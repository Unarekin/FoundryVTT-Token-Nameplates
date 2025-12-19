import { TokenNameplates } from "types";

declare global {

  declare const __DEV__: boolean;
  declare const __MODULE_TITLE__: string;
  // declare const __MODULE_ID__: string;
  const __MODULE_ID__ = "token-nameplates";
  declare const __MODULE_VERSION__: string;


  declare module '*.scss';
  declare const libWrapper: any;

  interface Game {
    TokenNameplates: TokenNameplates;
  }



  interface SettingsConfig {
    [__MODULE_ID__]: {
      invertIsometryTransform: boolean;
      globalConfigurations: Record<string, NameplateConfiguration>
    } // Placeholder for later
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