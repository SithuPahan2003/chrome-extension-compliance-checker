    //code before using NLP

document.addEventListener("DOMContentLoaded", function () {
    let scanBtn = document.getElementById("scanBtn");

    if (scanBtn) {
        scanBtn.addEventListener("click", function () {
            console.log("🔄 Starting scan...");

            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                chrome.scripting.executeScript({
                    target: { tabId: tabs[0].id },
                    files: ["content.js"]
                }, () => {
                    console.log("📢 Scan triggered, retrieving results...");

                    setTimeout(() => {
                        chrome.runtime.sendMessage({ action: "getScanResults" }, function (response) {
                            if (!response || !response.scanResults || response.scanResults.length === 0) {
                                alert("No scan results found. Try scanning again.");
                                return;
                            }

                            console.log("📢 Retrieved scan results:", response.scanResults);
                            chrome.runtime.sendMessage({ action: "openResults" });
                        });
                    }, 2000);
                });
            });
        });
    }

    var goToExtBtn = document.getElementById("goToExtension");
    if (goToExtBtn) {
        goToExtBtn.addEventListener("click", function() {
            chrome.tabs.create({ url: chrome.runtime.getURL("extension-info.html") });
        });
    }
});

document.getElementById("scanContracts").addEventListener("click", function () {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.scripting.executeScript({
            target: { tabId: tabs[0].id },
            files: ["content.js"]
        });
    });
});