// ------------------------------------------------------------------------
//                      e x t e r n a l   m o d u l e s
// ------------------------------------------------------------------------
const fs = require('fs-extra');
const path = require('path');
const inquirer = require('inquirer');
const chalk = require('chalk');

const _helper = require('./../utils/helper');

// ------------------------------------------------------------------------
//                      c o m m a n d   m o d u l e
// ------------------------------------------------------------------------
const _new = {

    // --------------------------------------------------------------------
    //                  i n f o
    // --------------------------------------------------------------------
    $info: {
        name: 'new',
        description: 'Generate a new OSE Modules Project under the current folder'
    },

    // --------------------------------------------------------------------
    //                  m e t h o d s
    // --------------------------------------------------------------------

    // ask questions to user
    getConfig: () => {
        const questions = [
            {
                name: 'projectName',
                type: 'input',
                message: 'Project name:',
                default: 'org_ose_project',
                validate: (value) => {
                    if (value.length) {
                        return true;
                    } else {
                        return 'Please enter a valid project name.';
                    }
                }
            },
            {
                name: 'author',
                type: 'input',
                message: 'Author:',
                default: 'Botika',
                validate: (value) => {
                    if (value.length) {
                        return true;
                    } else {
                        return 'Please enter a valid author.';
                    }
                }
            },
            {
                name: 'oseInstallPath',
                type: 'input',
                message: 'OSE install path (absolute path where the modules will be installed):',
                default: 'C:/ose/workspace/files/install/',
                validate: (value) => {
                    if (fs.pathExistsSync(value)) {
                        return true;
                    } else {
                        return 'Please enter a valid path.';
                    }
                }
            }
        ];
        return inquirer.prompt(questions);
    },

    // copy files from base/project to destination folder
    setupFolder: async (projectName) => {
        try {
            await fs.copy(
                path.join(__dirname, '../base/project'),
                projectName
            );
            return true;
        } catch (err) {
            console.error(err);
            return false;
        }
    },

    // edit package.json file based on prompted configuration
    setConfig: async (config) => {
        const file = config.projectName + '/package.json';
        try {
            const package = await fs.readJson(file);

            package.name = config.projectName;
            package.author = config.author;
            package.oseInstallPath = config.oseInstallPath;

            await fs.writeJSON(file, package, { spaces: '\t' });

            return true;
        } catch (err) {
            console.error(err);
            return false;
        }
    },

    // --------------------------------------------------------------------
    //                  e x e c u t i o n
    // --------------------------------------------------------------------
    run: async () => {
        if (await _helper.isOSEProject()) {
            // display error
            console.log(
                chalk.red('\nOSE Project already found, you cannot generate another project here')
            );
            return false;
        }

        // manage input settings
        console.log('\n');
        const config = await _new.getConfig();

        // setup folder structure 
        if (await _new.setupFolder(config.projectName)) {
            // write configurations to files
            if (await _new.setConfig(config)) {
                // display message
                console.log(
                    chalk.green('\nProject: ' + chalk.bold(config.projectName) + ' generated successfully!')
                );
                return true;
            }
        }

        // display error
        console.log(
            chalk.red('\nProject: ' + chalk.bold(config.projectName) + ' cannot be generated')
        );
        return false;
    },
};

// ------------------------------------------------------------------------
//                      e x p o r t s
// ------------------------------------------------------------------------
module.exports = _new;