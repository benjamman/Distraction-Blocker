
window.addEventListener("load", async () => {
    const toggleButton = document.getElementById("global-toggle");
    // Set displayed state of global toggle butoon on load
    if ((await browser.storage.local.get()).blocking.enabled) {
        // By default it says it's off so it only needs to be updated if it's on
        toggleButton.classList.add("enabled");
        toggleButton.textContent = "Turn Off";
    }
    // Handle global toggle button
    toggleButton.onclick = async function() {
        const storage = (await browser.storage.local.get());
        if (storage.blocking) {
            document.body.style.width = "555px";
            const unlock = await prompt("Please input the unblocking passphraze") === storage.preferences.block_page.password;
            if (!unlock) {
                alert("Incorrect Password");
                document.body.style.width = "349px";
                return;
            }
            document.body.style.width = "349px";
        }
        // Toggle the enabled class and text content
        this.classList.toggle("enabled");
        const enabled = this.classList.contains("enabled");
        this.textContent = enabled ? "Turn Off" : "Turn On";
        // Toggle blocking state
        browser.storage.local.set({
            blocking: {
                enabled: true
            }
        });
        console.log("Turned Blocking", enabled ? "On" : "Off");
    }
});

