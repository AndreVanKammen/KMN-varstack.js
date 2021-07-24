// Copyright by André van Kammen
// Licensed under CC BY-NC-SA 
// https://creativecommons.org/licenses/by-nc-sa/4.0/

class Communication {
  constructor() {
    this.connection = new WebSocket('ws://' + globalThis.location.host + '/ws');
    this.connection.onmessage = this.handleMessage.bind(this);
    this.connection.onopen = this.handleOpen.bind(this);
    this.connection.onload = this.handleLoad.bind(this);
    this.connection.onclose = this.handleClose.bind(this);
  }

  handleOpen(event) {
    console.log('handleOpen',this.connection.readyState);
    this.connection.send('CL00');
  }

  handleLoad(event) {
    console.log('handleLoad',this.connection);
  }
 
  handleClose(event) {
    console.log('handleClose',this.connection);
  }

  handleMessage(event) { 
    if (event.type === "message") {
      if (event.data instanceof Blob) {
        var byteData;
        var fileReader = new FileReader();
        fileReader.onload = (event) => {
          byteData = new Uint8Array(event.target.result);
          console.log('WS: ', byteData);
        }
        fileReader.readAsArrayBuffer(event.data);
      } else {
        console.log('WS: ', event.data);
      }
    } else {
      console.log('WS-event: ', event);
    }
  }
}
let communication = new Communication();
export default communication;
