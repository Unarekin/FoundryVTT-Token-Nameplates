Hooks.on("init", () => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
  libWrapper.register(__MODULE_ID__, "foundry.canvas.placeables.Token.prototype._draw", async function (this: foundry.canvas.placeables.Token, wrapped: Function, ...args: unknown[]) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment
    const retVal = await wrapped(...args);

    // If the nameplate and/or tooltip properties are a PreciseText, then wrap them in a PIXI.Container,
    // so we can add elements to them later.

    if (this.nameplate instanceof foundry.canvas.containers.PreciseText) {
      // Wrap in a container
      const { nameplate } = this;
      const container = new PIXI.Container();
      container.x = nameplate.x;
      container.y = nameplate.y;


      container.addChild(nameplate);
      this.addChild(container);

      nameplate.x = nameplate.y = 0;

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      (this as any).nameplate = container;
    }

    if (this.tooltip instanceof foundry.canvas.containers.PreciseText) {
      const { tooltip } = this;
      const container = new PIXI.Container();
      container.x = tooltip.x;
      container.y = tooltip.y;
      container.addChild(tooltip);
      this.addChild(container);
      tooltip.x = tooltip.y = 0;

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      (this as any).tooltip = container;
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return retVal;
  });
});