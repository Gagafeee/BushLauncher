const { Client, Authenticator } = require('minecraft-launcher-core');
const launcher = new Client();
const msmc = require("msmc");
import {CookieManager} from "./modules/cookie-manager.js";

document.querySelector('#mc-btn').addEventListener('click', () =>{
    startGame();
})

function startGame() {
    //msmc's testing enviroment sometimes runs into this issue that it can't load node fetch
msmc.fastLaunch("raw",
    (update) => {
        //A hook for catching loading bar events and errors, standard with MSMC
        console.log(update)
    }).then(result => {
        //Let's check if we logged in?
        if (msmc.errorCheck(result)){
            console.log(result.reason)
            return;
        }
        //If the login works
        let opts = {
            clientPackage: null,
            // Pulled from the Minecraft Launcher core docs , this function is the star of the show
            authorization: msmc.getMCLC().getAuth(result),
            root: "./minecraft",
            version: {
                number: "1.19.2",
                type: "release"
            },
            forge: "forge.jar",
            memory: {
                max: "6G",
                min: "4G"
            },
            javaPath: "C:/Program Files/Java/jdk-19/bin/javaw.exe"
        }

        console.log(opts.javaPath);
        console.log("Starting!")
        launcher.launch(opts);

        launcher.on('debug', (e) => console.log(e));
        launcher.on('data', (e) => console.log(e));
    }).catch(reason => {
        //If the login fails
        console.log("We failed to log someone in because : " + reason);
    })
}
