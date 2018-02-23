process.env.ELECTRON_HIDE_INTERNAL_MODULES = 'true';

const electron = require('electron');

const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
const Shell = electron.shell;
const dialog = electron.dialog;
const ipcMain = electron.ipcMain;

const path = require('path');
const FS = require('fs');

const Config = require('electron-store');
const ContextMenu = require('./context_menu');
const Menu = require('./menu');
const Tray = electron.Tray;

const _ = require('lodash');
const is = require('electron-is');
const unusedFilename = require('unused-filename');
require('electron-dl')();
const log = require('electron-log');
log.transports.file.level = 'info';

var mainWindow = null;
var menu = null;
var appIcon = null;
var currentBuffer = null;

const defaultHost = 'https://www.irccloud.com';

// TODO pull this from the outermost package.json
app.setAppUserModelId('com.irccloud.desktop');

function setupConfig () {
  log.debug('setupConfig');
  let defaults = {
    'host': defaultHost,
    'width': 1024,
    'height': 768,
    'zoom': 0,
    'spellcheck': true,
    'neverPromptIrcUrls': false,
    'userStylePath': path.join(app.getPath('userData'), 'user-style.css'),
    'userScriptPath': path.join(app.getPath('userData'), 'user-script.js')
  };

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
// This always returned true in sanbox builds, preventing startup
// Fixed but regressed https://github.com/electron/electron/issues/9985
// This only affects macOS when running multiple copies from the command line
var shouldQuit = false;
if (!is.sandbox()) {
  shouldQuit = app.makeSingleInstance(function(commandLine, workingDirectory) {
    openMainWindow();
  });
}
if (shouldQuit) {
  log.debug('makeSingleInstance quit');
  app.quit();
  process.exit();
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
  } else if (url) {
    mainWindow.webContents.session.cookies.remove(url, name, function (error) {
      if (error) {
        log.error('remove invite cookie error', error);
      }
    });
  }
}

function checkUserMods (type, reload) {
  var opts = {};
  switch (type) {
  case 'script':
    opts = {
      message: 'A custom user script was detected. Would you like to trust and run user scripts from,now on?',
      okText: 'Trust and &Run',
      acceptConfKey: 'acceptUserScripts',
      pathConfKey: 'userScriptPath',
      menuId: 'show_user_script',
      callback: function (data) {
        log.debug('injecting js');
        mainWindow.webContents.executeJavaScript(data);
      }
    };
    break;
  case 'style':
    opts = {
      message: 'A custom user style was detected. Would you like to load user styles from now on?',
      okText: '&Load Styles',
      acceptConfKey: 'acceptUserStyles',
      pathConfKey: 'userStylePath',
      menuId: 'show_user_style',
      callback: function (data) {
        log.debug('injecting css');
        mainWindow.webContents.insertCSS(data);
      }
    };
    break;
  default:
    return;
  }

  let path = config.get(opts.pathConfKey);
  if (path && _.isString(path)) {
    FS.readFile(path, 'utf8', function (err, data) {
      if (!err) {
        if (!config.get(opts.acceptConfKey)) {
          confirmUserMods(data);
        }
        if (config.get(opts.acceptConfKey)) {
          opts.callback(data);
        }
      }
    });
  }

  function confirmUserMods (data) {
    var revealText = '&Open File Location';
    if (is.macOS()) {
      revealText = 'Reveal In Finder';
    }
    if (reload) {
      revealText = 'Reload';
    }

    var extract = data.substr(0, 500);
    if (extract.length < data.length) {
      extract += '\n...';
    }
    var buttonId = dialog.showMessageBox({
      browserWindow: mainWindow,
      type: 'info',
      message: opts.message,
      detail: extract,
      buttons: [opts.okText, '&No', revealText],
      cancelId: 1,
      defaultId: 0,
      normalizeAccessKeys: true
    });
    switch (buttonId) {
    case 0:
      config.set(opts.acceptConfKey, true);
      var appMenu = menu.items.find(function (item) {
        return item.id == 'app';
      });
      appMenu.submenu.items.forEach(function (appItem) {
        if (appItem.id == opts.menuId) {
          appItem.visible = true;
        }
      });
      break;
    case 2:
      if (!reload) {
        Shell.showItemInFolder(config.get(opts.pathConfKey));
      }
      checkUserMods(type, true);
      break;
    }
  }
}

