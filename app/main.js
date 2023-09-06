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
const Touchbar = require('./touchbar');
const Tray = electron.Tray;

const _ = require('lodash');
const is = require('electron-is');
require('electron-dl')();
const log = require('electron-log');

const pkg = require('../package.json');

if (is.dev() || pkg.irccloud.local_build) {
  log.transports.file.level = 'debug';
} else {
  log.transports.file.level = 'info';
}

var mainWindow = null;
var menu = null;
var touchbar = null;
var appIcon = null;

const defaultHost = 'https://www.irccloud.com';

// TODO figure out how to dedupe this from electron-builder.json
// We could set this in package.json and then access it at runtime with:
// require(path.resolve(app.getAppPath(), 'package.json'));
// but it needs to be a top level build config item, either in
// package.json -> build or electron-builder.json
// We use electron-builder.json to keep things tidy, but it doesn't
// get packaged in the dist asar so we can't include it.
// Annoying
app.setAppUserModelId("com.irccloud.desktop");

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

function isMainHost () {
  return config.get('host') === defaultHost;
}
function singleInstance () {
  // This always returned true in sanbox builds, preventing startup
  // Fixed but regressed https://github.com/electron/electron/issues/9985
  // This only affects macOS when running multiple copies from the command line
  let shouldQuit = false;
  if (!is.sandbox()) {
    const gotTheLock = app.requestSingleInstanceLock();

    app.on('second-instance', function (commandLine, workingDirectory) {
      log.info('singleInstance', commandLine[1]);
      openMainWindow();
      if (commandLine[1]) {
        openUrl(commandLine[1]);
      }
    });

    if (!gotTheLock) {
      shouldQuit = true;
    }
  }
  if (shouldQuit) {
    log.debug('singleInstance quit');
    app.quit();
    process.exit();
  }
}
singleInstance();

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
    mainWindow.webContents.session.cookies.set(inviteCookie).catch(function (error) {
      if (error) {
        log.error('set invite cookie error', error);
      }
    });
  } else if (url) {
    mainWindow.webContents.session.cookies.remove(url, name).catch(function (error) {
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
        mainWindow.webContents.executeJavaScript(data + '\n0;', true);
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
    var buttonId = dialog.showMessageBoxSync({
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
      'contextIsolation': true,
      // Migration flag. this will be on by default in Electron 12
      // https://github.com/electron/electron/pull/24114
      'worldSafeExecuteJavaScript': true,
      'spellcheck': true,
      'nodeIntegration': false
    },
    'title': app.name
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

  mainWindow.on('page-title-updated', function(event) {
    var title = mainWindow.getTitle();
    if (title && is.macOS()) {
      var matches = title.match(/^(?:\((\d+)\)|([*+]))/);
      var badge = "";
      if (matches) {
        if (matches[1]) {
          badge = matches[1];
        } else {
          var current = app.dock.getBadge();
          if (/^\d+$/.test(current)) badge = current;

          // '+' means active channel has a notification
          if (current === '+') badge = current;

          // '*' means a channel has a notification
          badge = matches[2];
        }
      }
      app.dock.setBadge(badge);
    }
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

  // This is apparently not needed on linux, and results in double actions
  // despite the documentation
  // https://github.com/electron/electron/issues/18322
  // https://github.com/irccloud/irccloud-desktop/issues/86
  // macOS doesn't use app-command
  if (is.windows()) {
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
  }

  ContextMenu(mainWindow);

  mainWindow.webContents.on('preload-error', function (event, preloadPath, error) {
    log.error('preload-error', preloadPath, error);
  });

  mainWindow.webContents.on('dom-ready', function (event) {
    log.debug('dom-ready');
    app.toggleSpellcheck();
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
electron.autoUpdater.on('before-quit-for-update', function () {
  log.debug('before-quit-for-update');
  quitting = true;
});
if (!is.macOS()) {
  app.on('window-all-closed', function() {
    log.debug('window-all-closed');
    app.quit();
  });
}

function openUrl (url) {
  if (mainWindow) {
    mainWindow.webContents.send('set-irc-url', url);
  } else {
    ircUrlOnOpen = url;
  }
}

// Handles urls from app.setAsDefaultProtocolClient for mac only
app.on('open-url', function (event, url) {
  log.info('open-url', url);
  openUrl(url);
});

ipcMain.on('preload-channel-async', function (event, key) {
  switch (key) {
  case 'activate':
    openMainWindow();
    break;
  }
});
ipcMain.on('preload-channel-sync', function (event, key, arg1) {
  switch (key) {
  case 'version':
    event.returnValue = app.getVersion();
    break;
  case 'config':
    event.returnValue = config.get(arg1);
    break;
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
  appIcon.setToolTip(app.name);
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
    mainWindow.webContents.send('update-zoom-level', zoomLevel);
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

function checkInApplications () {
  if (is.dev()) {
    return;
  }
  if (!is.macOS()) {
    return;
  }
  if (app.isInApplicationsFolder()) {
    return;
  }
  if (config.get('neverPromptMoveToApplicationsFolder')) {
    return;
  }

  var ret = dialog.showMessageBoxSync({
    type: 'info',
    message: 'Would you like to move ' + app.name + ' to your Applications folder?',
    buttons: ['&OK', '&Not Now', '&Don’t Ask Again'],
    cancelId: 1,
    defaultId: 0,
    normalizeAccessKeys: true
  });
  switch (ret) {
  case 0:
    app.moveToApplicationsFolder();
    return true;
  case 2:
    config.set('neverPromptMoveToApplicationsFolder', true);
    return false;
  }
}

// Handle irc URLs
var ircUrlOnOpen;
function handleProtocolUrls () {
  // https://github.com/electron/electron/blob/master/docs/api/app.md#appsetasdefaultprotocolclientprotocol-path-args
  if (is.sandbox()) {
    return;
  }
  if (is.linux() && process.env.SNAP) {
    return;
  }
  if (config.get('neverPromptIrcUrls')) {
    return;
  }
  var handlesIrc = app.isDefaultProtocolClient('irc');
  var handlesIrcs = app.isDefaultProtocolClient('ircs');
  log.debug('isDefaultProtocolClient: irc', handlesIrc);
  log.debug('isDefaultProtocolClient: ircs', handlesIrcs);
  if (handlesIrc && handlesIrcs) {
    return;
  }
  
  dialog.showMessageBox({
    type: 'info',
    message: 'Would you like to set ' + app.name + ' as your default IRC client?',
    buttons: ['&Set Default', '&Not Now', '&Don’t Ask Again'],
    cancelId: 1,
    defaultId: 0,
    normalizeAccessKeys: true
  }).then(function (ret) {
    switch (ret.response) {
    case 0:
      var setIrc = app.setAsDefaultProtocolClient('irc');
      var setIrcs = app.setAsDefaultProtocolClient('ircs');
      log.debug('setAsDefaultProtocolClient: irc', setIrc);
      log.debug('setAsDefaultProtocolClient: ircs', setIrcs);
      break;
    case 2:
      config.set('neverPromptIrcUrls', true);
      break;
    }
  });
}

app.on('ready', function() {
  let arg = process.argv[1];
  log.info('ready', process.argv.slice(1));
  if (arg && arg != '.') {
    openUrl(arg);
  }
  const crash_reporter = require('./crash_reporter.js');
  crash_reporter.setup();

  if (checkInApplications()) {
    return;
  }

  handleProtocolUrls();
  
  menu = Menu.setup();

  const auto_updater = require('./auto_update.js');
  auto_updater.setup(menu);

  updateZoomMenu();

  openMainWindow();

  touchbar = Touchbar.setup(mainWindow);

  if (config.get('tray') && !is.macOS()) {
    setupTray();
  }

  if (config.get('menu-bar') === false && !is.macOS()) {
    hideMenuBar(mainWindow);
  }
});
