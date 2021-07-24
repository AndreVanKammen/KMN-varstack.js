import { BaseDefinition } from "./base.js";
import { FloatVar } from "./float.js";

class DurationVar extends FloatVar {
  get $niceStr() {
    // https://stackoverflow.com/questions/6312993/javascript-seconds-to-time-string-with-format-hhmmss
    var date = new Date(0);
    date.setSeconds(this._value); // specify value for SECONDS here
    var timeString = date.toISOString().substr(11, 8);
    return timeString;
  }
  // TODO: Add extra converter for setValue dat handles HH:MM:SS.ZZZ from string

  toString() {
    return this.$niceStr;
  }
}

DurationVar.typeDefinition = new BaseDefinition();
DurationVar.typeDefinition.type = 'Duration';

export { DurationVar };
