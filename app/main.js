process.env.ELECTRON_HIDE_INTERNAL_MODULES = 'true';

const electron = require('electron');

const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
const Shell = electron.shell;

const path = require('path');

const ConfigStore = require('configstore');
const Menu = require('./menu');
const Tray = electron.Tray;
const SquirrelWindows = require('./squirrel_windows');
const auto_updater = require('./auto_update.js');

const log = require('electron-log');
log.transports.file.level = 'silly';

if (SquirrelWindows.handleStartupEvent()) {
  return;
}

var mainWindow = null;
var menu = null;
var appIcon = null;

const config = new ConfigStore(app.getName(), {
  'host': 'https://www.irccloud.com',
  'width': 1024,
  'height': 768,
  'zoom': 0
});
const minZoom = -8;
const maxZoom = 9;

app.config = config;
global.config = config;

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
    'icon': path.join(__dirname, process.platform == 'win32' ? 'icon.ico' : 'icon.png'),
    'width': config.get('width'),
    'height': config.get('height'),
    'webPreferences': {
      'allowDisplayingInsecureContent': true,
      'preload': path.join(__dirname, 'preload.js'),
      'nodeIntegration': false
    },
    'title': app.getName()
  });
  // Enable the streamlined login page
  var inviteCookie = { url : config.get('host'), name : "invite", value : "1" };
  mainWindow.webContents.session.cookies.set(inviteCookie, function (error) {
    if (error) {
      log.error('set invite cookie error', error);
    }
  });

  mainWindow.loadURL(config.get('host'));

  mainWindow.on('closed', function() {
    mainWindow = null;
  });
  
  mainWindow.on('swipe', function (e, direction) {
    switch (direction) {
    case 'right':
        if (mainWindow.webContents.canGoForward()) {
          mainWindow.webContents.goForward();
        }
        break;
    case 'left':
        if (mainWindow.webContents.canGoBack()) {
          mainWindow.webContents.goBack();
        }
        break;
    }
  });
  
  mainWindow.on('resize', function() {
    size = mainWindow.getSize();
    config.set({
      'width': size[0],
      'height': size[1]
    });
  });

  if (config.get('maximize') === true) {
    mainWindow.maximize();
  }

  mainWindow.on('maximize', function() {
    config.set('maximize', true);
  });

  mainWindow.on('unmaximize', function() {
    config.set('maximize', false);
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
    var activate = disposition != 'background-tab';
    Shell.openExternal(url, {
      activate: activate
    });
  });
  mainWindow.on('close', function(ev) {
    if (!quitting && config.get('tray')) {
        ev.preventDefault();
        mainWindow.hide();
    }
  });
}

app.on('activate-with-no-open-windows', openMainWindow);
var quitting = false;
app.on('before-quit', function () {
  quitting = true;
});
app.on('window-all-closed', function() {
  app.quit();
});

function destroyTray() {
    if (appIcon) {
        appIcon.destroy();
    }
}

function setupTray() {
  appIcon = new Tray(path.join(__dirname, process.platform == 'win32' ? 'icon.ico' : 'icon.png'));
  appIcon.setToolTip(app.getName());
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

function updateZoomMenu() {
    var zoomLevel = config.get('zoom');
    var viewMenu = menu.items.find(function (item) {
      return item.id == 'view';
    });
    viewMenu.submenu.items.forEach(function (viewItem) {
      switch (viewItem.id) {
      case 'zoomReset':
        viewItem.enabled = zoomLevel !== 0;
        break;
      case 'zoomIn':
        viewItem.enabled = zoomLevel < maxZoom;
        break;
      case 'zoomOut':
        viewItem.enabled = zoomLevel > minZoom;
        break;
      default:
        break;
      }
    });
}

function updateZoom(zoomLevel) {
    config.set('zoom', zoomLevel);
    if (mainWindow) {
        mainWindow.webContents.send('update-zoom-level');
    }
    updateZoomMenu();
}

app.zoomIn = function () {
    var newZoom = Math.min(maxZoom, config.get('zoom') + 1);
    updateZoom(newZoom);
};
app.zoomOut = function () {
    var newZoom = Math.max(minZoom, config.get('zoom') - 1);
    updateZoom(newZoom);
};
app.resetZoom = function () {
    updateZoom(0);
};

function hideMenuBar(window) {
    window.setAutoHideMenuBar(true);
    window.setMenuBarVisibility(false);
}

function showMenuBar(window) {
    window.setAutoHideMenuBar(false);
    window.setMenuBarVisibility(true);
}

app.toggleMenuBar = function (window) {
    if (config.get('menu-bar')) {
        return showMenuBar(window);
    } else {
        return hideMenuBar(window);
    }
};

app.on('ready', function() {
  menu = Menu.setup(config);
  auto_updater.setup(menu);
  updateZoomMenu();
  openMainWindow();
  if (config.get('tray') && process.platform != 'darwin') {
      setupTray();
  }
  if (config.get('menu-bar') === false && process.platform != 'darwin') {
      hideMenuBar(mainWindow);
  }
});
