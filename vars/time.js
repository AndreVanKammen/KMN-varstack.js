import { secondsToTimeStr } from "../../KMN-utils.js/format.js";
import { BaseDefinition } from "./base.js";
import { FloatVar } from "./float.js";

export class TimeVar extends FloatVar {
  get $niceStr() {
    return secondsToTimeStr(this._value);
  }
  // TODO: Add extra converter for setValue that handles HH:MM:SS.ZZZ from string

  toString() {
    return this.$niceStr;
  }
}

TimeVar.typeDefinition = new BaseDefinition(
  {
    ...FloatVar.typeDefinition, ...{
      type: 'Time',
      isReadOnly: true // TODO make edit
    }
  });
