import { BaseDefinition, BaseVar } from './base.js';

class StringVar extends BaseVar {
  constructor () {
    super();
    this._value = '';
  };

  get $v() {
    return this._value
  }

  set $v(x) {
    let y = ''+x
    if (this._value !== y) {
      this._value = y;
      this._valueChanged();
    }
  }
}

StringVar.typeDefinition = new BaseDefinition();
StringVar.typeDefinition.type = 'String';

export { StringVar };
