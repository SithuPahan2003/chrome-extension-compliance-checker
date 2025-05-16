(async () => {
  console.log("✅ Content script running...");

  if (!window.nlp) {
    await new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = chrome.runtime.getURL("libs/compromise.min.js");
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  async function loadRules() {
    const res = await fetch(chrome.runtime.getURL("rules.json"));
    const rules = await res.json();
    return rules.map(rule => ({
      ...rule,
      keywordRegex: new RegExp(rule.keyword, "gi"),
      keywordTerms: rule.keyword.split("|").map(k => k.toLowerCase().trim())
    }));
  }

  async function loadConfig() {
    const res = await fetch(chrome.runtime.getURL("config.json"));
    return await res.json();
  }

  const scanResults = [];
  const securityRequirements = await loadRules();
  const config = await loadConfig();
  const redFlagPhrases = config.redFlagPhrases;
  const modalVerbs = config.modalVerbs;

  const possibleContracts = document.querySelectorAll("section, article, div, p");

  for (const [index, element] of [...possibleContracts].entries()) {
    const text = element.textContent.trim();
    if (text.length < 100) continue;

    const lowerText = text.toLowerCase();
    const doc = window.nlp(text);

    let contractNumber = "";
    let hasRealNumber = false;
    const contractNumberMatch = text.match(/Contract\s*#?\s*(\d{2,})/i);
    if (contractNumberMatch) {
      contractNumber = contractNumberMatch[1];
      hasRealNumber = true;
    }

    const heading = element.closest("h1, h2, h3, h4");
    let contractName = heading ? heading.textContent.trim() : "";

    contractName = contractName.replace(/\(Contract\s*#?[\w-]+\)/gi, '').trim();
    contractName = contractName.replace(/\bContract\s*#?\s*\w+\b/gi, '').trim();
    if (!contractName) contractName = `Contract ${index + 1}`;
    if (!contractNumber) contractNumber = `AUTO-${index + 1}`;

    const issues = securityRequirements.map(rule => {
      let found = false;
      let tone = "";
      let keywordMatched = "";

      for (const keywordTerm of rule.keywordTerms) {
        if (lowerText.includes(keywordTerm)) {
          keywordMatched = keywordTerm;
          found = true;
          break;
        }
      }

      if (found && keywordMatched) {
        const match = doc.match(keywordMatched);
        if (match.found) {
          const negation = match.lookBefore("(#Negative|not|no|optional|without|lack|missing)");
          if (negation?.found) {
            found = false;
          }

          const modal = match.lookBefore("(must|may|should)");
          if (modal?.found && typeof modal.text === 'function') {
            const verb = modal.text().toLowerCase();
            tone = modalVerbs[verb] || "";
          }
        }

        for (let phrase of redFlagPhrases) {
          if (lowerText.includes(phrase) && lowerText.includes(keywordMatched)) {
            found = false;
            break;
          }
        }
      }

      return {
        keyword: rule.specification,
        description: found ? "Present in contract." : rule.reason,
        suggestion: rule.suggestion || "",
        found,
        tone,
        priority: rule.priority || false,
        severity: rule.severity || "medium",
        id: rule.id || "",
        iso27001: rule.iso27001 || [],
        nist: rule.nist || []
      };
    });

    scanResults.push({
      name: contractName,
      contractNumber,
      hasRealNumber,
      status: "Non-Compliant",
      issues,
      contractText: text
    });
  }

  if (scanResults.length > 0) {
    chrome.runtime.sendMessage({ action: "storeScanResults", data: scanResults });
    console.log("✅ Scan results sent:", scanResults);
  } else {
    console.warn("⚠️ No contract-related content detected.");
  }
})();
