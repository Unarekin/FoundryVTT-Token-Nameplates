import { GlobalConfigContext, GlobalConfigConfiguration, GlobalNameplateConfig } from "./types";
import { DeepPartial, NameplateConfiguration } from "../types";
import { confirm, getDefaultNameplate, getDefaultSettings, serializeStyle, downloadJSON, uploadJSON } from "functions";
import { NameplateConfigApplication } from "./NameplateConfig";
import { LocalizedError } from "errors";
import { DefaultSettings } from "settings";

export class GlobalConfigApplication extends foundry.applications.api.HandlebarsApplicationMixin(foundry.applications.api.ApplicationV2<GlobalConfigContext, GlobalConfigConfiguration>) {
  #config: GlobalNameplateConfig = {
    ...getDefaultSettings(),
    upperNameplates: [],
    lowerNameplates: [],
    rightNameplates: [],
    leftNameplates: []
  }

  public static DEFAULT_OPTIONS: DeepPartial<foundry.applications.api.ApplicationV2.Configuration> = {
    window: {
      title: "NAMEPLATES.SETTINGS.GLOBAL.TITLE",
      icon: "fa-solid fa-signature",
      contentClasses: ["standard-form"]
    },
    position: {
      width: 600
    },
    tag: "form",
    form: {
      closeOnSubmit: true,
      submitOnChange: false,
      // eslint-disable-next-line @typescript-eslint/unbound-method
      handler: GlobalConfigApplication.FormHandler
      // handler: NameplateConfigApplication.FormHandler
    },
    actions: {
      // // eslint-disable-next-line @typescript-eslint/unbound-method
      // cancel: NameplateConfigApplication.Cancel
      // eslint-disable-next-line @typescript-eslint/unbound-method
      addNameplate: GlobalConfigApplication.AddNameplate,
      // eslint-disable-next-line @typescript-eslint/unbound-method
      removeNameplate: GlobalConfigApplication.RemoveNameplate,
      // eslint-disable-next-line @typescript-eslint/unbound-method
      editNameplate: GlobalConfigApplication.EditNameplate,
      // eslint-disable-next-line @typescript-eslint/unbound-method
      moveNameplateUp: GlobalConfigApplication.MoveNameplateUp,
      // eslint-disable-next-line @typescript-eslint/unbound-method
      moveNameplateDown: GlobalConfigApplication.MoveNameplateDown,
      // eslint-disable-next-line @typescript-eslint/unbound-method
      revertNameplates: GlobalConfigApplication.RevertNameplates

    }
  }

  public static PARTS: Record<string, foundry.applications.api.HandlebarsApplicationMixin.HandlebarsTemplatePart> = {
    config: {
      template: `modules/${__MODULE_ID__}/templates/TokenConfig.hbs`,
      templates: [`modules/${__MODULE_ID__}/templates/NameplateList.hbs`]
    },
    footer: {
      template: `templates/generic/form-footer.hbs`
    }
  }

  get title() {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    return game.i18n?.format("NAMEPLATES.SETTINGS.GLOBAL.TITLE", { type: game.i18n?.localize(CONFIG.Actor.typeLabels[this.actorType as any]) ?? "" }) ?? "";
  }


  static async RevertNameplates(this: GlobalConfigApplication) {
    try {
      const confirmed = await confirm("NAMEPLATES.CONFIG.REVERT.TITLE", game?.i18n?.localize("NAMEPLATES.CONFIG.REVERT.MESSAGE") ?? "");
      if (!confirmed) return;
      foundry.utils.mergeObject(this.#config, getDefaultSettings());
      await this.render();
    } catch (err) {
      console.error(err);
      if (err instanceof Error) ui.notifications?.error(err.message, { console: false });
    }
  }

  static async FormHandler(this: GlobalConfigApplication, e: SubmitEvent | Event, elem: HTMLElement, data: foundry.applications.ux.FormDataExtended) {
    const parsed = foundry.utils.expandObject(data.object) as Record<string, unknown>;
    const config: NameplateConfiguration = {
      ...foundry.utils.deepClone(DefaultSettings),
      ...(foundry.utils.deepClone(this.#config ?? {})),
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      enabled: (parsed.nameplates as any).enabled,
      nameplates: Array.isArray(this.#config.nameplates) ? foundry.utils.deepClone(this.#config.nameplates) : []
    };

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    delete (config as any).upperNameplates;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    delete (config as any).lowerNameplates;

    const settings = (game.settings?.get(__MODULE_ID__, "globalConfigurations") ?? {}) as Record<string, unknown>;
    settings[this.actorType] = config;
    await game.settings?.set(__MODULE_ID__, "globalConfigurations", settings);
  }

  static async AddNameplate(this: GlobalConfigApplication) {
    try {
      const highest = this.#config.nameplates.reduce((prev, curr) => Math.max(curr.sort, prev), 0);
      const nameplate = await NameplateConfigApplication.Edit({
        ...getDefaultNameplate(),
        id: foundry.utils.randomID(),
        sort: highest + 1
      });
      if (nameplate) {
        this.#config.nameplates.push(nameplate);
        await this.render();
      }
    } catch (err) {
      console.error(err);
      if (err instanceof Error) ui.notifications?.error(err.message, { console: false });
    }
  }

  static async RemoveNameplate(this: GlobalConfigApplication, e: PointerEvent, elem: HTMLElement) {
    try {
      if (!this.#config?.nameplates?.length) return;

      const id = elem.dataset.nameplate;
      if (!id) throw new LocalizedError("MISSINGNAMEPLATEID");
      const nameplate = this.#config.nameplates.find(item => item.id === id);
      if (!nameplate) throw new LocalizedError("NAMEPLATENOTFOUND");


      const confirmed = await confirm(
        "NAMEPLATES.CONFIG.REMOVE.TITLE",
        (game.i18n?.localize("NAMEPLATES.CONFIG.REMOVE.CONTENT") ?? "").replaceAll("\n", "<br>\n")
      );
      if (!confirmed) return;

      const index = this.#config.nameplates.findIndex(item => item.id === id);
      if (index > -1) this.#config.nameplates.splice(index, 1);
      await this.render();
    } catch (err) {
      console.error(err);
      if (err instanceof Error) ui.notifications?.error(err.message, { console: false });
    }
  }

  static async EditNameplate(this: GlobalConfigApplication, e: PointerEvent, elem: HTMLElement) {
    try {
      if (!this.#config?.nameplates?.length) return;
      const id = elem.dataset.nameplate;
      if (!id) throw new LocalizedError("MISSINGNAMEPLATEID");
      const nameplate = this.#config.nameplates.find(item => item.id === id);
      if (!nameplate) throw new LocalizedError("NAMEPLATENOTFOUND");

      const edited = await NameplateConfigApplication.Edit(nameplate, undefined, this.actorType);

      if (edited) {
        edited.style = serializeStyle(edited.style as unknown as PIXI.TextStyle);
        const index = this.#config.nameplates.findIndex(item => item.id === edited.id);
        if (index > -1) this.#config.nameplates.splice(index, 1, edited);
        await this.render();
      }
    } catch (err) {
      console.error(err);
      if (err instanceof Error) ui.notifications?.error(err.message, { console: false });
    }
  }

  static async MoveNameplateUp(this: GlobalConfigApplication, e: PointerEvent, elem: HTMLElement) {
    try {
      if (!this.#config.nameplates?.length) return;

      const id = elem.dataset.nameplate;
      if (!id) throw new LocalizedError("MISSINGNAMEPLATEID");
      const index = this.#config.nameplates.findIndex(item => item.id === id);
      if (index === -1) throw new LocalizedError("NAMEPLATENOTFOUND");
      if (index === 0) return;

      const nameplate = this.#config.nameplates[index];
      this.#config.nameplates[index] = this.#config.nameplates[index - 1];
      this.#config.nameplates[index - 1] = nameplate;

      const upper = this.#config.nameplates.filter(plate => plate.position === "top");
      const lower = this.#config.nameplates.filter(plate => plate.position === "bottom");

      upper.forEach((plate, i) => { plate.sort = i; });
      lower.forEach((plate, i) => { plate.sort = i; });
      await this.render();
    } catch (err) {
      console.error(err);
      if (err instanceof Error) ui.notifications?.error(err.message, { console: false });
    }
  }

  protected async finishImport(data: NameplateConfiguration) {
    if (!this.#config) return;
    if (typeof data.enabled === "boolean") this.#config.enabled = data.enabled;
    this.#config.nameplates.splice(0, this.#config.nameplates.length, ...(Array.isArray(data.nameplates) ? data.nameplates : []));
    await this.render();
  }

  protected async uploadFile() {
    try {
      if (!this.#config) return;
      const data = await uploadJSON<NameplateConfiguration>();
      if (!data) return;
      await this.finishImport(data);
    } catch (err) {
      console.error(err);
      if (err instanceof Error) ui.notifications?.error(err.message, { console: false });
    }
  }

  static async MoveNameplateDown(this: GlobalConfigApplication, e: PointerEvent, elem: HTMLElement) {
    try {
      if (!this.#config?.nameplates?.length) return;

      const id = elem.dataset.nameplate;
      if (!id) throw new LocalizedError("MISSINGNAMEPLATEID");
      const index = this.#config.nameplates.findIndex(item => item.id === id);
      if (index === -1) throw new LocalizedError("NAMEPLATENOTFOUND");
      if (index === this.#config.nameplates.length - 1) return;

      const nameplate = this.#config.nameplates[index];
      this.#config.nameplates[index] = this.#config.nameplates[index + 1];
      this.#config.nameplates[index + 1] = nameplate;

      const upper = this.#config.nameplates.filter(plate => plate.position === "top");
      const lower = this.#config.nameplates.filter(plate => plate.position === "bottom");

      upper.forEach((plate, i) => { plate.sort = i; });
      lower.forEach((plate, i) => { plate.sort = i; });
      await this.render();
    } catch (err) {
      console.error(err);
      if (err instanceof Error) ui.notifications?.error(err.message, { console: false });
    }
  }

  constructor(public readonly actorType: string, options?: DeepPartial<GlobalConfigConfiguration>) {
    super(options);
  }


  protected async exportToClipboard() {
    try {
      if ((await navigator.permissions.query({ name: "clipboard-write" })).state === "granted") {
        await navigator.clipboard.writeText(JSON.stringify(this.#config));
        ui.notifications?.info("NAMEPLATES.CONFIG.EXPORT.COPIED", { localize: true });
      } else {
        const content = await foundry.applications.handlebars.renderTemplate(`modules/${__MODULE_ID__}/templates/CopyJSON.hbs`, {
          config: JSON.stringify(this.#config, null, 2)
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

  async _onRender(context: GlobalConfigContext, options: foundry.applications.api.DocumentSheetV2.RenderOptions) {
    await super._onRender(context, options);
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
          callback: () => { downloadJSON(this.#config as object, "nameplates.json"); }
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

  protected async _prepareContext(options: foundry.applications.api.ApplicationV2.RenderOptions): Promise<GlobalConfigContext> {
    const context = await super._prepareContext(options);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    (context as any).tab = { active: true }
    context.globalConfig = true;

    if (options.isFirstRender) {
      const config = (game.settings?.get(__MODULE_ID__, "globalConfigurations") ?? {}) as Record<string, NameplateConfiguration>;

      if (config[this.actorType]) {
        const cfg = config[this.actorType];
        this.#config.enabled = cfg.enabled;
        this.#config.version = cfg.version;
        this.#config.nameplates.splice(0, this.#config.nameplates.length, ...cfg.nameplates.map(plate => foundry.utils.deepClone(plate)));
      }
    }


    context.nameplates = foundry.utils.deepClone(this.#config);
    context.nameplates.showTokenOverrides = false;
    foundry.utils.mergeObject(context.nameplates, this.#config)

    context.nameplates.upperNameplates = context.nameplates.nameplates.filter(plate => plate.position === "top");
    context.nameplates.lowerNameplates = context.nameplates.nameplates.filter(plate => plate.position === "bottom");

    context.idPrefix = foundry.utils.randomID();

    context.buttons = [
      { type: "submit", icon: "fa-solid fa-save", label: "SETTINGS.Save" }
    ]

    return context;
  }
}