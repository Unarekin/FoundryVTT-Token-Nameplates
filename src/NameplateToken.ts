import { DeepPartial, NameplatePosition, SerializedNameplate, NameplateConfiguration } from "types";
import { Nameplate } from "./Nameplate";
import { DefaultNameplate } from "settings";

/**
 * Manages the nameplates for a given token
 */
export class NameplateToken {

  public readonly nameplates: Nameplate[] = [];

  public get bottomNameplates() { return this.nameplates.filter(nameplate => nameplate.position === "bottom"); }
  public get topNameplates() { return this.nameplates.filter(nameplate => nameplate.position === "top"); }

  public refreshSize() { /* empty */ }

  public refreshNameplate() {
    if (this.token.actor?.flags[__MODULE_ID__]) {
      // Process flags
      const nameplates = this.token.actor.getFlag(__MODULE_ID__, "nameplates");
      this.setNameplates(nameplates);
    } else {
      this.setNameplates([]);
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

  public draw() { /* Empty */ }

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
    this.save().catch(console.error);
    return nameplate;
  }

  public addNameplate(nameplate: Nameplate): Nameplate {
    if (!this.nameplates.includes(nameplate)) this.nameplates.push(nameplate);
    this.token.addChild(nameplate.object);
    this.refreshPosition();
    return nameplate;
  }

  public async save() {
    if (this.token.actor && game.user instanceof User && this.token.actor.canUserModify(game.user, "update")) {
      const flags: NameplateConfiguration = {
        enabled: this.token.actor.flags[__MODULE_ID__]?.enabled ?? true,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        version: __MODULE_VERSION__ as any,
        nameplates: this.nameplates.map(nameplate => nameplate.serialize())
      };
      await this.token.actor.update({
        flags: {
          [__MODULE_ID__]: flags
        }
      });
    }
  }

  public setNameplates(nameplates: SerializedNameplate[]) {
    if (!nameplates.length) {
      nameplates.push(foundry.utils.mergeObject(
        foundry.utils.deepClone(DefaultNameplate),
        this.token.nameplate ?
          {
            style: this.token.nameplate.style.clone()
          } : {}
      ) as SerializedNameplate)
    }
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

    const nameplates = this.nameplates;
    for (const nameplate of nameplates) {
      if (!nameplate.enabled) {
        nameplate.object.visible = false;
        continue;
      }
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

    const index = TokenNameplates.tokens.indexOf(this);
    if (index > -1) TokenNameplates.tokens.splice(index, 1);
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
    const nameplates = token.actor?.flags[__MODULE_ID__]?.nameplates;
    if (Array.isArray(nameplates) && nameplates.length) {
      this.setNameplates(nameplates);
    } else if (token.nameplate) {
      token.nameplate.renderable = false;
      const nameplate = this.addText("{name}");
      nameplate.style = token.nameplate.style.clone();
    }
  }
}