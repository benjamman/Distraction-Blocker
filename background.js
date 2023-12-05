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
                    routine: {
                        // By default no routine, I'm not guessing other's routines
                        type: "none",
                        hours: [] // Just so it exists later
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
