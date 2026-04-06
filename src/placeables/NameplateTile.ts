import { NameplateConfiguration, NameplateConfigurationSource, NameplateDisplay, NameplatePlaceable } from "types";
import { NameplatePlaceableMixin } from "./NameplatePlaceable";
import { Nameplate } from "./Nameplate";
import { getDefaultSettings } from "functions";

export function NameplateTileMixin<t extends typeof foundry.canvas.placeables.Tile>(base: t) {
  return class NameplateTile extends NameplatePlaceableMixin<t>(base) {
    protected getNameplateDocument(): TileDocument {
      return this.document;
    }

    protected displayMode(plate: Nameplate): NameplateDisplay {
      const display = plate.display ?? "default";
      if (display === "default") {
        return "none";
      } else {
        return display;
      }
    }

    public get nameplateConfigSource(): NameplateConfigurationSource {
      return this.getNameplateDocument().getFlag(__MODULE_ID__, "source") ?? "tile";
    }

    protected refreshNameplates(force = false) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      super.refreshNameplates(force);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const nameContainer = (this as any).nameContainer as PIXI.Container;
      if (nameContainer.parent && nameContainer.parent === canvas?.primary) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        (nameContainer as any).sort = ((this as any).sort as number) + 1;
      }

      const placeable = this as unknown as NameplatePlaceable;

      // TODO: This is probably not correct.
      if (game?.release?.isNewer("14")) {
        placeable.topContainer.y = -(this.document.height / 2);
        placeable.topContainer.x = 0;  //(this.document.width / 2);

        placeable.bottomContainer.y = this.document.height / 2;
        placeable.bottomContainer.x = 0;// (this.document.width / 2);

        placeable.leftContainer.x = -this.document.width * 1.75; // * 1.3;
        placeable.leftContainer.y = -this.document.height / 2;

        placeable.rightContainer.x = this.document.width * 1.75;
        placeable.rightContainer.y = -this.document.height / 2;
      } else {
        placeable.topContainer.y = 0;
        placeable.topContainer.x = this.document.width / 2;

        placeable.bottomContainer.y = this.document.height;
        placeable.bottomContainer.x = this.document.width / 2;

        placeable.leftContainer.x = -this.document.width * 1.3;
        placeable.leftContainer.y = 0;

        placeable.rightContainer.x = this.document.width * 2.25;
        placeable.rightContainer.y = 0;
      }
    }

    protected setContainerParent() {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      const parent = (this as any).placeAbovePlaceables() ? canvas?.tiles : canvas?.primary;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (parent && parent !== (this as any).nameContainer.parent)
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        parent.addChild((this as any).nameContainer);
    }

    protected shouldMoveNameplateToPlaceable = true;

    protected getInterpolationData() {
      const data: Record<string, unknown> = {};
      foundry.utils.mergeObject(data, this.getNameplateDocument());

      return data;
    }

    protected getBasePlaceablePosition(): { x: number, y: number } {
      return {
        x: this.document.x - (this.document.width / 2),
        y: this.document.y,
      }
    }

    protected getNameplateFlags(): NameplateConfiguration {
      const defaultSettings = getDefaultSettings();
      const globalConfig = game.settings?.settings?.get(`${__MODULE_ID__}.globalConfigurations`) ? (game.settings?.get(__MODULE_ID__, "globalConfigurations") ?? {}) : {};

      switch (this.nameplateConfigSource) {
        case "tile":
          foundry.utils.mergeObject(defaultSettings, this.getNameplateDocument().flags[__MODULE_ID__]?.config ?? {});
          break;
        case "global":
          if (globalConfig.global) foundry.utils.mergeObject(defaultSettings, globalConfig.global);
          break;
      }
      return defaultSettings;
    }
  }
}