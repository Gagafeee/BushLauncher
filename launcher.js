const fs = require("fs");
const { Client } = require('minecraft-launcher-core');
const launcher = new Client();
const { Auth } = require('./authenticator');
const auth = new Auth();
const msmc = require("msmc");
const { DataManager } = require("./modules/data-manager.js");
const logginSaveManager = new DataManager({
    configName: 'logged-users',
    defaults: {}
});
const os = require('node:os');
const ClientType = {
    VANILLA: "vanilla",
    FORGE: "forge"
}
const ClientVersion = {
    1192: "1.19.2",
    1122: "1.12.2"
}
const getAppDataPath = require('appdata-path');
const shell = require('electron').shell;
const JavaVersion = 19;

function StartGame(clientType, version) {
    Object.freeze(ClientType);
    Object.freeze(ClientVersion);
    if (!auth.isLogged()) {
        console.log("user is not logged !");
        auth.LogIn("Microsoft").then(() => {
            console.log("Logged in !");
        })
    } else {
        console.log("user is logged");
    }
    const user = auth.getLoggedAccount();
    if (!auth.isAccountValid(user)) {
        console.error("Cannot Start the game: logged account is not valid");
    } else {

        //Let's check if we logged in?
        if (msmc.errorCheck(user)) {
            return;
        }
        //If the login works.
        CheckJava().then(() => {
            let opts = undefined;
            if (clientType == ClientType.VANILLA) {
                if (Object.values(ClientVersion).includes(version)) {
                    opts = {
                        clientPackage: null,
                        // Pulled from the Minecraft Launcher core docs , this function is the star of the show
                        authorization: msmc.getMCLC().getAuth(user),
                        root: "./minecraft",
                        version: {
                            number: version,
                            type: "release"
                        },
                        memory: {
                            max: "6G",
                            min: "4G"
                        },
                        javaPath: "C:/Program Files/Java/jdk-" + JavaVersion + "/bin/javaw.exe"
                    }
                } else {
                    console.error("wronk version");
                }


            }
            if (clientType == ClientType.FORGE) {
                if (Object.values(ClientVersion).includes(version)) {
                    opts = {
                        clientPackage: null,
                        // Pulled from the Minecraft Launcher core docs , this function is the star of the show
                        authorization: msmc.getMCLC().getAuth(user),
                        root: "./minecraft",
                        version: {
                            number: version,
                            type: "release"
                        },
                        forge: "./forge.jar",
                        memory: {
                            max: "6G",
                            min: "4G"
                        },
                        javaPath: "C:/Program Files/Java/jdk-" + JavaVersion + "/bin/javaw.exe"
                    }
                } else {
                    console.error("wronk version");
                }
            }



            if (opts != undefined) {
                console.log("Starting game in " + opts.version.number + " for: " + user.profile.name + " !");
                launcher.launch(opts);
            } else {
                console.error("opts can't be set");
            }


            launcher.on('debug', (e) => console.log(e));
            launcher.on('data', (e) => console.log(e));
        }).catch(e => {
            console.warn("cancel launch: wronk java");
        })

    }
}

function CheckJava() {
    return new Promise((resolve, reject) => {
        if (os.platform() == 'win32') {
            fs.access(`C:/Program Files/Java/jdk-` + JavaVersion + `/bin/javaw.exe`, (err) => {
                if (err) {
                    alert("Please update Java to version " + JavaVersion + " (and restart)")
                    shell.openExternal("https://www.oracle.com/java/technologies/downloads/#jdk" + JavaVersion)
                    reject();
                } else {
                    console.log('Java is up to date')
                    resolve();
                }
            })
        } else {
            alert("We can't update java because you are not in windows")
            reject();
        }
    })

}
module.exports = { StartGame, ClientType, ClientVersion }