import { getInterpolationData, interpolate, confirm, serializeStyle, getDefaultNameplate } from "functions";
import { DeepPartial, NameplateConfiguration } from "../types";
import { generateFontSelectOptions } from "./functions";
import { LocalizedError } from "../errors";
import { NameplateConfigApplication } from "./NameplateConfig";
import { DefaultSettings } from "settings";


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
          ...getDefaultNameplate(),
          id: foundry.utils.randomID(),
          style: serializeStyle(CONFIG.canvasTextStyle.clone()),
          sort: highest + 1
        });

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
          edited.style = serializeStyle(edited.style as unknown as PIXI.TextStyle);
          const index = this.#flags.nameplates.findIndex(item => item.id === edited.id);
          if (index > -1) this.#flags.nameplates.splice(index, 1, edited);
          await this.render();
        }
      } catch (err) {
        console.error(err);
        if (err instanceof Error) ui.notifications?.error(err.message, { console: false });
      }
    }

    async _onSubmitForm(formConfig: foundry.applications.api.ApplicationV2.FormConfiguration, event: Event | SubmitEvent): Promise<void> {
      if (!this.form) return;

      const data = foundry.utils.expandObject(new foundry.applications.ux.FormDataExtended(this.form).object) as Record<string, unknown>;

      const config: NameplateConfiguration = {
        ...DefaultSettings,
        ...(this.#flags ?? {}),
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        enabled: (data.nameplates as any)?.enabled ?? true,
        nameplates: Array.isArray(this.#flags?.nameplates) ? foundry.utils.deepClone(this.#flags.nameplates) : []
      };

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const actor = ((this as any).token as foundry.canvas.placeables.Token).actor as Actor | undefined;
      actor?.update({
        flags: {
          [__MODULE_ID__]: config
        }
      })

        .catch((err: Error) => {
          console.error(err);
          ui.notifications?.error(err.message, { console: false });
        })

      return super._onSubmitForm(formConfig, event);
    }

    async _prepareContext(options: foundry.applications.api.DocumentSheetV2.RenderOptions) {
      const context = await super._prepareContext(options);

      if (options.force || options.isFirstRender || !this.#flags) {
        this.#flags = foundry.utils.mergeObject({
          enabled: true,
          version: __MODULE_VERSION__,
          nameplates: []
        },
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          ((this as any).actor.flags[__MODULE_ID__] ?? {}),
        ) as NameplateConfiguration;

        if (!this.#flags.nameplates?.length) {
          // Add placeholder
          this.#flags.nameplates.push({
            ...getDefaultNameplate(),
            id: foundry.utils.randomID(),
            value: "{name}"
          }, {
            ...getDefaultNameplate(),
            id: foundry.utils.randomID(),
            value: "{tooltip}"
          });
        }
      }


      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      (context as any).nameplates = {
        enabled: this.#flags?.enabled ?? true,
        upperNameplates: (this.#flags?.nameplates ?? []).filter(plate => plate.position === "top").map(nameplate => ({
          ...nameplate,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
          actualValue: interpolate(nameplate.value, getInterpolationData((this as any).token))
        })),
        lowerNameplates: (this.#flags?.nameplates ?? []).filter(plate => plate.position === "bottom").map(nameplate => ({
          ...nameplate,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
          actualValue: interpolate(nameplate.value, getInterpolationData((this as any).token))
        })),
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
        idPrefix: (this as any).token instanceof foundry.canvas.placeables.Token ? (this as any).token.uuid.replaceAll(".", "-") : `prototype-${(this as any).actor.uuid.replaceAll(".", "-")}`,
        // idPrefix: (this as any).token.uuid.replaceAll(".", "-"),
        fontSelect: generateFontSelectOptions()
      }

      return context;
    }
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