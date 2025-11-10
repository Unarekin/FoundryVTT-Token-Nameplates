import { DefaultNameplate } from "settings";
import { NameplateConfiguration, SerializedNameplate } from "types";

/** Strips HTML from a given string */
export function stripHTML(val: string): string {
  const doc = new DOMParser().parseFromString(val, "text/html");
  return doc.body.textContent ?? "";
}

/**
 * Handles interpolating a string value to substitute values from the actual token/actor
 * @param {string} text 
 * @param {Record<string, unknown>} data - Data representing the object to be substituted in
 * @param {string} [strip=false] - Whether or not to strip HTML from the string.
 */
export function interpolate(text: string, data: Record<string, unknown>, strip = false): string {
  const reg = /{[^}]+}/g;
  return (strip ? stripHTML(text) : text).replace(reg, k => {
    return (data[k.slice(1, -1)] ?? "") as string;
  })
}

function getSchemaKeys(model: typeof foundry.abstract.DataModel): string[] {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
  const obj: foundry.abstract.DataModel.Any = new (model as any)();
  return Object.keys(foundry.utils.flattenObject(obj));
}

export function getKeys(actorType: string): string[] {
  const keys = [];
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  keys.push(...getSchemaKeys(TokenDocument as any));
  if (CONFIG.Actor.dataModels[actorType]) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const actorKeys = getSchemaKeys(CONFIG.Actor.dataModels[actorType] as any)
    // keys.push(...actorKeys.map(key => `actor.system.${key}`));
    keys.push(...actorKeys.map(key => `system.${key}`));
  }
  keys.push("tooltip", "flags");
  return keys.filter((key, i, arr) => arr.indexOf(key) === i);
}

export function getInterpolationData(doc: TokenDocument): Record<string, unknown> {

  const data = foundry.utils.flattenObject({
    ...doc.toObject(),
    tooltip: (doc.object?.tooltip?.text ?? ""),
    flags: foundry.utils.mergeObject({
      ...(doc.actor?.flags ?? {}),
      ...(doc.flags ?? {})
    }),
    system: foundry.utils.flattenObject(doc.actor?.system ?? {})
    // ...(doc.actor?.toObject() ?? {})
  }) as Record<string, unknown>;

  return data;
}


export async function confirm(title: string, content: string): Promise<boolean> {
  return foundry.applications.api.DialogV2.confirm({
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    window: ({ title } as any),
    content
  }) as Promise<boolean>;
}

export function serializeStyle(style: PIXI.TextStyle) {
  const serialized = JSON.parse(JSON.stringify(style)) as Record<string, unknown>;
  for (const key in style) {
    if (key.startsWith("_")) {
      serialized[key.substring(1)] = serialized[key];
      delete serialized[key];
    }
  }
  return serialized;
}

export function getDefaultNameplate(): SerializedNameplate {
  const val = foundry.utils.deepClone(DefaultNameplate);
  val.style = serializeStyle(CONFIG.canvasTextStyle);
  val.style.fontSize = 24;

  return val;
}

export function getDefaultSettings(): NameplateConfiguration {
  return {
    enabled: false,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    version: __MODULE_VERSION__ as any,
    nameplates: [
      {
        ...getDefaultNameplate(),
        id: foundry.utils.randomID(),
        value: "{name}"
      },
      {
        ...getDefaultNameplate(),
        position: "top",
        id: foundry.utils.randomID(),
        value: "{tooltip}"
      }
    ]
  }
}

export function getNameplateSettings(actor?: Actor): NameplateConfiguration
export function getNameplateSettings(token?: Token): NameplateConfiguration
export function getNameplateSettings(token?: TokenDocument): NameplateConfiguration
export function getNameplateSettings(obj?: unknown): NameplateConfiguration {
  const actor: Actor | undefined = (obj instanceof Actor ? obj : obj instanceof foundry.canvas.placeables.Token ? obj.actor : obj instanceof TokenDocument ? obj.actor : undefined) ?? undefined;

  const baseSettings = getDefaultSettings();

  if (actor?.flags[__MODULE_ID__]?.enabled) {
    foundry.utils.mergeObject(baseSettings, actor.flags[__MODULE_ID__]);
  } else {
    const globalConfig = (game.settings?.get(__MODULE_ID__, "globalConfigurations") ?? {}) as Record<string, NameplateConfiguration>;
    if (actor && globalConfig[actor.type]?.enabled) {
      foundry.utils.mergeObject(baseSettings, globalConfig[actor.type])
    } else if (globalConfig?.global?.enabled) {
      foundry.utils.mergeObject(baseSettings, globalConfig.global);
    }
  }

  return baseSettings;
}

export function downloadJSON(json: object, name: string) {
  const blob = new Blob([JSON.stringify(json, null, 2)], { type: "application/json" });
  const objUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objUrl;
  link.download = name.endsWith(".json") ? name : `${name}.json`;
  link.click();
  URL.revokeObjectURL(objUrl);
}

export function uploadJSON<t = any>(): Promise<t> {
  return new Promise<t>((resolve, reject) => {
    const file = document.createElement("input");
    file.setAttribute("type", "file");
    file.setAttribute("accept", "application/json");
    file.onchange = e => {
      const file = (e.currentTarget as HTMLInputElement).files?.[0];
      if (!file) {
        reject(new Error());
        return;
      }

      const reader = new FileReader();
      reader.onload = e => {
        if (!e.target?.result) throw new Error();
        if (typeof e.target.result === "string") resolve(JSON.parse(e.target.result) as t);
      }

      reader.readAsText(file);
    }

    file.onerror = (event, source, line, col, error) => {
      if (error) reject(error);
      else reject(new Error(typeof event === "string" ? event : typeof undefined));
    }

    file.click();
  })
}

export function getAutocompleteValue(text: string): string {
  const lastOpen = text.lastIndexOf("{");
  const lastClose = text.lastIndexOf("}");
  if (lastClose >= lastOpen) return "";

  const split = text.split("{");
  return split[split.length - 1];
}

export function getAutocompleteSuggestions(token: TokenDocument | Actor, text: string): string[] {
  return Object.keys(getInterpolationData(token))
    .filter(key => key.startsWith(text));
}

