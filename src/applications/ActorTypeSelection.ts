import { DeepPartial } from "types";
import { ActorTypeSelectionContext, ActorTypeSelectionConfiguration } from "./types";
import { GlobalConfigApplication } from "./GlobalConfig";

export class ActorTypeSelectionApplication extends foundry.applications.api.HandlebarsApplicationMixin(foundry.applications.api.ApplicationV2<ActorTypeSelectionContext, ActorTypeSelectionConfiguration>) {
  public static DEFAULT_OPTIONS: DeepPartial<foundry.applications.api.ApplicationV2.Configuration> = {
    window: {
      title: "NAMEPLATES.SETTINGS.GLOBAL.LIST.TITLE",
      icon: "fa-solid fa-signature",
      contentClasses: ["standard-form"]
    },
    // position: { width: 600 },
    tag: "form",
    form: {
      closeOnSubmit: true,
      submitOnChange: false,
      // handler: NameplateConfigApplication.FormHandler
    },
    actions: {
      // eslint-disable-next-line @typescript-eslint/unbound-method
      close: ActorTypeSelectionApplication.Close,
      // eslint-disable-next-line @typescript-eslint/unbound-method
      configure: ActorTypeSelectionApplication.Configure
    }
  };

  public static PARTS: Record<string, foundry.applications.api.HandlebarsApplicationMixin.HandlebarsTemplatePart> = {
    buttons: {
      template: `modules/${__MODULE_ID__}/templates/ActorTypeList.hbs`
    },
    footer: {
      template: `templates/generic/form-footer.hbs`
    }
  }

  public static async Close(this: ActorTypeSelectionApplication) { await this.close() }

  public static async Configure(this: ActorTypeSelectionApplication, event: PointerEvent, elem: HTMLElement) {
    const actorType = elem.dataset.type;
    if (!actorType) return;

    const app = new GlobalConfigApplication(actorType);
    await app.render(true);
  }

  protected async _prepareContext(options: foundry.applications.api.ApplicationV2.RenderOptions): Promise<ActorTypeSelectionContext> {
    const context = await super._prepareContext(options);
    context.types = Actor.TYPES
      .filter(type => type !== "base")
      .map(type => ({
        value: type,
        label: CONFIG.Actor.typeLabels[type]
      }))

    context.buttons = [
      { type: "button", icon: "fa-solid fa-times", label: "Close", action: "close" },
    ]

    return context;
  }
}