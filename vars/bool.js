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

  $toggle() {
    this.$v = !this.$v;
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

export class BoolSelectVar extends BoolVar {
  /**
   *
   * @param {BaseVar} baseVar
   * @param {any} value
   */
  constructor(baseVar, value, unselectVal) {
    super();
    this.value = value;
    this.unselectVal = unselectVal;
    this.baseVar = baseVar;
    this.baseEvent = this.baseVar.$addEvent((x) => {
      // console.log('select from base event: ',this.baseVar.$v, this.value);
      this.$v = this.baseVar.$v == this.value;
    });
    this.$addEvent((b) => {
      if (b.$v) {
        // console.log('set from bool event: ',this.baseVar ,this.baseVar.$v, this.value);
        this.baseVar.$v = this.value;

        // Always make sure our value is the right type for the basevar
        this.value = this.baseVar.$v;
      } else {
        if (this.value === this.baseVar.$v) {
          // console.log('set from base event: ',this.baseVar.$v, this.unselectVal);
          this.baseVar.$v = this.unselectVal;
        }
      }
    });
  }

  dispose() {
    this.baseVar.$removeEvent(this.baseEvent);
    super.dispose();
  }
}

