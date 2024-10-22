const params = new URL(location).searchParams;
let overrideLength;

window.addEventListener("focus", async () => {
    if ((await browser.storage.local.get()).blocking.enabled) return;
    window.history.back();
    // Fallback to location.replace
    window.location.replace(params.get("page"));
});

window.addEventListener("load", () => {
	document.getElementById("settings-link").href = chrome.extension.getURL("options/index.html");
	overrideLength = document.getElementById("override-len").value;
	for (const element of document.getElementsByClassName("blocked-page-url")) {
		element.textContent = (new URL(params.get("page"))).hostname;
	}
	document.getElementById("override-len").onchange = function() {
		const customTimeLebel = document.getElementById("custom-time-label");
		const customTimeInput = document.getElementById("custom-time");
		if (this.value === "custom") {
			const customTime = customTimeInput.value;
			if (!customTime) {
				customTimeLebel.style.display = "";
				customTimeInput.style.display = "";
				return;
			}
			overrideLength = customTime * 60000;
			return;
		}
		customTimeLebel.style.display = "none";
		customTimeInput.style.display = "none";
		overrideLength = this.value;

		console.log(overrideLength);
	};
	document.getElementById("custom-time").onchange = function() {
		overrideLength = this.value * 60000;
	};
	document.getElementById("override-button").onclick = async () => {
		if (document.getElementById("password").value !== (await browser.storage.local.get()).preferences.block_page.password) {
			alert("Incorrect password");
			return;
		}
		const restartBlocking = Date.now() + Number(overrideLength);
		browser.storage.local.set({
			blocking: {
                enabled: false,
                reEnable: restartBlocking
            }
		});
		console.log("Disabling blocking. Will restart at:", restartBlocking);
        window.history.back();
        // Fallback to location.replace
        window.location.replace(params.get("page"));
	};
});
