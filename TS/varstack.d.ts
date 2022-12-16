import { RecordVar } from "../structures/record";
import { ArrayTableVar } from "../structures/table";
import { BaseVar } from "../vars/base";
import { BoolVar } from "../vars/bool";
import { DurationVar } from "../vars/duration";
import { FloatVar } from "../vars/float";
import { IntVar } from "../vars/int";
import { StringVar } from "../vars/string";
import { TimeVar } from "../vars/time";

export type AddEvent = <T>(this: T, callBack: (T) => void, initialize?: Boolean) => number;

// @ts-ignore quit whining
interface RecordVarG<T> {
  $v: T;
  $addEvent<T>(this: T, callBack: (v: T) => void, initialize?: Boolean): number;
}
interface RecordVarAny extends RecordVarG<any> {
  // @ts-ignore
  [key:string]: BaseVar;
}
type GetBasVarType = (x: any) => typeof x.$v;
type RecorVarValues<T> = {
  [P in keyof T]: ReturnType<GetBasVarType>;
};

export interface ArrayTableVarG<T extends RecordVar> extends ArrayTableVar {
  $v: T;
  array: T[];
  $addEvent<T>(this: T, callBack: (v: T) => void): number;
  findFields(search: any): T;
  find(fieldName: string, value: any): T;
  findOrAdd(fieldName: string, value: any): T;
  add(arrayElement: any): T;
  element(ix: number): T;
  [Symbol.iterator](): IterableIterator<T>;

  // These are only for arrays
  splice(trackBeatIx: any, deleteLength: number, ...items: any);
  slice(arg0: number, arg1: number);

  remove(rec: T);

  onCleanUpForRemove: (rec: T) => void;
  onRemoveFromStore: (rec: T) => void;
}

export class ColorRecord extends RecordVar {
  R: FloatVar;
  G: FloatVar;
  B: FloatVar;
  A: FloatVar;
}
export type ColorPalette = ArrayTableVarG<ColorRecord>;


export interface VarStackTypes {
  main: RecordVar;
  Int: typeof IntVar;
  Float: typeof FloatVar;
  Bool: typeof BoolVar;
  String: typeof StringVar;
  Duration: typeof DurationVar;
  Time: typeof TimeVar;
  // @ ts-expect-error
  add(type: typeof BaseVar);
  // @ ts-expect-error
  addNamedType(name: string, baseType: typeof BaseVar) : any;
  // @ ts-expect-error
  addRecord(name: string, recordDef: Record<string,string>);
  // @ ts-expect-error
  addArray(name: string, elementType: string);
  // @ts-expect-error
  [k:string]: typeof any
}
