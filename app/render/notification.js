var remote = require('electron').remote;

function setupNotificationHandler() {
  document.addEventListener("DOMContentLoaded", function (event) {
    if (window.SESSION) {
      window.SESSION.on('notificationClick', function () {
        remote.app.emit('activate');
      });
    }
  });
}

module.exports = setupNotificationHandler;
