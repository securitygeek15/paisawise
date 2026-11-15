// PaisaWise Popup Script

document.addEventListener("DOMContentLoaded", () => {
  const statusIndicator = document.getElementById("connection-status");
  const statusText = document.getElementById("status-text");

  const activeSection = document.getElementById("active-product-section");
  const activeCard = document.getElementById("active-product-card");

  const urlInput = document.getElementById("url-input");
  const analyzeBtn = document.getElementById("analyze-btn");
  const searchError = document.getElementById("search-error");
  const searchResults = document.getElementById("search-results");

  const statBalance = document.getElementById("stat-balance");
  const statSpend = document.getElementById("stat-spend");

  // 1. Check Backend Health
  chrome.runtime.sendMessage({ action: "CHECK_HEALTH" }, (res) => {
    if (res && res.healthy) {
      statusIndicator.className = "status-indicator status-online";
      statusText.textContent = "Online";
      loadFinancialSnapshot();
    } else {
      statusIndicator.className = "status-indicator status-offline";
      statusText.textContent = "Offline";
      searchError.textContent = "PaisaWise local backend is offline. Run 'python run.py' on your machine.";
      searchError.classList.remove("hidden");
    }
  });

  // 2. Load Financial Snapshot
  function loadFinancialSnapshot() {
    chrome.runtime.sendMessage({ action: "GET_OVERVIEW" }, (res) => {
      if (res && res.success && res.data) {
        const summary = res.data.summary || {};
        if (summary.total_balance !== undefined) {
          statBalance.textContent = Number(summary.total_balance).toLocaleString("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0
          });
        }
        if (summary.total_expense !== undefined) {
          statSpend.textContent = Number(summary.total_expense).toLocaleString("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0
          });
        }
      }
    });
  }

  // 3. Check Active Tab
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const activeTab = tabs[0];
    if (!activeTab || !activeTab.url) return;

    const url = activeTab.url;
    const isAmazon = url.includes("amazon.in") || url.includes("amazon.com");
    const isFlipkart = url.includes("flipkart.com");
    const isProduct =
      (isAmazon && (url.includes("/dp/") || url.includes("/gp/product/") || url.includes("/gp/aw/d/"))) ||
      (isFlipkart && url.includes("/p/"));

    if (isProduct) {
      activeSection.classList.remove("hidden");
      chrome.runtime.sendMessage({ action: "CHECK_PRICE", url }, (res) => {
        if (res && res.success && res.data) {
          renderProductCard(activeCard, res.data);
        } else {
          activeCard.innerHTML = `
            <div style="font-size: 11px; color: #991B1B;">
              ${res?.error || "Unable to extract active page price."}
            </div>
          `;
        }
      });
    }
  });

  // 4. Handle Manual Search
  analyzeBtn.addEventListener("click", () => {
    handleManualAnalysis();
  });

  urlInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      handleManualAnalysis();
    }
  });

  function handleManualAnalysis() {
    const rawUrl = urlInput.value.trim();
    searchError.classList.add("hidden");
    searchResults.classList.add("hidden");

    if (!rawUrl) {
      searchError.textContent = "Please paste an Amazon or Flipkart product URL.";
      searchError.classList.remove("hidden");
      return;
    }

    analyzeBtn.disabled = true;
    analyzeBtn.textContent = "Checking...";

    chrome.runtime.sendMessage({ action: "CHECK_PRICE", url: rawUrl }, (res) => {
      analyzeBtn.disabled = false;
      analyzeBtn.textContent = "Analyze";

      if (res && res.success && res.data) {
        searchResults.classList.remove("hidden");
        renderProductCard(searchResults, res.data);
      } else {
        searchError.textContent = res?.error || "Analysis failed. Please verify the URL.";
        searchError.classList.remove("hidden");
      }
    });
  }

  // Render Product Card
  function renderProductCard(container, data) {
    const curFormatted = Number(data.current_price).toLocaleString("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    });
    const lowFormatted = Number(data.all_time_low).toLocaleString("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    });
    const highFormatted = Number(data.all_time_high).toLocaleString("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    });

    let verdictColor = "#166534";
    let verdictBg = "#DCFCE7";
    if (data.timing_verdict.includes("WAIT") || data.timing_verdict.includes("HIGH")) {
      verdictColor = "#991B1B";
      verdictBg = "#FEE2E2";
    }

    container.innerHTML = `
      <div class="prod-header">${data.product_name}</div>
      <div class="prod-meta">
        <span class="prod-price">${curFormatted}</span>
        <span class="prod-platform">${data.platform}</span>
      </div>
      <div>
        <span class="prod-verdict" style="color: ${verdictColor}; background: ${verdictBg};">
          ${data.timing_verdict}
        </span>
      </div>
      <div style="font-size: 10px; color: #737373; margin-top: 6px; display: flex; justify-content: space-between;">
        <span>Low: <strong>${lowFormatted}</strong></span>
        <span>High: <strong>${highFormatted}</strong></span>
      </div>
      <div class="prod-hours">
        <strong>Reality Check:</strong> ${data.work_time_formatted}
        <div style="font-size: 10px; color: #737373; margin-top: 2px;">
          Safe allowance after: ₹${Number(data.daily_budget_after).toFixed(0)}/day
        </div>
      </div>
    `;
  }
});
