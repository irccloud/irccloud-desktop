dist: node_modules
	npm run dist

node_modules: package.json
	npm install

clean:
	rm -Rf ./dist

dev: node_modules
	./node_modules/.bin/electron ./app

test: node_modules
	./node_modules/.bin/jshint ./app

ci: test dist

.PHONY: dist clean dev test ci
