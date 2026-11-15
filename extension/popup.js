// PaisaWise Popup Script (100% Standalone On-Device)

document.addEventListener("DOMContentLoaded", () => {
  const activeSection = document.getElementById("active-product-section");
  const activeCard = document.getElementById("active-product-card");
  const toggleSearchBtn = document.getElementById("toggle-search-btn");

  const searchSection = document.getElementById("search-section");
  const urlInput = document.getElementById("url-input");
  const analyzeBtn = document.getElementById("analyze-btn");
  const searchError = document.getElementById("search-error");
  const searchResults = document.getElementById("search-results");

  const incomeInput = document.getElementById("income-input");

  // 1. Initialize user monthly income preference
  chrome.storage.local.get(["user_income"], (res) => {
    if (res && res.user_income) {
      incomeInput.value = res.user_income;
    }
  });

  incomeInput.addEventListener("change", () => {
    const val = parseFloat(incomeInput.value);
    if (!isNaN(val) && val > 0) {
      chrome.runtime.sendMessage({ action: "SET_INCOME", income: val });
    }
  });

  // 2. Toggle search section
  if (toggleSearchBtn) {
    toggleSearchBtn.addEventListener("click", () => {
      searchSection.classList.toggle("hidden");
      toggleSearchBtn.textContent = searchSection.classList.contains("hidden")
        ? "Check another link →"
        : "Hide link input ↑";
    });
  }

  // Helper to extract page info from active tab
  function extractActivePageInfo(tabId, fallbackUrl, callback) {
    // Try sending message to content script first
    chrome.tabs.sendMessage(tabId, { action: "GET_PAGE_INFO" }, (res) => {
      if (!chrome.runtime.lastError && res && (res.title || res.price)) {
        return callback(res);
      }

      // Fallback: executeScript directly on active tab DOM
      try {
        chrome.scripting.executeScript(
          {
            target: { tabId },
            func: () => {
              let title = null;
              let price = null;
              try {
                // Amazon Title
                const aTitle = document.querySelector("#productTitle, #title");
                if (aTitle && aTitle.textContent.trim()) {
                  title = aTitle.textContent.trim();
                }
                // Flipkart Title
                const fTitle = document.querySelector("h1.VU-ZEz, h1.B_NuCI, h1");
                if (!title && fTitle && fTitle.textContent.trim()) {
                  title = fTitle.textContent.trim();
                }
                // Fallback document.title
                if (!title && document.title) {
                  title = document.title.split(":")[0].split("|")[0].replace(/Buy /i, "").trim();
                }

                // Amazon Price
                const aWhole = document.querySelector(".a-price-whole");
                if (aWhole) {
                  const num = parseFloat(aWhole.textContent.replace(/[^\d.]/g, ""));
                  if (!isNaN(num) && num > 0) price = num;
                }
                if (!price) {
                  const aDeal = document.querySelector("#priceblock_ourprice, #priceblock_dealprice");
                  if (aDeal) {
                    const num = parseFloat(aDeal.textContent.replace(/[^\d.]/g, ""));
                    if (!isNaN(num) && num > 0) price = num;
                  }
                }

                // Flipkart Price
                if (!price) {
                  const fPrice = document.querySelector("._30jeq3._16Jk6d, div._30jeq3, div.Nx9bqj");
                  if (fPrice) {
                    const num = parseFloat(fPrice.textContent.replace(/[^\d.]/g, ""));
                    if (!isNaN(num) && num > 0) price = num;
                  }
                }
              } catch (e) {}
              return { title, price };
            }
          },
          (results) => {
            if (!chrome.runtime.lastError && results && results[0] && results[0].result) {
              return callback(results[0].result);
            }
            callback({ title: null, price: null });
          }
        );
      } catch (err) {
        callback({ title: null, price: null });
      }
    });
  }

  // 3. Detect active tab product
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
      // Hide manual search box by default to avoid duplicate cards and scrollbars
      searchSection.classList.add("hidden");

      extractActivePageInfo(activeTab.id, url, (pageInfo) => {
        chrome.runtime.sendMessage(
          {
            action: "CHECK_PRICE",
            url,
            override_price: pageInfo?.price || null,
            custom_name: pageInfo?.title || null
          },
          (res) => {
            if (res && res.success && res.data) {
              renderProductCard(activeCard, res.data);
            } else {
              activeCard.innerHTML = `
                <div style="font-size: 11px; color: #991B1B;">
                  ${res?.error || "Unable to extract active page price."}
                </div>
              `;
            }
          }
        );
      });
    }
  });

  // 4. Handle manual search
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

  // 5. Render Product Card
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
    if (data.timing_verdict.includes("WAIT") || data.timing_verdict.includes("HIGH") || data.timing_verdict.includes("PEAK")) {
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
        <strong>Hours of Work:</strong> ${data.work_time_formatted}
        <div style="font-size: 10px; color: #737373; margin-top: 2px;">
          ${data.affordability_advice}
        </div>
      </div>
    `;
  }
});
