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

export interface Nameplate {
  id: string;
  sort: number;
  position: NameplatePosition;
  style: Record<string, unknown>;
  value: string;
  padding: { x: number; y: number };
  angle: number;
  alpha: number;
}

export interface NameplateConfiguration {
  enabled: boolean;
  version: Version;
  nameplates: Nameplate[];
}