import { RecordVar } from "../structures/record";
import { ArrayTableVar } from "../structures/table";
import { FloatVar } from "../vars/float";

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


