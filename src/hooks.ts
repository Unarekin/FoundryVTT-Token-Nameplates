import { NameplatePlaceable } from "types";
import { PrototypeTokenConfigMixin, TileConfigMixin, TokenConfigMixin } from "./applications";
import { NameplateTokenMixin, NameplateTileMixin } from "./placeables"

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
    refreshAllTokens(force = false) { canvas?.scene?.tokens.forEach((token: TokenDocument) => { (token.object as NameplatePlaceable | null)?.refreshNameplates(force); }) },
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
  CONFIG.Token.objectClass = NameplateTokenMixin(CONFIG.Token.objectClass);
  CONFIG.Tile.objectClass = NameplateTileMixin(CONFIG.Tile.objectClass);

  if (game.TokenNameplates) {
    game.TokenNameplates.classes ??= {};
    game.TokenNameplates.classes.NameplateToken = CONFIG.Token.objectClass;
    game.TokenNameplates.classes.NameplateTile = CONFIG.Tile.objectClass;
  }
})

function applyMixin(collection: Record<string, any>, mixin: any) {
  const entries = Object.entries(collection);
  for (const [key, { cls }] of entries) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
    const mixed = mixin(cls);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    collection[key].cls = mixed;
  }
}


Hooks.once("ready", () => {
  // Apply token configuration mixin.

  applyMixin(CONFIG.Token.sheetClasses.base, TokenConfigMixin);
  CONFIG.Token.prototypeSheetClass = PrototypeTokenConfigMixin(CONFIG.Token.prototypeSheetClass as any);

  applyMixin(CONFIG.Tile.sheetClasses.base, TileConfigMixin);

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

Hooks.on("updateTile", (tile: TileDocument) => {
  if (tile.object)
    (tile.object as unknown as NameplatePlaceable).refreshNameplates(true);
})