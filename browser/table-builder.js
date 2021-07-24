// Copyright by André van Kammen
// Licensed under CC BY-NC-SA 
// https://creativecommons.org/licenses/by-nc-sa/4.0/

import svgIcon from "../../KMN-utils.js/svg-icons.js";
import log from "../core/log.js";
import { RecordVar } from "../structures/record.js";
import { ArrayTableVar, TableVar } from "../structures/table.js";
import { BaseVar } from "../vars/base.js";
import InnerTextBinding from "./inner-text-binding.js";
import { CreateInputBinding } from "./input-binding.js";

/**
 * @template {RecordVar} R 
 * @template {import('../../../TS/data-model').ArrayTableVarG<R>} T 
 * @type {import('../../../TS/table-builder').TableBuilderG<T,R>}
 */
class TableBuilder {
  /**
   * 
   * @param {HTMLElement} element 
   * @param {import('../../../TS/data-model').ArrayTableVarG<R>} table 
   * @param {import('../../../TS/table-builder').TableBuilderOptions<import('../../../TS/table-builder').ArrayTableType<T>>} options 
   */
  constructor(element, table, options) {
    this.table = table;
    this.options = options || {};
    this.options.alternativeBindings = this.options.alternativeBindings || {};
    this.fieldNames = this.options.fieldNames;
    this.tableEl = element.$el({ tag: "table", cls: table.constructor.name });
    this.tableEl.setAttribute("tabindex", '1');
    this.tableEl.onkeydown = this.handleKeyPress.bind(this);
    // this.tableEl.onblur = this.handleFocusLoss.bind(this);

    this.rowCache = {};
    this.htmlRows

    this.selectedRec = null;
    this.selectedIx = -1;

    if (!this.options.skipHeader) {
      this.thead = this.tableEl.$el({ tag: "thead" });
      this.headRow = this.thead.$el({ tag: "tr" });
      this.tbody = this.tableEl.$el({ tag: "tbody" });
    } else {
      this.tbody = this.tableEl.$el({ tag: "tbody" });
      this.tbody.classList.add('noHead');
    }

    if (this.fieldNames) {
      const allNames = this.table.elementType.prototype._fieldNames;
      for (let name of this.fieldNames) {
        if (allNames.indexOf(name) === -1) {
          // TODO check names with .
          if (name.indexOf(".") === -1) {
            throw "FieldName not found: " + name;
          }
        }
      }
    } else {
      this.fieldNames = this.table.elementType.prototype._fieldNames;
    }
    this.bindings = {};
    for (let ix = 0; ix < this.fieldNames.length; ix++) {
      this.bindings[ix] =
          this.options.alternativeBindings[ix] || (this.options.inlineEdit ? CreateInputBinding : InnerTextBinding)
    }

    this.table.addArrayChangeEvent(this.handleTableArrayChange.bind(this));

    if (this.headRow) {
      this.updateHeader();
    }
    this.updateTable();

    this.onRowSelect = this.options.onRowSelect;
    this.onRowClick = this.options.onRowClick;
  }

  handleKeyPress(evt) {
    // TODO scroll into view
    if (evt.key === 'ArrowDown') {
      for (let ix = this.selectedIx + 1; ix < this.htmlRows.length; ix++) {
        if (this.htmlRows[ix].$isVisible()) {
          evt.preventDefault();
          evt.stopPropagation();
          this.selectRow(this.table.array[ix], ix);
          break;
        }
      }
    } else if (evt.key === 'ArrowUp') {
      for (let ix = this.selectedIx - 1; ix >= 0; ix--) {
        if (this.htmlRows[ix].$isVisible()) {
          evt.preventDefault();
          evt.stopPropagation();
          this.selectRow(this.table.array[ix], ix);
          break;
        }
      }
    } else if (evt.key === 'Enter') {
      this.handleRowClick(this.selectedRec, this.selectedIx);
    } else if (evt.key === 'Escape') {
      this.tableEl.blur();
    }
    // console.log(evt);
  }

  updateHeader() {
    if (!this.fieldNames) {
      log.error("No fields");
    }
    this.headRow.$removeChildren();
    this.fieldNames.forEach(
      (x) => (this.headRow.$el({ tag: "th", cls: x }).innerText = x)
    );

    this.addButton = null;
    if (this.options.editList) {
      this.headRow.$el({ tag: "th", cls: "up" }).width = "20px";
      this.headRow.$el({ tag: "th", cls: "down" }).width = "20px";
      this.addButton = this.headRow.$el({ tag: "th", cls: "add" });
      // this.addButton.width = "20px";
      this.addButton.appendChild(svgIcon("M12,4v16M4,12h16"));
      this.addButton.onclick = this.handleAdd.bind(this);
    }

    // Add filler for scrollbar header
    this.headRow.$el({ tag: "th", cls: "filler" }).innerText = " ";
  }

  handleAdd() {
    // if (!this.addMode) {
      if (this.options.addClick) {
        this.options.addClick()
      }
      // this.addMode = true;
      // this.addButton.classList.add("active");
      // this.addRow = this.tbody.$el({ tag: "tr", cls: "add-row" });
      // // TODO: get effects word from table or options
      // this.addRow.innerText = "click effect to add here!";
    // }
  }

  // handleFocusLoss() {
  //   setTimeout(() => {
  //     if (this.addMode) {
  //       console.log("focus lost!");
  //       // Rescedule to happen after click in table
  //       this.addButton.classList.remove("active");
  //       this.addMode = false;
  //       this.addRow.remove();
  //     }
  //   }, 250);
  // }

