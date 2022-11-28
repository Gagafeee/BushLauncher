const os = require('os');
const { DataManager } = require("./modules/data-manager.js");
const optionsDataManager = new DataManager({
    configName: 'launch-options',
    defaults: {}
});

const optionPanel = document.querySelector("#OPTION-container");
const ramSetting = optionPanel.querySelector("#ram-setting");
const ramSlider = ramSetting.querySelector("input[type=range]");

function Init() {
    /*ram*/
    const DisplayRam = Math.trunc((os.totalmem() / (1024 * 1024)) / 1000);
    var savedRam = optionsDataManager.get("ram");
    console.log(savedRam);
    if(savedRam == undefined){
        optionsDataManager.set("ram", 3);
        savedRam = 3;
    }
    ramSetting.querySelector(".result").innerHTML = savedRam + "G";
    ramSlider.max = DisplayRam;
    ramSlider.min = 3;
    ramSlider.value = savedRam;
    ramSlider.addEventListener("input", (e) => {
        ramSetting.querySelector(".result").innerHTML = e.target.valueAsNumber + "G";
        optionsDataManager.set("ram", e.target.valueAsNumber);
    })

}

module.exports = { Init }