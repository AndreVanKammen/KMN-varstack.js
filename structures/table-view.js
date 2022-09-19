import { IntVar } from "../vars/int.js";
import { TableVar } from "./table.js";

export class TableView {
  /**
   *
   * @param {TableVar} table
   */
  constructor(table) {
    this.table = table;
    this.sortField = '';
    this.sortAscending = false;
    this.viewInvalidated = true;

    this.preFilterArray = [];
    this.viewArray = [];

    this.table.$addEvent(this.handleArrayChanged.bind(this));
    this.viewChanged = new IntVar();
    this.hasPreFilter = false;
  }

  handleArrayChanged() {
    this.viewInvalidated = true;
  }

  /**
   *
   * @param {string} fieldName
   * @param {string | number} value1
   * @param {number} value2
   */
   setFilter(fieldName, value1, value2) {
    this.filterField = fieldName;
    this.filterValueStr = value1.toString();
    // @ts-ignore
    this.filterValue1 = Math.min(value1, value2);
    // @ts-ignore
    this.filterValue2 = Math.max(value1, value2);
    this.viewInvalidated = true;
    this.viewChanged.$v++;
  }

  setSort(fieldName, ascending = undefined) {
    console.log('set sort:', fieldName);
    if (this.sortField !== fieldName) {
      this.sortAscending = false;
      this.sortField = fieldName;
    } else {
      this.sortAscending = !this.sortAscending;
    }
    if (ascending !== undefined) {
      this.sortAscending = ascending;
    }
    this.viewInvalidated = true;
    this.viewChanged.$v++;
  }

  setPreFilterArray(perFilterArray) {
    if (perFilterArray) {
      this.preFilterArray = perFilterArray;
      this.hasPreFilter = true;
    } else {
      this.preFilterArray = null;
      this.hasPreFilter = false;
    }
    this.viewInvalidated = true;
    this.viewChanged.$v++;
  }

  getSortArray() {
    if (this.viewInvalidated) {
      /** @type {number[]} */
      let imputArray;
      if (this.hasPreFilter) {
        imputArray = this.preFilterArray;
      } else {
        imputArray = [];
        for (let ix = 0; ix < this.table.length; ix++) {
          imputArray.push(ix);
        }
      }

      let sortField = this.sortField || this.filterField;
      let sortFieldIx = this.table.elementType.prototype._fieldNames.indexOf(sortField);
      if (sortFieldIx !== -1) {
        let tempArray = [];
        for (let ix of imputArray) {
          let val = this.table.element(ix)[sortField].$sortValue;
          if (this.filterField) {
            let fieldIx = this.table.elementType.prototype._fieldNames.indexOf(this.filterField);
            let recInFiltered = true;
            if (this.table.elementType.prototype._fieldDefs[fieldIx].sortIsNumber) {
              if (this.table.element(ix)[this.filterField].$sortValue < this.filterValue1) {
                recInFiltered = false;
              }
              if (this.table.element(ix)[this.filterField].$sortValue > this.filterValue2) {
                recInFiltered = false;
              }
            } else {
              recInFiltered = this.table.element(ix)[this.filterField].$niceStr.toLocaleLowerCase()
                .indexOf(this.filterValueStr.toLocaleLowerCase()) >= 0;
            }

            if (recInFiltered) {
              tempArray.push({ ix, val });
            }
          }
          else {
            tempArray.push({ ix, val });
          }
        }

        let sortMultiplier = this.sortAscending ? -1 : 1;
        if (this.table.elementType.prototype._fieldDefs[sortFieldIx].sortIsNumber) {
          tempArray = tempArray.sort((a, b) => (a.val - b.val) * sortMultiplier);
        } else {
          tempArray = tempArray.sort((a, b) => a.val.localeCompare(b.val) * sortMultiplier)
        }

        this.viewArray = tempArray.map(t => t.ix);
      } else {
        this.viewArray = imputArray;
      }

      this.viewInvalidated = false;
    }
    return this.viewArray;
  }
}