import { BaseDefinition } from "./base.js";
import { FloatVar } from "./float.js";

export class SizeVar extends FloatVar {
  constructor() {
    super();
  }

  static fromPixels(val) {
    let result = new SizeVar();
    result.$v = val;
    return result;
  }
}

SizeVar.typeDefinition = new BaseDefinition(
  {
    ...FloatVar.typeDefinition, ...{
      range: [1, 1024],
      step: 1.0,
      type: 'Size',
      precision: 0
    }
  }
);
