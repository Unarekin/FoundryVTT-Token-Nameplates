import { NameplateConfiguration } from "types";
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


    protected abstract getInterpolationData(): Record<string, unknown>;
    protected abstract getFlagDocument(): foundry.abstract.Document.Any;
    protected getFlags(): NameplateConfiguration { return getNameplateSettings(this.getFlagDocument()); }

    protected recreateNameplates() {
      this.nameplates.forEach(nameplate => nameplate.destroy());
      this.nameplates.splice(0, this.nameplates.length);

      const config = this.getFlags();
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

    protected shouldDisplay(plate: Nameplate): boolean {
      const display = plate.display ?? "default" // === "default" ? TokenDisplayHash[this.document.displayName] : plate.display;


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

    protected positionNameplates(list: Nameplate[], up = false, initialY = 0) {
      const { width } = this.bounds;
      const sorted = list.toSorted((a, b) => a.sort - b.sort);

      let y = initialY;
      for (const plate of sorted) {
        if (this.shouldDisplay(plate)) {
          plate.visible = true;
          if (up)
            y -= (plate.height) + this.padding;

          plate.y = y;
          if (!up)
            y += (plate.height) + this.padding;

          plate.style.wordWrap = true;
          plate.style.wordWrapWidth = this.getPlateWrapWidth();

          if (plate.autoAnchor) plate.anchor.y = 0;
          switch (plate.style.align) {
            case "left":
            case "justify":
              if (plate.autoAnchor) plate.anchor.x = 0;
              plate.x = (width / 2) - (plate.style.wordWrapWidth / 2);
              break;
            case "right":
              if (plate.autoAnchor) plate.anchor.x = 1;
              plate.x = (width / 2) + (plate.style.wordWrapWidth / 2);
              break;
            default:
              if (plate.autoAnchor) plate.anchor.x = 0.5;
              plate.x = width / 2;
          }

        } else {
          plate.visible = false;
        }
      }
    }

    protected positionTopNameplates() { this.positionNameplates(this.topNameplates, true); }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
    protected positionBottomNameplates() { this.positionNameplates(this.bottomNameplates, false, ((this as any).nameplate?.y ?? 0) + this.padding); }
    protected positionLeftNameplates() { this.positionNameplates(this.leftNameplates); }
    protected positionRightNameplates() { this.positionNameplates(this.rightNameplates); }

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

      const config = this.getFlags();

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
