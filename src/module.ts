import "./hooks";
import { NameplateToken } from "./NameplateToken";
import "./settings";


// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
(globalThis as any).TokenNameplates = {
  tokens: new WeakMap<foundry.canvas.placeables.Token, NameplateToken>(),
}
CONFIG.debug.hooks = true;