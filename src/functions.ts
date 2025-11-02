import { DefaultNameplate } from "settings";
import { SerializedNameplate } from "types";

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
    return data[k.slice(1, -1)] as string;
  })
}

export function getInterpolationData(doc: TokenDocument): Record<string, unknown> {
  return foundry.utils.flattenObject(
    foundry.utils.mergeObject(doc.toObject(), {
      actor: doc.actor?.toObject() ?? {},
      flags: foundry.utils.mergeObject({
        ...(doc.actor?.flags ?? {}),
        ...(doc.flags ?? {})
      }),
      system: doc.actor?.system ?? {}
    })
  ) as Record<string, unknown>
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

  return val;
}