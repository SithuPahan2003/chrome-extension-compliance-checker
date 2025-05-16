document.addEventListener("DOMContentLoaded", () => {
    chrome.storage.local.get("lastPdfScan", (data) => {
      const contract = data.lastPdfScan;
      if (!contract) {
        document.getElementById("pdf-scan-summary").innerHTML = "<p>No PDF scan data found.</p>";
        return;
      }
  
      renderPdfContractSummary(contract);
      renderMismatchSection(contract.issues);
      renderFulfilledSection(contract.issues);
      renderNotMentionedSection(contract.issues);
  
      const backBtn = document.getElementById("backToDashboard");
      if (backBtn) {
        backBtn.addEventListener("click", () => {
          window.location.href = chrome.runtime.getURL("dashboard.html");
        });
      }
    });
  });
  
  function renderPdfContractSummary(contract) {
    const container = document.getElementById("pdf-scan-summary");
  
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
  
    const suggestions = failed
      .filter(i => i.suggestion)
      .map(i => `<li><strong>${i.keyword}:</strong> ${i.suggestion}</li>`)
      .join("") || "<li>No suggestions available.</li>";
  
    container.innerHTML = `
      <div class="contract-summary">
        <p>Total Issues: ${failed.length}</p>
        <p>
          <strong><span style="color: red;">High: ${high}</span></strong>,
          <strong><span style="color: orange;">Medium: ${medium}</span></strong>
        </p>
        <p><strong>Top Failed Controls:</strong> ${top3}</p>
        <p><strong>Compliance Score:</strong> <span style="color: green;">${score}/100</span></p>
        <div class="suggestions">
          <p><strong>Suggestions:</strong></p>
          <ul>${suggestions}</ul>
        </div>
      </div>
    `;
  }
  
  function renderMismatchSection(issues) {
    const mismatchContainer = document.getElementById("pdf-mismatches");
    const failed = issues.filter(i => !i.found && !i.description.startsWith('No mention of'));
    if (failed.length === 0) {
      mismatchContainer.innerHTML = "<p>No mismatches found 🎉</p>";
      return;
    }
  
    const mismatchList = failed.map(issue => `
      <li>
        <span style="color: ${issue.severity === "high" ? "red" : "orange"}; font-weight: bold;">
          ❌ ${issue.keyword} (${issue.severity})
        </span> - ${issue.description}
      </li>
    `).join("");
  
    mismatchContainer.innerHTML = `<ul>${mismatchList}</ul>`;
  }
  
  function renderFulfilledSection(issues) {
    const fulfilledContainer = document.getElementById("pdf-fulfilled");
    const passed = issues.filter(i => i.found);
    if (passed.length === 0) {
      fulfilledContainer.innerHTML = "<p>No fulfilled conditions found.</p>";
      return;
    }
  
    const fulfilledList = passed.map(issue => `
      <li>
        ✅ <strong>${issue.keyword}</strong> (${issue.severity}) - Present in contract
      </li>
    `).join("");
  
    fulfilledContainer.innerHTML = `<ul>${fulfilledList}</ul>`;
  }
  
  function renderNotMentionedSection(issues) {
    const notMentionedContainer = document.getElementById("pdf-not-mentioned");
    const notMentioned = issues.filter(i => i.description.startsWith('No mention of'));
    if (notMentioned.length === 0) {
        notMentionedContainer.innerHTML = "<p>All conditions are mentioned in the contract.</p>";
        return;
    }
    const notMentionedList = notMentioned.map(issue => `
      <li>
        <span style="color: #888;">&#10060; <strong>${issue.keyword}</strong> (${issue.severity}) - Not mentioned in contract</span>
      </li>
    `).join("");
    notMentionedContainer.innerHTML = `<ul>${notMentionedList}</ul>`;
  }
  