import { NameplateConfiguration, NameplateConfigurationSource, NameplatePlaceable } from "types";
import { ConfigMixin } from "./ConfigMixin";
import { RenderContext } from "./types";
import { getDefaultSettings, getPrototypeTokenInterpolationData } from "functions";


export function TokenConfigMixin<t extends typeof foundry.applications.sheets.TokenConfig>(Base: t) {
  class NameplateTokenConfig extends ConfigMixin<foundry.documents.TokenDocument>(Base) {

    protected getNameplateFlags(source?: NameplateConfigurationSource): NameplateConfiguration | undefined {
      const flags = foundry.utils.deepClone(getDefaultSettings());

      const globalSettings = game?.settings?.get(__MODULE_ID__, "globalConfigurations") ?? {};
      const actualSource = source ?? this.getNameplateConfigSource();
      switch (actualSource) {
        case "actor":
          foundry.utils.mergeObject(flags, foundry.utils.deepClone(this.document.actor?.flags[__MODULE_ID__] ?? {}));
          break;
        case "token":
          foundry.utils.mergeObject(flags, foundry.utils.deepClone(this.document.getFlag(__MODULE_ID__, "config") ?? {}));
          break;
        case "actorType": {
          const typeFlags = this.document.actor?.type ? globalSettings[this.document.actor.type] : undefined;
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
      return this.document.getFlag(__MODULE_ID__, "source") ?? "actorType";
    }

    protected getNameplateInterpolationData(): Record<string, unknown> {
      const data = {};
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const token = (this as any).token as TokenDocument | foundry.data.PrototypeToken;

      if (token instanceof TokenDocument)
        foundry.utils.mergeObject(data, (token.object as unknown as NameplatePlaceable).getInterpolationData());
      else if (token instanceof foundry.data.PrototypeToken)
        foundry.utils.mergeObject(data, getPrototypeTokenInterpolationData(token));

      return data;
    }

    protected getNameplateInterpolationDocument(): TokenDocument {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
      return (this as any).token;
    }

    protected async importGlobalNameplateConfig(configType: string): Promise<void> {
      const globalConfigs = game.settings?.get(__MODULE_ID__, "globalConfigurations");
      if (!globalConfigs) return;
      const config = globalConfigs[configType];
      if (!config) return;

      this.nameplateConfigOverride = foundry.utils.deepClone(config);
      await this.render();
    }

    protected getNameplateImportContextMenuOptions(): foundry.applications.ux.ContextMenu.Entry<HTMLElement>[] {
      // TODO: Change label to name when dropping v13 support
      // TODO: Change callback to onClick when dropping v13 support
      // TODO: Change condition to visible when dropping v13 support
      return [
        ...super.getNameplateImportContextMenuOptions(),
        {
          name: game.i18n?.format("NAMEPLATES.CONFIG.IMPORT.TYPE", { type: this.document?.actor?.type ?? "UNKNOWN" }) ?? "NAMEPLATES.CONFIG.IMPORT.TYPE",
          icon: `<i class="fa-solid fa-user"></i>`,
          callback: () => {
            if (this.document.actor?.type)
              this.importGlobalNameplateConfig(this.document.actor.type).catch(console.error);
          },
          condition: () => this.currentSelectedNameplateSource() !== "actorType"
        },
        {
          name: "NAMEPLATES.CONFIG.IMPORT.GLOBAL",
          icon: `<i class="fa-solid fa-gears"></i>`,
          callback: () => { this.importGlobalNameplateConfig("global").catch(console.error); },
          condition: () => this.currentSelectedNameplateSource() !== "global"
        },
        {
          name: "NAMEPLATES.CONFIG.IMPORT.ACTOR",
          icon: `<i class="fa-solid fa-user"></i>`,
          callback: () => {
            if (this.document.actor) {
              const config = this.document.actor.flags[__MODULE_ID__];
              this.nameplateConfigOverride = {
                ...getDefaultSettings(),
                ...foundry.utils.deepClone(config)
              };

              this.render().catch(console.error);
            }
          },
          condition: () => this.currentSelectedNameplateSource() !== "actor"
        },
        {
          name: "NAMEPLATES.CONFIG.IMPORT.TOKEN",
          icon: `<i class="fa-solid fa-user"></i>`,
          callback: () => {
            return {
              ...getDefaultSettings(),
              ...(this.document.getFlag(__MODULE_ID__, "config") ?? {})
            };
            this.render().catch(console.error);
          },
          condition: () => this.currentSelectedNameplateSource() !== "token"
        }
      ]
    }

    _prepareSubmitData(event: SubmitEvent, form: HTMLFormElement, formData: foundry.applications.ux.FormDataExtended, updateData?: unknown) {
      const data = super._prepareSubmitData(event, form, formData, updateData);

      const expandedData = foundry.utils.expandObject(formData.object) as Record<string, unknown>;

      const typedData = data as { flags: { [__MODULE_ID__]: Record<string, unknown> }, [key: string]: unknown };
      typedData.flags = {
        ...((typedData).flags ?? {}),
        [__MODULE_ID__]: {
          source: (expandedData.nameplates as Record<string, unknown>).configSource
        }
      }

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if ((expandedData.nameplates as any).configSource === "token") {
        typedData.flags[__MODULE_ID__].config = this.nameplateConfigOverride;
      }

      return data;
    }

    async _processSubmitData(event: SubmitEvent, form: HTMLFormElement, formData: Record<string, unknown>, options?: any) {
      if (((formData.flags as Record<string, unknown>)["token-nameplates"] as Record<string, unknown>)?.source === "actor") {
        // Update actor
        if (this.document.actor)
          await this.document.actor.update({
            flags: {
              [__MODULE_ID__]: this.nameplateConfigOverride
            }
          });
      }

      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      return super._processSubmitData(event, form, formData as any, options);
    }

    async _prepareContext(options: any) {

      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      const context = await super._prepareContext(options) as unknown as RenderContext<foundry.documents.TokenDocument>

      context.nameplates.allowSourceConfig = true;

      context.nameplates.configSourceSelect = {
        token: "DOCUMENT.Token",
        actor: "DOCUMENT.Actor",
        actorType: game.i18n?.format("NAMEPLATES.CONFIG.SOURCE.TYPE", { type: this.document?.actor?.type ?? "UNKNOWN" }) ?? "DOCUMENT.FIELDS.type.label",
        global: "NAMEPLATES.CONFIG.TYPES.GLOBAL"
      }


      return context;
    }
  }

  return NameplateTokenConfig;
}