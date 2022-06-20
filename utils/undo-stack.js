import defer from "../../KMN-utils.js/defer.js";
import { ArrayTableVar } from "../structures/table.js";
import { BaseVar } from "../vars/base.js";

class RestoreValueRec {
  /** @type {BaseVar} */
  v = null;
  /** @type {any} */
  oldValue = undefined;
}
class RestoreArrayRec {
  /** @type {ArrayTableVar} */
  v = null;
  /** @type {number[]} */
  oldValue = undefined;
}
class UndoBlock {
  constructor() {
    /** @type {Map<number,RestoreValueRec>} */
    this.oldValues = new Map();
    /** @type {Map<number,RestoreArrayRec>} */
    this.oldArrays = new Map();
  }
}

export class UndoStack {
  constructor() {
    /** @type {Map<number,RestoreValueRec>} */
    this.cachedValues = new Map();
    /** @type {Map<number,BaseVar>} */
    this.changeList = new Map();
    /** @type {UndoBlock[]} */
    this.undoStack = [];

    this.changeSceduled = false;
    this.showChangesBound = this.showChanges.bind(this);
    this.isLoading = true;
  }

  loadingFinished() {
    this.isLoading = false;
    this.clear();
  }

  clear() {
    this.undoStack = [];
    console.log('undostack clear');
  }

  undo() {
    let undoBlock = this.undoStack.pop();
    if (!undoBlock) {
      console.log('Nothing to undo!');
      return;
    }
    this.inUndo = true;
    for (let cacheRec of undoBlock.oldValues.values()) {
      cacheRec.v.$v = cacheRec.oldValue;
      this.cachedValues.set(cacheRec.v._hash, cacheRec);
    }
    for (let cacheRec of undoBlock.oldArrays.values()) {
      let newArray = [];
      for (let ix = 1; ix < cacheRec.oldValue.length; ix++) {
        newArray.push(this.cachedValues.get(cacheRec.oldValue[ix]).v);
      }
      cacheRec.v.restoreArray(newArray);
      this.cachedValues.set(cacheRec.v._hash, cacheRec);
    }
    this.inUndo = false;
  }

  showChanges() {
    let undoBlock = new UndoBlock();
    for (let v of this.changeList.values()) {
      /** @type {typeof BaseVar} */ // @ts-ignore You don' t get it typescript? constructor === class type
      let varClass = v.constructor;
      let cacheRec = this.cachedValues.get(v._hash);
      let newValue = v.$v;
      if (varClass.isValueType) {
        if (!this.isLoading) {
          undoBlock.oldValues.set(v._hash, { v, oldValue: cacheRec.oldValue });
        }
        cacheRec.oldValue = newValue;
      } else if (varClass.isArrayType) {
        /** @type {ArrayTableVar} */ // @ts-ignore
        let atv = v;
        if (cacheRec && cacheRec[0] !== atv.arrayChangeCount) {
          newValue = [atv.arrayChangeCount, ...atv.array.map(x => {
            this.cachedValues.set(x._hash, { v:x, oldValue: x.$v });
            return x._hash;
          })];
          let isSame = cacheRec.oldValue.length === newValue.length;
          if (isSame) {
            for (let ix = 1; ix < newValue.length; ix++) {
              if (cacheRec.oldValue[ix] !== newValue[ix]) {
                isSame = false;
                break;
              }
            }
            // if (isSame) {
            //   console.log('Array didnt change: ', v.$getFullName(), cacheRec, '=>', newValue);
            // }
          }
          if (!this.isLoading && !isSame) {
            undoBlock.oldArrays.set(v._hash, { v: atv, oldValue: cacheRec.oldValue });
            console.log('Array change: ', v.$getFullName(), cacheRec, '=>', newValue);
          }
          cacheRec.oldValue = newValue;
        }
      }
    }
    console.log('Stored undo: ', undoBlock);
    this.undoStack.push(undoBlock);
    
    this.changeSceduled = false;
    this.changeList = new Map();
  }

  /**
   * 
   * @param {BaseVar} rootVar 
   */
  addVarTree(rootVar) {
    rootVar._changeMonitor = this;
  }

  registerVar(v) {
    /** @type {typeof BaseVar} */
    let varClass = v.constructor;
    if (varClass.isValueType) {
      this.cachedValues.set(v._hash, { v, oldValue: v.$v });
    } else if (varClass.isArrayType) {
      this.cachedValues.set(v._hash, {
        v, oldValue: [v.arrayChangeCount, ...v.array.map(v => v._hash)]
      });
      // console.log('Array change: ',v.$getFullName(),v.array);
    } else {
      this.cachedValues.set(v._hash, { v, oldValue: v.$v });
    }
  }

  addVarChange(changedVar) {
    if (this.inUndo) {
      return;
    }
    this.changeList.set(changedVar._hash, changedVar);
    if (!this.changeSceduled) {
      this.changeSceduled = true;
      setTimeout(this.showChangesBound,100);
    }
  }
}
