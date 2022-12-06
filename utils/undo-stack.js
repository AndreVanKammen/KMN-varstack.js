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
class ChangeRecord {

  fromLoading = false;
  /** @type {BaseVar} */
  changedVar = null;
  constructor(changedVar, fromLoading) {
    this.changedVar = changedVar;
    this.fromLoading = fromLoading;
  }
}

export class UndoStack {
  constructor() {
    /** @type {Map<number,RestoreValueRec>} */
    this.cachedValues = new Map();
    /** @type {Map<number,ChangeRecord>} */
    this.changeList = new Map();
    /** @type {UndoBlock[]} */
    this.undoStack = [];
    this.onNewUndo = () => { }; // For debug puprposes

    this.changeSceduled = false;
    this.handleChangesBound = this.handleChanges.bind(this);
    this.isLoading = true;
  }

  loadingFinished() {
    // Handle the last changes without storing them
    this.handleChanges();
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
      cacheRec.v.$beginLoading();
      cacheRec.v.$v = cacheRec.oldValue;
      this.cachedValues.set(cacheRec.v._hash, cacheRec);
      cacheRec.v.$endLoading();
    }
    for (let cacheRec of undoBlock.oldArrays.values()) {
      let newArray = [];
      cacheRec.v.$beginLoading();
      for (let ix = 1; ix < cacheRec.oldValue.length; ix++) {
        newArray.push(this.cachedValues.get(cacheRec.oldValue[ix]).v);
      }
      cacheRec.v.restoreArray(newArray);
      cacheRec.v.$endLoading();
      this.cachedValues.set(cacheRec.v._hash, cacheRec);
    }
    this.inUndo = false;
    this.onNewUndo();
  }
  /**
   *
   * @param {ArrayTableVar} atv
   * @param {Boolean} updateCache
   * @returns {Number[]}
   */
  getArrayHashes(atv, updateCache = false) {
    let arr = new Array(atv.array.length + 1);
    arr[0] = atv.arrayChangeCount;
    for (let ix = 0; ix < atv.array.length; ix++) {
      const x = atv.array[ix];
      if (updateCache) {
        this.cachedValues.set(x._hash, { v: x, oldValue: x.$v });
      }
      arr[ix + 1] = x._hash;
    }
    return arr;

    // return [atv.arrayChangeCount, ...atv.array.map(x => {
    //   if (updateCache) {
    //     this.cachedValues.set(x._hash, { v: x, oldValue: x.$v });
    //   }
    //   return x._hash;
    // })];
  }

  /**
   * @param {ArrayTableVar} atv
   * @param {Boolean} updateCacheRec
   * @param {RestoreValueRec} cacheRec
   */
  checkArrayChanged(atv, updateCacheRec, cacheRec = null) {
    // let storeChange = cacheRec !== null;
    cacheRec = cacheRec || this.cachedValues.get(atv._hash);
    if (cacheRec && cacheRec.oldValue[0] !== atv.arrayChangeCount) {
      let isSame = (cacheRec.oldValue.length - 1) === atv.array.length;
      if (isSame) {
        for (let ix = 1; ix < atv.array.length; ix++) {
          if (cacheRec.oldValue[ix] !== atv.array[ix - 1]._hash) {
            isSame = false;
            break;
          }
        }
      }
      if (updateCacheRec && !isSame) {
        let newValue = this.getArrayHashes(atv, true);
        cacheRec.oldValue = newValue;
      }
      return !isSame;
    }
    return false;
}

  handleChanges() {
    let undoBlock = new UndoBlock();
    for (let changeRec of this.changeList.values()) {
      const v = changeRec.changedVar;
      /** @type {typeof BaseVar} */ // @ts-ignore You don' t get it typescript? constructor === class type
      let varClass = v.constructor;
      let cacheRec = this.cachedValues.get(v._hash);
      let newValue = v.$v;
      if (varClass.isValueType) {
        if (!this.isLoading && !changeRec.fromLoading) {
          undoBlock.oldValues.set(v._hash, { v, oldValue: cacheRec.oldValue });
        }
        cacheRec.oldValue = newValue;
      } else if (varClass.isArrayType) {
        /** @type {ArrayTableVar} */ // @ts-ignore
        let atv = v;
        let isLoading = !this.isLoading && !changeRec.fromLoading;
        let oldValueArray = cacheRec.oldValue;
        // if (isLoading) {
        //   console.log('!!!!!!!!!!!!!!!!!!!NOOOOOOOOOOOOOO!!!!!!!!!!!!!!!!!!');
        // }
        if (this.checkArrayChanged(atv, isLoading, cacheRec)) {
          if (!this.isLoading && !changeRec.fromLoading) {
            undoBlock.oldArrays.set(v._hash, { v: atv, oldValue: oldValueArray });
            // console.log('Array change: ', changeRec.fromLoading, v.$isLoading, v.$getFullName(), cacheRec.oldValue.slice(0), '=>', newValue);
          }
        }
      }
    }
    if (undoBlock.oldValues.size || undoBlock.oldArrays.size) {
      console.log('Stored undo: ', undoBlock);
      this.undoStack.push(undoBlock);
      this.onNewUndo();
    }

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
    const isLoading = changedVar.$isLoading || this.isLoading;
    if (changedVar.constructor.isArrayType) {
      if (changedVar instanceof ArrayTableVar && this.checkArrayChanged(changedVar, isLoading) && !isLoading) {
        // console.log('Array change: ', changedVar.$getFullName(), changedVar);
        // debugger;
      } else {
        return
      }
    }
    let cr = this.changeList.get(changedVar._hash);
    if (cr) {
      if (isLoading) {
        cr.fromLoading = true;
      }
    } else {
      cr = new ChangeRecord(changedVar, isLoading);
      this.changeList.set(changedVar._hash, cr);
    }
    if (!this.changeSceduled) {
      this.changeSceduled = true;
      setTimeout(this.handleChangesBound,1000);
    }
  }
}
