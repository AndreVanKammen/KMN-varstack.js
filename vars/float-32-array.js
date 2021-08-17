import { BaseDefinition, BaseVar } from './base.js';
import { BlobBaseVar } from './blob-base.js';

class Float32ArrayVar extends BlobBaseVar {
  constructor () {
    super();
    this._value = undefined;
  };

  /**
   * Value from storage retrieved, store here as weakref for caching
   */
  _storeNoCallBack(val)  {
    this._value = new WeakRef(val);
  }

  get $v() {
    return this._value?.deref()
  }

  set $v(x) {
    if (x instanceof Float32Array) {
      if (this._value !== x) {
        this._value = new WeakRef(x);
        this._valueChanged();
      }
    } else if (Array.isArray(x)) {
      this._value = new WeakRef(new Float32Array(x));
      this._valueChanged();
  } else {
      if (x) {
        console.error(`Invalid value (${x}) for Float32ArrayVar`);
      }
    }
  }
}

Float32ArrayVar.typeDefinition = new BaseDefinition();
Float32ArrayVar.typeDefinition.type = 'Float32Array';

export { Float32ArrayVar };
