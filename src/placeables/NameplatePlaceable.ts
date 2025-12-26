import { IsometricFlags, NameplateConfiguration, NameplateConfigurationSource, NameplateDisplay } from "types";
import { Nameplate } from "./Nameplate";
import { getNameplateSettings } from "functions";


export function NameplatePlaceableMixin<t extends typeof foundry.canvas.placeables.PlaceableObject>(base: t): t {
  abstract class NameplatePlaceable extends base {
    private readonly bottomContainer = new PIXI.Container();
    private readonly topContainer = new PIXI.Container();
    private readonly rightContainer = new PIXI.Container();
    private leftContainer = new PIXI.Container();

    public abstract isOwner: boolean;
    public abstract hover: boolean;

    public readonly padding = 2;

    public readonly nameplates: Nameplate[] = [];
    public get bottomNameplates() { return this.nameplates.filter(nameplate => nameplate.nameplatePosition === "bottom"); }
    public get topNameplates() { return this.nameplates.filter(nameplate => nameplate.nameplatePosition === "top"); }
    public get leftNameplates() { return this.nameplates.filter(nameplate => nameplate.nameplatePosition === "left"); }
    public get rightNameplates() { return this.nameplates.filter(nameplate => nameplate.nameplatePosition === "right"); }

    public abstract get nameplateConfigSource(): NameplateConfigurationSource;

    protected abstract getInterpolationData(): Record<string, unknown>;
    protected abstract getNameplateDocument(): foundry.abstract.Document.Any;
    protected getNameplateFlags(): NameplateConfiguration { return getNameplateSettings(this.getNameplateDocument()); }

    protected recreateNameplates() {
      this.nameplates.forEach(nameplate => nameplate.destroy());
      this.nameplates.splice(0, this.nameplates.length);

      const config = this.getNameplateFlags();
      if (!config.enabled) return;

      for (const plateConfig of config.nameplates) {
        const nameplate = new Nameplate(this, plateConfig);
        this.nameplates.push(nameplate);
        switch (plateConfig.position) {
          case "bottom":
            this.bottomContainer.addChild(nameplate);
            break;
          case "left":
            this.leftContainer.addChild(nameplate);
            break;
          case "top":
            this.topContainer.addChild(nameplate);
            break;
          case "right":
            this.rightContainer.addChild(nameplate);
        }
        nameplate.updateText(true);
      }
    }

    protected getPlateWrapWidth() { return this.bounds.width * 2.5; }

    protected displayMode(plate: Nameplate): NameplateDisplay { return plate.display ?? "default"; }

    protected displayConditionsMet(display: NameplateDisplay): boolean {
      switch (display) {
        case "always":
          return true;
        case "none":
          return false;
        case "ownerHover":
          return this.isOwner && this.hover;
        case "hover":
          return this.hover;
        default:
          return false;
      }
    }

    protected shouldDisplay(plate: Nameplate): boolean {
      const display = this.displayMode(plate);
      return this.displayConditionsMet(display);
    }

    protected get shouldInvertIsometry() {
      if (!game.modules?.get("isometric-perspective")?.active) return false;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
      if (!(game.settings?.settings as any).get(`${__MODULE_ID__}.invertIsometryTransform`)) return false;
      if (!game.settings?.get(__MODULE_ID__, "invertIsometryTransform")) return false;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (!(this.scene.flags as any)["isometric-perspective"]?.isometricEnabled) return false;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (((this.document as any).flags["isometric-perspective"] as IsometricFlags).isoTokenDisabled) return false;
      if (!game.settings?.get("isometric-perspective", "worldIsometricFlag")) return false;

      return true;
      // // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
      // return !!((game.settings?.settings as any).get(`${__MODULE_ID__}.invertIsometryTransform`) && game.settings?.get(__MODULE_ID__, "invertIsometryTransform") && (this.scene.flags as any)["isometric-perspective"]?.isometricEnabled && !((this.document as any).flags["isometric-perspective"] as IsometricFlags).isoTokenDisabled);
    }

    protected positionNameplates(list: Nameplate[], up = false, initialY = 0) {
      const { width } = this.bounds;
      const sorted = list.toSorted((a, b) => a.sort - b.sort);

      let y = initialY;
      let xAdjust = 0;


      if (this.shouldInvertIsometry && (this.document instanceof TokenDocument || this.document instanceof TileDocument)) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        const isoFlags = (this.document.flags as any)["isometric-perspective"] as IsometricFlags;
        if (isoFlags?.offsetX) y -= isoFlags.offsetX;
        if (isoFlags?.offsetY) xAdjust -= isoFlags.offsetY;
        xAdjust -= this.document.width * this.scene.dimensions.size / 4;
        if (up)
          y -= this.document.height * this.scene.dimensions.size;
      }


      for (const plate of sorted) {
        if (this.shouldDisplay(plate)) {
          plate.visible = true;
          if (up)
            y -= (plate.height) + this.padding + plate.padding.y;

          plate.y = y;
          if (!up)
            y += (plate.height) + this.padding + plate.padding.y;

          plate.style.wordWrap = true;
          plate.style.wordWrapWidth = this.getPlateWrapWidth();

          if (plate.autoAnchor) plate.anchor.y = 0;
          switch (plate.style.align) {
            case "left":
            case "justify":
              if (plate.autoAnchor) plate.anchor.x = 0;
              plate.x = ((width / 2) - (plate.style.wordWrapWidth / 2)) - xAdjust + plate.padding.x;
              break;
            case "right":
              if (plate.autoAnchor) plate.anchor.x = 1;
              plate.x = ((width / 2) + (plate.style.wordWrapWidth / 2)) - xAdjust + plate.padding.x;
              break;
            default:
              if (plate.autoAnchor) plate.anchor.x = 0.5;
              plate.x = (width / 2) - xAdjust + plate.padding.x
          }

        } else {
          plate.visible = false;
        }
      }
    }

    protected invertIsometry(displayObject: PIXI.DisplayObject) {
      displayObject.angle = 45;
      displayObject.skew.x = displayObject.skew.y = 0;
    }

    protected positionTopNameplates() {
      this.positionNameplates(this.topNameplates, true);
      if (this.shouldInvertIsometry) this.invertIsometry(this.topContainer);
      else this.topContainer.angle = 0;
    }

    protected positionBottomNameplates() {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
      this.positionNameplates(this.bottomNameplates, false, ((this as any).nameplate?.y ?? 0) + this.padding);
      if (this.shouldInvertIsometry) this.invertIsometry(this.bottomContainer);
      else this.bottomContainer.angle = 0;
    }
    protected positionLeftNameplates() {
      this.positionNameplates(this.leftNameplates);
      if (this.shouldInvertIsometry) {
        this.invertIsometry(this.leftContainer);
        this.leftContainer.x = -((this.getPlateWrapWidth() / 2) + (this.padding * 2));
        this.leftContainer.y = -((this.getPlateWrapWidth() / 2) + (this.padding * 2));
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        const isoFlags = (this.document.flags as any)["isometric-perspective"] as IsometricFlags;
        if (isoFlags) {
          if (isoFlags?.offsetX) this.leftContainer.y -= isoFlags.offsetX;
          if (isoFlags?.offsetY) this.leftContainer.x -= isoFlags.offsetY;
        }
      } else {
        this.leftContainer.angle = 0;
        this.leftContainer.y = 0;
        this.leftContainer.x = -(((this.document as TokenDocument).width * 2 * this.scene.dimensions.size) + this.padding);

      }
    }
    protected positionRightNameplates() {
      this.positionNameplates(this.rightNameplates);
      if (this.shouldInvertIsometry) {
        this.invertIsometry(this.rightContainer);
        this.rightContainer.x = ((this.getPlateWrapWidth() / 2) + (this.padding * 2));
        this.rightContainer.y = ((this.getPlateWrapWidth() / 2) + (this.padding * 2));
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        const isoFlags = (this.document.flags as any)["isometric-perspective"] as IsometricFlags;
        if (isoFlags) {
          if (isoFlags?.offsetX) this.leftContainer.y += isoFlags.offsetX;
          if (isoFlags?.offsetY) this.leftContainer.x += isoFlags.offsetY;
        }
      } else {
        this.rightContainer.angle = 0;
        this.rightContainer.y = 0;
        this.rightContainer.x = (((this.document as TokenDocument).width * 2 * this.scene.dimensions.size) + this.padding);
      }

    }

    protected clearContainer(container: PIXI.Container) {
      const children = container.removeChildren();
      children.forEach(child => { child.destroy(); })
    }

    protected refreshNameplates(force = false) {
      if (force) {
        this.nameplates.splice(0, this.nameplates.length);
        this.clearContainer(this.topContainer);
        this.clearContainer(this.bottomContainer);
        this.clearContainer(this.leftContainer);
        this.clearContainer(this.rightContainer);
      }

      const config = this.getNameplateFlags();

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if ((this as any).nameplate && config.enabled) (this as any).nameplate.renderable = false;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if ((this as any).tooltip && config.enabled) (this as any).tooltip.renderable = false;

      if (!this.nameplates.length)
        this.recreateNameplates();

      this.positionTopNameplates();
      this.positionBottomNameplates();
      this.positionLeftNameplates();
      this.positionRightNameplates();

      const interpolationData = this.getInterpolationData();
      this.nameplates.forEach(plate => { plate.refreshText(interpolationData); });
    }

    protected _refreshPosition() {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      super._refreshPosition();
      void this.refreshNameplates();
    }

    protected _refreshSize() {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      super._refreshSize();
      void this.refreshNameplates();
    }

    protected _refreshMesh() {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      super._refreshMesh();
      void this.refreshNameplates();
    }

    protected _refreshState() {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      super._refreshState();
      void this.refreshNameplates();
    }

    protected _destroy(options?: PIXI.IDestroyOptions | boolean) {
      this.nameplates.forEach(nameplate => { nameplate.destroy(); });
      this.nameplates.splice(0, this.nameplates.length);

      super._destroy(options)
    }

    constructor(doc: foundry.abstract.Document.Any) {
      super(doc);

      this.bottomContainer.name = `${this.id} - Bottom Nameplates`;
      this.topContainer.name = `${this.id} - Top Nameplates`;
      this.leftContainer.name = `${this.id} - Left Nameplates`;
      this.rightContainer.name = `${this.id} - Right Nameplates`;

      this.addChild(this.topContainer);
      this.addChild(this.bottomContainer);
      this.addChild(this.rightContainer);
      this.addChild(this.leftContainer);

      void this.refreshNameplates(true);
    }
  }

  return NameplatePlaceable;
}
