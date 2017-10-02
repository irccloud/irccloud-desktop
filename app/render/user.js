var ipcRenderer = require('electron').ipcRenderer;

function setupUserListener() {
  document.addEventListener("DOMContentLoaded", function (event) {
    if (window.SESSION) {
      window.SESSION.on('init', function () {
        ipcRenderer.send('set-user', {
          id: this.id,
          name: this.get('name'),
          email: this.get('email')
        });
      });
      window.SESSION.on('noAuth', function () {
        ipcRenderer.send('set-user', null);
      });
    }
  });
}

module.exports = setupUserListener;
