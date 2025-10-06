import { Nameplate } from "../types";

export interface NameplateConfigContext extends foundry.applications.api.ApplicationV2.RenderContext {
  object: TokenDocument | Actor;
  nameplate: Nameplate;
  fontSelect: Record<string, string>;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface NameplateConfigConfiguration extends foundry.applications.api.ApplicationV2.Configuration {

}