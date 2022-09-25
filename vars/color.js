import { ArrayTableVar } from '../structures/table.js';
import { Types } from '../varstack.js';

/** @type {typeof import('../TS/varstack').ColorRecord} */ // @ts-ignore
const ColorRecord = Types.addRecord('ColorRecord', {
  R: 'Float',
  G: 'Float',
  B: 'Float',
  A: 'Float:defval>1.0'
});

export class ColorVar extends ColorRecord {
  constructor() {
    super();
  }

  toRGBAFloatArray() {
    return [this.R.$v, this.G.$v, this.B.$v, this.A.$v];
  }

  toRGBFloatArray() {
    return [this.R.$v, this.G.$v, this.B.$v];
  }

  static _fromRGBBArray(byteArray, divider) {
    let result = new ColorVar();
    result.R.$v = (byteArray[0] || 0) / divider;
    result.G.$v = (byteArray[1] || 0) / divider;
    result.B.$v = (byteArray[2] || 0) / divider;
    if (byteArray.length > 3) {
      let alpha = byteArray[3];
      result.A.$v = alpha > 1.0 ? alpha / divider : alpha;
    }
    return result;
  }
  static fromRGBByteArray(byteArray) {
    return this._fromRGBBArray(byteArray, 255);
  }
  static fromRGBFloatArray(byteArray) {
    return this._fromRGBBArray(byteArray, 1);
  }
  static fromColorVar(clr) {
    let result = new ColorVar();
    result.R.$v = clr.R.$v;
    result.G.$v = clr.G.$v;
    result.B.$v = clr.B.$v;
    result.A.$v = clr.A.$v;
    return result;
  }
}

Types['ColorVar'] = ColorVar;

/** @type {typeof ArrayTableVar} */
const ColorPalette = Types.addArray('ColorPalette', 'ColorVar');

export class ColorPaletteVar extends ColorPalette {
  constructor() {
    super();
  }
  toRGBFloatArray() {
    let result = [];
    for (let clr of this.array) {
      result.push(...clr.toRGBFloatArray());
    }
    return result;
  }
  toRGBFloatArrayArray() {
    let result = [];
    for (let clr of this.array) {
      result.push(clr.toRGBFloatArray());
    }
    return result;
  }

  static fromRGBFloatArray(rgbFloats) {
    let result = new ColorPaletteVar();
    for (let ix = 0; ix < rgbFloats.length / 3; ix++) {
      result.add(ColorVar.fromRGBFloatArray([
        rgbFloats[ix * 3 + 0],
        rgbFloats[ix * 3 + 1],
        rgbFloats[ix * 3 + 2],
      ]));
    }
    // @ts-ignore
    return result;
  }
}

