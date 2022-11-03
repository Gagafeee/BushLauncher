const fs = require("fs");
const { Client } = require('minecraft-launcher-core');
const launcher = new Client();
const { Auth } = require('./authenticator');
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
        1182: "1.18.2",
        1165: "1.16.5",
        1144: "1.14.4",
        1132: "1.13.2",
        1122: "1.12.2",
        189: "1.8.9",
        171: "1.7.10"


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
const XMCLCore = require('@xmcl/core')
const XMCLInstaller = require('@xmcl/installer');
const { installForge, getForgeVersionList, getVersionList, ForgeVersionList, ForgeVersion, install, diagnoseInstall } = XMCLInstaller;
const { MinecraftFolder, ResolvedVersion, Version } = XMCLCore;
var isRunning = false;
const prefix = "[Launcher]: ";


function StartGame(clientType, version, updateInterface) {
    if (!isRunning) {
        updateInterface({ code: "starting", text: "Loading..." });
        Object.freeze(ClientType);
        Object.freeze(ClientVersion);
        updateInterface({ code: "starting", text: "Login In..." });
        if (!auth.isLogged()) {
            console.log("user is not logged !");
            auth.LogIn("Microsoft").then(() => {
                console.log("Logged in !");
            })
        } else {
            console.log("user is logged");
        }
        updateInterface({ code: "starting", text: "Validating Account..." });
        const user = auth.getLoggedAccount();
        if (!auth.isAccountValid(user)) {
            console.error(prefix + "Cannot Start the game: logged account is not valid");
        } else {

            //Let's check if we logged in?
            if (msmc.errorCheck(user)) {
                return;
            }
            updateInterface({ code: "starting", text: "Checking Java..." });
            //If the login works.
            CheckJava().then(() => {
                let opts = undefined;
                updateInterface({ code: "starting", text: "Validating parameters..." });
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
                        console.error(prefix + "wronk version");
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
                        console.error(prefix + "wronk version");
                    }
                }



                if (opts != undefined) {
                    //install 
                    console.log(locationRoot);
                    updateInterface({ code: "starting", text: "Downloading..." });
                    Download(clientType, version).then(() => {
                            updateInterface({ code: "starting", text: "Starting..." });
                            console.log("Starting " + clientType + " game in " + opts.version.number + " for: " + user.profile.name + " !");
                            launcher.launch(opts);
                            isRunning = true;

                        })
                        .catch((err) => {
                            updateInterface({ code: "error", returnCode: err })
                        })

                } else {
                    console.error(prefix + "opts can't be set");
                    updateInterface({ code: "error", returnCode: "Can't set minecraft launch options" })
                }


                launcher.on('debug', (e) => console.log(e));
                launcher.on('data', (e) => console.log(e));
                launcher.on('close', (e) => {
                    updateInterface({ code: "closed", returnCode: e });
                    isRunning = false;
                });
                launcher.on('arguments', (e) => {
                    updateInterface({ text: "Launched", code: "running" })
                })
            }).catch(e => {
                console.error(prefix + "cancel launch: " + e);
                console.error(e);
                updateInterface({ code: "error", returnCode: e })
                notificationsManager.CreateNotification(NotificationsType.Error, e + "  (Please check your Java installation)");
            })

        }
    } else {
        console.warn(prefix + "can't start, game is already running");
        notificationsManager.CreateNotification(NotificationsType.Info, "Game is already running !", 5000);
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

function Download(type, version) {
    if (Object.keys(ClientType).includes(type) && Object.values(ClientVersion[type]).includes(version)) {

        return new Promise((resolve, reject) => {
            switch (type) {
                case ClientType.VANILLA:
                    var ResolvedVersion = null;
                    getVanillaVersionList().then((VersionList) => {
                        Array.from(VersionList).forEach((e) => {
                            if (e.id == version) {
                                ResolvedVersion = e;
                            }
                        })
                        if (ResolvedVersion != null) {
                            const u = (locationRoot + "\\versions\\" + ResolvedVersion.id);
                            fs.stat(u, (err, stat) => {
                                if (!err) {
                                    console.log("already installed");
                                    resolve();
                                } else if (err.code === 'ENOENT') {

                                    console.log("installing");
                                    install(ResolvedVersion, locationRoot).then((res) => {
                                        console.log("done");
                                        resolve();
                                    }).catch((err) => {
                                        console.error(err);
                                        reject(err);
                                    })
                                }

                            })
                        } else {
                            console.error(prefix + "version not found (please don't use snapshot)");
                            reject();
                        }
                    })




                    break;
                case ClientType.FORGE:
                    console.log(version);
                    getForgeVersionList({ mcversion: version }).then((ForgeVersionList) => {
                        console.log(ForgeVersionList);
                        const ResolvedVersion = ForgeVersionList.versions[0]
                            //get if is already installed
                        console.log(ResolvedVersion);

                        const u = (locationRoot + "\\versions\\" + ResolvedVersion.mcversion + "-forge-" + ResolvedVersion.version);
                        fs.stat(u, (err, stat) => {
                            if (!err) {
                                console.log("already installed");
                                resolve();
                            } else if (err.code === 'ENOENT') {
                                console.log("not installed :");
                                console.log("installing forge " + version + "[" + ResolvedVersion.version + "]...");
                                installForge(ResolvedVersion, locationRoot).then((ResolvedForge) => {
                                    console.log("All done");
                                    resolve(ResolvedForge);


                                }).catch((err) => {
                                    console.error(err);
                                    reject(err);
                                })
                            } else {
                                console.error(prefix + "An error occurred: " + err);

                            }
                        })




                    })




                    break;

                default:
                    break;
            }

        })


    } else {
        console.error(prefix + "Client Type or version is not valid: " + type + " : " + version);
    }
}

function getVanillaVersionList() {
    return new Promise((resolve, reject) => {
        getVersionList().then((responce) => {
            var VersionList = [];
            const res = responce.versions;
            Array.from(res).forEach((e) => {
                if (e.type == "release") {
                    VersionList.push(e);
                }
            })



            resolve(VersionList);
        })
    })
}

module.exports = { locationRoot, StartGame, ClientType, ClientVersion, getVanillaVersionList }