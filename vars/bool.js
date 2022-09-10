import log from '../core/log.js';
import { BaseVar, BaseDefinition } from './base.js';

export class BoolVar extends BaseVar {
  constructor () {
    super();
    this._value = false;
  };

  get $v() {
    return this._value
  }

  /** @param {any} x */
  set $v(x) {
    let y = !!x
    if (typeof x !== 'boolean') {
      if (!isNaN(x)) {
        y = !!~~x
      } else {
        if (typeof x === 'string' && x) {
          x = BoolVar.parseStr(x);
        } else {
          log.error(`Invalid value (${x}) for BoolVar`);
        }
      }
    }

    if (this._value !== y) {
      this._value = y;
      this._valueChanged();
    }
  }

  /** @type {string} */
  get $niceStr() {
    return this._value ? 'yes' : 'no';
  }
}

BoolVar.parseStr= function(str, defaultValue) {
  if (str && str.length) {
    let c = str.trim()[0].toUpperCase()
    return !(c === 'N' || c === 'F' || c === '0');
  } else {
    return defaultValue;
  }
}

BoolVar.typeDefinition = new BaseDefinition({
  type: 'Bool',
  inputType: 'checkbox',
  screenWidth: 40
});

