import defer from "../../KMN-utils.js/defer.js";
import { ArrayTableVar } from "../structures/table.js";
import { Types } from "../varstack.js";


Types.addRecord('System_TaskState', {
  nr: 'Int',
  state: 'String',
  lastStateTime: 'Time',
  startTime: 'Time',
  stopTime: 'Time',
  id: 'String'
});

Types.addArray('System_TaskTable', 'System_TaskState');

//@ts-ignore: add debug function to show position
window.showProgress = function() {
  // let tbl = [];
  // for (let t of openTasks) {
  //   tbl.push({
  //     nr: t.nr, 
  //     'total(ms)': t.runTime,
  //     state: t._state,
  //     'time(ms)': t.stateTime,
  //     id:t.id
  //   });
  // }
  // console.table(tbl);
  console.table(_openTasksTable.toObject());
}

const openTasks = [];
/** @type {import("../../../TS/data-model.js").ArrayTableVarG<any>} */
let _openTasksTable = null;

/**
 * Rerturn the current last tasks list
 * @returns {import("../../../TS/data-model.js").ArrayTableVarG<any>}
 */
export function getOpenTasksTable() {
  if (!_openTasksTable) {
    _openTasksTable = new Types.System_TaskTable();
  }
  return _openTasksTable;
}

class TaskState {
  constructor() {
    this.taskIx = -1;
    for (let ix = 0; ix < openTasks.length-1; ix++) {
      if (!openTasks[ix]) {
        this.taskIx = ix;
        openTasks[this.taskIx] = this;
        break;
      }
    }
    if (this.taskIx < 0) {
      this.taskIx = openTasks.push(this) - 1;
    }

    /** @type {ArrayTableVar} */
    this.table = getOpenTasksTable();
    while (this.table.length<=this.taskIx) {
      this.table.add(new Types.System_TaskState());
    }
    this.stateRec = this.table.element(this.taskIx);

    this.stateRec.startTime.$v = Date.now() / 1000.0;
    this.stateRec.stopTime.$v = 0.0;
    this.state = 'starting';
    this.id = 'unkown';
    this.nr = -1;
  }

  set state(value) {
    this.stateRec.state.$v =  value;
    this.stateRec.lastStateTime.$v = Date.now() / 1000.0;
  }

  set id(value) {
    this.stateRec.id.$v =  value;
  }

  set nr(value) {
    this.stateRec.nr.$v =  value;
  }

  dispose() {
    this.state = 'disposing';
    this.stateRec.stopTime.$v = Date.now() / 1000.0;
    openTasks[this.taskIx] = null;
  }
}

export function limitParralelTasks(limitVar, maxValue, startTask, taskNr) {
  const handleTask = () => {
    // Claim the task
    limitVar.$v += 1;
    let taskState = new TaskState();
    taskState.nr = taskNr;
    // scedule execution so we don't block the var
    defer(async () => {
      try {
        await startTask(taskState);
        taskState.state = 'finished';
      } finally {
        limitVar.$v -= 1;
        taskState.dispose();
      }
    });
  };
  if (limitVar.$v < maxValue) {
    handleTask();
  } else {
    let waitEventHandle;
    waitEventHandle = limitVar.$addEvent((v) => {
      if (v.$v < maxValue) {
        limitVar.$removeEvent(waitEventHandle);
        handleTask();
      }
    });
  }
}
