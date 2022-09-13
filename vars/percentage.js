import { secondsToTimeStr } from "../../KMN-utils.js/format.js";
import { BaseDefinition } from "./base.js";
import { FloatVar } from "./float.js";

export class PercentageVar extends FloatVar {
  get $niceStr() {
    if (this._value >= 1.0) {
      return '100%'
    }
    if (this._value <= 0.0) {
      return '0%'
    }
    return (this._value * 100).toFixed(this.$varDefinition.precision) + '%';
  }
  // TODO: Add extra converter for setValue that handles HH:MM:SS.ZZZ from string

  toString() {
    return this.$niceStr;
  }
}

PercentageVar.typeDefinition = new BaseDefinition(
  {
    ...FloatVar.typeDefinition, ...{
      type: 'Percentage' //,
      // isReadOnly: true // TODO make edit
    }
  });
