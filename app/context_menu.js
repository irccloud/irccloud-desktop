const electron = require('electron');

const app = electron.app;
const Shell = electron.shell;
const Menu = electron.Menu;
const MenuItem = electron.MenuItem;
const ipcMain = electron.ipcMain;

const is = require('electron-is');

var spellingSuggestions = {};
ipcMain.on('set-spelling-suggestions', (event, suggestions) => {
  spellingSuggestions = suggestions;
});

// Some of this is lifted from https://github.com/sindresorhus/electron-context-menu
// But modified beyond the limits of its prepend/append abilities
module.exports = (win) => {
  win.webContents.on('context-menu', (e, props) => {
    const editFlags = props.editFlags;
    // selectionText trims whitespace, so this might be wrong for whitespace-only selections
    const hasText = props.selectionText.length > 0;
    const can = (type, checkHasText) => {
      return editFlags[`can${type}`] && (!checkHasText || hasText);
    };
    const cmdOrCtrl = e => {
      if (is.macOS()) {
        return e.metaKey;
      } else {
        return e.ctrlKey;
      }
    };

    let template = [];
    for (var word in spellingSuggestions) {
      if (props.selectionText == word) {
        spellingSuggestions[word].forEach(suggestion => {
          template.push({
            label: suggestion,
            click (item, focusedWindow, e) {
              win.webContents.replaceMisspelling(suggestion);
            }
          });
        });
      }
    }

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
      // need to set an empty role when disabled due to macOS limitation:
      // https://github.com/electron/electron/issues/5860
      role: can('Cut', true) ? 'cut' : '',
      enabled: can('Cut', true),
      visible: props.isEditable
    }, {
      label: 'Copy',
      role: can('Copy', true) ? 'copy' : '',
      enabled: can('Copy', true),
      visible: props.isEditable || hasText
    }, {
      label: 'Paste',
      role: can('Paste') ? 'paste' : '',
      enabled: can('Paste'),
      visible: props.isEditable
    }, {
      type: 'separator'
    });
    if (props.linkURL) {
      if (props.linkURL.match(/^mailto:/)) {
        template.push({
          type: 'separator'
        }, {
          label: 'Copy Email Address',
          click (item, focusedWindow, e) {
            electron.clipboard.write({
              text: props.linkURL.replace(/^mailto:/, ''),
              bookmark: props.linkText
            });
          }
        }, {
          type: 'separator'
        });
      } else if (props.linkURL.match(/^https?:/)) {
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
            electron.clipboard.write({
              text: props.linkURL,
              bookmark: props.linkText
            });
          }
        }, {
          type: 'separator'
        });
      } else {
        template.push({
          type: 'separator'
        }, {
          label: 'Copy Link Address',
          click (item, focusedWindow, e) {
            electron.clipboard.write({
              text: props.linkURL,
              bookmark: props.linkText
            });
          }
        }, {
          type: 'separator'
        });
      }
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

    if (hasText && is.macOS()) {
      template.push({
        role: 'services',
        submenu: []
      }, {
        type: 'separator'
      });
    }

    const menu = Menu.buildFromTemplate(template);
    setTimeout(() => {
      menu.popup({window: win});
    }, 20);
  });
};
