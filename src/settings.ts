import { NameplateConfiguration } from "types"

declare global {
  interface SettingsConfig {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    [__MODULE_ID__]: {} // Placeholder for later
  }

  interface FlagConfig {
    Token: {
      [__MODULE_ID__]: NameplateConfiguration
    }
  }
}