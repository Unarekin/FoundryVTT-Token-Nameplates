import { NameplateDisplay, NameplatePosition } from "./types";
import { SerializedNameplate } from "./types";
import { interpolate, getInterpolationData, serializeStyle } from "./functions";

export class Nameplate {
  #position: NameplatePosition = "bottom";
  #id = foundry.utils.randomID();

  public enabled = true;

  public alwaysVisible = false;

  #text = "";

  // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
  public readonly glow = new (PIXI.filters as any).GlowFilter() as PIXI.Filter;
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
  public readonly outline = new (PIXI.filters as any).OutlineFilter() as PIXI.Filter;

  public get id() { return this.#id; }

  public static deserialize(token: foundry.canvas.placeables.Token, config: SerializedNameplate): Nameplate {
    return new Nameplate(token, config.value).deserialize(config);
  }

  protected getDispositionColor(): PIXI.Color {
    if (!this.token?.document) return new PIXI.Color("white");

    const disposition = Object.entries(CONST.TOKEN_DISPOSITIONS).find(([, val]) => val === (this.token?.document?.disposition ?? 0))?.[0] ?? "NEUTRAL";
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
    const color = (CONFIG.Canvas.dispositionColors as any)[disposition]

    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      const actualColor = new PIXI.Color(color);
      if (actualColor instanceof PIXI.Color)
        return actualColor;
    } catch { /* Empty */ }
    return new PIXI.Color("white");
  }

  public deserialize(config: SerializedNameplate): this {
    this.enabled = config.enabled;
    this.#id = config.id ?? foundry.utils.randomID();
    this.text = config.value ?? "";
    this.position = config.position ?? "bottom";
    this.padding.x = config.padding?.x ?? 0;
    this.padding.y = config.padding?.y ?? 0;
    this.sort = typeof config.sort === "number" ? config.sort : typeof config.sort === "string" ? parseInt(config.sort) : 0;
    if (isNaN(this.sort)) this.sort = 0;
    this.angle = config.angle ?? 0;
    this.alpha = config.alpha ?? 1;
    if (config.style) this.style = config.style;
    this.display = config.display ?? "default";

    this.align = config.align ?? "center";

    if (config.effects) {
      const { glow, outline } = config.effects;
      if (glow) {
        this.glow.enabled = typeof glow.enabled === "boolean" ? glow.enabled : false;
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        (this.glow as any).innerStrength = typeof glow.innerStrength === "number" ? glow.innerStrength : 0;
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        (this.glow as any).outerStrength = typeof glow.outerStrength === "number" ? glow.outerStrength : 4;
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        (this.glow as any).alpha = typeof glow.alpha === "number" ? glow.alpha : 1;

        if (glow.useDispositionColor) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          (this.glow as any).color = this.getDispositionColor();
        } else {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          (this.glow as any).color = typeof glow.color === "string" ? glow.color : "FFFFFF";
        }

      }

      if (outline) {
        this.outline.enabled = typeof outline.enabled === "boolean" ? outline.enabled : false;
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        (this.outline as any).alpha = typeof outline.alpha === "number" ? outline.alpha : 1;
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        (this.outline as any).thickness = typeof outline.thickness === "number" ? outline.thickness : 1;

        if (outline.useDispositionColor) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          (this.outline as any).color = this.getDispositionColor();
        } else {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          (this.outline as any).color = typeof outline.color === "string" ? outline.color : "FFFFFF";
        }
      }
    }

    if (!config.effects?.outline) this.outline.enabled = false;
    if (!config?.effects?.glow) this.glow.enabled = false;

    return this;
  }

  public serializeStyle(): Record<string, unknown> {
    return serializeStyle(this.style as PIXI.TextStyle);
  }

  public serialize(): SerializedNameplate {
    return {
      enabled: this.enabled,
      id: this.id,
      position: this.position,
      sort: this.sort,
      value: this.text,
      angle: this.angle,
      alpha: this.alpha,
      display: this.display,
      padding: {
        x: this.padding.x,
        y: this.padding.y
      },
      effects: {
        glow: {
          enabled: this.glow.enabled,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          color: (this.glow as any).color as string,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          innerStrength: (this.glow as any).innerStrength as number,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          outerStrength: (this.glow as any).outerStrength as number,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          alpha: (this.glow as any).alpha as number
        },
        outline: {
          enabled: this.outline.enabled,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          color: (this.outline as any).color as string,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          alpha: (this.outline as any).alpha as number,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          thickness: (this.outline as any).thickness as number
        }
      },
      style: this.serializeStyle(),
    }
  }

  public readonly object: foundry.canvas.containers.PreciseText | PIXI.HTMLText;

  public sort = 0;

  public readonly padding = { x: 0, y: 0 };

  public get position() { return this.#position; }
  public set position(val) {
    if (val !== this.position) this.#position = val;
  }

  public get style() { return this.object.style; }
  public set style(val: PIXI.TextStyle | Record<string, unknown>) {
    if (!foundry.utils.objectsEqual(val, this.style)) {
      this.object.style = val;
    }
  }

  public get text() { return this.#text }
  public set text(val) {
    this.#text = val;
    this.refreshText();
  }

  public get actualText() { return this.object.text; }

  public get visible() { return this.object.visible; }
  public set visible(val) { this.object.visible = val; }

  public get x() { return this.object.x; }
  public set x(val) { this.object.x = val; }

  public get y() { return this.object.y; }
  public set y(val) { this.object.y = val; }

  public get height() { return this.object.height; }
  public set height(val) { this.object.height = val; }

  public get width() { return this.object.width; }
  public set width(val) { this.object.width = val; }

  public get anchor() { return this.object.anchor; }
  public set anchor(val) { this.object.anchor = val; }

  public get align() { return this.object.style.align; }
  public set align(val) { this.object.style.align = val; }

  public get angle() { return this.object.angle; }
  public set angle(val) { this.object.angle = val; }

  public get alpha() { return this.object.alpha; }
  public set alpha(val) { this.object.alpha = val; }

  public display: NameplateDisplay = "default";

  public destroy() {
    if (this.object) {

      if (Array.isArray(this.object.filters)) {
        for (const filter of this.object.filters)
          filter.destroy();
        this.object.filters = [];
      }

      if (!this.object.destroyed && this.token.nameplate !== this.object)
        this.object.destroy()


    }


  }

  public refreshText() {
    const data = getInterpolationData(this.token.document);
    if (this.object instanceof foundry.canvas.containers.PreciseText)
      this.object.text = interpolate(this.text, data, true);
    else if (this.object instanceof PIXI.HTMLText)
      this.object.text = interpolate(this.text, data, false);
  }

  constructor(token: foundry.canvas.placeables.Token, text?: string)
  constructor(token: foundry.canvas.placeables.Token, text?: foundry.canvas.containers.PreciseText)
  constructor(public readonly token: foundry.canvas.placeables.Token, arg?: unknown) {
    if (arg instanceof foundry.canvas.containers.PreciseText)
      this.object = arg;
    else
      this.object = new foundry.canvas.containers.PreciseText(typeof arg === "string" ? arg : "");

    if (typeof arg === "string") this.text = arg;
    this.object.style.wordWrap = true;

    this.object.filters = [this.glow, this.outline];
    this.glow.enabled = false;
    this.outline.enabled = false;
  }
}