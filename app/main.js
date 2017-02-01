process.env.ELECTRON_HIDE_INTERNAL_MODULES = 'true';

const electron = require('electron');

const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
const Shell = electron.shell;
const dialog = electron.dialog;

const path = require('path');
const FS = require('fs');

const ConfigStore = require('configstore');
const Config = require('electron-config');
const ContextMenu = require('./context_menu');
const Menu = require('./menu');
const Tray = electron.Tray;
const SquirrelWindows = require('./squirrel_windows');
const auto_updater = require('./auto_update.js');

const _ = require('lodash');
const is = require('electron-is');
const mime = require('mime-types');
const unusedFilename = require('unused-filename');
require('electron-dl')();
const log = require('electron-log');
log.transports.file.level = 'silly';

if (SquirrelWindows.handleStartupEvent()) {
  process.exit();
}

var mainWindow = null;
var menu = null;
var appIcon = null;

const defaultHost = 'https://www.irccloud.com';

function setupConfig () {
  let defaults = {
    'host': defaultHost,
    'width': 1024,
    'height': 768,
    'zoom': 0,
    'spellcheck': true,
    'neverPromptIrcUrls': false
  };

  // Migrate from old config, remove this in time
  let oldConfig = new ConfigStore(app.getName());
  try {
    Object.keys(defaults).concat('x', 'y').forEach(key => {
      if (oldConfig.has(key)) {
        defaults[key] = oldConfig.get(key);
      }
    });
    FS.unlinkSync(oldConfig.path);
  } catch (exc) {
    // noop
  }

  return new Config({
    defaults: defaults
  });
}
const config = setupConfig();

const minZoom = -8;
const maxZoom = 9;

app.config = config;
global.config = config;


function isMainHost () {
  return config.get('host') === defaultHost;
}
// https://github.com/electron/electron/issues/6771
// This always returns true in MAS builds, preventing startup
if (!is.sandbox()) {
  var shouldQuit = app.makeSingleInstance(function(commandLine, workingDirectory) {
    openMainWindow();
    return true;
  });
  if (shouldQuit) {
    app.quit();
    process.exit();
  }
}

function enableStreamlinedLogin () {
  // Enable the streamlined login page
  var url = config.get('host');
  var name = "invite";
  if (isMainHost()) {
    var inviteCookie = {
      url : url,
      name : name,
      value : "1"
    };
    mainWindow.webContents.session.cookies.set(inviteCookie, function (error) {
      if (error) {
        log.error('set invite cookie error', error);
      }
    });
  } else {
    mainWindow.webContents.session.cookies.remove(url, name, function (error) {
      if (error) {
        log.error('remove invite cookie error', error);
      }
    });
  }
}

