const electron = require('electron');

const app = electron.app;
const Shell = electron.shell;
const Menu = electron.Menu;
const MenuItem = electron.MenuItem;
const ipcMain = electron.ipcMain;

const isMac = process.platform === 'darwin';
const isLinux = process.platform === 'linux';

var spellingSuggestions = [];
ipcMain.on('set-spelling-suggestions', (event, suggestions) => {
  spellingSuggestions = suggestions;
});

// Some of this is lifted from https://github.com/sindresorhus/electron-context-menu
// But modified beyond the limits of its prepend/append abilities
module.exports = (win) => {
  win.webContents.on('context-menu', (e, props) => {
    const editFlags = props.editFlags;
    const hasText = props.selectionText.trim().length > 0;
    const can = type => editFlags[`can${type}`] && hasText;
    const cmdOrCtrl = e => {
      if (isMac) {
        return e.metaKey;
      } else {
        return e.ctrlKey;
      }
    };

    let template = [];
    spellingSuggestions.forEach(suggestion => {
      template.push({
        label: suggestion,
        click (item, focusedWindow, e) {
          win.webContents.replaceMisspelling(suggestion);
        }
      });
    });

    if (props.linkURL) {
      template.push({
        label: 'Open Link in Browser',
        click (item, focusedWindow, e) {
          Shell.openExternal(props.linkURL, {
            activate: !cmdOrCtrl(e)
          });
        }
      });
    } else {
      if (!props.selectionText) {
        template.push({
          label: 'Back',
          enabled: win.webContents.canGoBack(),
          click (item, focusedWindow, e) {
            win.webContents.goBack();
          }
        }, {
          label: 'Forward',
          enabled: win.webContents.canGoForward(),
          click (item, focusedWindow, e) {
            win.webContents.goForward();
          }
        }, {
          label: 'Reload',
          click(item, focusedWindow, e) {
            win.webContents.reloadIgnoringCache();
          }
        });
      }
    }

    template.push({
      type: 'separator'
    }, {
      label: 'Cut',
      // needed because of macOS limitation:
      // https://github.com/electron/electron/issues/5860
      role: can('Cut') ? 'cut' : '',
      enabled: can('Cut'),
      visible: props.isEditable
    }, {
      label: 'Copy',
      role: can('Copy') ? 'copy' : '',
      enabled: can('Copy'),
      visible: props.isEditable || hasText
    }, {
      label: 'Paste',
      role: editFlags.canPaste ? 'paste' : '',
      enabled: editFlags.canPaste,
      visible: props.isEditable
    }, {
      type: 'separator'
    });

    if (props.linkURL) {
      template.push({
        type: 'separator'
      }, {
        label: 'Save Link As…',
        click (item, focusedWindow, e) {
          app.doDownload(win, props.linkURL, {
            saveAs: !e.altKey
          });

        }
      }, {
        label: 'Copy Link Address',
        click (item, focusedWindow, e) {
          if (isLinux || !props.linkText) {
            electron.clipboard.writeText(props.linkURL);
          } else {
            electron.clipboard.writeBookmark(props.linkText, props.linkURL);
          }
        }
      }, {
        type: 'separator'
      });
    }

    if (props.mediaType === 'image') {
      template.push({
        type: 'separator'
      }, {
        label: 'Open Image in Browser',
        click (item, focusedWindow, e) {
          Shell.openExternal(props.srcURL, {
            activate: !cmdOrCtrl(e)
          });
        }
      }, {
        label: 'Save Image As…',
        click (item, focusedWindow, e) {
          app.doDownload(win, props.srcURL, {
            saveAs: !e.altKey
          });
        }
      }, {
        label: 'Copy Image',
        click (item, focusedWindow, e) {
          win.webContents.copyImageAt(props.x, props.y);
        }
      }, {
        label: 'Copy Image Address',
        click (item, focusedWindow, e) {
          electron.clipboard.writeText(props.srcURL);
        }
      }, {
        type: 'separator'
      });
    }

    template.push({
      type: 'separator'
    }, {
      label: 'Inspect Element',
      click (item, focusedWindow, e) {
        win.webContents.inspectElement(props.x, props.y);
        if (win.webContents.isDevToolsOpened()) {
          win.webContents.devToolsWebContents.focus();
        }
      }
    }, {
      type: 'separator'
    });

    if (hasText && isMac) {
      template.push({
        role: 'services',
        submenu: []
      }, {
        type: 'separator'
      });
    }

    // filter out leading/trailing separators
    // TODO: https://github.com/electron/electron/issues/5869
    template = template.filter((el, i, arr) => {
      return !(el.type === 'separator' && (i === 0 || i === arr.length - 1));
    });

    const menu = Menu.buildFromTemplate(template);
    setTimeout(() => {
      menu.popup(win);
    }, 20);
  });
};
