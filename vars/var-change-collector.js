import defer from "../../KMN-utils.js/defer.js";
import { BaseVar } from "./base.js";


export class VarChangeCollector {
  constructor() {
    /** @type {Map<number,any>} */
    this.oldValues = new Map();
    /** @type {Map<number,BaseVar>} */
    this.changeList = new Map();
    this.changeSceduled = false;
    this.showChangesBound = this.showChanges.bind(this);
  }

  showChanges() {
    // @ ts-ignore Added for debug
    //       window.lastChangeList = changeList;
    // console.log('Changes:',this.changeList)
    let count = 0;
    for (let v of this.changeList.values()) {

      /** @type {typeof BaseVar} */ // @ts-ignore You don't get it typescript? constructor === class type
      let varClass = v.constructor;
      let oldValue = this.oldValues.get(v._hash);
      let newValue = v.$v;
      if (varClass.isValueType) {
        console.log('Value change: ', v.$getFullName(), oldValue, '=>', newValue);
      } else if (varClass.isArrayType) {
        newValue = [v.arrayChangeCount, ...v.array.map(x => x._hash)];
        if (oldValue && oldValue[0] !== newValue[0]) {
          console.log('Array change: ', v.$getFullName(), oldValue, '=>', newValue);
        }
      }
      this.oldValues.set(v._hash, newValue);

      if (count++ > 20) {
        console.log('truncate...');
        break;
      }
    }
    
    this.changeSceduled = false;
    this.changeList = new Map();
  }

  registerVar(v) {
    /** @type {typeof BaseVar} */
    let varClass = v.constructor;
    if (varClass.isValueType) {
      this.oldValues.set(v._hash, v.$v);
    } else if (varClass.isArrayType) {
      this.oldValues.set(v._hash, [v.arrayChangeCount,...v.array.map(v => v._hash)]);
      // console.log('Array change: ',v.$getFullName(),v.array);
    } else {
      console.error('unknown var type registered', v);
    }
  }

  addVarChange(changedVar) {
    this.changeList.set(changedVar._hash, changedVar);
    if (!this.changeSceduled) {
      this.changeSceduled = true;
      setTimeout(this.showChangesBound,100);
    }
  }
}
