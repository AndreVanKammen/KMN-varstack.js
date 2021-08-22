import defer from "../../KMN-utils.js/defer.js";

const openTasks = [];

//@ts-ignore: add debug function to show position
window.showProgress = function() {
  let tbl = [];
  for (let t of openTasks) {
    tbl.push({
      nr: t.nr, 
      'total(ms)': t.runTime,
      state: t._state,
      'time(ms)': t.stateTime,
      id:t.id
    });
  }
  console.table(tbl);
}
class TaskState {
  constructor() {
    this.startTime = performance.now();
    this.state = 'starting';
    this.id = 'unkown';
    this.nr = -1;
    openTasks.push(this);
  }
  set state(value) {
    this._state = value;
    this.lastStateTime = performance.now();
  }

  dispose() {
    this.state = 'disposing';
    let ix = openTasks.indexOf(this);
    if (ix>=0) {
      openTasks.splice(ix,1);
      // window.showProgress();
    }
  }

  get runTime() {
    return (performance.now() - this.startTime).toFixed(2);
  }

  get stateTime() {
    return (performance.now() - this.lastStateTime).toFixed(2);
  }

  toString() {
    console.log(`Running (${this.nr}) for ${this.runTime}ms, doing ${this._state} for ${this.stateTime}ms, id${this.id}`);
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
