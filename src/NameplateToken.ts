import { DeepPartial, NameplatePosition, Nameplate as NameplateItem, NameplateConfiguration } from "types";
import { Nameplate } from "./Nameplate";

/**
 * Manages the nameplates for a given token
 */
export class NameplateToken {

  public readonly nameplates: Nameplate[] = [];

  public get bottomNameplates() { return this.nameplates.filter(nameplate => nameplate.position === "bottom"); }
  public get topNameplates() { return this.nameplates.filter(nameplate => nameplate.position === "top"); }

  public refreshSize() { /* empty */ }

  public refreshNameplate() {
    if (this.token.document?.flags[__MODULE_ID__]) {
      // Process flags
      const nameplates = this.token.document.getFlag(__MODULE_ID__, "nameplates");
      this.setNameplates(nameplates);
    }
  }

  public refreshTooltip() {
    this.refreshNameplate();
  }

  public refreshState() {
    this.refreshNameplate();
    this.bottomNameplates.forEach(nameplate => { nameplate.visible = !!this.token.nameplate?.visible });
    this.topNameplates.forEach(nameplate => { nameplate.visible = !!this.token.tooltip?.visible; });
    this.refreshPosition();
  }

  public draw() {
    console.log("Draw:", this);
  }

  public addText(text: string | foundry.canvas.containers.PreciseText, position?: NameplatePosition): Nameplate {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const nameplate = new Nameplate(this.token, text as any);
    if (position) nameplate.position = position;
    if (typeof text === "string") {
      const style = this.token.nameplate?.style.clone();
      if (style) {
        nameplate.style = style;
      } else {
        nameplate.style = CONFIG.canvasTextStyle.clone();
        nameplate.style.fontSize = 24;
        nameplate.style.wordWrapWidth = this.token.width * 2.5;
        nameplate.style.wordWrap = true;
      }
    }

    this.nameplates.push(nameplate);
    this.token.addChild(nameplate.object);

    this.refreshPosition();
    return nameplate;
  }

  public addNameplate(nameplate: Nameplate): Nameplate {
    if (!this.nameplates.includes(nameplate)) this.nameplates.push(nameplate);
    this.token.addChild(nameplate.object);
    this.refreshPosition();
    return nameplate;
  }

  public async saveToPrototype() {
    if (this.token.actor?.prototypeToken && game.user instanceof User && this.token.actor.canUserModify(game.user, "update")) {
      const flags: NameplateConfiguration = {
        enabled: this.token.document.flags[__MODULE_ID__]?.enabled ?? true,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        version: __MODULE_VERSION__ as any,
        nameplates: this.nameplates.map(nameplate => nameplate.serialize())
      };
      await this.token.actor.prototypeToken.update({
        flags: {
          [__MODULE_ID__]: flags
        }
      });
    }
  }

  public async save() {
    if (this.token.document && game.user instanceof User && this.token.document.canUserModify(game.user, "update")) {
      const flags: NameplateConfiguration = {
        enabled: this.token.document.flags[__MODULE_ID__]?.enabled ?? true,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        version: __MODULE_VERSION__ as any,
        nameplates: this.nameplates.map(nameplate => nameplate.serialize())
      };
      await this.token.document.update({
        flags: {
          [__MODULE_ID__]: flags
        }
      });
    }
  }

  public setNameplates(nameplates: NameplateItem[]) {
    for (let i = 0; i < nameplates.length; i++) {
      const config = nameplates[i];
      const nameplate = this.nameplates[i] ?? this.addText(config.value);
      nameplate.deserialize(config)
    }
    // Clean up excess plates
    if (this.nameplates.length > nameplates.length) {
      const removed = this.nameplates.splice(nameplates.length, this.nameplates.length - nameplates.length);
      removed.forEach(item => { item.destroy(); });
    }
  }

  public refreshPosition() {

    const tokenWidth = this.token.document.width * (canvas?.scene?.dimensions.size ?? 100);
    let bottomY = this.token.document.height * (canvas?.scene?.dimensions.size ?? 100);
    let topY = 0;

    for (const nameplate of this.nameplates) {
      if (nameplate.position === "bottom") {
        nameplate.y = bottomY;
        bottomY += nameplate.height + nameplate.padding.y;
        nameplate.anchor.y = 0;
      } else if (nameplate.position === "top") {
        nameplate.y = topY;
        topY -= (nameplate.height + nameplate.padding.y);
        nameplate.anchor.y = 1;
      }

      switch (nameplate.align) {
        case "left":
          nameplate.x = 0;
          nameplate.anchor.x = 0;
          break;
        case "center":
          nameplate.x = (tokenWidth / 2) + nameplate.padding.x;
          nameplate.anchor.x = 0.5;
          break;
        case "justify":
          nameplate.x = nameplate.padding.x;
          nameplate.anchor.x = 0;
          break;
        case "right":
          nameplate.x = tokenWidth - nameplate.padding.x;
          nameplate.anchor.x = 1;
          break;
      }
    }
  }

  public destroy() {
    this.nameplates.forEach(nameplate => { nameplate.destroy(); });
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public tokenUpdated(delta: DeepPartial<TokenDocument>) {
    this.refreshNameplate();
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public actorUpdated(delta: DeepPartial<Actor>) {
    this.refreshNameplate();
  }



  constructor(public readonly token: foundry.canvas.placeables.Token) {
    if (token.nameplate) {
      const nameplate = this.addText(token.nameplate);
      nameplate.text = "{name}";
    }

    if (token.document?.flags[__MODULE_ID__]) {
      // Process flags
      const nameplates = token.document.getFlag(__MODULE_ID__, "nameplates");
      this.setNameplates(nameplates);
    }
  }
}