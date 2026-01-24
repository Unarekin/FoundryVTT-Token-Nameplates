import { interpolate } from "functions";
import { NameplateDisplay, NameplatePosition, SerializedNameplate } from "types";

export class Nameplate extends foundry.canvas.containers.PreciseText {

  #id = foundry.utils.randomID();
  public get id() { return this.#id; }
  public readonly object: foundry.canvas.placeables.PlaceableObject;

  public readonly padding = { x: 0, y: 0 };
  public encodedText = "";

  // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
  public readonly glow = new (PIXI.filters as any).GlowFilter() as PIXI.Filter;
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
  public readonly outline = new (PIXI.filters as any).OutlineFilter() as PIXI.Filter;

  public nameplatePosition: NameplatePosition = "bottom";
  public sort = 0;
  public autoAnchor = true;
  public display: NameplateDisplay = "default";

  public fontDispositionColor = false;

  destroy() {
    super.destroy();
    if (Array.isArray(this.filters)) {
      const filters = [...this.filters];
      this.filters = [];
      filters.forEach(filter => { filter.destroy(); });
    }
  }

  protected getDispositionColor(token: TokenDocument): PIXI.Color {
    if (!token) return new PIXI.Color("white");

    const disposition = Object.entries(CONST.TOKEN_DISPOSITIONS).find(([, val]) => val === token.disposition)?.[0] ?? CONST.TOKEN_DISPOSITIONS.NEUTRAL;

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const color = (CONFIG.Canvas.dispositionColors as any)[disposition as any] as PIXI.ColorSource;
    try {
      const actualColor = new PIXI.Color(color);
      if (actualColor instanceof PIXI.Color)
        return actualColor
    } catch { /* Empty */ }
    return new PIXI.Color("white");
  }

  public refreshText(data: Record<string, unknown>) {
    this.text = interpolate(this.encodedText, data);
  }


  public deserialize(config: SerializedNameplate, placeable: foundry.abstract.Document.Any): Nameplate {

    this.#id = config.id;
    this.encodedText = config.value;
    this.padding.x = config.padding?.x ?? 0;
    this.padding.y = config.padding?.y ?? 0;
    this.sort = typeof config.sort === "number" ? config.sort : typeof config.sort === "string" ? parseInt(config.sort) : 0;
    if (isNaN(this.sort)) this.sort = 0;

    this.angle = config.angle ?? 0;
    this.alpha = config.alpha ?? 1;

    this.nameplatePosition = config.position ?? "bottom";

    // if (typeof serialized.style === "object") foundry.utils.mergeObject(this.style, serialized.style);
    if (typeof config.style === "object") foundry.utils.mergeObject(this.style, config.style);
    this.display = config.display ?? "default";

    this.anchor.x = config.anchor?.x ?? 0.5;
    this.anchor.y = config.anchor?.y ?? 0.5;
    this.autoAnchor = config.autoAnchor ? true : false;

    this.fontDispositionColor = config.fontDispositionColor ? true : false;

    this.style.align = config.align ?? "center";

    if (config.fontDispositionColor && placeable instanceof TokenDocument) {
      this.style.fill = this.getDispositionColor(placeable).toHex();
    }


    if (config.effects) {
      const { glow, outline } = config.effects;
      if (glow) {
        this.glow.enabled = Boolean(glow.enabled);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        (this.glow as any).innerStrength = typeof glow.innerStrength === "number" ? glow.innerStrength : 0;
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        (this.glow as any).outerStrength = typeof glow.outerStrength === "number" ? glow.outerStrength : 4;
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        (this.glow as any).alpha = typeof glow.alpha === "number" ? glow.alpha : 1;

        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        (this.glow as any).useDispositionColor = Boolean(glow.useDispositionColor);
        if (glow.useDispositionColor && placeable instanceof TokenDocument) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          (this.glow as any).color = this.getDispositionColor(placeable);
        } else {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          (this.glow as any).color = (typeof glow.color === "string" && glow.color) ? glow.color : "#FFFFFF";
        }
      } else {
        this.glow.enabled = false;
      }

      if (outline) {
        this.outline.enabled = Boolean(outline.enabled);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        (this.outline as any).alpha = typeof outline.alpha === "number" ? outline.alpha : 1;
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        (this.outline as any).thickness = typeof outline.thickness === "number" ? outline.thickness : 1;

        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        (this.outline as any).useDispositionColor = outline.useDispositionColor;
        if (outline.useDispositionColor && placeable instanceof TokenDocument) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          (this.outline as any).color = this.getDispositionColor(placeable);
        } else {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          (this.outline as any).color = (typeof outline.color === "string" && outline.color) ? outline.color : "#FFFFFF";
        }
      } else {
        this.outline.enabled = false;
      }
    } else {
      this.outline.enabled = false;
      this.glow.enabled = false;
    }
    return this;
  }

  constructor(placeable: foundry.canvas.placeables.PlaceableObject, config: SerializedNameplate, canvas?: PIXI.ICanvas)
  constructor(placeable: foundry.canvas.placeables.PlaceableObject, text?: string | number, style?: Partial<PIXI.ITextStyle> | PIXI.TextStyle, canvas?: PIXI.ICanvas)
  constructor(placeable: foundry.canvas.placeables.PlaceableObject, ...args: any[]) {
    if (typeof (args[0] as SerializedNameplate)?.value === "string") {
      const config = args[0] as SerializedNameplate;
      super(config.value, config.style, args[1] as PIXI.ICanvas | undefined);
      this.object = placeable;
      this.filters = [this.glow, this.outline];
      this.glow.enabled = this.outline.enabled = false;
      this.deserialize(config, placeable.document);
    } else {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      super(...args);
      this.object = placeable;
      this.filters = [this.glow, this.outline];
      this.glow.enabled = this.outline.enabled = false;
    }

  }
}