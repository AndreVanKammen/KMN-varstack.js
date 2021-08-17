
let globalHashCount = 0;
export class BaseDefinition {
  _hash = ++globalHashCount; // Give every type definition a unique nr for hash-maps
  name = '';
  type = '';
  isReadOnly = false;
  isKey = false;
  isValue = false;
  noStore = false;
  range = [0.0,1.0];
  lookup = '';
  ref = '';
  defRef = '';
  defVal = '';
}
export class BaseVar {
  /** @type {((BaserVar) => void)[]} */
  _directCallbacks = [];
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
    return this._varDefinition || this.constructor.typeDefinition
  }

  get $varType() {
    return this.$varDefinition.type
  }

  get $niceStr() {
    return this.$v.toString()
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
  $addEvent (callBack) {
    // re-use nulled version 
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
    return this._directCallbacks.push(callBack) - 1;
  }

  $removeEvent (handle) {
    this._directCallbacks[handle] = null
  }

  /** @param {BaseDefinition} definition*/
  $setDefinition(definition) {
    this._varDefinition = definition;
    if (definition.defVal) {
      this.$v = definition.defVal;
    }
  }
}

BaseVar.parseDefinition = function (definition, name) {
  if (typeof definition === 'object') {
    return definition;
  }
  // TODO: use a definition record, change the string stuff to definition and add more like ranges, masks, lookup etc.
  //       This so we can always create an apropriate edit.
  let defs = definition.split(':');
  let definitions = defs.length <= 1 ? [] : defs[1].split(',');
  let def = new BaseDefinition();

  def.name = name;
  def.type = defs[0];
  def.isReadOnly = definitions.indexOf('ro') !== -1;
  def.isKey = definitions.indexOf('key') !== -1;
  def.isValue = definitions.indexOf('value') !== -1;
  def.noStore = definitions.indexOf('nostore') !== -1;
  def.lookup = definitions.filter(x => x.startsWith('lookup>'))[0]?.substr(7);
  def.defRef = definitions.filter(x => x.startsWith('defref>'))[0]?.substr(7);
  def.defVal = definitions.filter(x => x.startsWith('defval>'))[0]?.substr(7);
  def.range = definitions.filter(x => x.startsWith('range>'))[0]?.substr(6)?.split('..')?.map(x => Number.parseFloat(x));
  def.ref = definitions.filter(x => x.startsWith('ref>'))[0]?.substr(4);

  return def;
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
