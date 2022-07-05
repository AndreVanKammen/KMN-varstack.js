import { BaseDefinition } from "./base.js";
import { TimeVar } from "./time.js";

// Duration is a special case for a time var
// TODO: Add a string function that handles days like 3d 10 min 5 seconds or something like that
export class DurationVar extends TimeVar {
  get $niceStr() {
    if (this._value < 1.0) {
      return (this._value * 1000.0).toFixed((this._value < 100.0) ? 1 : 0) + 'ms';
    }
    return super.$niceStr;
  }
}

DurationVar.typeDefinition = new BaseDefinition({
  ...TimeVar.typeDefinition, ...{
    type: 'Duration'
  }
});
