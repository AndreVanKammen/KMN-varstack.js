import { BaseDefinition } from "./base.js";
import { IntVar } from "./int.js";

export class EnumVar extends IntVar {
  constructor () {
    super();
  };

  get $v() {
    return super.$v;
  }

  set $v(x) {
    if (typeof x === 'string') {
      // @ts-ignore: TODO use different construction for this?
      // console.log(this.constructor.enumValues);
      // @ts-ignore: TODO use different construction for this?
      let nr = this.constructor.enumValues[x];
      if (isFinite(nr)) {
        super.$v = nr;
      } else {
        console.error('Invalid enum value: ', x);
      }
    } else {
      super.$v = x;
    }
  }

  get $sortValue() {
    // @ts-ignore: TODO use different construction for this?
    return Object.values(this.constructor.enumValues).indexOf(this.$v);
  }

  get $niceStr() {
    // @ts-ignore: TODO use different construction for this?
    // console.log(this.constructor.enumLookUp);
    // @ts-ignore: TODO use different construction for this?
    return this.constructor.enumLookUp[this.$v];
  }
}

EnumVar.initialize = function(name, enumValues) {
  let newClass = this;
  newClass.enumValues = enumValues;
  let enumOrder = [];
  let enumLookUp = [];
  let index = 0;
  let enumEntries = Object.entries(enumValues);
  for (let [key, val] of enumEntries) {
    enumLookUp[val] = key;
    enumOrder[val] = index++;
  }
  newClass.enumLookUp = enumLookUp;
  newClass.enumOrder = enumOrder;
  newClass.typeDefinition.range = [0, enumEntries.length-1];

  // TODO: Should do this for record and array as well to be more compatible
  newClass.typeDefinition = new BaseDefinition({
    ...EnumVar.typeDefinition,
    ...{
      type: name
    }
  });
}

EnumVar.$sortIsNumber = function () {
  return true;
}

EnumVar.enumValues = {};
EnumVar.enumLookUp = [];
EnumVar.typeDefinition = new BaseDefinition({
  ...IntVar.typeDefinition,
  ...{
    type: 'Enum',
    inputType: 'dropdown',
    sortIsNumber: true
  }
});
