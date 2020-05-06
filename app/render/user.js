var ipcRenderer = require('electron').ipcRenderer;
var remote = require('electron').remote;

function setupUserListener() {
  document.addEventListener("DOMContentLoaded", function (event) {
    remote.getCurrentWindow().webContents.executeJavaScript(
      'new Promise((resolve, reject) => { if (SESSION) { if (SESSION.id) { resolve({ id: SESSION.id, name: SESSION.get("name"), email: SESSION.get("email") }); } else { SESSION.once("init", function () { resolve({ id: SESSION.id, name: SESSION.get("name"), email: SESSION.get("email") }); }); } SESSION.once("noAuth", function () { resolve(null); }); } else { resolve(null); } });'
    ).then((result) => {
      ipcRenderer.send('set-user', result);
    });
  });
}

module.exports = setupUserListener;
