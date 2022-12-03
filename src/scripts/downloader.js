const { join } = require('path');
const fs = require('fs');
const axios = require("axios");
const pkg = require("../../package.json").version;
const { Octokit } = require("octokit");
const octokit = new Octokit({ auth: `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` })
const { createWriteStream, existsSync, unlinkSync, copyFile, readFileSync } = require("fs");
var FileSaver = require('file-saver');


function checkForUpdatesExist() {
    return new Promise((resolve, reject) => {
        console.log("Checking for updates...");
        octokit.request('GET /repos/{owner}/{repo}/releases/latest', {
            owner: 'Gagafeee',
            repo: 'BushLauncher'
        }).then((r) => {
            console.log("Got response from GitHub API");
            let res = r.data;
            if (!pkg) reject("cannot find local version");
            if (compareVersion(res.name.replace("v", ""), pkg) == 1) {
                console.log("Update is available...");
                resolve({
                    exist: true,
                    downloadData: {
                        version: res.name.replace("v", ""),
                        url: res.assets[0].browser_download_url,
                        size: res.assets[0].size,
                    }
                });
            } else {
                console.log("Update not available");
                resolve({ exist: false });
            }
        }).catch(err => {
            console.error("Couldn't check for updates");
            console.error(err);
            reject(err);
        });
    });
}

function compareVersion(v1, v2) {
    if (typeof v1 !== 'string') return false;
    if (typeof v2 !== 'string') return false;
    v1 = v1.split('.');
    v2 = v2.split('.');
    const k = Math.min(v1.length, v2.length);
    for (let i = 0; i < k; ++i) {
        v1[i] = parseInt(v1[i], 10);
        v2[i] = parseInt(v2[i], 10);
        if (v1[i] > v2[i]) return 1;
        if (v1[i] < v2[i]) return -1;
    }
    return v1.length == v2.length ? 0 : (v1.length < v2.length ? -1 : 1);
}


module.exports = { checkForUpdatesExist }