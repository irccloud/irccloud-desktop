const electron = require('electron');

const app = electron.app;

const child_process = require('child_process');
const path = require('path');
const is = require('electron-is');

module.exports = {
  handleStartupEvent: function() {
    // Handle Squirrel startup events, called by the Windows installer.
    // https://github.com/electronjs/windows-installer#handling-squirrel-events
    if (!is.windows()) {
      return false;
    }

    function squirrelUpdater(args, done) {
      const updateExe = path.resolve(path.dirname(process.execPath), "..", "Update.exe");
      child_process.spawn(updateExe, args, {detached: true}).on("close", done);
    }

    const target = path.basename(process.execPath);
    switch (process.argv[1]) {
    case '--squirrel-install':
    case '--squirrel-updated':
      squirrelUpdater(['--createShortcut=' + target + ''], app.quit);
      return true;
    case '--squirrel-uninstall':
      squirrelUpdater(['--removeShortcut=' + target + ''], app.quit);
      return true;
    case '--squirrel-obsolete':
      app.quit();
      return true;
    }
  }
};
