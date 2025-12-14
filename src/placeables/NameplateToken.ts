import { NameplatePlaceable } from "types";
import { NameplatePlaceableMixin } from "./NameplatePlaceable"

export function NameplateTokenMixin<t extends typeof foundry.canvas.placeables.Token>(base: t) {
  return class NameplateToken extends NameplatePlaceableMixin<t>(base) {

    protected getFlagDocument(): TokenDocument | Actor {
      if (this.document.getFlag(__MODULE_ID__, "useTokenOverride"))
        return this.document;

      return this.document.actor ?? this.document;
    }

    public get isOwner() { return super.isOwner; }
    public get hover() { return super.hover; }
    public set hover(val) { super.hover = val; }


    protected getInterpolationData() {
      const data: Record<string, unknown> = foundry.utils.flattenObject(this.document.toObject()) as Record<string, unknown>
      if (this.tooltip?.text) data.tooltip = this.tooltip.text;

      if (this.actor) {
        foundry.utils.mergeObject(data, {
          actor: this.actor.toObject(),
          system: foundry.utils.flattenObject(this.actor.system)
        });
      }

      return data;
    }

    protected _refreshNameplate() {
      super._refreshNameplate();
      (this as unknown as NameplatePlaceable).refreshNameplates();
    }

    protected _refreshTooltip() {
      super._refreshTooltip();
      (this as unknown as NameplatePlaceable).refreshNameplates();
    }

  }


}