// Copyright by André van Kammen
// Licensed under CC BY-NC-SA 
// https://creativecommons.org/licenses/by-nc-sa/4.0/

class Log {
  error (s, ...args) {
    console.trace(s, args);
  }
  warn (s) {
    console.log(s);
  }
}
let log = new Log();
export default log