const b = require('electron-builder');
const LinuxTargetHelper = require("app-builder-lib/out/targets/LinuxTargetHelper");

const config = require('../electron-builder.json');
const pkg = require('../package.json');

let p = new b.Packager({linux: ['deb']});
p._configuration = config;
p._metadata = pkg;

let h = p.createHelper(b.Platform.LINUX);
let lth = new LinuxTargetHelper.LinuxTargetHelper(h);
lth.writeDesktopEntry(config.linux, null, `./build/${config.linux.executableName}.desktop`);