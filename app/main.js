var app = require('app');
var BrowserWindow = require('browser-window');
var Menu = require('menu');
var MenuItem = require('menu-item');
var Shell = require('shell');
var fs = require('fs');

var mainWindow = null;
app.on('window-all-closed', function() {
  if (process.platform != 'darwin') {
    app.quit();
  }
});

windowConfigFile = app.getPath('appData') + '/IRCCloudWindowState';

app.on('ready', function() {
  var state = {width: 1024, height: 768};

  try {
    data = fs.readFileSync(windowConfigFile, 'utf8');
    state = JSON.parse(data);
  } catch (e) {
    console.log(e);
  }

  mainWindow = new BrowserWindow(state);
  mainWindow.loadURL('https://www.irccloud.com');

  mainWindow.on('closed', function() {
    mainWindow = null;
  });

  mainWindow.on('resize', function() {
    size = mainWindow.getSize();
    state = {width: size[0], height: size[1]};
    fs.writeFile(windowConfigFile, JSON.stringify(state), 'utf8');
  });

  mainWindow.on('page-title-updated', function(event) {
      var title = mainWindow.getTitle();
      if (title) {
          var unread = "";
          var matches = title.match(/^\((\d+)\)/);
          if (matches) {
            unread = matches[1];
          }
          app.dock.setBadge(unread);
      }
  });

  mainWindow.webContents.on('new-window', function(event, url, frameName, disposition) {
      event.preventDefault();
      Shell.openExternal(url);
  });

  var template = [{
    label: 'IRCCloud',
    submenu: [
      {
        label: 'About IRCCloud',
        click: function() {
            var win = new BrowserWindow({ width: 915, height: 600, show: false });
            win.on('closed', function() {
              win = null;
            });
            win.loadUrl('https://www.irccloud.com/about');
            win.show();
        }
      },
      {
        type: 'separator'
      },
      {
        label: 'Services',
        submenu: []
      },
      {
        type: 'separator'
      },
      {
        label: 'Hide IRCCloud',
        accelerator: 'Command+H',
        selector: 'hide:'
      },
      {
        label: 'Hide Others',
        accelerator: 'Command+Shift+H',
        selector: 'hideOtherApplications:'
      },
      {
        label: 'Show All',
        selector: 'unhideAllApplications:'
      },
      {
        type: 'separator'
      },
      {
        label: 'Quit',
        accelerator: 'Command+Q',
        click: function() { app.quit(); }
      },
    ]
  },
  {
    label: 'Edit',
    submenu: [
      {
        label: 'Undo',
        accelerator: 'Command+Z',
        selector: 'undo:'
      },
      {
        label: 'Redo',
        accelerator: 'Shift+Command+Z',
        selector: 'redo:'
      },
      {
        type: 'separator'
      },
      {
        label: 'Cut',
        accelerator: 'Command+X',
        selector: 'cut:'
      },
      {
        label: 'Copy',
        accelerator: 'Command+C',
        selector: 'copy:'
      },
      {
        label: 'Paste',
        accelerator: 'Command+V',
        selector: 'paste:'
      },
      {
        label: 'Select All',
        accelerator: 'Command+A',
        selector: 'selectAll:'
      },
    ]
  },
  {
    label: 'View',
    submenu: [
      {
        label: 'Reload',
        accelerator: 'Command+R',
        click: function() { BrowserWindow.getFocusedWindow().reloadIgnoringCache(); }
      },
      {
        label: 'Toggle DevTools',
        accelerator: 'Alt+Command+I',
        click: function() { BrowserWindow.getFocusedWindow().toggleDevTools(); }
      },
    ]
  },
  {
    label: 'Window',
    submenu: [
      {
        label: 'Minimize',
        accelerator: 'Command+M',
        selector: 'performMiniaturize:'
      },
      {
        label: 'Close',
        accelerator: 'Command+W',
        selector: 'performClose:'
      },
      {
        type: 'separator'
      },
      {
        label: 'Bring All to Front',
        selector: 'arrangeInFront:'
      },
    ]
  }];

  menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
});
