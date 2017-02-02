const electron = require('electron');

const app = electron.app;
const dialog = electron.dialog;
const log = require('electron-log');

var autoUpdater;
var updateAvailable = false;

module.exports = {
  setup: function (menu) {
    autoUpdater = require("electron-updater").autoUpdater;
    autoUpdater.logger = log;
    
    try {
      autoUpdater.checkForUpdates();
    } catch (exc) {
      // This will error if running with code signing
    }
    
    autoUpdater.on('error', function (error, errorMessage) {
      log.error('autoUpdater error', error);
      setUpdateCheckMenuEnabled(menu, true);
    });
    autoUpdater.on('checking-for-update', function (event) {
      setUpdateCheckMenuEnabled(menu, false);
    });
    autoUpdater.on('update-available', function (event) {
    });
    autoUpdater.on('update-not-available', function (event) {
      setUpdateCheckMenuEnabled(menu, true);
    });
    autoUpdater.on('update-downloaded', function (event, releaseNotes, releaseName, 
      releaseDate, updateURL) {
      setUpdateCheckMenuEnabled(menu, true);
      updateAvailable = {
        version: releaseName,
        notes: releaseNotes
      };
    });
  },
  check: function () {
    if (autoUpdater) {
      // TODO show progress dialog
      autoUpdater.checkForUpdates();
      autoUpdater.once('error', onUpdateError);
      autoUpdater.once('update-downloaded', onUpdateDownloaded);
      autoUpdater.once('update-not-available', onUpdateNotAvailable);
    }
  }
};


function setUpdateCheckMenuEnabled (menu, value) {
  var appMenu = menu.items.find(function (item) {
    return item.id == 'app';
  });
  if (appMenu) {
    appMenu.submenu.items.forEach(function (appItem) {
      if (appItem.id == 'updateCheck') {
        appItem.enabled = value;
      }
    });
  }
}

function showUpdateDialog() {
  if (!updateAvailable) {
    return;
  }
  
  var message = app.getName() + ' ' + updateAvailable.version + ' is now available. It will be installed the next time you restart the application.';
  if (updateAvailable.notes) {
    let splitNotes = updateAvailable.notes.split(/[^\r]\n/);
    message += '\n\nRelease notes:\n';
    splitNotes.forEach(function (notes) {
      message += notes + '\n\n';
    });
  }
  var ret = dialog.showMessageBox({
    type: 'info',
    message: 'A new version of ' + app.getName() + ' has been downloaded',
    detail: message,
    buttons: ['OK', 'Install and Relaunch'],
    cancelId: 0,
    defaultId: 1
  });
  if (ret === 1) {
    autoUpdater.quitAndInstall();
  }
}

function onUpdateDownloaded (event, releaseNotes, releaseName, releaseDate, updateURL) {
  updateAvailable = {
    version: releaseName,
    notes: releaseNotes
  };
  showUpdateDialog();
  autoUpdater.removeListener('error', onUpdateError);
  autoUpdater.removeListener('update-not-available', onUpdateNotAvailable);
}
function onUpdateNotAvailable (event) {
  if (updateAvailable) {
    showUpdateDialog();
  } else {
    dialog.showMessageBox({
      type: 'info',
      message: 'You’re up to date!',
      detail: app.getName() + ' ' + app.getVersion() + ' is currently the newest version available.',
      buttons: ['OK'],
      defaultId: 0
    });
  }
  autoUpdater.removeListener('error', onUpdateError);
  autoUpdater.removeListener('update-downloaded', onUpdateDownloaded);
}
function onUpdateError (error, errorMessage) {
  dialog.showMessageBox({
    type: 'error',
    message: 'Error checking for updates',
    detail: 'Please try again',
    buttons: ['OK'],
    defaultId: 0
  });
  autoUpdater.removeListener('update-downloaded', onUpdateDownloaded);
  autoUpdater.removeListener('update-not-available', onUpdateNotAvailable);
}
