import { SerializedNameplate, NameplatePosition, NameplateDisplay, NameplateConfiguration } from "../types";

export interface NameplateConfigContext extends foundry.applications.api.ApplicationV2.RenderContext {
  tabs?: Record<string, foundry.applications.api.ApplicationV2.Tab>;
  subtabs: Record<string, foundry.applications.api.ApplicationV2.Tab>;
  buttons: foundry.applications.api.ApplicationV2.FormFooterButton[];
  idPrefix: string;
  object: TokenDocument | Actor;
  nameplate: SerializedNameplate;
  fontSelect: Record<string, string>;
  positionSelect: Record<NameplatePosition, string>;
  displaySelect: Record<NameplateDisplay, string>;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface NameplateConfigConfiguration extends foundry.applications.api.ApplicationV2.Configuration {

}


export interface ActorTypeSelectionContext extends foundry.applications.api.ApplicationV2.RenderContext {
  types: { value: string, label: string }[];
  buttons: foundry.applications.api.ApplicationV2.FormFooterButton[];
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface ActorTypeSelectionConfiguration extends foundry.applications.api.ApplicationV2.Configuration { }

export interface GlobalNameplateConfig extends NameplateConfiguration {
  upperNameplates: SerializedNameplate[];
  lowerNameplates: SerializedNameplate[];
}

export interface GlobalConfigContext extends foundry.applications.api.ApplicationV2.RenderContext {
  type: string;
  nameplates: GlobalNameplateConfig;
  globalConfig: boolean;
  idPrefix: string;
  buttons: foundry.applications.api.ApplicationV2.FormFooterButton[];
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface GlobalConfigConfiguration extends foundry.applications.api.ApplicationV2.Configuration { }