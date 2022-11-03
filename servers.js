const { readInfo, writeInfo, ServerInfo } = require("@xmcl/server-info");
const fs = require("fs");
const { locationRoot, ClientVersion } = require("./launcher");
const seversDatBuffer = fs.readFileSync(locationRoot + "\\servers.dat", null);
const util = require('minecraft-server-util');
var initialized = false;
const prefix = "[ServerList]: "

var serverListMainContainer = null;
// info.ip -> server ip
// info.name -> server name

function getServerList() {
    return new Promise((resolve, reject) => {
        readInfo(seversDatBuffer).then((serverList) => {
            resolve(serverList);
        })
    })
}

function InitServerList() {
    var c = document.querySelector("#MainContainer .container.show");
    const reloadButton = c.querySelector("#reloadServerListButton");
    c = c.querySelector("#server-list") ? c.querySelector("#server-list .list") : false;
    if (c) {
        serverListMainContainer = c;
        reloadButton.addEventListener("click", () => {
            getServerList().then((LocalServerList) => {
                refreshServerList(LocalServerList);
            })
        })
        initialized = true;
        console.log(prefix + "initialized");
    } else {
        initialized = "cannot";
    }

};

function getServerInfos(ip) {
    return new Promise((resolve, reject) => {
        const o = {
            timeout: 1000 * 5,
            enableSRV: true
        }
        util.status(ip.host, ip.port, o).then((r) => {
            resolve({ infos: r, available: true });
        }).catch((err) => {
            resolve({ err: err, available: false });
        })
    })
}

function refreshServerList(LocalServerList) {
    if (!initialized) InitServerList();
    if (initialized) {
        const s = serverListMainContainer.querySelector(".servers");
        s.innerHTML = "";
        for (const LocalServer in LocalServerList) {
            if (LocalServerList.hasOwnProperty.call(LocalServerList, LocalServer)) {

                const e = LocalServerList[LocalServer];
                const name = e.name;
                const ip = e.ip;
                var rcon = "";
                var version = "";
                var isAvailable = "loading";
                var availableServers = [];

                //create
                const newServer = document.createElement("div");
                newServer.className = "server";
                newServer.dataset.isOnline = isAvailable;
                newServer.dataset.version = null;
                //button
                const btn = document.createElement("div");
                btn.className = "button";
                const btnImg = document.createElement("div");
                btnImg.className = "img"
                btn.appendChild(btnImg);
                const btnText = document.createElement("p");
                btnText.innerHTML = "Join";
                btn.appendChild(btnText);
                newServer.appendChild(btn);
                //content
                const content = document.createElement("div");
                content.className = "content";
                //icon
                const icon = document.createElement("img");
                icon.className = "logo img";
                icon.src = "./ressources/graphics/images/default-server-icon.webp";
                content.appendChild(icon);
                //infos
                const ServerInfos = document.createElement("div");
                ServerInfos.className = "infos";
                //div
                const d = document.createElement("div");
                //name
                const nameText = document.createElement("p");
                nameText.className = "name";
                nameText.innerText = name;
                d.appendChild(nameText);
                //ip
                const ipText = document.createElement("p");
                ipText.className = "ip";
                ipText.innerText = ip;
                d.appendChild(ipText);
                ServerInfos.appendChild(d);
                //version
                const versionText = document.createElement("p");
                versionText.className = "version";
                versionText.innerText = version;
                ServerInfos.appendChild(versionText);
                content.appendChild(ServerInfos);
                newServer.appendChild(content);
                s.appendChild(newServer);
                const i = util.parseAddress(ip, 25565);
                getServerInfos(i)
                    .then((infos) => {
                        if (infos.available) {
                            version = infos.infos.version.name;
                            isAvailable = infos.available;
                            newServer.style.order = availableServers.length * -1;
                            availableServers.push(infos);


                        } else {
                            version = "Offline";
                            isAvailable = false;
                            newServer.style.order = 1;
                        }
                        versionText.innerText = version;
                        newServer.dataset.isOnline = isAvailable;
                        if (isAvailable) {
                            rcon = infos.infos.favicon;
                            if (rcon == null) console.log(ip + ": " + rcon);

                            icon.src = rcon;
                            icon.style.backgroundImage = "";
                        };


                    })

            }
        }
        serverListMainContainer.dataset.loading = "false";
        /*Initialized */


    } else {
        console.warn(prefix + "Cannot init");
    }
}

module.exports = { getServerList, refreshServerList }