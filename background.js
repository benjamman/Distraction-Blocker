// background.js

let blocking;

browser.storage.local.set({
  blocking: true
});

(async()=>{
  blocking = (await browser.storage.local.get()).blocking ?? true;
})();

// Doesn't need to be secure, plain text is fine
browser.storage.local.set({
  password: "unblockpls"
});

const blockedUrl = "https://www.youtube.com"; // Replace with the URL you want to block
const redirectUrl = chrome.extension.getURL("redirect/index.html");

// Event listener for web requests
chrome.webRequest.onBeforeRequest.addListener(
  async function(details) {
    blocking = (await browser.storage.local.get()).blocking ?? true;

    console.log("Blocking:", blocking);

    // Check if the request is for the blocked URL
    if (blocking && details.url.indexOf(blockedUrl) !== -1) {
      // Redirect the request to the local HTML file
      return { redirectUrl: redirectUrl+"?page="+details.url };
    }

    const restartBlocking = (await browser.storage.local.get()).restartBlocking;
    if (restartBlocking > 0 && !blocking && Date.now() > restartBlocking) {
        console.log("Turning blocking back on");
        browser.storage.local.set({
          blocking: true
        });
    }

    // Allow all other requests
    return { cancel: false };
  },
  { urls: ["<all_urls>"] },
  ["blocking"]
);