import { NameplatePlaceable } from "types";
import { TokenConfigMixin } from "./applications";
import { NameplateTokenMixin } from "./placeables"

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

Hooks.once("init", () => {

  game.TokenNameplates = {
    refreshAllTokens() { canvas?.scene?.tokens.forEach((token: TokenDocument) => { (token.object as NameplatePlaceable | null)?.refreshNameplates(); }) },
    refreshTokensWithPrototype(prototype: foundry.data.PrototypeToken) {
      canvas?.scene?.tokens.forEach((token: TokenDocument) => {
        if (token.actor?.prototypeToken === prototype) (token.object as unknown as NameplatePlaceable).refreshNameplates(true);
      })
    },
    classes: {

    }
  }

});

Hooks.once("canvasConfig", () => {
  const NameplateToken = NameplateTokenMixin<typeof foundry.canvas.placeables.Token>(CONFIG.Token.objectClass);
  CONFIG.Token.objectClass = NameplateToken;
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  (game as any).TokenNameplates.classes.NameplateToken = NameplateToken;
})

Hooks.once("ready", () => {
  // Apply token configuration mixin.


  const entries = Object.entries(CONFIG.Token.sheetClasses.base);
  for (const [key, { cls }] of entries) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const mixed = TokenConfigMixin(cls as any);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    CONFIG.Token.sheetClasses.base[key].cls = mixed as any;
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  CONFIG.Token.prototypeSheetClass = TokenConfigMixin(CONFIG.Token.prototypeSheetClass as any);

});

Hooks.on("updateActor", (actor: Actor) => {
  canvas?.scene?.tokens.forEach((token) => {
    if (token.object && token.actor === actor)
      (token.object as unknown as NameplatePlaceable).refreshNameplates(true);
  });
});

Hooks.on("updateToken", (token: TokenDocument) => {
  if (token.object)
    (token.object as unknown as NameplatePlaceable).refreshNameplates(true);
});