  selectRow(rec, ix = -1) {
    if (ix === -1) {
      ix = this.table.findIxForElement(rec);
    } 
    if (0 > ix || ix >= this.htmlRows.length) {
      log.error("Index out of bound in selectRow");
    }
    if (!rec) {
      rec = this.table[ix];
    }
    this.htmlRows[ix].$setSelected();
    this.htmlRows[ix].scrollIntoView({ behavior: "auto", block: "nearest",inline: "nearest"});
    this.selectedRec = rec;
    this.selectedIx = ix;
    if (this.onRowSelect) {
      this.onRowSelect(rec, ix);
    }
  }

  handleRowClick(rec, ix) {
    this.selectRow(rec, ix);
    if (this.onRowClick) {
      this.onRowClick(rec, ix);
    }
  }

  moveRowUp(rec) {
    this.table.moveUp(rec);
  }

  moveRowDown(rec) {
    this.table.moveDown(rec);
  }

  deleteRow(rec) {
    this.table.remove(rec);
  }

  /**
   * @param {HTMLTableRowElement} row
   * @param {R} rec
   */
  _fillRow(row, rec) {
    let bindings = [];
    for (let ix = 0; ix < this.fieldNames.length; ix++) {
      // this.fieldNames.forEach((x) => {
      let fieldName = this.fieldNames[ix];
      let tdEl = row.$el({ tag: "td", cls: fieldName });
      let field = rec.$findVar(fieldName);
      if (field) {
        let bindingIx = bindings.push(new this.bindings[ix](field, tdEl))-1;
        // TODO make better
        let changeDef = rec['_' + fieldName + '_def'];
        if (changeDef) {
          changeDef.$addEvent(() => {
            bindings[bindingIx].remove();
            bindings[bindingIx] = new this.bindings[ix](rec.$findVar(fieldName), tdEl);
          });
        }
      } else {
        tdEl.innerText = "undefined(" + field.$v + ")";
      }
    }
    if (this.options.editList) {
      const addFunc = (name, pathData, func) => {
        let el = row.$el({ tag: "td", cls: name });
        el.appendChild(svgIcon(pathData));
        el.onclick = (evt) => {
          evt.stopPropagation();
          func.call(this, rec);
        };
      };
      // TODO better detection for top row, this won't work with filter or sort
      // if (ix <= 0) {
      //   addFunc("none", "", () => { });
      // } else {
      addFunc("up", "M4,16L12,8L20,16", this.moveRowUp);
      //}
      // TODO better detection for bottom row, this won't work with filter or sort
      // if (ix >= this.table.array.length - 1) {
      //   addFunc("none", "", () => { });
      // } else {
      addFunc("down", "M4,8L12,16L20,8", this.moveRowDown);
      // }
      addFunc("delete", "M4,4L20,20M20,4L4,20", this.deleteRow);
    }
    // @ts-ignore: TODO other way to handle cleanup
    row.dataForCleanup = {
      bindings
    }
  }

  updateTable() {
    this.htmlRows = [];
    // TODO: beter partial update, this one leaks memory through the textbindings

    this.tbody.$removeChildren();
    for (let ix = 0; ix < this.table.array.length; ix++) {
      let rec = this.table.array[ix];

      let row = this.rowCache[rec.$hash];
      if (row) {
        this.tbody.appendChild(row);
      } else {
        row = this.tbody.$el({ tag: "tr" });
        this._fillRow(row, rec);
        this.rowCache[rec.$hash] = row;
      }
      row.onclick = this.handleRowClick.bind(this, rec, ix);
      this.htmlRows.push(row);
    }
    if (this.options.inlineEdit) {
      if (!this.newRec) {
        this.newRec = new this.table.elementType;
        this.newRec.$parent = this.table;
        this.newRec.$setDefinition(this.table.elementDef);
        let addEvent = null
        addEvent = this.newRec.$addEvent(() => {
          this.newRec.$removeEvent(addEvent);
          this.table.add(this.newRec);
          this.newRec = null;
          this.updateTable();
        })
      }
      let row = this.rowCache[this.newRec.$hash];
      if (row) {
        this.tbody.appendChild(row);
      } else {
        row = this.tbody.$el({ tag: "tr" });
        this._fillRow(row, this.newRec);
        this.rowCache[this.newRec.$hash] = row;
      }
      // row.onclick = this.handleRowClick.bind(this, rec, ix);
      this.htmlRows.push(row);
    }
  }

  handleTableArrayChange() {
    this.updateTable();
  }

  setFilter(fieldNameOrFunction, values) {
    if (typeof fieldNameOrFunction === "function") {
      for (let ix = 0; ix < this.htmlRows.length; ix++) {
        this.htmlRows[ix].$setVisible(
          fieldNameOrFunction(ix, this.table.array[ix])
        );
      }
    } else {
      for (let ix = 0; ix < this.htmlRows.length; ix++) {
        const rec = this.table.array[ix]
        this.htmlRows[ix].$setVisible(
          // TODO use something like Hash<value> from c# for performance
          rec && values.indexOf(rec[fieldNameOrFunction].$v) !== -1
        );
      }
    }
  }

  clearFilter() {
    for (let ix = 0; ix < this.htmlRows.length; ix++) {
      this.htmlRows[ix].$setVisible(true);
    }
  }
}

export default TableBuilder;