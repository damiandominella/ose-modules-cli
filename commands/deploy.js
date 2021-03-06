// ------------------------------------------------------------------------
//                      e x t e r n a l   m o d u l e s
// ------------------------------------------------------------------------
const fs = require('fs-extra');
const inquirer = require('inquirer');
const chalk = require('chalk');
const zip = require('zip-a-folder');

const _helper = require('./../utils/helper');

// ------------------------------------------------------------------------
//                      c o m m a n d   m o d u l e
// ------------------------------------------------------------------------
const _deploy = {

    // --------------------------------------------------------------------
    //                  i n f o
    // --------------------------------------------------------------------
    $info: {
        name: 'deploy',
        description: 'Deploy compiled module(s) to the OSE Install Path',
    },

    // --------------------------------------------------------------------
    //                  m e t h o d s
    // --------------------------------------------------------------------

    // read list of modules from the dist/ directory
    getDeployableModules: async () => {
        try {
            return await fs.readdir('dist');
        } catch (err) {
            return null;
        }
    },

    // ask questions to user 
    getConfig: (modules) => {
        const questions = [
            {
                name: 'modules',
                type: 'checkbox',
                message: 'Select module(s) to deploy:',
                choices: modules
            }
        ];

        return inquirer.prompt(questions);
    },

    // zip the module and move it to the ose install path
    install: (module) => {
        return new Promise((resolve, reject) => {

            console.log('\nInstalling module ' + chalk.green.bold(module) + '...');

            let moduleZip = module + '.zip';
            zip.zipFolder('dist/' + module, moduleZip, (err) => {
                if (err) {
                    console.log(err);
                    reject('Error during ' + moduleZip + ' generation');
                }

                fs.readJson('package.json', (err, package) => {
                    if (err) {
                        reject('Cannot read oseInstallPath');
                    }
                    fs.move(
                        moduleZip, package.oseInstallPath + moduleZip,
                        { overwrite: true },
                        (err) => {
                            if (err) {
                                console.log(err);
                                reject(module + ': install failed.');
                            } else {
                                console.log('\n' + chalk.green(chalk.bold(module) + ': install completed'));
                                resolve();
                            }
                        });
                })
            });
        });
    },

    // --------------------------------------------------------------------
    //                  e x e c u t i o n
    // --------------------------------------------------------------------
    run: async () => {
        if (!(await _helper.isOSEProject())) {
            // display error
            console.log(chalk.red('\nOSE Project not found, you cannot deploy modules from the current folder'));
            return false;
        }

        // check for deployable modules
        const modules = await _deploy.getDeployableModules();

        if (!modules || !modules.length) {
            // display error message
            console.log(chalk.red('\nNo deployable modules! You have to build your modules before. Please see: `ose build`'));
            return false;
        }

        // manage input settings
        console.log('\n');
        const config = await _deploy.getConfig(modules);

        if (!config.modules || !config.modules.length) {
            // display warn message
            console.log(chalk.yellow('\nNo modules selected to deploy'));
            return true;
        }

        // deploy modules (exec promises in sequence)
        let errors = [];
        config.modules.reduce((p, module) => {
            return p
                .then(() => _deploy.install(module))
                .catch((err) => {
                    errors.push(err);
                })
        }, Promise.resolve()).finally(() => {
            if (errors.length > 0) {
                console.log('\n' + chalk.red(errors.join('\n')));
                return false;
            }

            return true;
        });
    }
};

// ------------------------------------------------------------------------
//                      e x p o r t s
// ------------------------------------------------------------------------
module.exports = _deploy;