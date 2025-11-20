import { NameplateToken } from "NameplateToken";

type Version = "1.1.0";


export type IsObject<T> = T extends Readonly<Record<string, any>>
  ? T extends AnyArray | AnyFunction
  ? false
  : true
  : false;

/**
 * Recursively sets keys of an object to optional. Used primarily for update methods
 * @internal
 */
export type DeepPartial<T> = T extends unknown
  ? IsObject<T> extends true
  ? {
    [P in keyof T]?: DeepPartial<T[P]>;
  }
  : T
  : T;

export type AnyArray = readonly unknown[];
export type AnyFunction = (arg0: never, ...args: never[]) => unknown;

export const NameplatePositions = ["top", "bottom"] as const;
export type NameplatePosition = typeof NameplatePositions[number];

export interface TokenNameplates {
  // tokens: WeakMap<foundry.canvas.placeables.Token, NameplateToken>;
  tokens: NameplateToken[];
}

type PropsCoercedToPOrNeverOnO<O, P> = { [k in keyof O]: O[k] extends P ? k : never }[keyof O];
export type PropsOfType<P, O> = Record<PropsCoercedToPOrNeverOnO<P, O>, O>;

export const NameplateDisplayOptions = ["default", "none", "control", "ownerHover", "hover", "owner", "always"] as const;
export type NameplateDisplay = typeof NameplateDisplayOptions[number];

export interface SerializedNameplate {
  id: string;
  enabled: boolean;
  sort: number;
  position: NameplatePosition;
  style: Record<string, unknown>;
  value: string;
  padding: { x: number; y: number };
  angle: number;
  align: PIXI.TextStyleAlign;
  alpha: number;
  display: NameplateDisplay;
  effects: {
    glow?: NameplateGlowEffect;
    outline?: NameplateOutlineEffect;
  }
}

export interface NameplateEffect {
  enabled: boolean;
}

export interface NameplateGlowEffect extends NameplateEffect {
  color: string;
  useDispositionColor: boolean;
  alpha: number;
  innerStrength: number;
  outerStrength: number;
}

export interface NameplateOutlineEffect extends NameplateEffect {
  color: string;
  useDispositionColor: boolean;
  alpha: number;
  thickness: number;
}

export interface NameplateConfiguration {
  enabled: boolean;
  version: Version;
  nameplates: SerializedNameplate[];
}