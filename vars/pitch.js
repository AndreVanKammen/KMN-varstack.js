import { BaseDefinition } from "./base.js";
import { FloatVar } from "./float.js";

export class PitchVar extends FloatVar {
  get $niceStr() {
    let percentage = 0.0;
    if (this._value > 0.0) {
      percentage = Math.pow(2.0, (12.0 + this._value) / 12.0) / 2.0 - 1.0;
    } else {
      percentage = -1.0 + Math.pow(2.0, (12.0 - this._value) / 12.0) / 2.0;
    }
  
    return (this._value * 100.0).toFixed(0) + 'ct ('+(percentage * 100).toFixed(1)+'%)';
  }
}

PitchVar.typeDefinition = new BaseDefinition(
  {
    ...FloatVar.typeDefinition, ...{
      type: 'Pitch',
      range: [-6.0, 6.0]
    }
  }
);