function openMainWindow(opts) {
  opts = opts || {};
  var reload;
  // Someone tried to run a second instance, we should focus our window
  if (mainWindow) {
    if (mainWindow.isMinimized()) {
      mainWindow.restore();
    }
    mainWindow.show();
    mainWindow.focus();
    if (opts.reload) {
      mainWindow.webContents.reloadIgnoringCache();
    }
    return;
  }

  var windowOpts = {
    'icon': path.join(__dirname, is.windows() ? 'icon.ico' : 'icon.png'),
    'width': config.get('width'),
    'height': config.get('height'),
    'webPreferences': {
      'allowDisplayingInsecureContent': true,
      'preload': path.join(__dirname, 'render', 'preload.js'),
      'nodeIntegration': false
    },
    'title': app.getName()
  };
  if (config.has('x') && config.has('y')) {
    windowOpts.x = config.get('x');
    windowOpts.y = config.get('y');
  }
  mainWindow = new BrowserWindow(windowOpts);
  if (config.get('maximize') === true) {
    mainWindow.maximize();
  }
  
  var initialUrl = config.get('host') + '/';
  if (ircUrlOnOpen) {
    initialUrl += '#?/irc_url=' + ircUrlOnOpen;
    ircUrlOnOpen = null;
  }
  
  enableStreamlinedLogin();
  mainWindow.loadURL(initialUrl);

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

  mainWindow.on('page-title-updated', function(event) {
    var title = mainWindow.getTitle();
    if (title && is.macOS()) {
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

  ContextMenu(mainWindow);

  mainWindow.webContents.on('dom-ready', function(event) {
    var userStylePath = path.join(app.getPath('userData'), 'user-style.css');
    FS.readFile(userStylePath, 'utf8', function (err, data) {
      if (!err) {
        mainWindow.webContents.insertCSS(data);
      }
    });
  });

  mainWindow.webContents.on('will-navigate', function (e, url) {
    // Make sure the invite cookie persists over logout
    enableStreamlinedLogin();
  });
  mainWindow.webContents.session.on('will-download', function (e, item, webContents) {
    if (manualDownload && manualDownload.saveAs) {
      item.setSavePath('');
    }
    item.on('done', function (e, state) {
      manualDownload = null;
    });
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
  mainWindow.on('close', function (ev) {
    var size = mainWindow.getSize();
    var position = mainWindow.getPosition();
    var props = {
      'width': size[0],
      'height': size[1],
      'x': position[0],
      'y': position[1]
    };
    if (mainWindow.isMaximized()) {
      props.maximized = true;
    }
    config.set(props);
    if (!quitting && (is.macOS() || config.get('tray'))) {
      ev.preventDefault();
      mainWindow.hide();
    }
  });
}

var quitting = false;
app.on('activate', openMainWindow);
app.on('before-quit', function () {
  quitting = true;
});
if (!is.macOS()) {
  app.on('window-all-closed', function() {
    app.quit();
  });
}

// Handles urls from app.isDefaultProtocolClient
app.on('open-url', function (event, url) {
  if (mainWindow) {
    mainWindow.webContents.send('set-irc-url', url);
  } else {
    ircUrlOnOpen = url;
  }
});

function destroyTray() {
  if (appIcon) {
    appIcon.destroy();
  }
}

function setupTray() {
  appIcon = new Tray(path.join(__dirname, is.windows() ? 'icon.ico' : 'icon.png'));
  appIcon.setToolTip(app.getName());
  appIcon.on('click', function() {
    openMainWindow();
  });
  var tray_menu = Menu.setup_tray(app);
  appIcon.setContextMenu(tray_menu);
}

var manualDownload;
app.doDownload = function (win, url, opts) {
  manualDownload = opts;
  win.webContents.downloadURL(url);
};

app.toggleTray = function() {
  if (config.get('tray')) {
    return setupTray();
  } else {
    return destroyTray();
  }
};
app.toggleSpellcheck = function() {
  if (config.get('spellcheck')) {
    mainWindow.webContents.send('enable-spellcheck');
  } else {
    mainWindow.webContents.send('disable-spellcheck');
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

// Handle irc URLs
var ircUrlOnOpen;
function handleProtocolUrls () {
  // https://github.com/electron/electron/blob/master/docs/api/app.md#appsetasdefaultprotocolclientprotocol-macos-windows
  var supported = (is.macOS() || is.windows()) && !is.sandbox();
  if (!supported) {
    return;
  }
  var isHandler = (
    app.isDefaultProtocolClient('irc') &&
    app.isDefaultProtocolClient('ircs')
    );
  
  if (!isHandler && !config.get('neverPromptIrcUrls')) {
    dialog.showMessageBox({
      type: 'info',
      message: 'Would you like to set ' + app.getName() + ' as your default IRC client?',
      buttons: ['Set Default', 'Not Now', 'Don’t Ask Again'],
      cancelId: 1,
      defaultId: 0
    }, function (ret) {
      switch (ret) {
      case 0:
        app.setAsDefaultProtocolClient('irc');
        app.setAsDefaultProtocolClient('ircs');
        handleProtocolUrls();
        break;
      case 2:
        config.set('neverPromptIrcUrls', true);
        break;
      }
    });
  }
}

app.on('ready', function() {
  handleProtocolUrls();
  
  menu = Menu.setup();
  auto_updater.setup(menu);
  updateZoomMenu();
  openMainWindow();
  if (config.get('tray') && !is.macOS()) {
    setupTray();
  }
  if (config.get('menu-bar') === false && !is.macOS()) {
    hideMenuBar(mainWindow);
  }
});
