import { NameplateConfigContext, NameplateConfigConfiguration } from "./types";
import { DeepPartial, Nameplate as NameplateItem } from "../types";

export class NameplateConfigApplication extends foundry.applications.api.HandlebarsApplicationMixin(foundry.applications.api.ApplicationV2<NameplateConfigContext, NameplateConfigConfiguration>) {

  static async Edit(config: NameplateItem): Promise<NameplateItem | undefined> {
    const app = new NameplateConfigApplication();
    return app.Edit(config);
  }


  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async Edit(config: NameplateItem): Promise<NameplateItem | undefined> {
    // TODO: Implement
    return Promise.resolve(undefined);
  }

  constructor(public readonly object?: TokenDocument | Actor, options?: DeepPartial<NameplateConfigConfiguration>) {
    super(options);
  }
}