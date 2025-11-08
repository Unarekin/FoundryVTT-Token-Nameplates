import { DeepPartial, NameplateConfiguration, NameplateDisplay } from "types";
import { Nameplate } from "./Nameplate";
import { DefaultSettings } from "settings";
import { getNameplateSettings, serializeStyle } from "functions";

const TokenDisplayHash: Record<number, NameplateDisplay> = {
  50: "always",
  10: "control",
  30: "hover",
  0: "none",
  40: "owner",
  20: "ownerHover"
}

export class NameplateToken {
  #destroyed = false;
  #enabled = true;

  public readonly token: TokenDocument | undefined;
  public readonly actor: Actor | undefined;

  private bottomContainer = new PIXI.Container();
  private topContainer = new PIXI.Container();

  public readonly nameplates: Nameplate[] = [];

  public get bottomNameplates() { return this.nameplates.filter(nameplate => nameplate.position === "bottom"); }
  public get topNameplates() { return this.nameplates.filter(nameplate => nameplate.position === "top"); }
  public get destroyed() { return this.#destroyed; }

  public get enabled() { return this.#enabled; }
  public set enabled(val) {
    if (val !== this.enabled) {
      this.#enabled = val;
      const enabled = this.actor?.flags[__MODULE_ID__]?.enabled;
      if (typeof enabled === "boolean" && val !== enabled)
        this.actor?.setFlag(__MODULE_ID__, "enabled", val).catch(console.error);
    }
  }

  protected shouldDisplay(nameplate: Nameplate): boolean {
    if (!this.token) return false;
    const display = nameplate.display === "default" ? TokenDisplayHash[this.token.displayName] : nameplate.display;

    // Special case: Don't display a tooltip element if there's no tooltip (elevation is 0)
    if (nameplate.text === "{tooltip}" && this.token.object?.tooltip?.text === "") return false;

    switch (display) {
      case "always":
        return true;
      case "none":
        return false;
      case "owner":
        return this.token.isOwner;
      case "control":
        return (this.token.object && canvas?.tokens?.controlled.includes(this.token.object)) ?? false;
      case "ownerHover":
        return (this.token.object?.hover ?? false) && this.token.isOwner;
      case "hover":
        return (this.token.object?.hover ?? false)
      default:
        return false;
    }
  }

  protected refreshNameplates() {
    if (!this.token?.object) return;
    const { width } = this.token.object.bounds;

    const bottom = this.bottomNameplates.sort((a, b) => a.sort - b.sort);
    let y = this.token.object.nameplate?.y ?? 0;
    for (const plate of bottom) {
      if (this.shouldDisplay(plate)) {
        plate.object.visible = true;
        plate.refreshText();
        plate.style.wordWrapWidth = width * 2.5;
        plate.style.wordWrap = true;
        plate.y = y + plate.padding.y;
        plate.x = ((width - plate.width) / 2) + plate.padding.x;
        y += plate.height + 2 + plate.padding.x;
      } else {
        plate.object.visible = false;
      }
    }


    const top = this.topNameplates.sort((a, b) => a.sort - b.sort);
    y = (this.token.object.tooltip?.y ?? 0);
    for (const plate of top) {
      // if (this.token.object.tooltip?.visible && !(plate.text === "{tooltip}" && this.token.object.tooltip?.text === "")) {
      if (this.shouldDisplay(plate)) {
        plate.object.visible = true;
        plate.refreshText();
        y -= (plate.height + 2 + plate.padding.y);
        plate.style.wordWrapWidth = width * 2.5;
        plate.style.wordWrap = true;
        plate.y = y;
        plate.x = ((width - plate.width) / 2) + plate.padding.x;
      } else {
        plate.object.visible = false;
      }
    }
  }

  protected loadFromActor() {
    if (!this.token?.object) return;

    const config = getNameplateSettings(this.actor);
    if (typeof config.enabled === "boolean") this.enabled = config.enabled;

    // Remove all
    for (const plate of this.nameplates) plate.destroy();
    this.nameplates.splice(0, this.nameplates.length);

    // Recreate
    this.nameplates.push(...(config.nameplates ?? []).map(plate => Nameplate.deserialize(this.token!.object!, plate)));

    if (this.nameplates.length === 0) {
      if (this.token.object.nameplate) {
        const nameplate = new Nameplate(this.token.object, "{name}");
        nameplate.style = serializeStyle(this.token.object.nameplate.style);
        this.nameplates.push(nameplate);
      }

      if (this.token.object.tooltip) {
        const nameplate = new Nameplate(this.token.object, "{tooltip}");
        nameplate.position = "top";
        nameplate.style = serializeStyle(this.token.object.tooltip.style);
        this.nameplates.push(nameplate);
      }
    }

    if (this.topNameplates.length) this.topContainer.addChild(...this.topNameplates.map(plate => plate.object));
    if (this.bottomNameplates.length) this.bottomContainer.addChild(...this.bottomNameplates.map(plate => plate.object));

    // Ensure properly positioned/sized
    this.refreshNameplates();

  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public actorUpdated(delta: DeepPartial<Actor>) { this.loadFromActor(); }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public tokenUpdated(delta: DeepPartial<TokenDocument>) { this.loadFromActor(); }

  public draw() { /* TODO */ }
  public refreshState() { this.refreshNameplates(); }
  public refreshSize() { this.refreshNameplates(); }
  public refreshNameplate() { this.refreshNameplates(); }
  public refreshTooltip() { this.refreshNameplates(); }

  public destroy() {
    if (!this.destroyed) {
      this.#destroyed = true;
      for (const nameplate of this.nameplates)
        nameplate.destroy();
      this.nameplates.splice(0, this.nameplates.length);

      const index = TokenNameplates.tokens.indexOf(this);
      if (index > -1) TokenNameplates.tokens.splice(index, 1);
    }
  }


  public async save(): Promise<NameplateConfiguration> {
    const config = this.serialize();
    if (this.actor)
      await this.actor.update({ flags: { [__MODULE_ID__]: config } });

    return config;
  }

  public serialize(): NameplateConfiguration {
    return {
      ...foundry.utils.deepClone(DefaultSettings),
      enabled: this.enabled,
      nameplates: this.nameplates.map(nameplate => nameplate.serialize())
    }
  }

  constructor(actor: Actor)
  constructor(token: TokenDocument)
  constructor(token: foundry.canvas.placeables.Token)
  constructor(obj: Actor | TokenDocument | Token) {
    if (obj instanceof Actor) {
      this.actor = obj;
      if (obj.token) this.token = obj.token;
    } else if (obj instanceof foundry.canvas.placeables.Token) {
      if (obj.actor instanceof Actor) this.actor = obj.actor;
      if (obj.document instanceof TokenDocument) this.token = obj.document;
    } else if (obj instanceof TokenDocument) {
      this.token = obj;
      if (obj.actor instanceof Actor) this.actor = obj.actor;
    }

    this.topContainer.name = "Top Nameplates";
    this.bottomContainer.name = "Bottom Nameplates";

    if (this.token?.object) {
      this.token.object.addChild(this.topContainer);
      this.token.object.addChild(this.bottomContainer);

      if (this.token.object.nameplate) this.token.object.nameplate.renderable = false;
      if (this.token.object.tooltip) this.token.object.tooltip.renderable = false;

      this.loadFromActor();
    }
  }
}

