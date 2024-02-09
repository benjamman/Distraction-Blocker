// background.js

async function init(){
    // On first run setup the default settings
    if (!(await browser.storage.local.get()).init) {
        browser.storage.local.set({
            init: true,
            blocking: {
                enabled: true,
                reEnable: null
            },
            preferences: {
                general: {
                    autostart: true,
                    timeLimit: {
                        enabled: false,
                        time: 10800000
                    },
                    routine: {
                        // By default no routine, I'm not guessing other's routines
                        type: "none",
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
                theme: {

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
    
    const storage = await browser.storage.local.get();
    blocking = storage.blocking;
    routine = storage.preferences.general.routine;
    
    //blocking = (await browser.storage.local.get()).blocking.enabled ?? true;
}

let blocking, routine;
init();

const blockedUrl = "https://www.youtube.com"; // Replace with the URL you want to block
const redirectUrl = chrome.extension.getURL("redirect/index.html");

// Event listener for web requests
browser.webRequest.onBeforeRequest.addListener(
  async function(details) {
    blocking = (await browser.storage.local.get()).blocking.enabled ?? true;

    console.log("Blocking:", blocking);

    // Check if the request is for the blocked URL
    if (blocking && details.url.indexOf(blockedUrl) !== -1) {
      // Redirect the request to the local HTML file
      return { redirectUrl: redirectUrl+"?page="+details.url };
    }

    // If it's passed the time that blocking is set to turn back on, either through a schedule or from the redirect page, enable blocking.
    const restartBlocking = (await browser.storage.local.get()).blocking.reEnable;
    if (restartBlocking > 0 && !blocking && Date.now() > restartBlocking) {
        console.log("Turning blocking back on");
        browser.storage.local.set({
          blocking: {
              enabled: true
          }
        });
    }

    // Allow all other requests
    return { cancel: false };
  },
  { urls: ["<all_urls>"] },
  ["blocking"]
);
