//Deprecated??

console.log("Productivity Blocker Extension Loaded.");

const channel = new MessageChannel();
channel.port1.onmessage = e => {
	if (e.data === "pong") {
		console.log("Connection test successful!");
		return;
	}
	console.log("Message recieved from frame: "+e.data);
};

async function doStuffs() {
	const overrideTime = (await browser.storage.local.get()).override;
	alert(overrideTime);

	if (Date.now() < overrideTime) {
		// alert("timeout: " + (Date.now() - overrideTime))
		setTimeout(
			doStuffs,
			overrideTime - Date.now()
		);
		return;
	}

	if (location.origin.match(/youtube\.com/)) {
		console.log(Date.now());
		createFrame();
	}
}

function createFrame() {
	const frame = document.createElement('iframe');
	frame.id = "productivity-blocker-frame";
	frame.src = browser.runtime.getURL("redirect.html");
	frame.style.zIndex = "10000";
	frame.style.position = "absolute";
	frame.style.left = "0";
	frame.style.top = "0";
	frame.style.width = "100vw";
	frame.style.height = "100dvh"
	// Test connection to iframe
	frame.addEventListener("load", () => {
		console.log("Testing connection...")
		frame.contentWindow.postMessage("ping", "*", [
		  channel.port2,
		]);
	});

	document.body.appendChild(frame);
}

function removeFrame() {
	
}

doStuffs();

// async function doStuffs() {
// 	const overrideTime = (await browser.storage.local.get()).override;
// 	alert(overrideTime);
// 	if (Date.now() < overrideTime) {
// 		// alert("timeout: " + (Date.now() - overrideTime))
// 		setTimeout(
// 			doStuffs,
// 			overrideTime - Date.now()
// 		);
// 		return;
// 	}
// 	if (location.origin.match(/youtube\.com/)) {
// 		console.log(Date.now());
// 		location.replace(browser.runtime.getURL("password-page.html?dir="+location));
// 	}
// }

// doStuffs();