function openMainWindow(opts) {
  log.debug('openMainWindow');
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
  if (config.get('maximized') === true) {
    mainWindow.maximize();
  }
  if (config.get('fullscreen') === true) {
    mainWindow.setFullScreen(true);
  }
  
  var initialUrl = config.get('host') + '/';
  if (ircUrlOnOpen) {
    initialUrl += '#?/irc_url=' + ircUrlOnOpen;
    ircUrlOnOpen = null;
  }
  
  enableStreamlinedLogin();
  mainWindow.loadURL(initialUrl);

  mainWindow.on('closed', function() {
    log.debug('closed');
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
    log.debug('dom-ready');
    checkUserMods('style');
    checkUserMods('script');
  });

  mainWindow.webContents.on('will-navigate', function (e, url) {
    // Make sure the invite cookie persists over logout
    log.debug('will-navigate');
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
    log.debug('new-window', frameName, url);
    if (!/popup:/.test(frameName)) {
      event.preventDefault();
      var activate = disposition != 'background-tab';
      Shell.openExternal(url, {
        activate: activate
      });
    }
  });
  mainWindow.on('close', function (ev) {
    log.debug('close', 'quitting?', quitting);
    var size = mainWindow.getSize();
    var position = mainWindow.getPosition();
    var props = {
      'width': size[0],
      'height': size[1],
      'x': position[0],
      'y': position[1]
    };
    props.maximized = mainWindow.isMaximized();
    props.fullscreen = mainWindow.isFullScreen();
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
  log.debug('before-quit');
  quitting = true;
});
if (!is.macOS()) {
  app.on('window-all-closed', function() {
    log.debug('window-all-closed');
    app.quit();
  });
}

// Handles urls from app.isDefaultProtocolClient
app.on('open-url', function (event, url) {
  log.debug('open-url');
  if (mainWindow) {
    mainWindow.webContents.send('set-irc-url', url);
  } else {
    ircUrlOnOpen = url;
  }
});

function destroyTray() {
  if (appIcon) {
    log.debug('destroyTray');
    appIcon.destroy();
  }
}

function setupTray() {
  log.debug('setupTray');
  // Windows uses ico
  // Linux uses png
  // KDE needs a small icon cos it can't scale
  // Ubuntu uses @2x etc variants (i think?)
  appIcon = new Tray(path.join(__dirname, is.windows() ? 'icon.ico' : 'tray-icon.png'));
  // This doesn't work on KDE (it uses the app.name instead of productName)
  // Also can't seem to get it to show on Ubuntu
  appIcon.setToolTip(app.getName());
  // Doesn't work on linux
  appIcon.on('click', function() {
    log.debug('tray click');
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
  var newZoom = Math.min(maxZoom, config.get('zoom') + 0.5);
  updateZoom(newZoom);
};
app.zoomOut = function () {
  var newZoom = Math.max(minZoom, config.get('zoom') - 0.5);
  updateZoom(newZoom);
};
app.resetZoom = function () {
  updateZoom(0);
};

function hideMenuBar(window) {
  log.debug('menu hide');
  window.setAutoHideMenuBar(true);
  window.setMenuBarVisibility(false);
}

function showMenuBar(window) {
  log.debug('menu show');
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
  // TODO: Linux support added in electron 1.8.2
  // Add it to the support list when we upgrade to the next stable release
  // https://github.com/irccloud/irccloud-desktop/issues/105
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
      buttons: ['&Set Default', '&Not Now', '&Don’t Ask Again'],
      cancelId: 1,
      defaultId: 0,
      normalizeAccessKeys: true
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
  log.debug('ready');
  const crash_reporter = require('./crash_reporter.js');
  crash_reporter.setup();

  handleProtocolUrls();
  
  menu = Menu.setup();

  const auto_updater = require('./auto_update.js');
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

ipcMain.on('set-current-buffer', (event, bufferInfo) => {
  currentBuffer = bufferInfo;
});