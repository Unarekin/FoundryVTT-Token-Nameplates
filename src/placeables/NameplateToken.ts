import { NameplateConfiguration, NameplateConfigurationSource, NameplateDisplay, NameplatePlaceable } from "types";
import { NameplatePlaceableMixin } from "./NameplatePlaceable";
import { getActorInterpolationData, getDefaultSettings, getNameplateSettings } from "functions";
import { Nameplate } from "./Nameplate";
import { TokenDisplayHash } from "settings";

export function NameplateTokenMixin<t extends typeof foundry.canvas.placeables.Token>(base: t) {
  return class NameplateToken extends NameplatePlaceableMixin<t>(base) {

    protected getNameplateDocument(): TokenDocument | Actor {
      if (this.document.getFlag(__MODULE_ID__, "useTokenOverride") && this.document.getFlag(__MODULE_ID__, "enabled"))
        return this.document;

      return this.document.actor ?? this.document;
    }

    protected displayMode(plate: Nameplate): NameplateDisplay {
      const display = plate.display ?? "default";
      if (display === "default") {
        return TokenDisplayHash[this.document.displayName];
      } else {
        return display;
      }
    }


    public get nameplateConfigSource(): NameplateConfigurationSource {
      if (this.document.getFlag(__MODULE_ID__, "useTokenOverride") && this.document.getFlag(__MODULE_ID__, "enabled"))
        return "token";
      else if (this.actor?.getFlag(__MODULE_ID__, "enabled"))
        return "actor";


      const globalConfig = (game.settings?.get(__MODULE_ID__, "globalConfigurations") ?? {}) as Record<string, NameplateConfiguration>;
      if (this.actor && globalConfig[this.actor.type]?.enabled)
        return "actorType";


      if (globalConfig.global?.enabled)
        return "global";

      return "default"
    }

    protected getNameplateFlags(): NameplateConfiguration {
      const localFlags = getNameplateSettings(this.getNameplateDocument());
      const defaultSettings = getDefaultSettings();

      // First check to see if there are settings on the token or actor
      if (localFlags.enabled) return foundry.utils.mergeObject(defaultSettings, localFlags);

      // Check to make sure the setting has been registered.  This can be called before the module has properly loaded.
      if (game.settings?.settings.get(`${__MODULE_ID__}.globalConfigurations`)) {
        // Now find type-based
        const globalConfig = (game.settings?.get(__MODULE_ID__, "globalConfigurations") ?? {}) as Record<string, NameplateConfiguration>;
        if (this.actor && globalConfig[this.actor.type]?.enabled) {
          return foundry.utils.mergeObject(defaultSettings, globalConfig[this.actor.type]);
        } else if (globalConfig?.global?.enabled) {
          return foundry.utils.mergeObject(defaultSettings, globalConfig.global);
        }
      }
      return defaultSettings;
    }

    public get isOwner() { return super.isOwner; }
    public get hover() { return super.hover; }
    public set hover(val) { super.hover = val; }


    protected getInterpolationData() {
      const data: Record<string, unknown> = {};
      foundry.utils.mergeObject(data, this.document);;

      if (this.document.system)
        foundry.utils.mergeObject(data, this.document.system);
      foundry.utils.mergeObject(data, { flags: this.document.flags });

      if (this.actor)
        foundry.utils.mergeObject(data, getActorInterpolationData(this.actor));

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