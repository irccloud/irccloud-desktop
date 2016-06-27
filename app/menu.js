const electron = require('electron');

const app = electron.app;
const Menu = electron.Menu;
const MenuItem = electron.MenuItem;

module.exports = {
  setup: function (config) {
    var app_menu = {
      label: app.getName(),
      submenu: [
        {
          role: 'about'
        },
        {
          type: 'separator'
        },
        {
          label: 'Preferences…',
          accelerator: 'Cmd+,',
          click: function (item, focusedWindow, event) {
            if (focusedWindow) {
              focusedWindow.webContents.executeJavaScript('if (SESSIONVIEW) { SESSIONVIEW.openSettings(); }', true);
            }
          }
        },
        {
          type: 'separator'
        },
        {
          role: 'services',
          submenu: []
        },
        {
          type: 'separator'
        },
        {
          role: 'hide'
        },
        {
          role: 'hideothers'
        },
        {
          role: 'unhide'
        },
        {
          type: 'separator'
        },
        {
          role: 'quit'
        }
      ]
    };
    var file_menu = {
        label: 'File',
        submenu: [
            {
              label: 'Open in Browser',
              click: function(item, focusedWindow, event) {
                var url = focusedWindow ? focusedWindow.webContents.getURL() : config.get('host');
                require('electron').shell.openExternal(url);
              }
            },
            {
              type: 'separator'
            },
            {
              label: 'Add a Network…',
              click: function (item, focusedWindow, event) {
                if (focusedWindow) {
                  focusedWindow.webContents.executeJavaScript('if (SESSIONVIEW) { SESSIONVIEW.addNetwork(); }', true);
                }
              }
            },
            {
              type: 'separator'
            },
            {
              label: 'Jump to…',
              accelerator: 'CmdOrCtrl+K',
              click: function (item, focusedWindow, event) {
                if (focusedWindow) {
                  focusedWindow.webContents.executeJavaScript('if (SESSIONVIEW) { SESSIONVIEW.channelSwitcher.toggle(); }', true);
                }
              }
            },
            {
              label: 'Select Next in List',
              accelerator: 'Alt+Down',
              click: function (item, focusedWindow, event) {
                if (focusedWindow) {
                  focusedWindow.webContents.executeJavaScript('if (SESSIONVIEW) { SESSIONVIEW.sidebar.bufferList.selectNextBuffer(); }', true);
                }
              }
            },
            {
              label: 'Select Previous in List',
              accelerator: 'Alt+Up',
              click: function (item, focusedWindow, event) {
                if (focusedWindow) {
                  focusedWindow.webContents.executeJavaScript('if (SESSIONVIEW) { SESSIONVIEW.sidebar.bufferList.selectPreviousBuffer(); }', true);
                }
              }
            },
            {
              label: 'Select Next Unread in List',
              accelerator: 'Alt+Shift+Down',
              click: function (item, focusedWindow, event) {
                if (focusedWindow) {
                  focusedWindow.webContents.executeJavaScript('if (SESSIONVIEW) { SESSIONVIEW.sidebar.bufferList.selectNextUnreadBuffer(); }', true);
                }
              }
            },
            {
              label: 'Select Previous Unread in List',
              accelerator: 'Alt+Shift+Up',
              click: function (item, focusedWindow, event) {
                if (focusedWindow) {
                  focusedWindow.webContents.executeJavaScript('if (SESSIONVIEW) { SESSIONVIEW.sidebar.bufferList.selectPreviousUnreadBuffer(); }', true);
                }
              }
            },
            {
              type: 'separator'
            },
            {
              label: 'Mark Current as Read',
              accelerator: 'Esc',
              click: function (item, focusedWindow, event) {
                if (focusedWindow) {
                  focusedWindow.webContents.executeJavaScript('if (SESSION && SESSION.currentBuffer) { SESSION.currentBuffer.read(); }', true);
                }
              }
            },
            {
              label: 'Mark All as Read',
              accelerator: 'Shift+Esc',
              click: function (item, focusedWindow, event) {
                if (focusedWindow) {
                  focusedWindow.webContents.executeJavaScript('if (SESSION) { SESSION.markAllAsRead(); }', true);
                }
              }
            },
            {
              type: 'separator'
            },
            {
              label: 'Upload a File…',
              click: function (item, focusedWindow, event) {
                if (focusedWindow) {
                  focusedWindow.webContents.executeJavaScript('if (SESSION && SESSION.currentBuffer) { SESSION.currentBuffer.trigger("uploadPrompt"); }', true);
                }
              }
            },
            {
              label: 'Start a Pastebin…',
              click: function (item, focusedWindow, event) {
                if (focusedWindow) {
                  focusedWindow.webContents.executeJavaScript('if (SESSION && SESSION.currentBuffer) { SESSION.currentBuffer.trigger("pastePrompt"); }', true);
                }
              }
            }
        ]
    };
    if (process.platform != 'darwin') {
      file_menu.submenu.push({
        type: 'separator'
      });
      file_menu.submenu.push({
        label: 'Preferences…',
        accelerator: 'Ctrl+,',
        click: function (item, focusedWindow, event) {
          if (focusedWindow) {
            focusedWindow.webContents.executeJavaScript('if (SESSIONVIEW) { SESSIONVIEW.openSettings(); }', true);
          }
        }
      });
      file_menu.submenu.push({
        type: 'separator'
      });
      file_menu.submenu.push({
        label: 'Show in Tray',
        type:  'checkbox',
        checked: Boolean(app.config.get('tray')),
        click: function(item, focusedWindow, event) {
            app.config.set('tray', item.checked);
            app.toggleTray();
        }
      });
      file_menu.submenu.push({
        role: 'quit',
      });
    }

    var edit_menu = {
      label: 'Edit',
      submenu: [
        {
          role: 'undo'
        },
        {
          role: 'redo'
        },
        {
          type: 'separator'
        },
        {
          role: 'cut'
        },
        {
          role: 'copy'
        },
        {
          role: 'delete'
        },
        {
          role: 'paste'
        },
        {
          role: 'pasteandmatchstyle'
        },
        {
          role: 'selectall'
        },
      ]
    };

    var view_menu = {
      label: 'View',
      id: 'view',
      submenu: [
        {
          label: 'Reload',
          accelerator: 'CmdOrCtrl+R',
          click: function(item, focusedWindow, event) {
            if (focusedWindow) {
              focusedWindow.webContents.reloadIgnoringCache();
            }
          }
        },
        {
          type: 'separator'
        },
        {
          role: 'togglefullscreen'
        },
        {
          label: 'Actual Size',
          id: 'zoomReset',
          enabled: false,
          accelerator: 'CmdOrCtrl+0',
          click: function(item, focusedWindow, event) {
            app.resetZoom();
          }
        },
        {
          label: 'Zoom In',
          id: 'zoomIn',
          enabled: false,
          accelerator: 'CmdOrCtrl+=',
          click: function(item, focusedWindow, event) {
            app.zoomIn();
          }
        },
        {
          label: 'Zoom Out',
          id: 'zoomOut',
          enabled: false,
          accelerator: 'CmdOrCtrl+-',
          click: function(item, focusedWindow, event) {
            app.zoomOut();
          }
        },
        {
          type: 'separator'
        },
        {
          label: 'Developer Tools',
          accelerator: (function() {
            if (process.platform == 'darwin') {
              return 'Cmd+Alt+I';
            } else {
              return 'Ctrl+Shift+I';
            }
          })(),
          click: function(item, focusedWindow, event) {
            if (focusedWindow) {
              focusedWindow.openDevTools();
            }
          }
        },
      ]
    };
    if (process.platform != 'darwin') {
        view_menu.submenu.splice(2, 0, {
            label: 'Toggle Menu Bar',
            accelerator: 'Ctrl+Shift+M',
            click: function(item, focusedWindow, event) {
                if (focusedWindow.isMenuBarAutoHide()) {
                    app.config.set('menu-bar', true);
                    app.toggleMenuBar(focusedWindow);
                } else {
                    app.config.set('menu-bar', false);
                    app.toggleMenuBar(focusedWindow);
                }
            }
        });
    }

    var go_menu = {
      label: 'Go',
      id: 'history',
      submenu: [
        {
          label: 'Back',
          accelerator: 'CmdOrCtrl+[',
          enabled: false,
          id: 'backMenu',
          click: function (item, focusedWindow, event) {
            if (focusedWindow) {
              focusedWindow.webContents.goBack();
            }
          }
        },
        {
          label: 'Forward',
          accelerator: 'CmdOrCtrl+]',
          enabled: false,
          id: 'fwdMenu',
          click: function (item, focusedWindow, event) {
            if (focusedWindow) {
              focusedWindow.webContents.goForward();
            }
          }
        },
        {
          type: 'separator'
        },
        {
          label: 'File Uploads',
          click: function (item, focusedWindow, event) {
            if (focusedWindow) {
              focusedWindow.webContents.executeJavaScript('if (SESSIONVIEW) { SESSIONVIEW.files.show(); }', true);
            }
          }
        },
        {
          label: 'Pastebins',
          click: function (item, focusedWindow, event) {
            if (focusedWindow) {
              focusedWindow.webContents.executeJavaScript('if (SESSIONVIEW) { SESSIONVIEW.pastebins.show(); }', true);
            }
          }
        }
      ]
    };

    var window_menu = {
      label: 'Window',
      role: 'window',
      submenu: [
        {
          role: 'minimize'
        },
        {
          type: 'separator'
        },
        {
          role: 'front'
        }
      ]
    };

    var help_menu = {
      role: 'help',
      submenu: [
        {
          label: 'Keyboard Shortcuts',
          accelerator: 'CmdOrCtrl+/',
          click: function (item, focusedWindow, event) {
            focusedWindow.webContents.executeJavaScript('if (SESSIONVIEW) { SESSIONVIEW.navigate("?/shortcuts", {trigger: true}); }', true);
          }
        },
        {
          type: 'separator'
        },
        {
          label: 'Known Issues',
          click: function(item, focusedWindow, event) {
            require('electron').shell.openExternal('https://github.com/irccloud/irccloud-desktop/issues');
          }
        },
      ]
    };

    var menu;
    if (process.platform == 'darwin') {
      menu = Menu.buildFromTemplate([app_menu, file_menu, edit_menu, view_menu, go_menu, window_menu, help_menu]);
    } else {
      menu = Menu.buildFromTemplate([file_menu, edit_menu, view_menu, go_menu, help_menu]);
    }
    Menu.setApplicationMenu(menu);
    return menu;
  },
  setup_tray: function(app){
    var menu;
    menu = Menu.buildFromTemplate([
        {
          role: 'quit'
        }
    ]);
    return menu;
  }
};
