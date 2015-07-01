module.exports = function(grunt) {
  grunt.initConfig({
    'build-atom-shell': {
      tag: 'v0.27.3',
      nodeVersion: '0.27.3',
      buildDir: 'atom-shell-build',
      projectName: 'irccloud',
      productName: 'IRCCloud'
    }
  });
  grunt.loadNpmTasks('grunt-build-atom-shell');
  grunt.registerTask('default', ['build-atom-shell']);
};
