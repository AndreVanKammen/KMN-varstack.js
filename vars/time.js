import { BaseDefinition } from "./base.js";
import { FloatVar } from "./float.js";

class TimeVar extends FloatVar {
  get $niceStr() {
    // https://stackoverflow.com/questions/6312993/javascript-seconds-to-time-string-with-format-hhmmss
    var date = new Date(0);
    date.setSeconds(this._value); // specify value for SECONDS here
    var timeString = date.toISOString().substr(11, 8);

    let ix = 0;
    while (ix < timeString.length-4) {
      let c = timeString.charAt(ix);
      if ((c !== '0') && (c !== ':')) {
        break;
      }
      ix++;
    }
    
    return timeString.substr(ix);
  }
  // TODO: Add extra converter for setValue that handles HH:MM:SS.ZZZ from string

  toString() {
    return this.$niceStr;
  }
}

TimeVar.typeDefinition = new BaseDefinition();
TimeVar.typeDefinition.type = 'Time';

export { TimeVar };
