const { readInfo, writeInfo, ServerInfo } = require("@xmcl/server-info");
const fs = require("fs");
const { locationRoot } = require("./launcher")
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
    var c = document.querySelector("#MainContainer .container.show")
    c = c.querySelector("#server-list") ? c.querySelector("#server-list .list") : false;
    if (c) {
        serverListMainContainer = c;
        initialized = true;
        console.log(prefix + "initialized");
    } else {
        initialized = "cannot";
    }

};

function refreshServerList(LocalServerList, version) {
    if (!initialized) InitServerList();
    if (initialized) {
        const s = serverListMainContainer.querySelector(".servers");
        s.innerHTML = "";
        for (const LocalServer in LocalServerList) {
            if (LocalServerList.hasOwnProperty.call(LocalServerList, LocalServer)) {
                const e = LocalServerList[LocalServer];
                const name = e.name;
                const ip = e.ip;
                const rcon = e.icon;
                var version = "version";
                var isAvailable = null;
                const o = {
                    timeout: 1000 * 5,
                    enableSRV: true
                }
                const i = util.parseAddress(ip, 25565);
                util.statusLegacy(i.host, null, o).then((r) => {
                        version = r.version.name;
                        isAvailable = true;
                    }).catch((err) => {
                        console.error(prefix + err);
                    })
                //create
                const newServer = document.createElement("div");
                newServer.className = "server";
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
                const icon = document.createElement("div");
                icon.className = "logo img";
                //load rcon
                content.appendChild(icon);
                //infos
                const infos = document.createElement("div");
                infos.className = "infos";
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
                infos.appendChild(d);
                //version
                const versionText = document.createElement("p");
                versionText.className = "version";
                versionText.innerText = version;
                infos.appendChild(versionText);
                content.appendChild(infos);
                newServer.appendChild(content);
                s.appendChild(newServer);

                serverListMainContainer.dataset.loading = "false";
            }
        }


    } else {
        console.warn(prefix + "Cannot init");
    }
}

module.exports = { getServerList, refreshServerList }