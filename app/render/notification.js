var remote = require('electron').remote;

function setupNotifiationHandlder() {
  document.addEventListener("DOMContentLoaded", function (event) {
    SESSION.on('notificationClick', function () {
      remote.app.emit('activate');
    });
  });
}

module.exports = setupNotifiationHandlder;
