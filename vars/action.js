import { BaseDefinition } from "./base.js";
import { BoolVar } from "./bool.js";

export class ActionVar extends BoolVar {
  get $niceStr() {
    return this._value ? 'working' : 'start';
  }
}

ActionVar.typeDefinition = new BaseDefinition(
  {
    ...BoolVar.typeDefinition, ...{
      type: 'Action',
      inputType: 'button'
    }
  });
