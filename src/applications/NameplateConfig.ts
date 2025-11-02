import { NameplateConfigContext, NameplateConfigConfiguration } from "./types";
import { DeepPartial, SerializedNameplate } from "../types";
import { generateDisplaySelectOptions, generateFontSelectOptions } from "./functions";

export class NameplateConfigApplication extends foundry.applications.api.HandlebarsApplicationMixin(foundry.applications.api.ApplicationV2<NameplateConfigContext, NameplateConfigConfiguration>) {

  #config: SerializedNameplate | undefined = undefined;
  #promise: Promise<SerializedNameplate | undefined> | undefined = undefined;
  #resolve: ((value: SerializedNameplate | undefined) => void) | undefined = undefined;
  // eslint-disable-next-line no-unused-private-class-members
  #reject: ((err: Error) => void) | undefined = undefined;
  #submitted = false;

  public static DEFAULT_OPTIONS: DeepPartial<foundry.applications.api.ApplicationV2.Configuration> = {
    window: {
      title: "NAMEPLATES.CONFIG.TITLE",
      icon: "fa-solid fa-signature",
      contentClasses: ["standard-form"]
    },
    position: {
      width: 600
    },
    tag: "form",
    form: {
      closeOnSubmit: true,
      submitOnChange: false,
      // eslint-disable-next-line @typescript-eslint/unbound-method
      handler: NameplateConfigApplication.FormHandler
    },
    actions: {
      // eslint-disable-next-line @typescript-eslint/unbound-method
      cancel: NameplateConfigApplication.Cancel
    }
  }

  public static PARTS: Record<string, foundry.applications.api.HandlebarsApplicationMixin.HandlebarsTemplatePart> = {
    tabs: {
      template: `templates/generic/tab-navigation.hbs`
    },
    basics: {
      template: `modules/${__MODULE_ID__}/templates/NameplateBasics.hbs`
    },
    font: {
      template: `modules/${__MODULE_ID__}/templates/NameplateFont.hbs`
    },
    footer: {
      template: `templates/generic/form-footer.hbs`
    }
  }

  static async Cancel(this: NameplateConfigApplication) {
    this.#submitted = false;
    await this.close();
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  static async FormHandler(this: NameplateConfigApplication, e: SubmitEvent | Event, elem: HTMLElement, data: foundry.applications.ux.FormDataExtended) {
    const parsed = foundry.utils.expandObject(data.object);
    if (this.#config) foundry.utils.mergeObject(this.#config, parsed);
    this.#submitted = true;
  }

  static async Edit(config: SerializedNameplate): Promise<SerializedNameplate | undefined> {
    const app = new NameplateConfigApplication();
    return app.Edit(config);
  }


  async Edit(config: SerializedNameplate): Promise<SerializedNameplate | undefined> {
    this.#config = foundry.utils.deepClone(config);
    if (!this.rendered) await this.render(true);

    if (!this.#promise) {
      this.#promise = new Promise<SerializedNameplate | undefined>((resolve, reject) => {
        this.#resolve = resolve;
        this.#reject = reject;
      });
    }
    return this.#promise;
  }

  protected _onClose(options: foundry.applications.api.ApplicationV2.RenderOptions): void {

    super._onClose(options);
    if (this.#resolve) {
      if (this.#submitted) this.#resolve(foundry.utils.deepClone(this.#config));
      else this.#resolve(undefined);
    }

    this.#promise = undefined;
    this.#resolve = undefined;
    this.#reject = undefined;
  }

  protected renderPreview() {
    if (!canvas?.app?.renderer || !this.#config) return;
    const previewCanvas = this.element.querySelector(`[data-role="text-preview"]`);
    if (!(previewCanvas instanceof HTMLCanvasElement)) return;

    const ctx = previewCanvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);

    const text = new foundry.canvas.containers.PreciseText("Sample Text", this.#config.style);
    // text.style = this.#config.style;
    const renderTexture = PIXI.RenderTexture.create({ width: text.width, height: text.height });
    canvas.app.renderer.render(text, { renderTexture });

    const pixels = Uint8ClampedArray.from(canvas.app.renderer.extract.pixels(renderTexture));
    const imageData = new ImageData(pixels, renderTexture.width, renderTexture.height);

    previewCanvas.style.height = `${text.height}px`;

    const rect = previewCanvas.getBoundingClientRect();
    if (rect.width) previewCanvas.width = rect.width;
    if (rect.height) previewCanvas.height = rect.height;

    ctx.putImageData(imageData, (rect.width - text.width) / 2, (rect.height - text.height) / 2);
  }

  protected async _onRender(context: NameplateConfigContext, options: foundry.applications.api.ApplicationV2.RenderOptions): Promise<void> {
    await super._onRender(context, options);

    const fontSelectors = Array.from(this.element.querySelectorAll(`[data-font-select]`)).filter(elem => elem instanceof HTMLSelectElement);
    for (const select of fontSelectors) {
      for (const option of select.options) {
        option.style.fontFamily = option.value;
      }
      select.style.fontFamily = select.value;
      select.addEventListener("change", () => { select.style.fontFamily = select.value; });
    }

    this.renderPreview();
  }

  changeTab(tab: string, group: string, options?: foundry.applications.api.ApplicationV2.ChangeTabOptions): void {
    super.changeTab(tab, group, options);
    if (tab === "font") this.renderPreview();
  }

  _onChangeForm(config: foundry.applications.api.ApplicationV2.FormConfiguration, event: Event) {
    super._onChangeForm(config, event);

    if (this.element instanceof HTMLFormElement && this.#config) {
      const data = foundry.utils.expandObject(new foundry.applications.ux.FormDataExtended(this.element).object) as SerializedNameplate;
      foundry.utils.mergeObject(this.#config.style, data.style);
      this.renderPreview();
    }
  }


  protected async _prepareContext(options: foundry.applications.api.ApplicationV2.RenderOptions): Promise<NameplateConfigContext> {
    const context = await super._prepareContext(options);

    context.tabs = {
      basics: {
        id: "basics",
        group: "primary",
        label: "NAMEPLATES.CONFIG.TABS.BASICS",
        active: true,
        cssClass: "active",
        icon: "fa-solid fa-cogs"
      },
      font: {
        id: "font",
        group: "primary",
        label: "NAMEPLATES.CONFIG.TABS.FONT",
        active: false,
        cssClass: "",
        icon: "fa-solid fa-paragraph"
      }
    }

    if (this.#config) context.nameplate = foundry.utils.deepClone(this.#config);

    context.positionSelect = {
      "top": "NAMEPLATES.CONFIG.POSITION.TOP",
      "bottom": "NAMEPLATES.CONFIG.POSITION.BOTTOM"
    }

    context.fontSelect = generateFontSelectOptions();
    context.displaySelect = generateDisplaySelectOptions();

    context.buttons = [
      { type: "button", icon: "fa-solid fa-times", label: "Cancel", action: "cancel" },
      { type: "submit", icon: "fa-solid fa-save", label: "SETTINGS.Save" }
    ]

    return context;
  }

  constructor(public readonly object?: TokenDocument | Actor, options?: DeepPartial<NameplateConfigConfiguration>) {
    super(options);
  }
}