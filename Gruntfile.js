'use strict';

module.exports = function (grunt) {

    // Show elapsed time after tasks run to visualize performance
    require('time-grunt')(grunt);
    // Load all Grunt tasks that are listed in package.json automagically
    require('load-grunt-tasks')(grunt);

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        // shell commands for use in Grunt tasks
        shell: {
            jekyllBuild: {
                command: 'jekyll build'
            },
            jekyllServe: {
                command: 'jekyll serve'
            }
        },

        // watch for files to change and run tasks when they do
        watch: {
            html: {
                files: ['index.html', '*.html', '_includes/*.html'],
                tasks: ['staticinline']
            },
            sass: {
                files: ['_sass/**/*.{scss,sass}'],
                tasks: ['sass', 'staticinline']
            }
        },

        // sass (libsass) config
        sass: {
            options: {
                sourceMap: false,
                relativeAssets: false,
                outputStyle: 'compressed',
                sassDir: '_sass',
                cssDir: '_site/css'
            },
            build: {
                files: [{
                    expand: true,
                    cwd: '_sass/',
                    src: ['**/*.{scss,sass}'],
                    dest: '_site/css',
                    ext: '.css'
                }]
            }
        },

        // autoprefixr
        autoprefixer: {
            no_dest: {
                src: '_site/css/main.css'
            }
        },

        // inline css
        staticinline: {
            main: {
                options: {
                    prefix: '@{',
                    suffix: '}@',
                    vars: {
                        'css_include': '<%= grunt.file.read("_site/css/main.css") %>'
                    }
                },
                files: {
                    '_includes/head-min.html': '_includes/head.html'
                }
            }
        },

        // run tasks in parallel
        concurrent: {
            serve: [
                'sass',
                'autoprefixer',
                'staticinline',
                'watch',
                'shell:jekyllServe'
            ],
            options: {
                logConcurrentOutput: true
            }
        },

    });

    // Register the grunt serve task
    grunt.registerTask('serve', [
        'concurrent:serve'
    ]);

    // Register the grunt build task
    grunt.registerTask('build', [
        'shell:jekyllBuild',
        'sass'
    ]);

    // Register build as the default task fallback
    grunt.registerTask('default', 'build');

};
