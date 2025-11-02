export function generateFontSelectOptions(): Record<string, string> {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
  return Object.fromEntries(((foundry.applications.settings.menus.FontConfig as any).getAvailableFonts() as string[]).sort((a, b) => a.localeCompare(b)).map(font => [font, font]));
}

export function generateDisplaySelectOptions(): Record<string, string> {
  return {
    default: "",
    none: "TOKEN.DISPLAY_NONE",
    control: "TOKEN.DISPLAY_CONTROL",
    ownerHover: "TOKEN.DISPLAY_OWNER_HOVER",
    hover: "TOKEN.DISPLAY_HOVER",
    owner: "TOKEN.DISPLAY_OWNER",
    always: "TOKEN.DISPLAY_ALWAYS"
  }
}