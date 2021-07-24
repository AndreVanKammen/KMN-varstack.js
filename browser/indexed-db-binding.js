// Copyright by André van Kammen
// Licensed under CC BY-NC-SA 
// https://creativecommons.org/licenses/by-nc-sa/4.0/

import { IDB, idb } from "../../KMN-utils.js/indexed-db.js";
import { RecordVar } from "../structures/record.js";
import { ArrayTableVar, TableVar } from "../structures/table.js";
import { Types } from "../varstack.js";

const tableMetaStore = 'table-meta-data';

Types.addRecord('TableMetaData', {
  name: 'String:key',
  count: 'Int:value'
})
class IndexedDBRecordBindingBase {
  /**
   * 
   * @param {RecordVar} varToStore 
   * @param {IDB} idb 
   * @param {string} storageName 
   * @param {string} keyValue 
   */
  constructor(varToStore, idb, storageName, keyValue) {
    this.varToStore = varToStore;
    this.storageName = storageName;
    this.idb = idb;
    this.justCreated = true;
    this.keyName = keyValue;
    this.idb.getStoreValue(this.storageName, this.keyName).then(
      (result) => {
        if (result != null) {
          this.varToStore.$v = result;
          this.justCreated = false;
        }
      }).finally(()  => {
        window.setTimeout(() => {
          this.varToStore.$addEvent(this.handleChanged.bind(this))
        }, 0);
      });
  }

  handleChanged() {
    // TODO: Feedback to record if saved or not?
    this.idb.setStoreValue(this.storageName,this.keyName,this.varToStore.toJSON());
  }
}

export class IndexedDBRecordBinding extends IndexedDBRecordBindingBase {
  /**
   * 
   * @param {RecordVar} varToStore 
   * @param {IDB} idb 
   * @param {string} storageName 
   */
  constructor(varToStore, idb, storageName) {
    const keyFieldName = varToStore.$keyFieldName;
    const keyFieldVar = varToStore.$v[keyFieldName];
    super (varToStore, idb, storageName, keyFieldVar.$v);
  }
}

export class IndexedDBTableBinding {
  /**
   * Creates a link between a varstack table and a indexed-db store
   * @param {ArrayTableVar} tableToStore 
   * @param {IDB} idb 
   * @param {string} storageName 
   * @param {any} defaultData 
   */
  constructor(tableToStore, idb, storageName, defaultData) {
    this.tableToStore = tableToStore;
    this.storageName = storageName;
    this.justCreated = true;
    this.idb = idb;
    this.tableMeta = new Types.TableMetaData();
    this.tableMeta.name.$v = storageName;
    this.tableMeta.count.$v = defaultData?.length || 0;
    this.tableMetaBinding = new IndexedDBRecordBinding(this.tableMeta, this.idb, tableMetaStore);
    this.boundRecords = {};
    this.keyFieldName = this.tableToStore.keyFieldName;

    this.idb.getAll(this.storageName).then( (result) => {
      if (result) {
        this.justCreated = false;
        // TODO: Sparse loading?
        for (let entry of result) {
          this.tableToStore.add(entry);
        }
      }
    }).finally( () => {
      this.tableToStore.addArrayChangeEvent(this.handleArrayChanged.bind(this));
      this.handleArrayChanged();
    });
    this.tableToStore
  }

  handleArrayChanged() {
    this.tableMeta.count.$v = this.tableToStore.length;
    for (let ix = 0; ix < this.tableToStore.length; ix++) {
      // TODO: See if we kan support sparse array so we only cache used records in memory, might be useful for large load on demand tables
      let el = this.tableToStore.element(ix);
      if (el) {
        let keyValue = el[this.keyFieldName].$v;
        let binding = this.boundRecords[keyValue];
        if (!binding) {
          this.boundRecords[keyValue] = new IndexedDBRecordBindingBase(el, this.idb, this.storageName, keyValue);
        }
      }
    }
  }

  // handleChanged() {
  //   if (this.storageName) {
  //     let storeStr = JSON.stringify(this.varToStore);
  //     let start = performance.now();
  //     localStorage.setItem(this.storageName, storeStr);
  //     let stop = performance.now();
  //     console.log('Update to local storage: ',storeStr.length,'bytes ',(stop-start).toFixed(2));
  //   }
  // }
}

export default IndexedDBTableBinding