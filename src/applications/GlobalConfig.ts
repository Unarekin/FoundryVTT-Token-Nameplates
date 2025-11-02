import { GlobalConfigContext, GlobalConfigConfiguration } from "./types";
import { DeepPartial, NameplateConfiguration } from "../types";
import { getDefaultNameplate } from "functions";

export class GlobalConfigApplication extends foundry.applications.api.HandlebarsApplicationMixin(foundry.applications.api.ApplicationV2<GlobalConfigContext, GlobalConfigConfiguration>) {
  public static DEFAULT_OPTIONS: DeepPartial<foundry.applications.api.ApplicationV2.Configuration> = {
    window: {
      title: "NAMEPLATES.SETTINGS.GLOBAL.TITLE",
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
      // // eslint-disable-next-line @typescript-eslint/unbound-method
      // handler: NameplateConfigApplication.FormHandler
    },
    actions: {
      // // eslint-disable-next-line @typescript-eslint/unbound-method
      // cancel: NameplateConfigApplication.Cancel
    }
  }

  public static PARTS: Record<string, foundry.applications.api.HandlebarsApplicationMixin.HandlebarsTemplatePart> = {
    config: {
      template: `modules/${__MODULE_ID__}/templates/TokenConfig.hbs`
    },
    footer: {
      template: `templates/generic/form-footer.hbs`
    }
  }

  get title() {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    return game.i18n?.format("NAMEPLATES.SETTINGS.GLOBAL.TITLE", { type: game.i18n?.localize(CONFIG.Actor.typeLabels[this.actorType as any]) ?? "" }) ?? "";
  }

  constructor(public readonly actorType: string, options?: DeepPartial<GlobalConfigConfiguration>) {
    super(options);
  }

  protected async _prepareContext(options: foundry.applications.api.ApplicationV2.RenderOptions): Promise<GlobalConfigContext> {
    const context = await super._prepareContext(options);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    (context as any).tab = { active: true }


    context.nameplates = {
      enabled: false,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      version: __MODULE_VERSION__ as any,
      nameplates: [
        {
          ...getDefaultNameplate(),
          id: foundry.utils.randomID(),
          value: "{name}"
        },
        {
          ...getDefaultNameplate(),
          position: "top",
          id: foundry.utils.randomID(),
          value: "{tooltip}"
        }
      ],
      upperNameplates: [],
      lowerNameplates: []
    }

    const config = (game.settings?.get(__MODULE_ID__, "globalConfigurations") ?? {}) as Record<string, NameplateConfiguration>;

    if (config[this.actorType])
      foundry.utils.mergeObject(context.nameplates, config[this.actorType])

    context.nameplates.upperNameplates = context.nameplates.nameplates.filter(plate => plate.position === "top");
    context.nameplates.lowerNameplates = context.nameplates.nameplates.filter(plate => plate.position === "bottom");

    context.idPrefix = foundry.utils.randomID();

    console.log("Context:", context);
    return context;
  }
}