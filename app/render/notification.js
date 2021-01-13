var webFrame = require('electron').webFrame;

function setupNotificationHandler() {
  webFrame.executeJavaScript(`
    document.addEventListener("DOMContentLoaded", function (event) {
      if (SESSION) {
        SESSION.on("notificationClick", () => {
          IRCCLOUD_ELECTRON.notificationClick();
        });
      }
    });
  `);
}

module.exports = setupNotificationHandler;