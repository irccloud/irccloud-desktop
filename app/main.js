var app = require('app');
var path = require('path');
var BrowserWindow = require('browser-window');
var Shell = require('shell');
var ConfigStore = require('configstore');
var Menu = require('./menu');
var SquirrelWindows = require('./squirrel_windows');
var Tray = require('tray');

if (SquirrelWindows.handleStartupEvent()) {
  return;
}

var mainWindow = null;
var menu = null;
var appIcon = null;

const host = 'https://www.irccloud.com';
const config = new ConfigStore(app.getName(), {
  'width': 1024,
  'height': 768
});

app.userInitiatedQuit = false;
app.config = config;

var shouldQuit = app.makeSingleInstance(function(commandLine, workingDirectory) {
  // Someone tried to run a second instance, we should focus our window
  if (mainWindow) {
    if (mainWindow.isMinimized()) {
        mainWindow.restore();
    }
    mainWindow.show();
    mainWindow.focus();
  }
  return true;
});

if (shouldQuit) {
  app.quit();
  return;
}

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
  
  mainWindow.on('swipe-right', function (e) {
    if (mainWindow.webContents.canGoForward()) {
      mainWindow.webContents.goForward();
    }
  });
  
  mainWindow.on('swipe-left', function (e) {
    if (mainWindow.webContents.canGoBack()) {
      mainWindow.webContents.goBack();
    }
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
    switch (cmd) {
    case 'browser-backward':
      if (mainWindow.webContents.canGoBack()) {
        mainWindow.webContents.goBack();
      }
      break;
    case 'browser-forward':
      if (mainWindow.webContents.canGoForward()) {
        mainWindow.webContents.goForward();
      }
      break;
    case 'browser-refresh':
      mainWindow.webContents.reloadIgnoringCache();
      break;
    default:
      break;
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
  mainWindow.on('close', function(ev) {
    if (!app.userInitiatedQuit && config.get('tray')) {
        ev.preventDefault();
        mainWindow.hide();
    }
  });

}

app.on('activate-with-no-open-windows', openMainWindow);
app.on('window-all-closed', function() {
  if (process.platform != 'darwin') {
    app.quit();
  }
});

function destroyTray() {
    if (appIcon) {
        appIcon.destroy();
    }
}

function setupTray() {
  appIcon = new Tray(path.join(__dirname, '/icon.png'));
  appIcon.setToolTip('IRCCloud');
  appIcon.on('click', function() {
      mainWindow.show();
  });
  var tray_menu = Menu.setup_tray(app);
  appIcon.setContextMenu(tray_menu);
}

app.toggleTray = function() {
    if (config.get('tray')) {
        return setupTray();
    } else {
        return destroyTray();
    }
};

app.on('ready', function() {
  menu = Menu.setup(app, host);
  openMainWindow();
  if (config.get('tray') && process.platform != 'darwin') {
      setupTray();
  }
});
