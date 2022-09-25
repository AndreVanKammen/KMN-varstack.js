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

