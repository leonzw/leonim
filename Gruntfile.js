var grunt = require("grunt");
grunt.config.init({
        pkg: grunt.file.readJSON('gruntPackage.json'),
        'create-windows-installer': {
                ia32: {
                        appDirectory: 'SNM Quick Start-win32-ia32',
                        authors: 'Leon Zhao',
                        exe: 'SNM Quick Start.exe',
                        description: "Leon personal family IM",
                }       
        }
})

grunt.loadNpmTasks('grunt-electron-installer');
grunt.registerTask('default', ['create-windows-installer']);