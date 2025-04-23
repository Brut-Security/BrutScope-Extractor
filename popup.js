document.getElementById("scrape").addEventListener("click", async () => {
  const domains = await extractDomains();
  const blob = new Blob([domains.join("\n")], { type: "text/plain" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "domains.txt";
  a.click();
  URL.revokeObjectURL(url);
});

document.getElementById("copy").addEventListener("click", async () => {
  const domains = await extractDomains();
  const textToCopy = domains.join("\n");
  try {
    await navigator.clipboard.writeText(textToCopy);
    // Optionally console log or notify silently
  } catch (err) {
    console.error("Failed to copy domains:", err);
  }
});

async function extractDomains() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const tabUrl = new URL(tab.url);
  const currentDomain = tabUrl.hostname.replace(/^www\./, "");

  return new Promise((resolve) => {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      args: [currentDomain],
      func: (currentDomain) => {
        const text = document.body.innerText;
        const domainRegex = /\b(?:\*\.|https?:\/\/\*\.|https?:\/\/)?[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/g;
        const matches = new Set();

        let match;
        while ((match = domainRegex.exec(text)) !== null) {
          let domain = match[0].replace(/^https?:\/\//, "").replace(/^www\./, "");
          if (!domain.includes(currentDomain)) {
            matches.add(domain);
          }
        }
        return Array.from(matches);
      },
    }, (results) => {
      resolve(results[0].result || []);
    });
  });
}
