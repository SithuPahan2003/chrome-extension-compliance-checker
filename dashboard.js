document.addEventListener("DOMContentLoaded", function () {
    console.log("📚 Rendering glossary...");

    const glossaryContainer = document.getElementById("glossary");

    

if (glossaryContainer) {
    fetch(chrome.runtime.getURL("glossary.json"))
        .then(res => res.json())
        .then(glossary => {
            glossary.forEach(entry => {
                const div = document.createElement("div");
                div.classList.add("glossary-entry");
                div.innerHTML = `
                    <p><strong>ISO 27001:</strong> ${entry.iso}</p>
                    <p><strong>NIST:</strong> ${entry.nist}</p>
                    <p><em>${entry.description}</em></p>
                    <hr>
                `;
                glossaryContainer.appendChild(div);
            });
        })
        .catch(err => {
            console.error("Failed to load glossary.json", err);
            glossaryContainer.innerHTML = "<p>Glossary data unavailable.</p>";
        });
} else {
    console.warn("Glossary container not found in HTML.");
}

});

  

document.addEventListener("DOMContentLoaded", function () {
    console.log("📊 Dashboard loaded");

    chrome.storage.local.get(["scanResults"], function (data) {
        const results = data.scanResults || [];

        if (results.length === 0) {
            document.getElementById("contract-summary").innerHTML = "<p>No scanned contracts found.</p>";
            return;
        }

        // Render summary cards
        renderContractSummary(results);

        // Render bar chart
        let unfulfilledHigh = 0;
        let unfulfilledMedium = 0;
        let fulfilled = 0;

        results.forEach(contract => {
            contract.issues.forEach(issue => {
              const sev = issue.severity?.toLowerCase();
              if (issue.found) {
                fulfilled++;
              } else {
                if (sev === "high") unfulfilledHigh++;
                else if (sev === "medium") unfulfilledMedium++;
              }
            });
          });


          const ctx = document.getElementById("chart-summary").getContext("2d");
            new Chart(ctx, {
            type: "bar",
            data: {
            labels: ["High Mismatches", "Medium Mismatches", "Fulfilled Conditions"],
            datasets: [{
                label: "Compliance Overview",
                data: [unfulfilledHigh, unfulfilledMedium, fulfilled],
                backgroundColor: ["#e74c3c", "#f39c12", "#2ecc71"]
            }]
            },
        options: {
        responsive: true,
        plugins: {
            tooltip: {
            callbacks: {
                title: function () {
                // remove title (top line)
                return "";
                },
                label: function (context) {
                const labelIndex = context.dataIndex;
                const value = context.dataset.data[labelIndex];
                const labels = ["High mismatches", "Medium mismatches", "Fulfilled conditions"];
                return `${labels[labelIndex]}: ${value}`;
                }
            }
            },
                legend: {
                display: false
                }
            },
            scales: {
                y: {
                beginAtZero: true,
                ticks: {
                    precision: 0
                }
                }
            }
        }
        });

        // Set the totals next to the chart
        document.getElementById("totalHigh").textContent = unfulfilledHigh;
        document.getElementById("totalMedium").textContent = unfulfilledMedium;
        document.getElementById("totalFulfilled").textContent = fulfilled;


        // Populate contract dropdown
        
        const summaryContainer = document.getElementById("dashboard-summary");

        results.forEach((contract, index) => {
            const option = document.createElement("option");
            option.value = index;
            option.textContent = contract.name.replace(/\s?\(Contract #AUTO-\d+\)/, ''); // clean name
            
        });

        

        

            
    });

    
    
    // Only run PDF scan button logic on dashboard.html
    if (document.getElementById("processPdf") && window.location.pathname.endsWith("dashboard.html")) {
        const pdfUpload = document.getElementById("pdfUpload");
        const processPdfBtn = document.getElementById("processPdf");
        const uploadStatus = document.getElementById("uploadStatus");

        pdfUpload.addEventListener("change", function() {
            const file = this.files[0];
            if (file) {
                if (file.type === "application/pdf") {
                    processPdfBtn.disabled = false;
                    uploadStatus.textContent = `Selected: ${file.name}`;
                    uploadStatus.className = "status-message success";
                } else {
                    uploadStatus.textContent = "Please select a PDF file";
                    uploadStatus.className = "status-message error";
                    processPdfBtn.disabled = true;
                }
            } else {
                processPdfBtn.disabled = true;
                uploadStatus.textContent = "";
                uploadStatus.className = "status-message";
            }
        });

        processPdfBtn.addEventListener("click", async () => {
            const file = pdfUpload.files[0];
            if (!file) {
                uploadStatus.textContent = "Please select a PDF file first";
                uploadStatus.className = "status-message error";
                return;
            }

            // Ensure pdfjsLib is loaded
            const pdfjsLib = window['pdfjsLib'];
            if (!pdfjsLib || !pdfjsLib.getDocument) {
                uploadStatus.textContent = "PDF.js library not loaded. Please refresh the page.";
                uploadStatus.className = "status-message error";
                return;
            }

            // Set workerSrc via JS to avoid inline <script>
            pdfjsLib.GlobalWorkerOptions.workerSrc = chrome.runtime.getURL('libs/pdf.worker.min.js');

            uploadStatus.textContent = "Processing PDF...";
            uploadStatus.className = "status-message processing";
            processPdfBtn.disabled = true;

            const reader = new FileReader();

            reader.onload = async function () {
                try {
                    const typedarray = new Uint8Array(reader.result);
                    const pdf = await pdfjsLib.getDocument({ data: typedarray }).promise;

                    let fullText = "";
                    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
                        const page = await pdf.getPage(pageNum);
                        const content = await page.getTextContent();
                        const pageText = content.items.map(item => item.str).join(" ");
                        fullText += pageText + "\n";
                    }

                    console.log("📄 Extracted PDF text:", fullText.slice(0, 300));
                    await processExtractedPdf(fullText);
                    uploadStatus.textContent = "PDF processed successfully!";
                    uploadStatus.className = "status-message success";

                } catch (error) {
                    console.error("⚠️ Error reading PDF:", error);
                    uploadStatus.textContent = "Error processing PDF file. Please try again.";
                    uploadStatus.className = "status-message error";
                    processPdfBtn.disabled = false;
                }
            };

            reader.onerror = function() {
                uploadStatus.textContent = "Error reading file. Please try again.";
                uploadStatus.className = "status-message error";
                processPdfBtn.disabled = false;
            };

            reader.readAsArrayBuffer(file);
        });
    }
});

document.getElementById("viewHelp").addEventListener("click", () => {
    window.open(chrome.runtime.getURL("help.html"), "_blank");
  });
  
  
  

function renderContractSummary(results) {
    const container = document.getElementById("contract-summary");
    container.innerHTML = ""; // Clear existing

    results.forEach((contract, index) => {
        const high = contract.issues.filter(i => i.severity.toLowerCase() === "high" && !i.found).length;
        const medium = contract.issues.filter(i => i.severity.toLowerCase() === "medium" && !i.found).length;
        

        const failed = contract.issues.filter(i => !i.found);
        const top3 = failed.slice(0, 3).map(i => i.keyword).join(", ") || "None";
        const totalWeight = contract.issues.reduce((sum, i) => {
            const sev = i.severity?.toLowerCase();
            if (sev === "high") return sum + 20;
            if (sev === "medium") return sum + 10;
            
            return sum;
          }, 0);
          
          const earnedWeight = contract.issues.reduce((sum, i) => {
            if (!i.found) return sum;
            const sev = i.severity?.toLowerCase();
            if (sev === "high") return sum + 20;
            if (sev === "medium") return sum + 10;
            
            return sum;
          }, 0);
          
          const score = totalWeight === 0 ? 100 : Math.round((earnedWeight / totalWeight) * 100);
          

        const wrapper = document.createElement("div");
        wrapper.className = "contract-toggle";

        const header = document.createElement("div");
        header.className = "contract-header";
        header.textContent = contract.name.replace(/\s?\(Contract #AUTO-\d+\)/, '');

        const content = document.createElement("div");
        content.className = "contract-content";
        content.style.display = "none";

        // Generate suggestions list for failed issues
        const suggestions = failed
        .filter(i => i.suggestion)
        .map(i => `<li><strong>${i.keyword}:</strong> ${i.suggestion}</li>`)
        .join("") || "<li>No suggestions available.</li>";

        content.innerHTML = `
        <p>Total Issues: ${failed.length}</p>
        <p>
    <strong><span style="color: red; font-weight: bold;">High: ${high}</span></strong>, 
    <strong><span style="color: orange; font-weight: bold;">Medium: ${medium}</span></strong>
  </p>

        <p><strong>Top Failed Controls:</strong> ${top3}</p>
        <p><strong>Compliance Score:</strong><span style="color: green; font-weight: bold;"> ${score}/100</span></p>
        <div class="suggestions">
            <p><strong>Suggestions:</strong></p>
            <ul>${suggestions}</ul>
        </div>
        `;


        // Toggle logic
        header.addEventListener("click", () => {
            content.style.display = content.style.display === "none" ? "block" : "none";
        });

        wrapper.appendChild(header);
        wrapper.appendChild(content);
        container.appendChild(wrapper);
    });
}

async function processExtractedPdf(text, resultPage = "pdf-results.html") {
    const rules = await fetch(chrome.runtime.getURL("rules.json")).then(res => res.json());
    const config = await fetch(chrome.runtime.getURL("config.json")).then(res => res.json());
    const redFlags = config.redFlagPhrases || [];
    const modalVerbs = config.modalVerbs || {};
  
    const lowerText = text.toLowerCase();
    const doc = window.nlp ? window.nlp(text) : null;
  
    const issues = rules.map(rule => {
      const keywordRegex = new RegExp(rule.keyword, "i");
      const matched = keywordRegex.test(lowerText);
      let found = matched;
      let tone = "";
      let customReason = rule.reason || "";
      
      if (matched && doc) {
        const variations = rule.keyword.split("|");
        let matchedSomething = false;
  
        for (let variant of variations) {
          const trimmed = variant.trim();
          const match = doc.match(trimmed);
  
          if (match.found) {
            matchedSomething = true;
            const sentence = match.sentences().out('text').toLowerCase();
  
            if (redFlags.some(phrase => sentence.includes(phrase))) {
              found = false;
              break;
            }
  
            const negation = match.lookBefore("(not|no|optional|without|lack|missing)");
            if (negation.found) {
              found = false;
              break;
            }
  
            const modal = match.lookBefore("(must|may|should)");
            if (modal.found) {
              const verb = modal.text().toLowerCase();
              tone = modalVerbs[verb] || "";
            }
  
            break;
          }
        }
  
        if (!matchedSomething) {
          found = false;
          customReason = `No mention of "${rule.specification}" found in the contract.`;
        }
      } else if (!matched) {
        found = false;
        customReason = `No mention of "${rule.specification}" found in the contract.`;
      }
  
      return {
        keyword: rule.specification,
        description: found ? "Present in contract." : customReason,
        found,
        tone,
        suggestion: rule.suggestion || "",
        severity: rule.severity || "medium",
        priority: rule.priority || false,
        iso27001: rule.iso27001 || [],
        nist: rule.nist || []
      };
    });
  
    const scannedContract = {
      name: "Imported PDF",
      contractNumber: `PDF-${Date.now()}`,
      hasRealNumber: false,
      status: "Non-Compliant",
      issues,
      contractText: text
    };
  
    // Save to both lastPdfScan and scanResults (prepend to array)
    chrome.storage.local.get(['scanResults'], (data) => {
        const prevResults = Array.isArray(data.scanResults) ? data.scanResults : [];
        const updatedResults = [scannedContract, ...prevResults];
        chrome.storage.local.set(
            { lastPdfScan: scannedContract, scanResults: updatedResults },
            () => {
                chrome.tabs.create({ url: chrome.runtime.getURL(resultPage) });
                // Send to backend
                fetch('http://localhost:3000/save-scan', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(scannedContract)
                })
                .then(res => res.json())
                .then(data => console.log('Saved to backend:', data))
                .catch(err => console.error('Backend save error:', err));
            }
        );
    });
}
  