dist: node_modules
	npm run dist

node_modules: package.json
	npm install

clean:
	rm -Rf ./dist

test:
	./node_modules/.bin/jshint ./app

ci: test dist

.PHONY: dist clean test ci
