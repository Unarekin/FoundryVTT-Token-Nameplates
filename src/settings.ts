import { ActorTypeSelectionApplication } from "applications"
import { NameplateConfiguration, NameplateDisplay, SerializedNameplate } from "types"

declare global {
  interface SettingsConfig {
    [__MODULE_ID__]: {
      globalConfigurations: Record<string, NameplateConfiguration>
    } // Placeholder for later
  }

  interface FlagConfig {
    Actor: {
      [__MODULE_ID__]: NameplateConfiguration
    }
  }
}

export const TokenDisplayHash: Record<number, NameplateDisplay> = {
  50: "always",
  10: "control",
  30: "hover",
  0: "none",
  40: "owner",
  20: "ownerHover"
}

export const DefaultSettings: NameplateConfiguration = {
  enabled: true,
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  version: __MODULE_VERSION__ as any,
  nameplates: []
}

export const DefaultNameplate: SerializedNameplate = {
  id: "",
  enabled: true,
  sort: 0,
  position: "bottom",
  display: "default",
  value: "",
  autoAnchor: true,
  anchor: { x: 0.5, y: 0 },
  padding: { x: 0, y: 0 },
  align: "center",
  fontDispositionColor: false,
  angle: 0,
  alpha: 1,
  // style: CONFIG.canvasTextStyle as unknown as Record<string, unknown>
  style: {},
  effects: {
    glow: {
      enabled: false,
      useDispositionColor: false,
      alpha: 1,
      innerStrength: 0,
      outerStrength: 4,
      color: "#FFFFFF"
    },
    outline: {
      enabled: false,
      useDispositionColor: false,
      alpha: 1,
      color: "#FFFFFF",
      thickness: 1
    }
  }
}

Hooks.once("ready", () => {
  game.settings?.registerMenu(__MODULE_ID__, `globalConfigMenu`, {
    name: game.i18n?.localize("NAMEPLATES.SETTINGS.GLOBAL.TEXT") ?? "",
    label: game.i18n?.localize("NAMEPLATES.SETTINGS.GLOBAL.LABEL") ?? "",
    hint: game.i18n?.localize("NAMEPLATES.SETTINGS.GLOBAL.HINT") ?? "",
    icon: "fa-solid fa-cogs",
    type: ActorTypeSelectionApplication,
    restricted: true
  });

  game.settings?.register(__MODULE_ID__, "globalConfigurations", {
    name: "Global Configurations",
    hint: "",
    scope: "world",
    config: false,
    requiresReload: false,
    type: Object,
    default: {},
    onChange() { game?.TokenNameplates?.refreshAllTokens(); }
  })
})