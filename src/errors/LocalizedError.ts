
export class LocalizedError extends Error {
  constructor(message?: string, subs?: Record<string, string>) {
    if (message) super(game.i18n?.format(`NAMEPLATES.ERRORS.${message}`, subs ?? {}))
    else super();
  }
}