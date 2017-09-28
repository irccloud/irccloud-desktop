PKG := $(shell command -v yarn 2> /dev/null || command -v npm 2> /dev/null)

node_modules: package.json
	${PKG} install

dist: node_modules
	${PKG} run dist

clean:
	rm -Rf ./dist

distclean: clean
	rm -Rf ./node_modules

dev: node_modules
	${PKG} run app

test: node_modules
	${PKG} run test

mac: node_modules
	${PKG} run mac

win: node_modules
	${PKG} run win

ci: test dist

encryptenv:
	travis encrypt-file .travis.env --add

.PHONY: dist clean distclean dev test mac win ci encryptenv
