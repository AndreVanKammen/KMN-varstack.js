import defer from '../../KMN-utils.js/defer.js';

const deferedHandleOffset = 10000000;

let globalHashCount = 0;
export class BaseDefinition {
  constructor(defaults) {
    this._hash = ++globalHashCount; // Give every type definition a unique nr for hash-maps
    this.name = defaults?.name || '';
    this.type = defaults?.type || '';

    this.directInput = defaults?.directInput || '';
    this.inputType = defaults?.inputType || '';
    this.range = defaults?.range;
    this.step = defaults?.step || '';
    this.defVal = defaults?.defVal || '';
    this.showValue = defaults?.showValue || '';
    this.precision = isFinite(defaults?.precision) ? ~~(defaults?.precision) : 2;

    this.isReadOnly = defaults?.isReadOnly || false;
    this.isKey = defaults?.isKey || false;
    this.isValue = defaults?.isValue || false;
    this.noStore = defaults?.noStore || false;

    this.lookup = defaults?.lookup || '';
    this.ref = defaults?.ref || '';
    this.defRef = defaults?.defRef || '';

    this.sortIsNumber = defaults?.sortIsNumber || false;
  }
}
export class BaseVar {
  /** @type {((BaserVar) => void)[]} */
  _directCallbacks = [];
  /** @type {((BaserVar) => void)[]} */
  _deferedCallbacks = [];
  _deferedSceduled = false;
  _handleDeferedBound = this.handleDefered.bind(this);
  _hash = ++globalHashCount; // Give every object a unique nr for hash-maps
  /** @type {BaseDefinition} */
  _varDefinition = undefined;
  _value = undefined;

  constructor () {
  }

  /** @type {import('../structures/record').RecordVar} */
  set $parent(x) {
    this._parent = x;
  }

  get $parent() {
    return this._parent;
  }

  $getMain() {
    let parent = this._parent;
    let p;
    while (p = parent._parent) {
      parent = p;
    }
    return parent;
  }

  get $v() {
    return undefined;
  }

  set $v(x) {
  }

  get $hash() {
    return this._hash;
  }

  /** @type {BaseDefinition} */
  get $varDefinition() {
    // @ts-ignore: TODO use different construction for this?
    return this._varDefinition || this.constructor.typeDefinition;
  }

  get $varType() {
    return this.$varDefinition.type
  }

  get $sortValue() {
    return this.$v;
  }

  get $niceStr() {
    if (this.$v != null) {
      //@ts-ignore 
      if (this.constructor.$formatForScreen) {
        //@ts-ignore 
        return this.constructor.$formatForScreen(this);
      }
      return this.$v.toString()
    } else {
      return '';
    }
  }

  toJSON () {
    return this.$v;
  }

  toString () {
    if (this.$v !== this) {
      return this.$v.toString();
    } else {
      return 'Implement to string for ' + this.$varType;
    }
  }

  _valueChanged () {
    for (const callBack of this._directCallbacks) {
      if (callBack) {
        callBack(this);
      }
    }
    if (this._deferedCallbacks.length>0 && !this._deferedSceduled) {
      this._deferedSceduled = true;
      defer(this._handleDeferedBound);
    }
  }

  handleDefered() {
    this._deferedSceduled = false;
    for (const callBack of this._deferedCallbacks) {
      if (callBack) {
        callBack(this);
      }
    }
  }

  $getStoredPromise () {
    this._storeResolvers = this._storeResolvers || [];
    return new Promise((resolve, reject) => {
      this._storeResolvers.push(resolve);
    });
  }

  $storeIsPending ()  {
  }

  $storeIsFinished ()  {
    if (this._storeResolvers) {
      for (const resolver of this._storeResolvers) {
        resolver();
      }
    }
    this._storeResolvers = [];
  }

  /** @type {import("../../../TS/data-model").AddEvent} */
  $addEvent (callBack, initialize = false) {
    // re-use nulled version on larger lists
    if (this._directCallbacks.length>512) {
      let ix = 0;
      for (const cb of this._directCallbacks) {
        if (!cb) {
          this._directCallbacks[ix] = callBack;
          return ix;
        }
        ix++;
      }
    }
    if (initialize) {
      callBack(this);
    }
    return this._directCallbacks.push(callBack) - 1;
  }

  $addDeferedEvent(callBack, initialize = false) {
    // re-use nulled version on larger lists
    if (this._deferedCallbacks.length > 512) {
      let ix = 0;
      for (const cb of this._deferedCallbacks) {
        if (!cb) {
          this._deferedCallbacks[ix] = callBack;
          return ix;
        }
        ix++;
      }
    }
    if (initialize) {
      callBack(this);
    }
    return this._deferedCallbacks.push(callBack) - 1 + deferedHandleOffset;
  }

  $removeEvent(handle) {
    if (handle >= deferedHandleOffset) {
      this._deferedCallbacks[handle - deferedHandleOffset] = null;
    }else{
      this._directCallbacks[handle] = null
    }
  }

  /** @param {BaseDefinition} definition*/
  $setDefinition(definition) {
    this._varDefinition = definition;
    if (definition.range && definition.range.length) {
      let v = definition.range[0];
      if (v < 0 && definition.range[1] > 0) {
        this.$v = 0;
      } else {
        this.$v = definition.range[0];
      }
    }
    if (definition.defVal) {
      this.$v = definition.defVal;
    }
  }
}

export class BaseBinding {
  constructor (baseVar) {
    if (!baseVar) {
      throw "No baseVar supplied";
    }
    /** @type {BaseVar} baseVar */
    this.baseVar = baseVar
    this.changeEvent = undefined;
  }

  remove() {
    if (this.changeEvent !== undefined) {
      this.baseVar.$removeEvent(this.changeEvent);
    }
  }
}
