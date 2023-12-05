let sectionLinks, sectionIds;

window.addEventListener("load", async () => {
    // Just to not have to grab options over and over on initial load
    let options = (await browser.storage.local.get()).preferences;

    /*
		Get the sections for highlighting them later.
		It's done here for performance, but realistically the section IDs could be 
		hard-coded a potential security benefit and a small somewhat inconsiquential 
		performance increase.
	*/
	sectionLinks = document.getElementsByClassName("primary-navigation-section-link");
	sectionIds = new Array(...sectionLinks).map(link=>link.href.match(/[^#]+$/)[0]);

	/* 							*\
		### General Section ### 
	\*							*/

	/*
		On/off at start setting
	*/
	document.getElementById("on-at-start-select").onchange = function() {
		console.log(this.value);						// TODO:: Change the setting here
	};

	/*
		Routine settings
	*/

	// TODO:: Display current settings on page load
	document.getElementById("routine-select").onchange = function() {
		for (const routineForm of document.getElementsByClassName("routine-form")) {
			routineForm.style.display = "none";
		}
		if (this.value === "none") return;				// TODO:: Save this value
		document.getElementById(this.value+"-form").style.display = "";
	};

	/*
		TODO:: Handle work hours settings
		TODO:: Handle free hours settings
		TODO:: Handle shift settings
	*/

	/*  								*\
		### Blocking Rules Section ###
	\*  								*/

	/*
		Domain List settings
	*/


    function changeDomainList() { 
        // Swap between black/white list
        // UI only, the actually settings change when you press the save button for either list
		if (document.getElementById("blacklist-whitelist-select").value === "blacklist") {
			document.getElementById("whitelist-form").style.display = "none";
			document.getElementById("blacklist-form").style.display = "";
			return;
		}
		document.getElementById("blacklist-form").style.display = "none";
		document.getElementById("whitelist-form").style.display = "";
	};

    // Swap domain lists when the selected value changes
    document.getElementById("blacklist-whitelist-select").onchange = changeDomainList;

	// Display current Domain List settings on page load
    document.getElementById("blacklist-whitelist-select").value = options.blocking_rules.list_type;
    changeDomainList();
    
	/*
		TODO:: Handle blacklist settings
		TODO:: Handle whitelist settings
	*/

	/*  								*\
		### Data & Syncing Section ###
	\*  								*/

     document.getElementById("clear-local-data").onclick = function() {
        if (confirm("This will clear local Distraction Blocker storage.\nAre you sure you want to do that?")) {
            browser.storage.local.clear();
            browser.runtime.reload();
        }
    };
    document.getElementById("clear-sync-data").onclick = function() {
        if (confirm("This will clear all synced Distraction Blocker storage.\nAre you sure you want to do that?")) {
            browser.storage.sync.clear();
            browser.runtime.reload();
        }
    };

});

window.addEventListener("scroll", () => {
	for (i = sectionIds.length - 1; i >= 0; i--) {
		if ((document.getElementById(sectionIds[i]).getBoundingClientRect()).top < 100) {
			for (const link of sectionLinks) {
				link.classList.remove("selected");
			}
			sectionLinks[i].classList.add("selected");
			break;
		}
	}
});
