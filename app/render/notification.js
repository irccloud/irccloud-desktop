var remote = require('electron').remote;

function listenNotification() {
  remote.getCurrentWindow().webContents.executeJavaScript(
    'new Promise((resolve, reject) => { if (SESSION) { SESSION.on("notificationClick", function () { resolve(); }); } });'
  ).then(() => {
    remote.app.emit('activate');
    listenNotification();
  });
}

function setupNotificationHandler() {
  document.addEventListener("DOMContentLoaded", function (event) {
    listenNotification();
  });
}

module.exports = setupNotificationHandler;