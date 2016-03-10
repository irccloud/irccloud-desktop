var app = require('app');
var path = require('path');
var BrowserWindow = require('browser-window');
var Shell = require('shell');
var ConfigStore = require('configstore');
var Menu = require('./menu');

var handleStartupEvent = function() {
  // Handle Squirrel startup events, called by the Windows installer.
  // https://github.com/electronjs/windows-installer#handling-squirrel-events
  if (process.platform !== 'win32') {
    return false;
  }

  switch (process.argv[1]) {
    case '--squirrel-install':
    case '--squirrel-updated':
    case '--squirrel-uninstall':
    case '--squirrel-obsolete':
      app.quit();
      return true;
  }
};

if (handleStartupEvent()) {
  return;
}

var mainWindow = null;

const host = 'https://www.irccloud.com';
const config = new ConfigStore(app.getName(), {
  'width': 1024,
  'height': 768
});
var menu = null;

function openMainWindow() {
  mainWindow = new BrowserWindow({
    'width': config.get('width'),
    'height': config.get('height'),
    'webPreferences': {
      'allowDisplayingInsecureContent': true,
      'preload': path.join(__dirname, 'preload.js'),
      'nodeIntegration': false
    },
    'title': app.getName()
  });
  mainWindow.loadURL(host);

  mainWindow.on('closed', function() {
    mainWindow = null;
  });

  mainWindow.on('resize', function() {
    size = mainWindow.getSize();
    config.set({
      'width': size[0],
      'height': size[1]
    });
  });

  mainWindow.on('page-title-updated', function(event) {
      var title = mainWindow.getTitle();
      if (title && process.platform == 'darwin') {
          var unread = "";
          var matches = title.match(/^\((\d+)\)/);
          if (matches) {
            unread = matches[1];
          }
          app.dock.setBadge(unread);
      }
  });
  
  mainWindow.on('app-command', function (e, cmd) {
    if (cmd === 'browser-backward' && mainWindow.webContents.canGoBack()) {
      someWindow.webContents.goBack();
    }
  });
  
  mainWindow.webContents.on('did-navigate-in-page', function (e, url) {
    var historyMenu = menu.items.find(function (item) {
      return item.id == 'history';
    });
    historyMenu.submenu.items.forEach(function (historyItem) {
      switch (historyItem.id) {
      case 'backMenu':
        historyItem.enabled = mainWindow.webContents.canGoBack();
        break;
      case 'fwdMenu':
        historyItem.enabled = mainWindow.webContents.canGoForward();
        break;
      default:
        break;
      }
    });
  });

  mainWindow.webContents.on('new-window', function(event, url, frameName, disposition) {
      event.preventDefault();
      Shell.openExternal(url);
  });
}

app.on('activate-with-no-open-windows', openMainWindow);
app.on('window-all-closed', function() {
  if (process.platform != 'darwin') {
    app.quit();
  }
});

app.on('ready', function() {
  menu = Menu.setup(app, host);
  openMainWindow();
});
