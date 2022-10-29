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
    VANILLA: "VANILLA",
    FORGE: "FORGE"
}
const ClientVersion = {
    [ClientType.VANILLA]: {
        1192: "1.19.2",
        1122: "1.12.2",
        189: "1.8.9"
    },
    [ClientType.FORGE]: {
        1192: "1.19.2",
        1122: "1.12.2"
    }

}
const getAppDataPath = require('appdata-path');
const locationRoot = getAppDataPath() + "\\.minecraft";
const shell = require('electron').shell;
const JavaVersion = 19;
const { notificationsManager, NotificationsType } = require('./modules/notifications/notifications');
const localDataManager = new DataManager({
    configName: 'localData',
    default: {}
});
const { Downloader } = require('downloader');
const downloader = new Downloader();
const XMCLCore = require('@xmcl/core')
const XMCLInstaller = require('@xmcl/installer');
const { installForge, getForgeVersionList, ForgeVersionList, ForgeVersion, installDependencies, diagnoseInstall } = XMCLInstaller;
console.log(XMCLInstaller);
const { MinecraftFolder, ResolvedVersion, Version } = XMCLCore;



function StartGame(clientType, version, updateInterface) {
    updateInterface({ text: "Loading..." });
    Object.freeze(ClientType);
    Object.freeze(ClientVersion);
    updateInterface({ text: "Login In..." });
    if (!auth.isLogged()) {
        console.log("user is not logged !");
        auth.LogIn("Microsoft").then(() => {
            console.log("Logged in !");
        })
    } else {
        console.log("user is logged");
    }
    updateInterface({ text: "Validating Account..." });
    const user = auth.getLoggedAccount();
    if (!auth.isAccountValid(user)) {
        console.error("Cannot Start the game: logged account is not valid");
    } else {

        //Let's check if we logged in?
        if (msmc.errorCheck(user)) {
            return;
        }
        updateInterface({ text: "Checking Java..." });
        //If the login works.
        CheckJava().then(() => {
            let opts = undefined;
            updateInterface({ text: "Validating parameters..." });
            if (clientType == ClientType.VANILLA) {
                if (Object.values(ClientVersion[ClientType.VANILLA]).includes(version)) {
                    opts = {
                        clientPackage: null,
                        authorization: msmc.getMCLC().getAuth(user),
                        root: locationRoot,
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
                    console.error(version);
                }


            }
            if (clientType == ClientType.FORGE) {
                if (Object.values(ClientVersion[ClientType.FORGE]).includes(version)) {

                    opts = {
                        clientPackage: null,
                        // Pulled = require(the Minecraft Launcher core docs , this function is the star of the show
                        authorization: msmc.getMCLC().getAuth(user),
                        root: locationRoot,
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
                //install 
                console.log(locationRoot);
                updateInterface({ text: "Downloading Client..." });
                DownloadClientType(clientType, version).then(() => {
                    updateInterface({ text: "Starting..." });
                    console.log("Starting " + clientType + " game in " + opts.version.number + " for: " + user.profile.name + " !");
                    launcher.launch(opts);
                    updateInterface({ text: "Launched..." });
                })

            } else {
                console.error("opts can't be set");
            }


            launcher.on('debug', (e) => console.log(e));
            launcher.on('data', (e) => console.log(e));
            launcher.on('close', (e) => updateInterface({code: e}));
        }).catch(e => {
            console.warn("cancel launch: wronk java");
            console.error(e);
            notificationsManager.CreateNotification(NotificationsType.Error, "Please check your Java installation");
        })

    }
}

function CheckJava() {
    return new Promise((resolve, reject) => {
        if (os.platform() == 'win32') {
            fs.access(`C:/Program Files/Java/jdk-` + JavaVersion + `/bin/javaw.exe`, (err) => {
                if (err) {
                    notificationsManager.CreateNotification(NotificationsType.Error, "Please update Java to version " + JavaVersion + " (and restart)")
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

function DownloadClientType(type, version) {
    if (Object.keys(ClientType).includes(type) && Object.values(ClientVersion[type]).includes(version)) {

        return new Promise(function(resolve, reject) {
            if (type != ClientType.VANILLA) {
                switch (type) {
                    case ClientType.FORGE:
                        console.log(version);
                        getForgeVersionList({ mcversion: version }).then((ForgeVersionList) => {
                            console.log(ForgeVersionList);
                            const ResolvedVersion = ForgeVersionList.versions[0]
                                //get if is already installed
                            console.log(ResolvedVersion);

                            const u = (locationRoot + "\\versions\\" + ResolvedVersion.mcversion + "-forge-" + ResolvedVersion.version);
                            console.log(u);
                            fs.stat(u, (err, stat) => {
                                if (!err) {
                                    console.log("already installed");
                                    resolve();
                                } else if (err.code === 'ENOENT') {
                                    console.log("not installed");
                                    console.log("installing forge " + version + "[" + ResolvedVersion.version + "]...");
                                    installForge(ResolvedVersion, locationRoot).then((ResolvedForge) => {
                                        console.log("All done");
                                        resolve(ResolvedForge);


                                    }).catch((err) => {
                                        console.error(err);
                                        reject(err);
                                    })
                                } else {
                                    console.error("An error occurred: " + err);

                                }
                            })




                        })




                        break;

                    default:
                        break;
                }
            } else {
                console.log("Vanilla don't installing");
                resolve()
            }
        })


    } else {
        console.error("Client Type or version is not valid: " + type + " : " + version);
    }
}
module.exports = { StartGame, ClientType, ClientVersion }