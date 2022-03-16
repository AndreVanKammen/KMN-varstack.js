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
  for (let [key, val] of Object.entries(enumValues)) {
    enumLookUp[val] = key;
    enumOrder[val] = index++;
  }
  newClass.enumLookUp = enumLookUp;
  newClass.enumOrder = enumOrder;

  // TODO: Should do this for record and array as well to be more compatible
  newClass.typeDefinition = new BaseDefinition({
    ...EnumVar.typeDefinition,
    ...{
      type: name
    }
  });
}

EnumVar.enumValues = {};
EnumVar.enumLookUp = [];
EnumVar.typeDefinition = new BaseDefinition({
  ...IntVar.typeDefinition,
  ...{
    type: 'Enum',
    inputType: 'dropdown'
  }
});
