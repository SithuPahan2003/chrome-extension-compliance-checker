// code before using NLP
document.addEventListener("DOMContentLoaded", function () {
    const scanButton = document.getElementById("scanAgain");

    if (scanButton) {
        scanButton.addEventListener("click", startScan);
    }

    loadLastScanTime();
    startScan(); // Automatically run scan on page load
});

function startScan() {
    const suppliersContainer = document.getElementById("suppliers-container");
    const mismatchAlertsContainer = document.getElementById("mismatch-alerts");
    const loadingMessage = document.getElementById("loading");
    const lastScanDisplay = document.getElementById("last-scan");
    const scanButton = document.getElementById("scanAgain");

    loadingMessage.style.display = "block";
    scanButton.disabled = true;

    suppliersContainer.innerHTML = "";
    mismatchAlertsContainer.innerHTML = "";

    setTimeout(() => {
        chrome.storage.local.get(["scanResults"], function (data) {
            console.log("📌 Retrieved scan results:", data.scanResults);

            loadingMessage.style.display = "none";
            scanButton.disabled = false;

            const results = data.scanResults || [];

            if (results.length === 0) {
                suppliersContainer.innerHTML = "<p>No supplier data available.</p>";
                return;
            }

            const lastScanTime = new Date().toLocaleString();
            localStorage.setItem("lastScanTime", lastScanTime);
            lastScanDisplay.innerText = `Last Scan: ${lastScanTime}`;

            const contractCards = [];
            const alertCards = [];

            for (const supplier of results) {
                const name = supplier.name?.trim() || "";
                const contractNumber = supplier.contractNumber?.trim() || "";

                const displayTitle = name || contractNumber
    ? name || `Contract #${contractNumber}`
    : "Unnamed Contract";

                const supplierCard = document.createElement("div");
                supplierCard.className = "supplier-card";

                const titleElem = document.createElement("h3");
                titleElem.textContent = displayTitle;
                supplierCard.appendChild(titleElem);

                const issues = supplier.issues || [];
                const isCompliant = issues.every(issue => issue.found);
                const statusElem = document.createElement("p");
                statusElem.innerHTML = isCompliant
                    ? `<span class="icon tick"></span> Status: <strong style="color: green;">Compliant</strong>`
                    : `<span class="icon cross"></span> Status: <strong style="color: red;">Non-Compliant</strong>`;
                supplierCard.appendChild(statusElem);

                const ruleList = document.createElement("ul");
                // Define severity order for sorting
const severityRank = { "high": 1, "medium": 2, "low": 3 };

// Sort issues by severity
issues.sort((a, b) => {
    const sa = severityRank[a.severity?.toLowerCase()] || 4;
    const sb = severityRank[b.severity?.toLowerCase()] || 4;
    return sa - sb;
});

issues.forEach(rule => {
    if (!rule.keyword) return;
    const item = document.createElement("li");
    let sevHTML = "";
if (rule.severity) {
    const sev = rule.severity.toLowerCase();
    const sevColor = sev === "high" ? "red" : sev === "medium" ? "orange" : "green";
    sevHTML = `<span class="severity-tag" style="color: ${sevColor}; font-weight: bold;">[${sev.toUpperCase()}]</span> `;
}
let mappingHTML = "";
if (rule.iso27001?.length || rule.nist?.length) {
    mappingHTML += "<br><small style='color: gray'>";
    if (rule.iso27001?.length) mappingHTML += `ISO 27001: ${rule.iso27001.join(", ")} `;
    if (rule.nist?.length) mappingHTML += `NIST: ${rule.nist.join(", ")}`;
    mappingHTML += "</small>";
}

item.innerHTML = `${rule.found === false ? "❌" : "✅"} ${sevHTML}<strong>${rule.keyword}</strong>: ${rule.description}${mappingHTML}`;


    ruleList.appendChild(item);
});

                supplierCard.appendChild(ruleList);
                suppliersContainer.appendChild(supplierCard);
                contractCards.push(supplierCard);

                // Mismatch alerts - only failed priority issues
                const failedPriority = issues.filter(rule => rule.priority && rule.found === false);
                // Sort failed priority issues by severity
failedPriority.sort((a, b) => {
    const sa = severityRank[a.severity?.toLowerCase()] || 4;
    const sb = severityRank[b.severity?.toLowerCase()] || 4;
    return sa - sb;
});


                if (failedPriority.length > 0) {
                    const alertDiv = document.createElement("div");
                    alertDiv.className = "mismatch-alert";

                    const issuesHTML = failedPriority.map(rule => {
                        const sev = rule.severity?.toLowerCase() || "unknown";
                        const sevColor = sev === "high" ? "red" : sev === "medium" ? "orange" : "green";
                        const sevHTML = `<span class="severity-tag" style="color: ${sevColor}; font-weight: bold;">[${sev.toUpperCase()}]</span>`;
                        let mappings = "";
if (rule.iso27001?.length || rule.nist?.length) {
    mappings += "<br><small style='color: gray'>";
    if (rule.iso27001?.length) mappings += `ISO 27001: ${rule.iso27001.join(", ")} `;
    if (rule.nist?.length) mappings += `NIST: ${rule.nist.join(", ")}`;
    mappings += "</small>";
}
return `<li>❌ ${sevHTML} <strong>${rule.keyword.toLowerCase()}:</strong> ${rule.description}${mappings}</li>`;

                    }).join("");
                    

                    alertDiv.innerHTML = `
                        <span class="icon alert"></span>
                        <strong>${displayTitle}</strong>
                        <ul>${issuesHTML}</ul>
                    `;
                    mismatchAlertsContainer.appendChild(alertDiv);
                    alertCards.push(alertDiv);
                }
            }

            function syncCardHeights() {
                for (let i = 0; i < contractCards.length; i++) {
                    const height = Math.max(
                        contractCards[i]?.offsetHeight || 0,
                        alertCards[i]?.offsetHeight || 0
                    );
                    contractCards[i].style.height = `${height}px`;
                    if (alertCards[i]) alertCards[i].style.height = `${height}px`;
                }
            }

            setTimeout(syncCardHeights, 100);
            window.addEventListener("resize", syncCardHeights);
        });
    }, 1000);
}

