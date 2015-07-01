osx:
	wget --continue https://github.com/atom/electron/releases/download/v0.28.3/electron-v0.28.3-darwin-x64.zip
	unzip electron-*.zip
	rm LICENSE version
	
	# Our app
	cp -r app Electron.app/Contents/Resources/
	cp app/irccloud.icns Electron.app/Contents/Resources/atom.icns

	# BRAND AWARENESS (Oh god the horror)
	perl -pi -000 -e 's/<key>CFBundleDisplayName<\/key>\s+<string>Electron<\/string>/<key>CFBundleDisplayName<\/key>\n\t<string>IRCCloud<\/string>/' 'Electron.app/Contents/Info.plist'
	perl -pi -000 -e 's/<key>CFBundleIdentifier<\/key>\s+<string>Electron<\/string>/<key>CFBundleIdentifier<\/key>\n\t<string>IRCCloud<\/string>/' 'Electron.app/Contents/Info.plist'
	perl -pi -000 -e 's/<key>CFBundleName<\/key>\s+<string>Electron<\/string>/<key>CFBundleName<\/key>\n\t<string>IRCCloud<\/string>/' 'Electron.app/Contents/Info.plist'
	mv 'Electron.app' 'IRCCloud.app'

clean:
	rm -rf IRCCloud.app
	rm -rf Electron.app
