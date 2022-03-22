import log from '../core/log.js';
import { BaseDefinition, BaseVar } from './base.js';

export class IntVar extends BaseVar {
  constructor () {
    super();
    this._value = ~~0;
  };

  get $v() {
    return this._value
  }

  set $v(x) {
    if (isNaN(x)) {
      this._valueChanged();
      log.error(`Invalid value (${x}) for IntVar`);
      return;
    }

    let y = ~~x
    if (this._value !== y) {
      this._value = y;
      this._valueChanged();
    }
  }
}

IntVar.typeDefinition = new BaseDefinition({
  type: 'Int',
  inputType: 'number',
  sortIsNumber: true
});
