
document.addEventListener("DOMContentLoaded", function () {
  const form  = document.getElementById("navSearchForm");
        const input = document.getElementById("navSearchInput");

  // Utility to safely build regex from the query
  function escapeRegExp(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  form.addEventListener("submit", function (event) {
            event.preventDefault();
        
    const query = input.value.trim();
    // Prefer searching inside <main> if it exists
    const scopeEl = document.querySelector("main") || document.body;

    // Remove previous results (before reading text to avoid self-matching)
    const existing = document.getElementById("searchResults");
    if (existing) existing.remove();

    // Use original-cased text for nicer snippets
    const sourceText = scopeEl.innerText;
    if (query === "") {
      showResultsBox("<p>Please enter a search term.</p>");
      return;
    }

    // Split into sentences while keeping punctuation
    const sentences = sourceText.split(/(?<=[.!?])\s+/);

    // Case-insensitive match
    const qLower = query.toLowerCase();
    const matches = sentences.filter(s => s.toLowerCase().includes(qLower)).slice(0, 10);

    if (matches.length === 0) {
      showResultsBox("<p>No results found.</p>");
      return;
        }

    // Build highlighted HTML
    const rx = new RegExp(escapeRegExp(query), "gi");
    let html = `<p><strong>Results (${matches.length})</strong></p>`;
    matches.forEach(s => {
      const highlighted = s.replace(rx, (m) => `<mark>${m}</mark>`);
      html += `<p style="margin: 0.25rem 0;">• ${highlighted}</p>`;
    });

    showResultsBox(html);
  });

  function showResultsBox(innerHtml) {
    const box = document.createElement("div");
    box.id = "searchResults";
    Object.assign(box.style, {
      position: "fixed",
      top: "100px",
      right: "20px",
      background: "white",
      border: "1px solid #ccc",
      padding: "10px",
      maxHeight: "300px",
      overflowY: "auto",
      zIndex: "9999",
      width: "300px",
      boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
      borderRadius: "8px",
      fontSize: "14px",
      lineHeight: "1.35"
    });
    box.innerHTML = innerHtml;
    document.body.appendChild(box);
  }
    });