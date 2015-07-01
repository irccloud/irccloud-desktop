var app = require('app');
var BrowserWindow = require('browser-window');

var mainWindow = null;
app.on('window-all-closed', function() {
  if (process.platform != 'darwin') {
    app.quit();
  }
});

app.on('ready', function() {
  mainWindow = new BrowserWindow({width: 1366, height: 768});
  mainWindow.loadUrl('https://www.irccloud.com');

  mainWindow.on('closed', function() {
    mainWindow = null;
  });
});
