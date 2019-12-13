var grunt = require("grunt");
grunt.config.init({
        pkg: grunt.file.readJSON('gruntPackage.json'),
        'create-windows-installer': {
                ia32: {
                        appDirectory: '../../src',
                        outputDirectory: '/tmp/build/installer32',
                        authors: 'Leon Zhao',
                        exe: 'leonim.exe',
                        description: "Leon personal family IM",
                }       
        }
})

grunt.loadNpmTasks('grunt-electron-installer');
grunt.registerTask('default', ['create-windows-installer']);