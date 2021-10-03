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

EnumVar.enumValues = {};
EnumVar.enumLookUp = [];
EnumVar.typeDefinition = new BaseDefinition({
  ...IntVar.typeDefinition,
  ...{
    type: 'Enum',
    inputType: 'dropdown'
  }
});
