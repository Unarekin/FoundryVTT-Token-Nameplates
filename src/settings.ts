import { NameplateConfiguration, SerializedNameplate } from "types"

declare global {
  interface SettingsConfig {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    [__MODULE_ID__]: {} // Placeholder for later
  }

  interface FlagConfig {
    Actor: {
      [__MODULE_ID__]: NameplateConfiguration
    }
  }
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
  value: "",
  padding: { x: 0, y: 0 },
  angle: 0,
  alpha: 1,
  style: CONFIG.canvasTextStyle as unknown as Record<string, unknown>
  // style: {
  //   align: "left",
  //   breakWords: false,
  //   dropShadow: false,
  //   dropShadowAlpha: 1,
  //   dropShadowAngle: 0.5235987755982988,
  //   dropShadowBlur: 0,
  //   dropShadowColor: "black",
  //   dropShadowDistance: 5,
  //   fill: "black",
  //   fillGradientType: 0,
  //   fillGradientStops: [],
  //   fontFamily: "Arial",
  //   fontSize: 26,
  //   fontStyle: "normal",
  //   fontVariant: "normal",
  //   fontWeight: "normal",
  //   leading: 0,
  //   letterSpacing: 0,
  //   lineHeight: 0,
  //   lineJoin: "miter",
  //   miterLimit: 10,
  //   padding: 0,
  //   stroke: "black",
  //   strokeThickness: 0,
  //   textBaseline: "alphabetic",
  //   trim: false,
  //   whiteSpace: "pre",
  //   wordWrap: true,
  //   wordWrapWidth: 100
  // }
}
