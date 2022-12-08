class TabSystem {
    constructor(tabs) {
        /*
        tablist must be:
        [
        {button:<div>,container:<div>,name: ""},
        {button:<div>,container:<div>,name: ""}
        ]
        
        */
        if (typeof tabs == "object") {
            this.tabList = tabs;
            this.reset()
        } else {
            console.error("tabsList must be an array");
        }
    }
    switch (tabName) {
        let tabI = -1;
        this.tabList.forEach(tab => {
            if (tab.name == tabName) {
                tabI = this.tabList.indexOf(tab);
            }
        })
        if (tabI > -1) {
            const tab = this.tabList[tabI];
            this.reset();
            tab.container.style.display = ""; /*to display it */
            tab.button.classList.add("selected")
        }else {
            console.error(new Error("Cannot find tab: " + tabName));
        }


    }
    reset() {
        this.tabList.forEach(tab => {
            tab.container.style.display = "none";
            tab.button.classList.remove("selected");
        })
    }
}

module.exports = { TabSystem }