import { NameplateConfigurationSource, NameplateConfiguration } from "types";
import { ConfigMixin } from "./ConfigMixin";
import { getDefaultSettings } from "functions";
import { RenderContext } from "./types";

export function TileConfigMixin<t extends typeof foundry.applications.sheets.TileConfig>(Base: t) {
  return class NameplateTileConfig extends ConfigMixin<foundry.documents.TileDocument>(Base) {
    protected getNameplateFlags(source?: NameplateConfigurationSource): NameplateConfiguration | undefined {
      const flags = foundry.utils.deepClone(getDefaultSettings());

      const actualSource = source ?? this.getNameplateConfigSource();

      switch (actualSource) {
        case "tile":
          foundry.utils.mergeObject(flags, foundry.utils.deepClone(this.document.getFlag(__MODULE_ID__, "config") ?? {}));
          break;
        case "global": {
          const globalSettings = game?.settings?.get(__MODULE_ID__, "globalConfigurations") ?? {};
          if (globalSettings.global) foundry.utils.mergeObject(flags, foundry.utils.deepClone(globalSettings.global));
        }
      }

      return flags;
    }

    protected getNameplateConfigSource(): NameplateConfigurationSource | undefined {
      return this.document.getFlag(__MODULE_ID__, "source") ?? "actorType";
    }
    protected getNameplateInterpolationData(): Record<string, unknown> {
      const data = {};

      foundry.utils.mergeObject(data, this.document);

      return data;
    }
    protected getNameplateInterpolationDocument(): foundry.abstract.Document.Any {
      return this.document;
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
      if ((expandedData.nameplates as any).configSource === "tile") {
        typedData.flags[__MODULE_ID__].config = this.nameplateConfigOverride;
      }
      return data;
    }

    async _prepareContext(options: any) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      const context = await super._prepareContext(options) as unknown as RenderContext<foundry.documents.TileDocument>

      context.nameplates.allowSourceConfig = true;

      context.nameplates.configSourceSelect = {
        tile: "DOCUMENT.Tile",
        global: "NAMEPLATES.CONFIG.TYPES.GLOBAL"
      }


      return context;
    }

  }
}