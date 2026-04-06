import { NameplateConfigurationSource, NameplateConfiguration } from "types";
import { ConfigMixin } from "./ConfigMixin";
import { getDefaultSettings, getPrototypeTokenInterpolationData } from "functions";
import { RenderContext } from "./types";

export function PrototypeTokenConfigMixin<t extends typeof foundry.applications.sheets.PrototypeTokenConfig>(Base: t) {
  class NameplatePrototypeTokenConfig extends ConfigMixin<foundry.documents.TokenDocument>(Base) {

    protected getNameplateFlags(source?: NameplateConfigurationSource): NameplateConfiguration | undefined {
      const flags = foundry.utils.deepClone(getDefaultSettings());

      const globalSettings = game?.settings?.get(__MODULE_ID__, "globalConfigurations") ?? {};
      const actualSource = source ?? this.getNameplateConfigSource();

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const token = (this as any).token as foundry.data.PrototypeToken;

      switch (actualSource) {
        case "token":
          foundry.utils.mergeObject(flags, foundry.utils.deepClone(token.flags[__MODULE_ID__]?.config ?? {}));
          break;
        case "actor":
          foundry.utils.mergeObject(flags, foundry.utils.deepClone(token.actor.flags[__MODULE_ID__] ?? {}));
          break;
        case "actorType": {
          const typeFlags = token.actor.type ? globalSettings[token.actor.type] : undefined;
          if (typeFlags)
            foundry.utils.mergeObject(flags, foundry.utils.deepClone(typeFlags));
          break;
        }
        case "global":
          if (globalSettings.global)
            foundry.utils.mergeObject(flags, foundry.utils.deepClone(globalSettings.global));
          break;
      }

      return flags;
    }


    protected getNameplateConfigSource(): NameplateConfigurationSource | undefined {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const token = (this as any).token as foundry.data.PrototypeToken;
      return token.getFlag(__MODULE_ID__, "source") ?? "actorType";

    }
    protected getNameplateInterpolationData(): Record<string, unknown> {
      const data = {};
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const token = (this as any).token as foundry.data.PrototypeToken;
      foundry.utils.mergeObject(data, getPrototypeTokenInterpolationData(token));

      return data;
    }
    protected getNameplateInterpolationDocument(): foundry.abstract.Document.Any {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const token = (this as any).token as foundry.data.PrototypeToken;
      return token.actor;
    }

    async _prepareContext(options: any) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      const context = await super._prepareContext(options) as unknown as RenderContext<foundry.documents.TokenDocument>;
      context.nameplates.allowSourceConfig = true;

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const token = (this as any).token as foundry.data.PrototypeToken;

      context.nameplates.configSourceSelect = {
        token: "DOCUMENT.Token",
        actor: "DOCUMENT.Actor",
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        actorType: game.i18n?.format("NAMEPLATES.CONFIG.SOURCE.TYPE", { type: token.actor?.type ? (game.i18n?.translations as any).TYPES.Actor[token.actor.type] ? game.i18n?.localize(`TYPES.Actor.${token.actor.type}`) : token.actor.type : "UNKNOWN" }) ?? "DOCUMENT.FIELDS.type.label",
        global: "NAMEPLATES.CONFIG.TYPES.GLOBAL"
      }

      return context;
    }


    async _onSubmitForm(formConfig: foundry.applications.api.ApplicationV2.FormConfiguration, e: Event | SubmitEvent) {


      if (!(e.target instanceof HTMLFormElement)) return console.warn("No form element to submit");

      const formData = foundry.utils.expandObject(new foundry.applications.ux.FormDataExtended(e.target).object);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const token = (this as any).token as foundry.data.PrototypeToken;

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const source = (formData as any).nameplates.configSource as NameplateConfigurationSource;

      const update: Record<string, unknown> = {
        prototypeToken: {
          flags: {
            [__MODULE_ID__]: {
              source
            }
          }
        }
      }

      if (source === "token") {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        ((update.prototypeToken as any).flags[__MODULE_ID__] as Record<string, unknown>).config = foundry.utils.deepClone(this.nameplateConfigOverride);
      } else if (source === "actor") {
        update.flags = {
          [__MODULE_ID__]: foundry.utils.deepClone(this.nameplateConfigOverride)
        }
      }

      await super._onSubmitForm(formConfig, e);
      await token.actor.update(update);
    }

  }

  return NameplatePrototypeTokenConfig;
}