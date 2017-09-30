const electron = require('electron');

const app = electron.app;
const Shell = electron.shell;
const Menu = electron.Menu;
const auto_updater = require('./auto_update.js');
const is = require('electron-is');
const open = require('open');
const log = require('electron-log');

module.exports = {
  setup: function () {
    var checkForUpdates = {visible: false, enabled: false};
    if (!is.dev()) {
      checkForUpdates = {
        label: 'Check for Updates…',
        id: 'updateCheck',
        click: function (item, focusedWindow) {
          auto_updater.check();
        }
      };
    }
    var sep = {
      type: 'separator'
    };
    var prefs = {
      label: 'Preferences…',
      accelerator: 'CmdOrCtrl+,',
      click: function (item, focusedWindow, event) {
        if (focusedWindow) {
          focusedWindow.webContents.executeJavaScript('if (SESSIONVIEW) { SESSIONVIEW.openSettings(); }', true);
        }
      }
    };
    var show_config = {
      label: 'Edit Config File…',
      click: function (item, focusedWindow, event) {
        app.config.openInEditor();
      }
    };
    var show_log = {
      label: 'Reveal Log File…',
      click: function (item, focusedWindow, event) {
        Shell.showItemInFolder(log.transports.file.findLogPath());
      }
    };
    var show_user_style = {
      id: 'show_user_style',
      label: 'Reveal User Style…',
      click: function (item, focusedWindow, event) {
        Shell.showItemInFolder(app.config.get('userStylePath'));
      },
      visible: !!app.config.get('acceptUserStyles')
    };
    var show_user_script = {
      id: 'show_user_script',
      label: 'Reveal User Script…',
      click: function (item, focusedWindow, event) {
        Shell.showItemInFolder(app.config.get('userScriptPath'));
      },
      visible: !!app.config.get('acceptUserScripts')
    };
    var app_menu = {
      label: app.getName(),
      id: 'app',
      submenu: []
    };
    app_menu.submenu.push({
      role: 'about'
    });
    app_menu.submenu.push(checkForUpdates);
    app_menu.submenu.push(sep);
    app_menu.submenu.push(prefs);
    app_menu.submenu.push(sep);
    app_menu.submenu.push(show_config);
    app_menu.submenu.push(show_log);
    app_menu.submenu.push(show_user_style);
    app_menu.submenu.push(show_user_script);
    app_menu.submenu.push(sep);
    app_menu.submenu.push({
      role: 'services',
      submenu: []
    });
    app_menu.submenu.push(sep);
    app_menu.submenu.push({
      role: 'hide'
    });
    app_menu.submenu.push({
      role: 'hideothers'
    });
    app_menu.submenu.push({
      role: 'unhide'
    });
    app_menu.submenu.push(sep);
    app_menu.submenu.push({
      role: 'quit'
    });
    var file_menu = {
      label: 'File',
      id: 'app',
      submenu: [
        {
          role: 'close'
        },
        sep,
        {
          label: 'Open in Browser',
          click: function(item, focusedWindow, event) {
            var url = focusedWindow ?
              focusedWindow.webContents.getURL() :
              app.config.get('host');
            require('electron').shell.openExternal(url);
          }
        }, {
          label: 'Open Browser Tab…',
          accelerator: 'CmdOrCtrl+T',
          click: function(item, focusedWindow, event) {
            open('http://');
          }
        },
        sep,
        {
          label: 'Add a Network…',
          click: function (item, focusedWindow, event) {
            if (focusedWindow) {
              focusedWindow.webContents.executeJavaScript('if (SESSIONVIEW) { SESSIONVIEW.addNetwork(); }', true);
            }
          }
        },
        sep,
        {
          label: 'Jump to…',
          accelerator: 'CmdOrCtrl+K',
          click: function (item, focusedWindow, event) {
            if (focusedWindow) {
              focusedWindow.webContents.executeJavaScript('if (SESSIONVIEW) { SESSIONVIEW.channelSwitcher.toggle(); }', true);
            }
          }
        }, {
          label: 'Select Next in List',
          accelerator: 'Alt+Down',
          click: function (item, focusedWindow, event) {
            if (focusedWindow) {
              focusedWindow.webContents.executeJavaScript('if (SESSIONVIEW) { SESSIONVIEW.sidebar.bufferList.selectNextBuffer(); }', true);
            }
          }
        }, {
          label: 'Select Previous in List',
          accelerator: 'Alt+Up',
          click: function (item, focusedWindow, event) {
            if (focusedWindow) {
              focusedWindow.webContents.executeJavaScript('if (SESSIONVIEW) { SESSIONVIEW.sidebar.bufferList.selectPreviousBuffer(); }', true);
            }
          }
        }, {
          label: 'Select Next Unread in List',
          accelerator: 'Alt+Shift+Down',
          click: function (item, focusedWindow, event) {
            if (focusedWindow) {
              focusedWindow.webContents.executeJavaScript('if (SESSIONVIEW) { SESSIONVIEW.sidebar.bufferList.selectNextUnreadBuffer(); }', true);
            }
          }
        }, {
          label: 'Select Previous Unread in List',
          accelerator: 'Alt+Shift+Up',
          click: function (item, focusedWindow, event) {
            if (focusedWindow) {
              focusedWindow.webContents.executeJavaScript('if (SESSIONVIEW) { SESSIONVIEW.sidebar.bufferList.selectPreviousUnreadBuffer(); }', true);
            }
          }
        },
        sep,
        {
          label: 'Mark Current as Read',
          accelerator: 'Esc',
          click: function (item, focusedWindow, event) {
            if (focusedWindow) {
              focusedWindow.webContents.executeJavaScript('if (SESSION && SESSION.currentBuffer) { SESSION.currentBuffer.read(); }', true);
            }
          }
        }, {
          label: 'Mark All as Read',
          accelerator: 'Shift+Esc',
          click: function (item, focusedWindow, event) {
            if (focusedWindow) {
              focusedWindow.webContents.executeJavaScript('if (SESSION) { SESSION.markAllAsRead(); }', true);
            }
          }
        },
        sep,
        {
          label: 'Upload a File…',
          click: function (item, focusedWindow, event) {
            if (focusedWindow) {
              focusedWindow.webContents.executeJavaScript('if (SESSION && SESSION.currentBuffer) { SESSION.currentBuffer.trigger("uploadPrompt"); }', true);
            }
          }
        }, {
          label: 'Start a Pastebin…',
          click: function (item, focusedWindow, event) {
            if (focusedWindow) {
              focusedWindow.webContents.executeJavaScript('if (SESSION && SESSION.currentBuffer) { SESSION.currentBuffer.trigger("pastePrompt"); }', true);
            }
          }
        }
      ]
    };
    if (!is.macOS()) {
      file_menu.submenu.push(sep);
      file_menu.submenu.push(prefs);
      file_menu.submenu.push(show_config);
      file_menu.submenu.push(show_log);
      file_menu.submenu.push(show_user_style);
      file_menu.submenu.push(show_user_script);
      file_menu.submenu.push(sep);
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
        role: 'quit'
      });
    }
    
    var spellingItem;
    var spellingSubItem = {
      type: 'checkbox',
      id: 'spellingItem',
      checked: app.config.get('spellcheck'),
      click: function(item, focusedWindow, event) {
        app.config.set('spellcheck', item.checked);
        app.toggleSpellcheck();
      }
    };
    if (is.macOS()) {
      spellingSubItem.label = 'Check Spelling While Typing';
      spellingItem = {
        label: 'Spelling and Grammar',
        submenu: [spellingSubItem]
      };
    } else {
      spellingSubItem.label = 'Check spelling as you type';
      spellingItem = spellingSubItem;
    }
    var edit_menu = {
      label: 'Edit',
      id: 'edit',
      submenu: [
        {
          role: 'undo'
        }, {
          role: 'redo'
        },
        sep,
        {
          role: 'cut'
        }, {
          role: 'copy'
        }, {
          role: 'delete'
        }, {
          role: 'paste'
        }, {
          role: 'pasteandmatchstyle'
        }, {
          role: 'selectall'
        },
        sep,
        spellingItem
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
            } else {
              app.emit('activate', {
                reload: true
              });
            }
          }
        },
        sep,
        {
          role: 'togglefullscreen'
        }, {
          label: 'Actual Size',
          id: 'zoomReset',
          enabled: false,
          accelerator: 'CmdOrCtrl+0',
          click: function(item, focusedWindow, event) {
            app.resetZoom();
          }
        }, {
          label: 'Zoom In',
          id: 'zoomIn',
          enabled: false,
          accelerator: 'CmdOrCtrl+=',
          click: function(item, focusedWindow, event) {
            app.zoomIn();
          }
        }, {
          label: 'Zoom Out',
          id: 'zoomOut',
          enabled: false,
          accelerator: 'CmdOrCtrl+-',
          click: function(item, focusedWindow, event) {
            app.zoomOut();
          }
        },
        sep,
        {
          label: 'Developer Tools',
          accelerator: (function() {
            if (is.macOS()) {
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
        }
      ]
    };
    if (!is.macOS()) {
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
        }, {
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
        sep,
        {
          label: 'File Uploads',
          click: function (item, focusedWindow, event) {
            if (focusedWindow) {
              focusedWindow.webContents.executeJavaScript('if (SESSIONVIEW) { SESSIONVIEW.files.show(); }', true);
            }
          }
        }, {
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
        sep,
        {
          role: 'front'
        },
        sep,
        {
          label: 'Main Window',
          accelerator: 'CmdOrCtrl+1',
          click: function (item, focusedWindow, event) {
            app.emit('activate');
          }
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
        sep,
        {
          label: 'Known Issues',
          click: function(item, focusedWindow, event) {
            require('electron').shell.openExternal('https://github.com/irccloud/irccloud-desktop/issues');
          }
        }
      ]
    };
    if (!is.macOS()) {
      help_menu.submenu.push(checkForUpdates);
    }

    var menu;
    if (is.macOS()) {
      menu = Menu.buildFromTemplate([app_menu, file_menu, edit_menu, view_menu, go_menu, window_menu, help_menu]);
    } else {
      menu = Menu.buildFromTemplate([file_menu, edit_menu, view_menu, go_menu, help_menu]);
    }
    Menu.setApplicationMenu(menu);
    return menu;
  },
  setup_tray: function(app){
    var menu;
    let items = [
      // Clicking the icon to show the app only works on windows
      // May as well include this option for all anyway
      {
        label: 'Open',
        click: function (item, focusedWindow, event) {
          app.emit('activate');
        }
      },
      {
        role: 'quit'
      }
    ];
    menu = Menu.buildFromTemplate(items);
    return menu;
  }
};
