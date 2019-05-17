var ipcRenderer = require('electron').ipcRenderer;
var remote = require('electron').remote;

function setupUserListener() {
  document.addEventListener("DOMContentLoaded", function (event) {
    remote.getCurrentWindow().webContents.executeJavaScript(
      'new Promise((resolve, reject) => { if (SESSION) { SESSION.once("init", function () { resolve({ id: this.id, name: this.get("name"), email: this.get("email") }); }); SESSION.once("noAuth", function () { resolve(null); }); } else { resolve(null); } });'
    ).then((result) => {
      ipcRenderer.send('set-user', result);
    });
  });
}

module.exports = setupUserListener;
