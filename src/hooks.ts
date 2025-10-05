import { DeepPartial, PropsOfType } from "types";
import { NameplateToken } from "./NameplateToken";


Hooks.once("canvasReady", () => {
  // Initialize Pixi DevTools if we are a debug build
  if (__DEV__ && canvas?.stage) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    (window as any).__PIXI_DEVTOOLS__ = {
      stage: canvas.stage,
      renderer: canvas?.app?.renderer
    }
  }
});

// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
function simpleWrapper<t extends keyof PropsOfType<NameplateToken, Function>>(funcName: t): (this: foundry.canvas.placeables.Token, wrapped: Function, ...args: unknown[]) => any {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  return function (this: foundry.canvas.placeables.Token, wrapped: Function, ...args: unknown[]) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment
    const retVal = wrapped(...args);
    if (retVal instanceof Promise) {
      return retVal
        .then(val => {
          const nameplateToken = TokenNameplates.tokens.get(this) ?? new NameplateToken(this);
          TokenNameplates.tokens.set(this, nameplateToken);
          if (nameplateToken) {

            // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
            (nameplateToken as any)[funcName]();
          }
          // eslint-disable-next-line @typescript-eslint/no-unsafe-return
          return val;
        })
    } else {
      const nameplateToken = TokenNameplates.tokens.get(this) ?? new NameplateToken(this);
      TokenNameplates.tokens.set(this, nameplateToken);
      if (nameplateToken) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        (nameplateToken as any)[funcName]();
      }
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return retVal;
    }
  }
}

Hooks.once("init", () => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
  libWrapper.register(__MODULE_ID__, "foundry.canvas.placeables.Token.prototype._draw", simpleWrapper("draw"));
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
  libWrapper.register(__MODULE_ID__, "foundry.canvas.placeables.Token.prototype._refreshState", simpleWrapper("refreshState"));
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
  libWrapper.register(__MODULE_ID__, "foundry.canvas.placeables.Token.prototype._refreshSize", simpleWrapper("refreshSize"));
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
  libWrapper.register(__MODULE_ID__, "foundry.canvas.placeables.Token.prototype._destroy", simpleWrapper("destroy"));
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
  libWrapper.register(__MODULE_ID__, "foundry.canvas.placeables.Token.prototype._refreshNameplate", simpleWrapper("refreshNameplate"));
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
  libWrapper.register(__MODULE_ID__, "foundry.canvas.placeables.Token.prototype._refreshTooltip", simpleWrapper("refreshTooltip"));

});

// eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
(Hooks as any).on("updateToken", (doc: TokenDocument, delta: DeepPartial<TokenDocument>) => {
  const nameplate = doc.object ? TokenNameplates.tokens.get(doc.object) : undefined;
  if (nameplate instanceof NameplateToken) nameplate.tokenUpdated(delta);
});