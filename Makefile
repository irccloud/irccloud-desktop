dist: node_modules
	npm run dist

node_modules: package.json
	npm install

clean:
	rm -Rf ./dist