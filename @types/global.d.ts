import { TokenNameplates } from "types";

declare module '*.scss';
declare global {

  declare const __DEV__: boolean;
  declare const __MODULE_TITLE__: string;
  // declare const __MODULE_ID__: string;
  const __MODULE_ID__ = "token-nameplates";
  declare const __MODULE_VERSION__: string;

  interface Game {
    TokenNameplates: TokenNameplates;
  }
}

declare module "fvtt-types/configuration" {
  interface SettingConfig {
    "token-nameplates.invertIsometryTransform": boolean;
    "token-nameplates.globalConfigurations": Record<string, NameplateConfiguration>;
    "token-nameplates.placeAbovePlaceables": boolean;

    "isometric-perspective.worldIsometricFlag": boolean;
    "isometric-perspective.enableHeightAdjustment": boolean;
    "isometric-perspective.enableTokenVisuals": boolean;
    "isometric-perspective.enableOcclusionDynamicTile": boolean;
    "isometric-perspective.enableAutoSorting": boolean;
    "isometric-perspective.enableOcclusionTokenSilhouette": boolean;
    "isometric-perspective.showWelcome": boolean;
    "isometric-perspective.debug": boolean;

  }

  interface FlagConfig {
    Actor: {
      [__MODULE_ID__]: NameplateConfiguration
    },
    TileDocument: {
      [__MODULE_ID__]: NameplateConfiguration,
      "isometric-perspective"?: IsometricFlags;
    },
    TokenDocument: {
      [__MODULE_ID__]: NameplateConfiguration,
      "isometric-perspective"?: IsometricFlags;
    }
  }
}