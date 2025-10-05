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
