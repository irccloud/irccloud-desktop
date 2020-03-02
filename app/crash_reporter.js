const electron = require('electron');
const app = electron.app;
const dialog = electron.dialog;
const ipcMain = electron.ipcMain;

const os = require('os');
const osName = require('os-name');
const log = require('electron-log');
const is = require('electron-is');

const pkg = require('../package.json');

let user = null;
let Raven = null;

// https://github.com/getsentry/raven-js/pull/637
const PATH_MATCH_RE = /[^/]+\/[^/]+\/[^/]+$/;
function normalizePath(path) {
  if (!path) {
    return path;
  }
  let match = path.replace(/\\/g, '/').match(PATH_MATCH_RE);
  return match ? match[0] : path;
}
function normalizeStacktrace(data) {
  if (
    data.exception &&
    data.exception[0] &&
    data.exception[0].stacktrace &&
    data.exception[0].stacktrace.frames
  ) {
    data.exception[0].stacktrace.frames.forEach((frame) => {
      frame.filename = normalizePath(frame.filename);
    });
  }
}

const os_totalmem_gb = Math.round(os.totalmem() / 1024 / 1024 / 1024);
function raven_config() {
  let config_promise = new Promise((resolve, reject) => {
    let config = {
      release: app.getVersion(),
      environment: is.dev() ? 'development' : 'production',
      name: osName(),
      tags: {
        os_arch: os.arch(),
        os_platform: os.platform(),
        os_release: os.release(),
        os_version: process.getSystemVersion(),
        os_type: os.type(),
        os_totalmem: os_totalmem_gb + 'GB',
        hostname: app.config.get('host'),
        user_style: app.config.get('acceptUserStyles'),
        user_script: app.config.get('acceptUserScripts'),
        tray: app.config.get('tray'),
        menu_bar: app.config.get('menu-bar')
      },
      dataCallback: (data) => {
        if (user) {
          data.user = {
            id: user.id,
            name: user.name,
            email: user.email
          };
        }
        let os_freemem = os.freemem() / 1024 / 1024;
        if (os_freemem < 1024) {
          os_freemem = '<1GB';
        } else {
          os_freemem = Math.round(os_freemem / 1024) + 'GB';
        }
        data.tags.os_freemem = os_freemem;

        normalizeStacktrace(data);

        return data;
      }
    };
    if (is.linux()) {
      const getLinuxOs = require('getos');
      getLinuxOs((error, linuxOs) => {
        if (error) {
          log.warn('failed to get linux os');
        } else {
          config.tags.linux_dist = linuxOs.dist;
          config.tags.linux_codename = linuxOs.codename;
          config.tags.linux_release = linuxOs.release;
        }
        resolve(config);
      });
    } else {
      resolve(config);
    }
  });
  return config_promise;
}

function uncaughtException (error) {
  let message = 'Uncaught Exception: ';
  let stack = error.stack || error.name + ': ' + error.message;
  message += stack;
  
  // Log to sentry
  if (Raven) {
    let raven_event_id = Raven.captureException(error);
    if (raven_event_id) {
      message += ' [raven: ' + raven_event_id + ']';
    }
  }

  // Log to file
  log.error(message);

  // Show generic error in GUI.
  dialog.showErrorBox('An unexpected error occured', 'The error has been logged');
}

function setupRaven() {
  if (is.dev() || pkg.irccloud.local_build) {
    return;
  }
  if (!pkg.irccloud.sentry_dsn) {
    return;
  }
  const _Raven = require('raven');
  _Raven.on('error', (e) => {
    log.error('Raven error', e);
  });
  raven_config().then((config) => {
    _Raven.config(pkg.irccloud.sentry_dsn, config);
    Raven = _Raven;
  });
  ipcMain.on('set-user', (event, sessionUser) => {
    user = sessionUser;
  });
}

module.exports = {
  setup: () => {
    setupRaven();
    
    process.on('uncaughtException', uncaughtException);
  }
};
