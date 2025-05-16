// code before using NLP
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "storeScanResults") {
        console.log("🔍 Storing scan results:", message.data);

        if (!message.data || message.data.length === 0) {
            console.warn("⚠ No scan results found!");
            sendResponse({ status: "No contracts detected" });
            return;
        }

        chrome.storage.local.set({ scanResults: message.data }, () => {
            if (chrome.runtime.lastError) {
                console.error("❌ Storage error:", chrome.runtime.lastError);
                sendResponse({ status: "Error storing scan results" });
            } else {
                console.log("✅ Scan results stored successfully");
                sendResponse({ status: "Scan Complete!" });
            }
        });

        return true;
    }

    if (message.action === "getScanResults") {
        chrome.storage.local.get(["scanResults"], (data) => {
            sendResponse({ scanResults: data.scanResults || [] });
        });

        return true;
    }

    if (message.action === "openResults") {
        chrome.tabs.create({ url: chrome.runtime.getURL("report.html") });
    }
});