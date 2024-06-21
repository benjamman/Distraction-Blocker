// background.js

async function init(){
    let storage = await browser.storage.local.get();
    // On first run setup the default settings
    if (!storage.init) {
        browser.storage.local.set({
            init: true,
            blocking: {
                enabled: true,
                reEnable: null
            },
            stats: {
                timeDistracted: 0, // Time spent on distracting pages (in seconds)
            },
            preferences: {
                general: {
                    autostart: true,
                    timeLimit: {
                        enabled: false,
                        canOverride: true,
                        time: 10800000
                    },
                    routine: {
                        // By default no routine, I'm not guessing other's routines
                        type: "none",
                        canOverride: true,
                        hours: [
                            { "start": "09:00:00", "end": "17:00:00" }, // Reserved for work-hours routine type
                            { "start": "09:00:00", "end": "17:00:00" }, // Reserved for free-hours routine type
                            // Reserved for work-shifts routine type
                            [{ "start": "09:00:00", "end": "12:00:00" }, { "start": "13:00:00", "end": "17:00:00" }]
                        ]
                    }
                },
                blocking_rules: {
                    list_type: "blacklist",
                    blacklist: {
                        sites: [
                            "youtube.com"
                        ]
                    }
                },
                block_page: {
                    type: "password",
                    // This doesn't need to be secure, it really doesn't matter since
                    // it's just to make you think while you type it
                    password: "unblockpls"
                },
                syncing: {
                    sync_enabled: true,
                    general: true,
                    blocking_rules: true,
                    blocking_rules_overrides: false,
                    block_page: true,
                    theme: true
                }
            }
        });
    }
    
    if (!storage.preferences.general.autostart || storage.preferences.general.routine.type !== "none" || storage.preferences.general.timeLimit.enabled) {
        storage.blocking.enabled = checkBlocking();
        browser.storage.local.set(storage);
    }
    
    //blocking = (await browser.storage.local.get()).blocking.enabled ?? true;
}

init();


// These two vars need to be replaced with user changable values from browser.storage
const blockedOrigins = [
    "https://www.youtube.com"
];
const redirectUrl = chrome.extension.getURL("redirect/index.html");


let lastActive = Date.now();

function enableBlocking() {
    console.log("Turning blocking back on");
    browser.storage.local.set({ blocking: { enabled: true, reEnable: -1 } });
    return true;
}

async function checkTimeLimit(s) {
    let storage = s || await browser.storage.local.get();
    // If the time limit is not enabled there's no sense checking if it's passed
    if (!storage.preferences.general.timeLimit.enabled || (storage.blocking.reEnable > 0 && storage.preferences.general.timeLimit.canOverride)) return false;
    // If time limit is passed return true
    if (storage.stats.timeDistracted >= (storage.preferences.general.timeLimit.time / 1000)) {
        return enableBlocking();
    }
    return false; // Default to false
}


async function checkShift(shift) {
    let now = Date.now(), 
        start = new Date(), 
        end = new Date();
    let split;


    split = shift.start.split(":");
    console.log("split (start)", split);
    start.setHours(split[0]); 
    start.setMinutes(split[1]); 
    start.setSeconds(split[2]);

    split = shift.end.split(":");
    console.log("split (end)", split);
    end.setHours(split[0]); 
    end.setMinutes(split[1]); 
    end.setSeconds(split[2]);

    let res = start < now && end > now;

    // console.log("shift", shift);
    // console.log("checkShift", res);

    return res;
}

async function checkRoutine(s) {
    let storage = s || await browser.storage.local.get();
    console.log("Checking routine")
    // If the routine is not enabled no sense checking if it's passed
    if (storage.preferences.general.routine.type === "none" || (storage.blocking.reEnable > 0 && storage.preferences.general.routine.canOverride)) return false;
    // Now to check the routine;
    switch(storage.preferences.general.routine.type) {
        case "work-hours":
            return checkShift(storage.preferences.general.routine.hours[0]);

        case "free-hours":
            return !(await checkShift(storage.preferences.general.routine.hours[1]));

        case "work-shifts":
            break;
    }
    return false; // Default to false
}

function isBlocked(pageUrl) { return blockedOrigins.map(url => url == (new URL(pageUrl)).origin).sort().reverse()[0]; }

async function checkBlocking() {
    let storage = await browser.storage.local.get(),
        blocking = storage.blocking;
    // If blocking is already enabled or allowed distracted time is up
    if (blocking.enabled || await checkTimeLimit(storage) || await checkRoutine(storage)) return true;
    // Reinable blocking after a break
    if (blocking.reEnable > 0 && Date.now() > blocking.reEnable) {
        return enableBlocking();
    }
    // And otherwise just send back it's current value
    return blocking.enabled;
}


function getActiveTab() { return browser.tabs.query({active: true, currentWindow: true}); }

async function checkActiveTab() {
    let blocking = await checkBlocking();
    if (!blocking) return;
    // Get the active tab
    getActiveTab().then((tabs) => {
        let tab = tabs[0];
        // Check the active tab
        if (!isBlocked(tab.url)) return;
        // Passed checks, then block the active tab
        browser.tabs.update({ url: redirectUrl+"?page="+tab.url });
    });
}

browser.tabs.onActivated.addListener(() => checkActiveTab());
browser.tabs.onUpdated.addListener(() => checkActiveTab());

setInterval(() => {
    getActiveTab().then(async tabs => {
        let tab = tabs[0];
        // When It's been at least 20 seconds since a positive activity check and you've been active for the last 20 seconds
        if (lastActive < Date.now()-20000 && await browser.idle.queryState(20) === "active" && isBlocked(tab.url)) {
            lastActive = Date.now();
            // Update the distraction stats
            let storage = await browser.storage.local.get();
            storage.stats.timeDistracted += 20;
            browser.storage.local.set(storage);
            // Temp for debug
            console.log(storage.stats.timeDistracted);
        }
        checkActiveTab();
    });
}, 20000);

