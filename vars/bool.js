import log from '../core/log.js';
import { BaseVar, BaseDefinition } from './base.js';

class BoolVar extends BaseVar {
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
          let c = x.trim()[0].toUpperCase()
          x = !(c==='N' || c==='F')
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

  get $niceStr() {
    return this._value ? 'yes' : 'no';
  }
}
BoolVar.typeDefinition = new BaseDefinition();
BoolVar.typeDefinition.type = 'Bool';
BoolVar.typeDefinition.inputType = 'checkbox';

export { BoolVar };
