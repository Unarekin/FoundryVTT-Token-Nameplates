export function generateFontSelectOptions(): Record<string, string> {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
  return Object.fromEntries(((foundry.applications.settings.menus.FontConfig as any).getAvailableFonts() as string[]).sort((a, b) => a.localeCompare(b)).map(font => [font, font]));
}