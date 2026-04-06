import { DeepPartial, NameplateConfiguration, NameplateConfigurationSource, NameplatePosition, SerializedNameplate } from "types";
import { Configuration, RenderContext, RenderOptions, SerializedNameplateContext } from "./types";
import { downloadJSON, getDefaultNameplate, interpolate, uploadJSON, confirm, serializeStyle } from "functions";
import { NameplateConfigApplication } from "./NameplateConfig";
import { LocalizedError } from "errors";

export function ConfigMixin<Document extends foundry.abstract.Document.Any = foundry.abstract.Document.Any, Context extends RenderContext<Document> = RenderContext<Document>, Config extends Configuration<Document> = Configuration<Document>, Options extends RenderOptions = RenderOptions>(Base: typeof foundry.applications.api.DocumentSheetV2<Document, Context, Config, Options>) {

  abstract class NameplateConfig extends Base {

    protected nameplateConfigOverride: NameplateConfiguration | undefined = undefined;
    protected nameplateConfigSource: NameplateConfigurationSource | undefined = undefined;

    public static DEFAULT_OPTIONS: DeepPartial<Config> = {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      ...((Base as any).DEFAULT_OPTIONS as DeepPartial<Config>),
      actions: {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        ...(((Base as any).DEFAULT_OPTIONS as DeepPartial<Config>)?.actions ?? {}),
        // eslint-disable-next-line @typescript-eslint/unbound-method
        addNameplate: NameplateConfig.AddNameplate,
        // eslint-disable-next-line @typescript-eslint/unbound-method
        editNameplate: NameplateConfig.EditNameplate,
        //         // eslint-disable-next-line @typescript-eslint/unbound-method
        //         moveNameplateDown: TokenConfiguration.MoveNameplateDown,
        //         // eslint-disable-next-line @typescript-eslint/unbound-method
        //         moveNameplateUp: TokenConfiguration.MoveNameplateUp,
        // eslint-disable-next-line @typescript-eslint/unbound-method
        removeNameplate: NameplateConfig.RemoveNameplate,
        //         // eslint-disable-next-line @typescript-eslint/unbound-method
        //         revertNameplates: TokenConfiguration.RevertNameplates,
      }
    };

    static TABS: Record<string, foundry.applications.api.ApplicationV2.TabsConfiguration> = {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      ...((Base as any).TABS as Record<string, foundry.applications.api.ApplicationV2.TabsConfiguration>),
      sheet: {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        ...((Base as any).TABS as Record<string, foundry.applications.api.ApplicationV2.TabsConfiguration>).sheet,
        tabs: [
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          ...((Base as any).TABS as Record<string, foundry.applications.api.ApplicationV2.TabsConfiguration>).sheet.tabs,
          {
            id: "nameplates",
            icon: "fa-solid fa-signature",
            cssClass: ""
          }
        ]
      }
    }

    static PARTS: Record<string, foundry.applications.api.HandlebarsApplicationMixin.HandlebarsTemplatePart> = {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      ...((Base as any).PARTS as Record<string, foundry.applications.api.HandlebarsApplicationMixin.HandlebarsTemplatePart>),
      nameplates: {
        template: `modules/${__MODULE_ID__}/templates/TokenConfig.hbs`,
        templates: [
          `modules/${__MODULE_ID__}/templates/NameplateList.hbs`
        ]
      }
    }

    protected abstract getNameplateFlags(source?: NameplateConfigurationSource): NameplateConfiguration | undefined;
    protected abstract getNameplateConfigSource(): NameplateConfigurationSource | undefined;
    protected abstract getNameplateInterpolationData(): Record<string, unknown>;
    protected abstract getNameplateInterpolationDocument(): foundry.abstract.Document.Any;

    static async RemoveNameplate(this: NameplateConfig, e: PointerEvent, elem: HTMLElement) {
      try {
        if (!this.nameplateConfigOverride) return console.warn("No configuration loaded");

        const id = elem.dataset.nameplate;
        if (!id) throw new LocalizedError("MISSINGNAMEPLATEID");

        const nameplate = this.nameplateConfigOverride?.nameplates.find(item => item.id === id);
        if (!nameplate) throw new LocalizedError("NAMEPLATENOTFOUND");

        const confirmed = await confirm(
          "NAMEPLATES.CONFIG.REMOVE.TITLE",
          (game.i18n?.localize("NAMEPLATES.CONFIG.REMOVE.CONTENT") ?? "").replaceAll("\n", "<br>\n")
        );

        if (!confirmed) return;

        const index = this.nameplateConfigOverride.nameplates.findIndex(item => item.id === id);
        if (index > -1) this.nameplateConfigOverride.nameplates.splice(index, 1);

        await this.render();
      } catch (err) {
        if (err instanceof Error) ui.notifications?.error(err.message, { localize: true, console: false });
        console.error(err);
      }
    }

    static async AddNameplate(this: NameplateConfig) {
      try {
        if (!this.nameplateConfigOverride) return console.warn("No configuration loaded");
        const defaultNameplate = getDefaultNameplate();
        defaultNameplate.id = foundry.utils.randomID();
        const highest = this.nameplateConfigOverride.nameplates.reduce((prev, curr) => curr.position === defaultNameplate.position && curr.sort > prev ? curr.sort : prev, 0);

        const nameplate = await NameplateConfigApplication.Edit(defaultNameplate);
        if (nameplate) {
          nameplate.sort = highest + 1;
          this.nameplateConfigOverride.nameplates.push(nameplate);
          await this.render();
        }
      } catch (err) {
        if (err instanceof Error) ui.notifications?.error(err.message, { localize: true, console: false });
        console.error(err);
      }
    }

    static async EditNameplate(this: NameplateConfig, e: PointerEvent, elem: HTMLElement) {
      try {
        if (!this.nameplateConfigOverride) return console.warn("No config loaded");
        const id = elem.dataset.nameplate;
        if (!id) throw new LocalizedError("MISSINGNAMEPLATEID");

        const nameplate = this.nameplateConfigOverride.nameplates.find(item => item.id === id);
        if (!nameplate) throw new LocalizedError("NAMEPLATENOTFOUND");

        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        const edited = await NameplateConfigApplication.Edit(nameplate, this.getNameplateInterpolationDocument() as any);

        if (edited) {
          edited.style = serializeStyle(edited.style as unknown as PIXI.TextStyle);
          const index = this.nameplateConfigOverride.nameplates.findIndex(item => item.id === edited.id);
          if (index > -1) this.nameplateConfigOverride.nameplates.splice(index, 1, edited);
          await this.render();
        }
      } catch (err) {
        if (err instanceof Error) ui.notifications?.error(err.message, { localize: true, console: false });
        console.error(err);
      }
    }

    protected nameplatesByPosition(nameplates: SerializedNameplate[], position: NameplatePosition): SerializedNameplateContext[] {
      return nameplates
        .filter(nameplate => nameplate.position === position)
        .map(nameplate => this.prepareNameplateContext(nameplate));
    }


    protected prepareNameplateContext(nameplate: SerializedNameplate): SerializedNameplateContext {
      return {
        ...nameplate,
        actualValue: interpolate(nameplate.value, this.getNameplateInterpolationData())
      }
    }

    protected async exportToClipboard() {
      try {
        if ((await navigator.permissions.query({ name: "clipboard-write" })).state === "granted") {
          await navigator.clipboard.writeText(JSON.stringify(this.nameplateConfigOverride));
          ui.notifications?.info("NAMEPLATES.CONFIG.EXPORT.COPIED", { localize: true });
        } else {
          const content = await foundry.applications.handlebars.renderTemplate(`modules/${__MODULE_ID__}/templates/CopyJSON.hbs`, {
            config: JSON.stringify(this.nameplateConfigOverride, null, 2)
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

    protected getNameplateExportContextMenuOptions(): foundry.applications.ux.ContextMenu.Entry<HTMLElement>[] {
      // TODO: Change label to name when dropping v13 support
      // TODO: Change callback to onClick when dropping v13 support
      return [
        {
          name: "NAMEPLATES.CONFIG.EXPORT.CLIPBOARD",
          icon: `<i class="fa-solid fa-copy"></i>`,
          callback: () => { void this.exportToClipboard(); }
        },
        {
          name: "NAMEPLATES.CONFIG.EXPORT.DOWNLOAD",
          icon: `<i class="fa-solid fa-download"></i>`,
          callback: () => { downloadJSON(this.nameplateConfigOverride as object, "nameplates.json"); }
        }
      ]
    }

    protected async finishImport(data: NameplateConfiguration) {
      if (!this.nameplateConfigOverride) return;
      if (typeof data.enabled === "boolean") this.nameplateConfigOverride.enabled = data.enabled;

      this.nameplateConfigOverride.nameplates = Array.isArray(data.nameplates) ? data.nameplates : [];
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
        if (!this.nameplateConfigOverride) return;
        const data = await uploadJSON<NameplateConfiguration>();
        if (!data) return;
        await this.finishImport(data);
      } catch (err) {
        console.error(err);
        if (err instanceof Error) ui.notifications?.error(err.message, { console: false });
      }
    }

    protected getNameplateImportContextMenuOptions(): foundry.applications.ux.ContextMenu.Entry<HTMLElement>[] {
      // TODO: Change label to name when dropping v13 support
      // TODO: Change callback to onClick when dropping v13 support
      return [
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
      ];
    }

    protected currentSelectedNameplateSource(): NameplateConfigurationSource {
      const select = this.element.querySelector(`select[name="nameplates.configSource"]`);
      if (select instanceof HTMLSelectElement) return select.value as NameplateConfigurationSource;
      else return "global";
    }

    protected toggleNameplateConfig(enabled: boolean) {
      const elems = this.element.querySelectorAll(`[data-toggle-nameplate-config]`);

      for (const elem of elems) {
        if (elem instanceof HTMLInputElement || elem instanceof HTMLSelectElement) {
          elem.disabled = !enabled;
        } else if (enabled) {
          elem.removeAttribute("disabled");
          elem.classList.remove("disabled");
        } else {
          elem.setAttribute("disabled", "disabled");
          elem.classList.add("disabled");
        }

      }
    }

    protected changeNameplateConfigSource(source: NameplateConfigurationSource) {
      switch (source) {
        case "global":
        case "actorType":
          this.toggleNameplateConfig(false);
          break;
        default:
          this.toggleNameplateConfig(true);
      }
    }

    _onChangeForm(formConfig: foundry.applications.api.ApplicationV2.FormConfiguration, event: Event) {
      super._onChangeForm(formConfig, event);
      const formData = ((foundry.utils.expandObject((new foundry.applications.ux.FormDataExtended(this.element as HTMLFormElement)).object)) as Record<string, unknown>).nameplates as Record<string, unknown>;
      if (this.nameplateConfigOverride) this.nameplateConfigOverride.enabled = formData.enabled as boolean;

      if (formData.configSource !== this.nameplateConfigSource) {
        this.nameplateConfigSource = formData.configSource as NameplateConfigurationSource;
        console.log(foundry.utils.deepClone(this.nameplateConfigOverride))
        this.nameplateConfigOverride = this.getNameplateFlags(this.nameplateConfigSource);
        console.log(foundry.utils.deepClone(this.nameplateConfigOverride))
        this.render().catch(console.error);
      }
    }

    async _onRender(context: DeepPartial<Context>, options: DeepPartial<Options>) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      await super._onRender(context as any, options as any);

      const sourceSelect = this.element.querySelector(`[name="nameplates.configSource"]`);
      if (sourceSelect instanceof HTMLSelectElement) {
        this.changeNameplateConfigSource(sourceSelect.value as NameplateConfigurationSource);
        // sourceSelect.addEventListener("change", () => { this.changeNameplateConfigSource(sourceSelect.value as NameplateConfigurationSource); });
      }

      // Assign context menus
      new foundry.applications.ux.ContextMenu(
        this.element,
        `[data-role="export-nameplates"]`,
        this.getNameplateExportContextMenuOptions(),
        {
          jQuery: false,
          eventName: "click",
          fixed: true
        }
      );

      new foundry.applications.ux.ContextMenu(
        this.element,
        `[data-role="import-nameplates"]`,
        this.getNameplateImportContextMenuOptions(),
        {
          jQuery: false,
          eventName: "click",
          fixed: true
        }
      );

    }

    _onClose(options: any) {
      this.nameplateConfigOverride = undefined;
      this.nameplateConfigSource = undefined;

      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      super._onClose(options)
    }

    async _prepareContext(options: DeepPartial<Options> & { isFirstRender: boolean; }): Promise<Context> {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      const context = await super._prepareContext(options as any);

      this.nameplateConfigOverride ??= this.getNameplateFlags();
      this.nameplateConfigSource ??= this.getNameplateConfigSource() ?? "global";

      context.nameplates = {
        allowSourceConfig: false,
        enabled: !!this.nameplateConfigOverride?.enabled,
        controlsDisabled: !["actor", "token", "tile"].includes(this.nameplateConfigSource),
        upperNameplates: this.nameplatesByPosition(this.nameplateConfigOverride?.nameplates ?? [], "top"),
        lowerNameplates: this.nameplatesByPosition(this.nameplateConfigOverride?.nameplates ?? [], "bottom"),
        leftNameplates: this.nameplatesByPosition(this.nameplateConfigOverride?.nameplates ?? [], "left"),
        rightNameplates: this.nameplatesByPosition(this.nameplateConfigOverride?.nameplates ?? [], "right"),
        configSource: this.nameplateConfigSource,
        configSourceSelect: {}
      }

      return context;
    }

  }

  // Move footer part to the bottom of the list
  const footer = NameplateConfig.PARTS.footer;
  delete NameplateConfig.PARTS.footer;
  NameplateConfig.PARTS.footer = footer;

  return NameplateConfig;
}