function loadLastScanTime() {
    const time = localStorage.getItem("lastScanTime");
    if (time) {
        document.getElementById("last-scan").innerText = `Last Scan: ${time}`;
    }
}

// Enable JSON export
document.getElementById("downloadJson").addEventListener("click", function () {
    chrome.storage.local.get(["scanResults"], function (data) {
        const results = data.scanResults || [];

        const exportData = {
            timestamp: new Date().toISOString(),
            scannedContracts: results.length,
            contracts: results
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = url;
        link.download = `compliance_scan_${new Date().toISOString().slice(0,19).replace(/[:T]/g, "-")}.json`;
        link.click();

        URL.revokeObjectURL(url);
    });
});

// PDF Export Button Handler
document.getElementById("downloadPdf").addEventListener("click", async function () {
    try {
        // Dynamically inject the script if not already loaded
        if (!window.jspdf) {
            await new Promise((resolve, reject) => {
                const script = document.createElement("script");
                script.src = chrome.runtime.getURL("libs/jspdf.umd.min.js");
                script.onload = resolve;
                script.onerror = reject;
                document.head.appendChild(script);
            });
        }

        const jsPDF = window.jspdf.jsPDF;

        if (!jsPDF) throw new Error("jsPDF not found in module");

        chrome.storage.local.get(["scanResults"], function (data) {
            const results = data.scanResults || [];
            const doc = new jsPDF();

            doc.setDrawColor(180); // light grey
            doc.rect(10, 10, 190, 277); // border box for A4 page


            doc.setFont("helvetica", "bold");
            doc.setFontSize(16);
            doc.text("Cybersecurity Compliance Report", 15, 20);
            doc.setFontSize(12);
            doc.setFont("helvetica", "normal");
            doc.text(`Generated: ${new Date().toLocaleString()}`, 15, 30);

            let y = 40;

            const severityColor = {
                high: [255, 0, 0],
                medium: [255, 165, 0],
                low: [0, 128, 0]
            };

            results.forEach((supplier, index) => {
                const name = supplier.name || `Contract ${index + 1}`;
                const number = supplier.contractNumber || "";
                const issues = supplier.issues || [];

                // Header for contract
                doc.setFont("helvetica", "bold");
                doc.setTextColor(0, 0, 0);
                doc.text(name || `Contract #${number}` || "Unnamed Contract", 15, y);

                y += 8;

                const isCompliant = issues.every(issue => issue.found);
                doc.setFont("helvetica", "normal");
                doc.setTextColor(isCompliant ? 0 : 255, isCompliant ? 128 : 0, 0);
                doc.text(`Status: ${isCompliant ? "Compliant" : "Non-Compliant"}`, 15, y);
                y += 8;

                // List issues
                issues.forEach(issue => {
                    if (!issue.keyword || !issue.description) return;
                
                    const sev = issue.severity?.toLowerCase() || "low";
                    const severityTag = `[${sev.toUpperCase()}]`;
                    const keywordPart = cleanText(`${issue.keyword}:`);
                    const description = cleanText(`${issue.description}`);
                    

                    // Color-coded PASS/FAIL
                    const isFail = issue.found === false;
                    const statusText = isFail ? "[FAIL]" : "[PASS]";
                    const statusColor = isFail ? [255, 0, 0] : [0, 128, 0];

                    function cleanText(text) {
                        return text.replace(/[^\x20-\x7E]/g, ""); // Remove non-printable characters
                    }              
                                      
                    
                     // Start rendering
                    const startX = 15;
                    let currentY = y;
                
                    // 1. Draw statusText
                    doc.setTextColor(...statusColor);
                    doc.text(statusText, startX, currentY);
                
                    // 2. Draw the severity label (colored)
                    const [r, g, b] = severityColor[sev] || [0, 0, 0];
                    const severityX = startX + doc.getTextWidth(statusText + " ");
                    doc.setTextColor(r, g, b);
                    doc.text(severityTag, severityX, currentY);
                
                    // 3. Draw keyword part (black again)
                    const keywordX = severityX + doc.getTextWidth(severityTag + " ");
                    doc.setTextColor(0, 0, 0);
                    doc.text(keywordPart, keywordX, currentY);
                
                    // 4. Wrap and draw description on the next lines
                    const wrappedLines = doc.splitTextToSize(description, 160);
                    let mappings = [];
                    if (issue.iso27001?.length) mappings.push(`ISO 27001: ${issue.iso27001.join(", ")}`);
                    if (issue.nist?.length) mappings.push(`NIST: ${issue.nist.join(", ")}`);
                    const mappingText = mappings.length ? mappings.join(" | ") : "";

                    currentY += 7;
                    wrappedLines.forEach(wrapLine => {
                        doc.text(wrapLine, startX + 5, currentY);
                        currentY += 7;
                    });

                    if (mappingText) {
                        doc.setTextColor(100); // gray
                        doc.setFontSize(10);
                        doc.text(mappingText, startX + 5, currentY);
                        doc.setFontSize(12);
                        currentY += 7;
                    }
                
                    y = currentY + 3;
                
                    if (y > 270) {
                        doc.addPage();
                        doc.setDrawColor(180);
                        doc.rect(10, 10, 190, 277); // Border
                        y = 20;
                    }
                });
            
                y += 10;
            });

            doc.save(`compliance_report_${new Date().toISOString().slice(0,19).replace(/[:T]/g, "-")}.pdf`);
        });
    } catch (error) {
        console.error("❌ PDF Export Error:", error);
        alert("PDF export failed. Check console for details.");
    }
});

document.getElementById("viewDashboard").addEventListener("click", () => {
    window.open(chrome.runtime.getURL("dashboard.html"), "_blank");
  });
  

