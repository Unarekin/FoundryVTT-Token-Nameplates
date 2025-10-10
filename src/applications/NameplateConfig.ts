import { NameplateConfigContext, NameplateConfigConfiguration } from "./types";
import { DeepPartial, Nameplate as NameplateItem } from "../types";

export class NameplateConfigApplication extends foundry.applications.api.HandlebarsApplicationMixin(foundry.applications.api.ApplicationV2<NameplateConfigContext, NameplateConfigConfiguration>) {

  #config: NameplateItem | undefined = undefined;

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
      submitOnChange: false
    },
    actions: {

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

  static async Edit(config: NameplateItem): Promise<NameplateItem | undefined> {
    const app = new NameplateConfigApplication();
    return app.Edit(config);
  }


  async Edit(config: NameplateItem): Promise<NameplateItem | undefined> {
    this.#config = config;
    if (!this.rendered) await this.render(true);
    // TODO: Implement
    return Promise.resolve(undefined);
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