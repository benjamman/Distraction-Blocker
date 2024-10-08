let sectionLinks, sectionIds;

async function setLocal(set) {
    s = set(await browser.storage.local.get());
    browser.storage.local.set(s);
}
let getLocal = browser.storage.local.get;

window.addEventListener("load", async () => {
    // Just to not have to grab options over and over on initial load
    let options = (await getLocal("preferences")).preferences;

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
        setLocal(s => {
            s.preferences.general.autostart = this.value=="true";
            return s;
        });
    };

    /*
        Time limit settings
    */
    // Update the UI for if the time limit is enabled
    if (options.general.timeLimit.enabled) {
        document.getElementById("time-limit-form").style.display = "";
        document.getElementById("time-limited-select").value = 1;
    } else {
        document.getElementById("time-limit-form").style.display = "none";
        document.getElementById("time-limited-select").value = 0;
    }
    // Update the UI to show the current time limit
    // This happens regardless of whether it's enabled when the page is loaded because when
    // it's not enabled and you enabled it then it will be set to the correct time.
    document.getElementById("time-limit-hours").value = Math.floor((options.general.timeLimit.time/60000)/60);
    document.getElementById("time-limit-minutes").value = Math.floor((options.general.timeLimit.time/60000)%60);
    // When the time limit select is used update the UI and settings accordingly
    document.getElementById("time-limited-select").onchange = function() {
        document.getElementById("time-limit-form").style.display = this.value == 1 ? '' : "none";
        setLocal(s => {
            console.log(this.value);
            s.preferences.general.timeLimit.enabled = !!+this.value;
            console.log("Time Limit Enabled:",s.preferences.general.timeLimit.enabled);
            return s;
        });
    };
    // When the "Update Time Limit" button is pressed save the current time limit and enable it
    document.getElementById("save-time-limit").onclick = async function (e) {
        e.preventDefault();
        setLocal(s => {
            s.preferences.general.timeLimit.enabled = true;
            s.preferences.general.timeLimit.time = 
                Math.floor((document.getElementById("time-limit-hours").value*60000)*60)+
                Math.floor(document.getElementById("time-limit-minutes").value*60000);
            window.alert("Time Limit Saved!");
            return s;
        });
    };

	/*
		Routine settings
	*/

    async function changeRoutineType() {
        const value = document.getElementById("routine-select").value;
		for (const routineForm of document.getElementsByClassName("routine-form")) {
			routineForm.style.display = "none";
		}
        if (value == "none") return;
		document.getElementById(value+"-form").style.display = "";
        let s = await getLocal();
        switch (value) {
            case "work-hours":
                if (!s.preferences.general.routine.hours[0]) break;
                document.getElementById("work-hours-start-time").value = s.preferences.general.routine.hours[0].start;
                document.getElementById("work-hours-end-time").value = s.preferences.general.routine.hours[0].end;
                break;
            case "free-hours":
                if (!s.preferences.general.routine.hours[0]) break;
                document.getElementById("free-hours-start-time").value = s.preferences.general.routine.hours[1].start;
                document.getElementById("free-hours-end-time").value = s.preferences.general.routine.hours[1].end;
                break;
            default:
                break;
        }
	}

    // Swap routine type setting when selected value changes
	document.getElementById("routine-select").onchange = async function() {
        changeRoutineType();
        setLocal(s => {
            s.preferences.general.routine.type = this.value;
            return s;
        })
        // let s = await getLocal();
        // s.preferences.general.routine.type = this.value;
        // browser.storage.local.set(s);
    };

    // Display current routine settings on page load
    document.getElementById("routine-select").value = options.general.routine.type;
    changeRoutineType();

	/*
		TODO:: Handle shift settings
	*/

    async function saveRoutine(hours, type) {
        setLocal(s => {
            s.preferences.general.routine.type = type;
            let i = ["work-hours","free-hours","work-shifts"].indexOf(type);
            s.preferences.general.routine.hours[i] = hours;
            return s;
        });;
        window.alert("Routine Saved!");
    }

    document.getElementById("save-work-hours").onclick = function(e) {
        e.preventDefault();
        saveRoutine({
            start: document.getElementById("work-hours-start-time").value,
            end:   document.getElementById("work-hours-end-time").value
        }, "work-hours");
    }

    document.getElementById("save-free-hours").onclick = function(e) {
        e.preventDefault();
        saveRoutine({
            start: document.getElementById("free-hours-start-time").value,
            end:   document.getElementById("free-hours-end-time").value
        }, "free-hours");
    }

	/*  								*\
		### Blocking Rules Section ###
	\*  								*/

	/*
		Domain List settings
	*/

    
    function changeDomainList() { 
        // Swap between black/white list
        // UI only, the actually settings change when you press the save button for either list
        const blForm = document.getElementById("blacklist-form"),
              wlForm = document.getElementById("whitelist-form");
		if (document.getElementById("blacklist-whitelist-select").value === "blacklist") {
			wlForm.style.display = "none";
			blForm.style.display = "";
			return;
		}
		blForm.style.display = "none";
		wlForm.style.display = "";
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
		### Redirect page settings ###
	\*  								*/
    
    
    async function changePageType() { 
        const value = document.getElementById("page-type-select").value;

        // Hide all forms
        for (const form of document.getElementsByClassName("blockpage-form")) {
            form.style.display = "none";
        }

        // Show the relevant form based on the selected value
        if (value == "none") return;
        document.getElementById(value + "-form").style.display = "";
    }

    // Assign the onchange event to trigger the function when the selection changes
    document.getElementById("page-type-select").onchange = changePageType;

    // Display the current Page Type settings on page load
    changePageType();

    
    // Save/Sets password in settings
    function setPassphraze(newPass) {
        if (newPass.length < 4) {
            window.alert("Too short!");
            return;
        }
        browser.storage.local.get().then(s => {
            s.preferences.block_page.password = newPass;
            browser.storage.local.set(s);
        });
        window.alert("Password saved!");
    }

    // Show password on the click of a button
    document.getElementById("show-password").onclick = function() {
        browser.storage.local.get().then(s => {
            window.alert("Password is set to: "+s.preferences.block_page.password);
        });
    };
    
    
    // Save Password when save button is pressed(actually it just prints)
    document.getElementById("save-password").onclick = function(e) {
        e.preventDefault();
        setPassphraze(document.getElementById("password-text-input").value);
    };




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
