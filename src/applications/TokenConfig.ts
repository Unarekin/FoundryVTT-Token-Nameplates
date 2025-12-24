import { interpolate, confirm, serializeStyle, getDefaultNameplate, getDefaultSettings, downloadJSON, uploadJSON, getPrototypeTokenInterpolationData } from "functions";
import { DeepPartial, NameplateConfiguration, NameplatePosition, SerializedNameplate, NameplatePlaceable } from "../types";
import { generateFontSelectOptions } from "./functions";
import { LocalizedError } from "../errors";
import { NameplateConfigApplication } from "./NameplateConfig";


export function TokenConfigMixin(Base: typeof foundry.applications.sheets.TokenConfig) {
  class TokenConfiguration extends Base {
    #flags: NameplateConfiguration | undefined = undefined;
    #hasChanges = false;

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
        removeNameplate: TokenConfiguration.RemoveNameplate,
        // eslint-disable-next-line @typescript-eslint/unbound-method
        revertNameplates: TokenConfiguration.RevertNameplates,
        // eslint-disable-next-line @typescript-eslint/unbound-method
        loadFromActor: TokenConfiguration.LoadFromActor,
        // eslint-disable-next-line @typescript-eslint/unbound-method
        loadFromToken: TokenConfiguration.LoadFromToken
      }
    }

    static async LoadFromActor(this: TokenConfiguration) {
      await this.loadFromActor();
    }

    static async LoadFromToken(this: TokenConfiguration) {
      await this.loadFromToken();
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

        const upper = this.#flags.nameplates.filter(plate => plate.position === "top");
        const lower = this.#flags.nameplates.filter(plate => plate.position === "bottom");

        upper.forEach((plate, i) => { plate.sort = i; });
        lower.forEach((plate, i) => { plate.sort = i; });

        this.#hasChanges = true;
        await this.render();
      } catch (err) {
        console.error(err);
        if (err instanceof Error) ui.notifications?.error(err.message, { console: false });
      }
    }

    static async RevertNameplates(this: TokenConfiguration) {
      try {
        const confirmed = await confirm("NAMEPLATES.CONFIG.REVERT.TITLE", game?.i18n?.localize("NAMEPLATES.CONFIG.REVERT.MESSAGE") ?? "");
        if (!confirmed) return;

        this.#flags = foundry.utils.deepClone(getDefaultSettings());
        this.#hasChanges = true;
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

        const upper = this.#flags.nameplates.filter(plate => plate.position === "top");
        const lower = this.#flags.nameplates.filter(plate => plate.position === "bottom");

        upper.forEach((plate, i) => { plate.sort = i; });
        lower.forEach((plate, i) => { plate.sort = i; });
        this.#hasChanges = true;
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
          this.#hasChanges = true;
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
        this.#hasChanges = true;
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


        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
        const edited = await NameplateConfigApplication.Edit(nameplate, (this as any).token);

        if (edited) {
          edited.style = serializeStyle(edited.style as unknown as PIXI.TextStyle);
          const index = this.#flags.nameplates.findIndex(item => item.id === edited.id);
          if (index > -1) this.#flags.nameplates.splice(index, 1, edited);
          this.#hasChanges = true;
          await this.render();
        }
      } catch (err) {
        console.error(err);
        if (err instanceof Error) ui.notifications?.error(err.message, { console: false });
      }
    }

    async _onSubmitForm(formConfig: foundry.applications.api.ApplicationV2.FormConfiguration, event: Event | SubmitEvent): Promise<void> {
      if (!this.form) return;
      if (this.#hasChanges) {
        const data = foundry.utils.expandObject(new foundry.applications.ux.FormDataExtended(this.form).object) as DeepPartial<NameplateConfiguration>;
        const config: NameplateConfiguration = {
          ...getDefaultSettings(),
          ...(this.#flags ?? {}),
          ...data.nameplates,
          nameplates: Array.isArray(this.#flags?.nameplates) ? foundry.utils.deepClone(this.#flags.nameplates) : []
        };

        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        const doc = ((this as any).isPrototype ? (this as any).actor : config.useTokenOverride ? this.document : (this as any).actor) as Actor | TokenDocument | undefined;

        console.log("Config:", config, doc);

        if (!doc) return;

        doc?.update({
          flags: {
            [__MODULE_ID__]: config
          }
        })
          .then(() => {
            if (this.document)
              return this.document.setFlag(__MODULE_ID__, "useTokenOverride", config.useTokenOverride)
          })
          .then(() => {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            if ((this as any).token instanceof TokenDocument) {
              // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
              ((this as any).token.object as unknown as NameplatePlaceable).refreshNameplates(true);
              // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            } else if ((this as any).token instanceof foundry.data.PrototypeToken) {
              // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
              game?.TokenNameplates?.refreshTokensWithPrototype((this as any).token as foundry.data.PrototypeToken);
            }
          })
          .then(() => { this.#hasChanges = false; })
          .catch((err: Error) => {
            console.error(err);
            ui.notifications?.error(err.message, { console: false });
          })

      }
      return super._onSubmitForm(formConfig, event);
    }

    protected async exportToClipboard() {
      try {
        if ((await navigator.permissions.query({ name: "clipboard-write" })).state === "granted") {
          await navigator.clipboard.writeText(JSON.stringify(this.#flags));
          ui.notifications?.info("NAMEPLATES.CONFIG.EXPORT.COPIED", { localize: true });
        } else {
          const content = await foundry.applications.handlebars.renderTemplate(`modules/${__MODULE_ID__}/templates/CopyJSON.hbs`, {
            config: JSON.stringify(this.#flags, null, 2)
          });
          await foundry.applications.api.DialogV2.input({
            window: { title: "NAMEPLATES.CONFIG.EXPORT.LABEL" },
            position: { width: 600 },
            content
          });
        }
      } catch (err) {
        console.error(err);
        if (err instanceof Error) ui.notifications?.error(err.message, { console: false });
      }
    }

    protected async finishImport(data: NameplateConfiguration) {
      if (!this.#flags) return;
      if (typeof data.enabled === "boolean") this.#flags.enabled = data.enabled;

      this.#flags.nameplates.splice(0, this.#flags.nameplates.length, ...(Array.isArray(data.nameplates) ? data.nameplates : []))
      this.#hasChanges = true;
      await this.render();
    }

    protected async importFromClipboard() {
      try {
        if ((await navigator.permissions.query({ name: "clipboard-read" })).state === "granted") {
          const text = await navigator.clipboard.readText();
          if (text) {
            const data = JSON.parse(text) as NameplateConfiguration;
            ui.notifications?.info("NAMEPLATES.CONFIG.IMPORT.PASTED", { localize: true });
            if (data) await this.finishImport(data);
          }
        } else {
          const content = await foundry.applications.handlebars.renderTemplate(`modules/${__MODULE_ID__}/templates/PasteJSON.hbs`, {});
          const { json } = await foundry.applications.api.DialogV2.input({
            window: { title: "NAMEPLATES.CONFIG.IMPORT.LABEL" },
            position: { width: 600 },
            content
          });
          if (typeof json === "string") {
            const data = JSON.parse(json) as NameplateConfiguration;
            if (data) await this.finishImport(data)
          }
        }
      } catch (err) {
        console.error(err);
        if (err instanceof Error) ui.notifications?.error(err.message, { console: false });
      }
    }

    protected async uploadFile() {
      try {
        if (!this.#flags) return;
        const data = await uploadJSON<NameplateConfiguration>();
        if (!data) return;
        await this.finishImport(data);
      } catch (err) {
        console.error(err);
        if (err instanceof Error) ui.notifications?.error(err.message, { console: false });
      }
    }

    protected async loadFromActor() {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const actor = (this as any).actor as Actor | undefined;
      if (!(actor instanceof Actor)) return;

      const settings = foundry.utils.deepClone(getDefaultSettings());
      if (actor.flags[__MODULE_ID__])
        foundry.utils.mergeObject(settings, (actor.flags[__MODULE_ID__] as DeepPartial<NameplateConfiguration>));

      const useOverride = this.element.querySelector(`[name="nameplates.useTokenOverride"]`);
      if (useOverride instanceof HTMLInputElement)
        settings.useTokenOverride = useOverride.checked;

      console.log("Loading from actor:", settings);
      this.#flags = foundry.utils.deepClone(settings);
      await this.render();
    }

    protected async loadFromToken() {
      if (!this.document) return;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const flags = (this.document as any).flags[__MODULE_ID__] as DeepPartial<NameplateConfiguration>;
      const settings = foundry.utils.deepClone(getDefaultSettings());
      if (flags) foundry.utils.mergeObject(settings, flags);

      const useOverride = this.element.querySelector(`[name="nameplates.useTokenOverride"]`);
      if (useOverride instanceof HTMLInputElement)
        settings.useTokenOverride = useOverride.checked;

      console.log("Loading from token:", settings);
      this.#flags = foundry.utils.deepClone(settings);
      await this.render();
    }

    async _onRender(context: TokenConfig.RenderContext, options: foundry.applications.api.DocumentSheetV2.RenderOptions) {
      await super._onRender(context, options);

      const enable = this.element.querySelector(`[name="nameplates.enabled"]`);
      if (enable instanceof HTMLInputElement)
        enable.addEventListener("change", () => { this.#hasChanges = true; })

      const overrides = this.element.querySelector(`[name="nameplates.useTokenOverride"]`);
      if (overrides instanceof HTMLInputElement) {
        overrides.addEventListener("change", () => {
          this.#hasChanges = true;
          if (overrides.checked) {
            void this.loadFromToken();
          } else {
            void this.loadFromActor();
          }
        });
      }


      // Export menu
      new foundry.applications.ux.ContextMenu(
        this.element,
        `[data-role="export-nameplates"]`,
        [
          {
            name: "NAMEPLATES.CONFIG.EXPORT.CLIPBOARD",
            icon: `<i class="fa-solid fa-copy"></i>`,
            callback: () => { void this.exportToClipboard(); }
          },
          {
            name: "NAMEPLATES.CONFIG.EXPORT.DOWNLOAD",
            icon: `<i class="fa-solid fa-download"></i>`,
            callback: () => { downloadJSON(this.#flags as object, "nameplates.json"); }
          }
        ],
        {
          jQuery: false,
          eventName: "click",
          fixed: true
        }
      );

      // Import menu
      new foundry.applications.ux.ContextMenu(
        this.element,
        `[data-role="import-nameplates"]`,
        [
          {
            name: "NAMEPLATES.CONFIG.IMPORT.CLIPBOARD",
            icon: `<i class="fa-solid fa-paste"></i>`,
            callback: () => { void this.importFromClipboard(); }
          },
          {
            name: "NAMEPLATES.CONFIG.IMPORT.UPLOAD",
            icon: `<i class="fa-solid fa-upload"></i>`,
            callback: () => { void this.uploadFile(); }
          }
        ],
        {
          jQuery: false,
          eventName: "click",
          fixed: true
        }
      )
    }

    private nameplatesByPosition(position: NameplatePosition): SerializedNameplate[] {
      const interpolationData = {};
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const token = (this as any).token as TokenDocument | foundry.data.PrototypeToken;

      if (token instanceof TokenDocument)
        foundry.utils.mergeObject(interpolationData, (token.object as unknown as NameplatePlaceable).getInterpolationData());
      else if (token instanceof foundry.data.PrototypeToken)
        foundry.utils.mergeObject(interpolationData, getPrototypeTokenInterpolationData(token));



      return (this.#flags?.nameplates ?? []).filter(plate => plate.position === position).map(nameplate => ({
        ...nameplate,
        actualValue: interpolate(nameplate.value, interpolationData)
      }));
    }

    async _prepareContext(options: foundry.applications.api.DocumentSheetV2.RenderOptions) {
      const context = await super._prepareContext(options);


      if (options.force || options.isFirstRender || !this.#flags) {

        const defaultSettings = getDefaultSettings();
        this.#flags = foundry.utils.deepClone(defaultSettings);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        const actor = (this as any).actor as Actor | undefined;
        const useOverrides = this.document ? this.document.getFlag(__MODULE_ID__, "useTokenOverride") : false;


        if (!useOverrides && actor instanceof Actor) {
          foundry.utils.mergeObject(this.#flags, actor.flags[__MODULE_ID__] as DeepPartial<NameplateConfiguration>);
        } else {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          foundry.utils.mergeObject(this.#flags, (this.document.flags as any)[__MODULE_ID__] as DeepPartial<NameplateConfiguration>);
        }

        // Re-inject nameplates if there are none
        if (!this.#flags.nameplates.length) this.#flags.nameplates.push(...defaultSettings.nameplates);
      }

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const token = ((this as any).token as TokenDocument | undefined)?.object as NameplatePlaceable | undefined;
      console.log(this);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      (context as any).nameplates = {
        ...getDefaultSettings(),
        ...(this.#flags ?? {}),
        showTokenOverrides: !!this.document,
        upperNameplates: this.nameplatesByPosition("top"),
        lowerNameplates: this.nameplatesByPosition("bottom"),
        rightNameplates: this.nameplatesByPosition("right"),
        leftNameplates: this.nameplatesByPosition("left"),
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
        idPrefix: (this as any).token instanceof foundry.canvas.placeables.Token ? (this as any).token.uuid.replaceAll(".", "-") : `prototype-${(this as any).actor.uuid.replaceAll(".", "-")}`,
        // idPrefix: (this as any).token.uuid.replaceAll(".", "-"),
        fontSelect: generateFontSelectOptions(),

        configSource: token?.nameplateConfigSource,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        actorType: (this as any).actor?.type,
      }

      switch (token?.nameplateConfigSource) {
        case "actor":
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          (context as any).nameplates.configSourceDescription = game?.i18n?.localize("NAMEPLATES.CONFIG.SOURCE.ACTOR");
          break;
        case "token":
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          (context as any).nameplates.configSourceDescription = game?.i18n?.localize("NAMEPLATES.CONFIG.SOURCE.TOKEN");
          break;
        case "tile":
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          (context as any).nameplates.configSourceDescription = game?.i18n?.localize("NAMEPLATES.CONFIG.SOURCE.TILE");
          break;
        case "actorType":
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
          (context as any).nameplates.configSourceDescription = game?.i18n?.format("NAMEPLATES.CONFIG.SOURCE.ACTORTYPE", { actorType: (this as any).actor?.type });
          break;
        case "global":
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          (context as any).nameplates.configSourceDescription = game?.i18n?.localize("NAMEPLATES.CONFIG.SOURCE.GLOBAL");
          break;
        default:
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          (context as any).nameplates.configSourceDescription = game?.i18n?.localize("NAMEPLATES.CONFIG.SOURCE.DEFAULT");
          break;
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
      template: `modules/${__MODULE_ID__}/templates/TokenConfig.hbs`,
      templates: [`modules/${__MODULE_ID__}/templates/NameplateList.hbs`]
    },
    footer
  });

  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  foundry.utils.mergeObject((TokenConfiguration as any).PARTS ?? {}, parts);

  TokenConfiguration.TABS.sheet.tabs.push({
    id: "nameplates",
    icon: "fa-solid fa-signature",
    cssClass: ""
  });

  ((canvas?.scene?.tokens.contents ?? [])).forEach(token => {
    if (token.sheet && !(token.sheet instanceof TokenConfiguration)) {

      try {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        token._sheet = new TokenConfiguration(token.sheet.options);
      } catch (err) {
        console.warn(err);
      }
    }

  });
  return TokenConfiguration;
}