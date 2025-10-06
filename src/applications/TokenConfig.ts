import { getInterpolationData, interpolate, confirm, serializeStyle } from "functions";
import { DeepPartial, NameplateConfiguration } from "../types";
import { generateFontSelectOptions } from "./functions";
import { LocalizedError } from "../errors";
import { NameplateConfigApplication } from "./NameplateConfig";


export function TokenConfigMixin(Base: typeof foundry.applications.sheets.TokenConfig) {
  class TokenConfiguration extends Base {
    #flags: NameplateConfiguration | undefined = undefined;

    public static DEFAULT_OPTIONS: DeepPartial<foundry.applications.api.DocumentSheetV2.Configuration<any>> = {
      actions: {
        // eslint-disable-next-line @typescript-eslint/unbound-method
        addNameplate: TokenConfiguration.AddNameplate,
        // eslint-disable-next-line @typescript-eslint/unbound-method
        editNameplate: TokenConfiguration.EditNameplate,
        // eslint-disable-next-line @typescript-eslint/unbound-method
        moveNameplateDown: TokenConfiguration.MoveNameplateDown,
        // eslint-disable-next-line @typescript-eslint/unbound-method
        moveNameplateUp: TokenConfiguration.MoveNameplateUp,
        // eslint-disable-next-line @typescript-eslint/unbound-method
        removeNameplate: TokenConfiguration.RemoveNameplate
      }
    }

    static async MoveNameplateUp(this: TokenConfiguration, e: PointerEvent, elem: HTMLElement) {
      try {
        if (!this.#flags) return;

        const id = elem.dataset.nameplate;
        if (!id) throw new LocalizedError("MISSINGNAMEPLATEID");
        const index = this.#flags.nameplates.findIndex(item => item.id === id);
        if (index === -1) throw new LocalizedError("NAMEPLATENOTFOUND");
        if (index === 0) return;

        const nameplate = this.#flags.nameplates[index];

        this.#flags.nameplates[index] = this.#flags.nameplates[index - 1];
        this.#flags.nameplates[index - 1] = nameplate;
        await this.render();
      } catch (err) {
        console.error(err);
        if (err instanceof Error) ui.notifications?.error(err.message, { console: false });
      }
    }

    static async MoveNameplateDown(this: TokenConfiguration, e: PointerEvent, elem: HTMLElement) {
      try {
        if (!this.#flags) return;

        const id = elem.dataset.nameplate;
        if (!id) throw new LocalizedError("MISSINGNAMEPLATEID");
        const index = this.#flags.nameplates.findIndex(item => item.id === id);
        if (index === -1) throw new LocalizedError("NAMEPLATENOTFOUND");
        if (index === this.#flags.nameplates.length - 1) return;

        const nameplate = this.#flags.nameplates[index];
        this.#flags.nameplates[index] = this.#flags.nameplates[index + 1];
        this.#flags.nameplates[index + 1] = nameplate;
        await this.render();
      } catch (err) {
        console.error(err);
        if (err instanceof Error) ui.notifications?.error(err.message, { console: false });
      }
    }

    static async AddNameplate(this: TokenConfiguration) {
      try {
        if (!this.#flags) return;
        const highest = this.#flags.nameplates.reduce((prev, curr) => curr.position === "bottom" && curr.sort > prev ? curr.sort : prev, 0);
        const nameplate = await NameplateConfigApplication.Edit({
          id: foundry.utils.randomID(),
          sort: highest + 1,
          position: "bottom",
          style: serializeStyle(CONFIG.canvasTextStyle.clone()),
          value: "",
          padding: { x: 0, y: 0 },
          angle: 0,
          alpha: 1
        });

        console.log("Nameplate:", nameplate);
        if (nameplate) {
          this.#flags.nameplates.push(nameplate);
          await this.render();
        }
      } catch (err) {
        console.error(err);
        if (err instanceof Error) ui.notifications?.error(err.message, { console: false });
      }
    }

    static async RemoveNameplate(this: TokenConfiguration, e: PointerEvent, elem: HTMLElement) {
      try {
        if (!this.#flags) return;

        const id = elem.dataset.nameplate;
        if (!id) throw new LocalizedError("MISSINGNAMEPLATEID");
        const nameplate = this.#flags?.nameplates.find(item => item.id === id);
        if (!nameplate) throw new LocalizedError("NAMEPLATENOTFOUND");

        const confirmed = await confirm(
          "NAMEPLATES.CONFIG.REMOVE.TITLE",
          (game.i18n?.localize("NAMEPLATES.CONFIG.REMOVE.CONTENT") ?? "").replaceAll("\n", "<br>\n")
        );
        if (!confirmed) return;

        const index = this.#flags.nameplates.findIndex(item => item.id === id);
        if (index > -1) this.#flags.nameplates.splice(index, 1);
        await this.render();
      } catch (err) {
        console.error(err);
        if (err instanceof Error) ui.notifications?.error(err.message, { console: false });
      }
    }

    static async EditNameplate(this: TokenConfiguration, e: PointerEvent, elem: HTMLElement) {
      try {
        if (!this.#flags) return;
        const id = elem.dataset.nameplate;
        if (!id) throw new LocalizedError("MISSINGNAMEPLATEID");
        const nameplate = this.#flags.nameplates.find(item => item.id === id);
        if (!nameplate) throw new LocalizedError("NAMEPLATENOTFOUND");

        const edited = await NameplateConfigApplication.Edit(nameplate);
        if (edited) {
          const index = this.#flags.nameplates.findIndex(item => item.id === edited.id);
          if (index > -1) this.#flags.nameplates.splice(index, 1, edited);
          await this.render();
        }
      } catch (err) {
        console.error(err);
        if (err instanceof Error) ui.notifications?.error(err.message, { console: false });
      }
    }

    async _prepareContext(options: foundry.applications.api.DocumentSheetV2.RenderOptions) {
      const context = await super._prepareContext(options);

      if (!this.#flags) {
        this.#flags = foundry.utils.mergeObject({
          enabled: true,
          version: __MODULE_VERSION__,
          nameplates: []
        },
          {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            ...((this as any).actor.flags[__MODULE_ID__] ?? {}),
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            ...((this as any).token.flags[__MODULE_ID__] ?? {})
          }
        ) as NameplateConfiguration;
      }


      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      (context as any).nameplates = {
        enabled: this.#flags?.enabled ?? true,
        nameplates: (this.#flags?.nameplates ?? [])?.map(nameplate => ({
          ...nameplate,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
          actualValue: interpolate(nameplate.value, getInterpolationData((this as any).token))
        })) ?? [],
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
        idPrefix: (this as any).token instanceof foundry.canvas.placeables.Token ? (this as any).token.uuid.replaceAll(".", "-") : `prototype-${(this as any).actor.uuid.replaceAll(".", "-")}`,
        // idPrefix: (this as any).token.uuid.replaceAll(".", "-"),
        fontSelect: generateFontSelectOptions()
      }

      return context;
    }

    // async _onRender(context: foundry.applications.api.DocumentSheetV2.RenderContext<any>, options: foundry.applications.api.DocumentSheetV2.RenderOptions) {
    //   await super._onRender(context, options);

    //   // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    //   ($(this.element).find(`[data-role="nameplate-item"]`) as any).sortable({
    //     handle: `[data-role="drag-handle"]`,
    //     containment: "parent",
    //     axis: "y"
    //   })
    // }

  }

  // Inject our configuration part before the footer
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  const parts = (Base as any).PARTS as Record<string, foundry.applications.api.HandlebarsApplicationMixin.HandlebarsTemplatePart>;
  const footer = parts.footer;
  delete parts.footer;

  foundry.utils.mergeObject(parts, {
    nameplates: {
      template: `modules/${__MODULE_ID__}/templates/TokenConfig.hbs`
    },
    footer
  });

  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  foundry.utils.mergeObject((Base as any).PARTS ?? {}, parts);

  TokenConfiguration.TABS.sheet.tabs.push({
    id: "nameplates",
    icon: "fa-solid fa-signature",
    cssClass: ""
  });

  return TokenConfiguration;
}