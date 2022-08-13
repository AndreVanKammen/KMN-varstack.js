import { byteLengthToStr } from '../../KMN-utils.js/format.js';
import { BaseDefinition, BaseVar } from './base.js';
import { BlobBaseVar } from './blob-base.js';

export class BlobVar extends BlobBaseVar {
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
    return this._value?.deref();
  }

  set $v(x) {
    if (x instanceof ArrayBuffer) {
      if (this._value?.deref() !== x) {
        this._value = new WeakRef(x);
        this._valueChanged();
      }
    } else {
      // No value is the default for blob storage vars
      if (x) {
        console.error(`Invalid value (${x}) for BlobVar`);
      }
      this._value = undefined;
    }
  }

  get $niceStr() {
    let lengthVal = (this._value?.deref()?.byteLength);
    if (lengthVal) {
      return byteLengthToStr(lengthVal);
    } else {
      return 'not loaded';
    }
  }
}

BlobVar.typeDefinition = new BaseDefinition({
  ...BlobBaseVar.typeDefinition,
  ...{
    type: 'Blob'
  }
});

