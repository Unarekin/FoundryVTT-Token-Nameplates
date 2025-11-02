import { SerializedNameplate, NameplatePosition, NameplateDisplay } from "../types";

export interface NameplateConfigContext extends foundry.applications.api.ApplicationV2.RenderContext {
  tabs?: Record<string, foundry.applications.api.ApplicationV2.Tab>;
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