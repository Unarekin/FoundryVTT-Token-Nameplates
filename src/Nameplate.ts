import { NameplatePosition } from "./types";
import { SerializedNameplate } from "./types";
import { interpolate, getInterpolationData, serializeStyle } from "./functions";

export class Nameplate {
  #position: NameplatePosition = "bottom";
  #id = foundry.utils.randomID();

  public enabled = true;

  #text = "";

  public get id() { return this.#id; }

  public static deserialize(token: foundry.canvas.placeables.Token, config: SerializedNameplate): Nameplate {
    return new Nameplate(token, config.value).deserialize(config);
  }

  public deserialize(config: SerializedNameplate): this {
    this.enabled = config.enabled;
    this.#id = config.id ?? foundry.utils.randomID();
    this.text = config.value ?? "";
    this.position = config.position ?? "bottom";
    this.padding.x = config.padding?.x ?? 0;
    this.padding.y = config.padding?.y ?? 0;
    this.sort = config.sort ?? 0;
    this.angle = config.angle ?? 0;
    this.alpha = config.alpha ?? 1;
    if (config.style) this.style = config.style;

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
      padding: {
        x: this.padding.x,
        y: this.padding.y
      },
      style: this.serializeStyle()
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
    const data = getInterpolationData(this.token.document);
    if (this.object instanceof foundry.canvas.containers.PreciseText)
      this.object.text = interpolate(val, data, true);
    else if (this.object instanceof PIXI.HTMLText)
      this.object.text = interpolate(val, data, false);
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

  public destroy() {
    if (!this.object.destroyed && this.token.nameplate !== this.object) this.object.destroy();
  }



  constructor(token: foundry.canvas.placeables.Token, text?: string)
  constructor(token: foundry.canvas.placeables.Token, text?: foundry.canvas.containers.PreciseText)
  constructor(public readonly token: foundry.canvas.placeables.Token, arg?: unknown) {
    if (arg instanceof foundry.canvas.containers.PreciseText)
      this.object = arg;
    else
      this.object = new foundry.canvas.containers.PreciseText(typeof arg === "string" ? arg : "");
    this.object.style.wordWrap = true;
  }
}