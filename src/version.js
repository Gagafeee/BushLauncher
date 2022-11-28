const XMCLCore = require('@xmcl/core')
const XMCLInstaller = require('@xmcl/installer');
const { installForge, getForgeVersionList, getVersionList, ForgeVersionList, ForgeVersion, install, diagnoseInstall } = XMCLInstaller;
const { MinecraftFolder, ResolvedVersion, Version } = XMCLCore;
const { DataManager } = require("./modules/data-manager.js");
const logginSaveManager = new DataManager({
    configName: 'logged-users',
    defaults: {}
});
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
    //can return false if version not supported
function versionProtocolToVersion(protocol, clientType) {
    clientType = clientType || logginSaveManager.get("loggedUser").data.selectedVersionType;
    switch (protocol) {
        case 760:
            return ClientVersion[clientType][1192];
        case 758:
            return ClientVersion[clientType][1182];
        case 754:
            return ClientVersion[clientType][1165];
        case 498:
            return ClientVersion[clientType][1144];
        case 404:
            return ClientVersion[clientType][1132];
        case 340:
            return ClientVersion[clientType][1122];
        case 47:
            return ClientVersion[clientType][189];
        case 5:
            return ClientVersion[clientType][171];
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



module.exports = { versionProtocolToVersion, getVanillaVersionList, ClientType, ClientVersion }