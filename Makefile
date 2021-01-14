PKG := "$(shell command -v yarn 2> /dev/null || command -v npm 2> /dev/null)"

node_modules: package.json
	${PKG} install

dist: node_modules
	${PKG} run dist

yarn-upgrade-deps:
	yarn upgrade-interactive --latest

clean:
	rm -Rf ./dist

distclean: clean
	rm -Rf ./node_modules

dev: node_modules
	${PKG} run app

test: node_modules
	${PKG} run test

snyk: node_modules
	${PKG} run snyk

mac: node_modules
	${PKG} run mac

win: node_modules
	${PKG} run win

.PHONY: dist clean distclean dev test mac win ci encryptenv
