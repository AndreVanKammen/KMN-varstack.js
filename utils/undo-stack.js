import defer from "../../KMN-utils.js/defer.js";
import { ArrayTableVar } from "../structures/table.js";
import { BaseVar } from "../vars/base.js";

class RestoreRec {
  v = null;
  oldValue = undefined;
}
class UndoBlock {
  constructor() {
    /** @type {Map<number,RestoreRec>} */
    this.oldValues = new Map();
  }
}

export class UndoStack {
  constructor() {
    /** @type {Map<number,any>} */
    this.oldValues = new Map();
    /** @type {Map<number,BaseVar>} */
    this.changeList = new Map();
    /** @type {UndoBlock[]} */
    this.undoStack = [];

    this.changeSceduled = false;
    this.showChangesBound = this.showChanges.bind(this);
  }

  undo() {
    let undoBlock = this.undoStack.pop();
    this.inUndo = true;
    for (let v of undoBlock.oldValues.values()) {
      v.v.$v = v.oldValue;
      this.oldValues.set(v.v._hash, v.oldValue);
    }
    this.inUndo = false;
  }

  showChanges() {
    let undoBlock = new UndoBlock();
    for (let v of this.changeList.values()) {
      /** @type {typeof BaseVar} */ // @ts-ignore You don' t get it typescript? constructor === class type
      let varClass = v.constructor;
      let oldValue = this.oldValues.get(v._hash);
      let newValue = v.$v;
      if (varClass.isValueType) {
        // console.log('Value change: ', v.$getFullName(), oldValue, '=>', newValue);
        undoBlock.oldValues.set(v._hash, { v, oldValue });
        this.oldValues.set(v._hash, newValue);
      } else if (varClass.isArrayType) {
        /** @type {ArrayTableVar} */ // @ts-ignore
        let atv = v;
        if (oldValue && oldValue[0] !== atv.arrayChangeCount) {
          newValue = [atv.arrayChangeCount, ...atv.array.map(x => x._hash)];
          console.log('Array change: ', v.$getFullName(), oldValue, '=>', newValue);
          this.oldValues.set(v._hash, newValue);
        }
      }
      console.log('Stored undo: ', undoBlock);
    }
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
      this.oldValues.set(v._hash, v.$v);
    } else if (varClass.isArrayType) {
      this.oldValues.set(v._hash, [v.arrayChangeCount,...v.array.map(v => v._hash)]);
      // console.log('Array change: ',v.$getFullName(),v.array);
    } else {
      console.error('unknown var type registered', v);
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
