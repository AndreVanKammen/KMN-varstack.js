import { BaseDefinition, BaseVar } from './base.js';

class FloatVar extends BaseVar {
  constructor () {
    super();
    this._value = 0.0;
  };

  get $v() {
    return this._value
  }

  get $niceStr() {
    return this._value.toFixed(2);
  }

  set $v(x) {
    let val = typeof x === 'string' ? parseFloat(x) : x;
    // TODO: Make this optional
    if (isNaN(val) || !isFinite(val)) {
      // TODO: This can cause a stack overflow
      // this._valueChanged();
      console.error(`Invalid value (${x}) for FloatVar (${this.$varDefinition?.name})`);
      return;
    }

    if (this._value !== val) {
      this._value = val;
      this._valueChanged();
    }
  }
}

FloatVar.typeDefinition = new BaseDefinition();
FloatVar.typeDefinition.type = 'Float';
FloatVar.typeDefinition.inputType = 'range';

export { FloatVar };
