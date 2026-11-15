// PaisaWise Content Script - Runs on Amazon and Flipkart

(function () {
  const currentUrl = window.location.href;
  const isAmazon = currentUrl.includes("amazon.in") || currentUrl.includes("amazon.com");
  const isFlipkart = currentUrl.includes("flipkart.com");

  // Verify this is a product detail page
  const isProductPage =
    (isAmazon && (currentUrl.includes("/dp/") || currentUrl.includes("/gp/product/") || currentUrl.includes("/gp/aw/d/"))) ||
    (isFlipkart && currentUrl.includes("/p/"));

  if (!isProductPage) {
    return;
  }

  // Extract DOM price
  function extractPagePrice() {
    try {
      if (isAmazon) {
        const whole = document.querySelector(".a-price-whole");
        if (whole) {
          const raw = whole.textContent.replace(/[^\d.]/g, "");
          const num = parseFloat(raw);
          if (!isNaN(num) && num > 0) return num;
        }
        const block = document.querySelector("#priceblock_ourprice, #priceblock_dealprice");
        if (block) {
          const raw = block.textContent.replace(/[^\d.]/g, "");
          const num = parseFloat(raw);
          if (!isNaN(num) && num > 0) return num;
        }
      } else if (isFlipkart) {
        const el = document.querySelector("._30jeq3._16Jk6d, div._30jeq3, div.Nx9bqj");
        if (el) {
          const raw = el.textContent.replace(/[^\d.]/g, "");
          const num = parseFloat(raw);
          if (!isNaN(num) && num > 0) return num;
        }
      }
    } catch (e) {
      console.warn("DOM price extract error", e);
    }
    return null;
  }

  // Build UI
  function setupUI() {
    if (document.getElementById("paisawise-floating-trigger")) return;

    // 1. Floating Trigger Button
    const trigger = document.createElement("div");
    trigger.id = "paisawise-floating-trigger";
    trigger.innerHTML = `
      <div class="pw-logo">P</div>
      <span>PaisaWise Check</span>
    `;
    document.body.appendChild(trigger);

    // 2. Drawer Container
    const drawerContainer = document.createElement("div");
    drawerContainer.id = "paisawise-drawer-container";
    drawerContainer.innerHTML = `
      <div id="paisawise-drawer">
        <div class="pw-header">
          <div class="pw-header-title">
            <span class="pw-badge">PaisaWise</span>
            <span style="font-size: 12px; font-weight: 600; color: #737373;">Smart Buy Oracle</span>
          </div>
          <button class="pw-close-btn" id="pw-close-drawer">&times;</button>
        </div>
        <div class="pw-body" id="pw-drawer-body">
          <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px 20px; gap: 12px;">
            <div style="width: 24px; height: 24px; border: 3px solid #171717; border-top-color: transparent; border-radius: 50%; animation: pw-spin 0.8s linear infinite;"></div>
            <span style="font-size: 12px; color: #737373;">Analyzing 6-month historical price records...</span>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(drawerContainer);

    // Add spinner keyframes
    const style = document.createElement("style");
    style.textContent = `
      @keyframes pw-spin { to { transform: rotate(360deg); } }
    `;
    document.head.appendChild(style);

    // Event Listeners
    trigger.addEventListener("click", () => {
      drawerContainer.classList.add("pw-open");
      loadProductData();
    });

    document.getElementById("pw-close-drawer").addEventListener("click", () => {
      drawerContainer.classList.remove("pw-open");
    });

    drawerContainer.addEventListener("click", (e) => {
      if (e.target === drawerContainer) {
        drawerContainer.classList.remove("pw-open");
      }
    });
  }

  // Load product data from background
  function loadProductData() {
    const body = document.getElementById("pw-drawer-body");
    const domPrice = extractPagePrice();

    chrome.runtime.sendMessage(
      {
        action: "CHECK_PRICE",
        url: window.location.href,
        override_price: domPrice
      },
      (response) => {
        if (!response || !response.success || !response.data) {
          body.innerHTML = `
            <div class="pw-card" style="border-color: #FECACA; background: #FEF2F2;">
              <p style="font-size: 12px; font-weight: 600; color: #991B1B;">Analysis Notice</p>
              <p style="font-size: 11px; color: #7F1D1D; margin-top: 4px;">
                ${response?.error || "Could not connect to PaisaWise local backend. Please make sure 'python run.py' is running on your machine."}
              </p>
              <a href="http://localhost:3000" target="_blank" class="pw-footer-btn" style="margin-top: 12px;">Open PaisaWise Dashboard</a>
            </div>
          `;
          return;
        }

        renderDetails(response.data);
      }
    );
  }

  // Generate SVG Line Chart
  function generateChartSVG(points) {
    if (!points || points.length === 0) return "";
    const w = 340;
    const h = 100;
    const padding = 15;

    const prices = points.map((p) => p.price);
    const minP = Math.min(...prices);
    const maxP = Math.max(...prices);
    const range = maxP - minP || 1;

    const coords = points.map((p, idx) => {
      const x = padding + (idx / (points.length - 1)) * (w - 2 * padding);
      const y = h - padding - ((p.price - minP) / range) * (h - 2 * padding);
      return { x, y, date: p.date, price: p.price };
    });

    const pathData = coords.reduce((acc, curr, idx) => {
      return idx === 0 ? `M ${curr.x} ${curr.y}` : `${acc} L ${curr.x} ${curr.y}`;
    }, "");

    const dots = coords
      .map(
        (c) =>
          `<circle cx="${c.x}" cy="${c.y}" r="3.5" fill="#171717" stroke="#FFFFFF" stroke-width="1.5" />`
      )
      .join("");

    return `
      <svg viewBox="0 0 ${w} ${h}" width="100%" height="100" style="overflow: visible;">
        <path d="${pathData}" fill="none" stroke="#171717" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        ${dots}
      </svg>
    `;
  }

  function renderDetails(data) {
    const body = document.getElementById("pw-drawer-body");
    const curPriceFormatted = Number(data.current_price).toLocaleString("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    });

    const lowFormatted = Number(data.all_time_low).toLocaleString("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    });

    const avgFormatted = Number(data.average_price).toLocaleString("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    });

    const highFormatted = Number(data.all_time_high).toLocaleString("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    });

    let verdictClass = "pw-verdict-fair";
    if (data.timing_verdict.includes("OPTIMAL") || data.timing_verdict.includes("LOW")) {
      verdictClass = "pw-verdict-optimal";
    } else if (data.timing_verdict.includes("WAIT") || data.timing_verdict.includes("HIGH")) {
      verdictClass = "pw-verdict-caution";
    }

    body.innerHTML = `
      <!-- Product Header -->
      <div class="pw-card">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px;">
          <h2 style="font-size: 13px; font-weight: 600; line-height: 1.4; color: #171717; margin: 0;">
            ${data.product_name}
          </h2>
          <span style="font-size: 10px; font-family: monospace; background: #EAEAEA; padding: 2px 6px; border-radius: 4px; font-weight: 700;">
            ${data.platform}
          </span>
        </div>
        <div style="margin-top: 10px; display: flex; align-items: baseline; gap: 8px;">
          <span class="pw-price-tag">${curPriceFormatted}</span>
          <span style="font-size: 11px; color: #737373;">${data.data_source || "Verified"}</span>
        </div>
        <div>
          <span class="pw-verdict ${verdictClass}">${data.timing_verdict}</span>
        </div>
        <p style="font-size: 11px; color: #737373; margin-top: 8px; line-height: 1.4;">
          ${data.timing_explanation}
        </p>
      </div>

      <!-- 6-Month Fluctuation Graph -->
      <div class="pw-chart-container">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <span style="font-size: 11px; font-weight: 700; color: #171717;">6-Month Price History</span>
          <span style="font-size: 10px; font-mono; color: #737373;">Verified Range</span>
        </div>
        ${generateChartSVG(data.history_points)}
        <div class="pw-stats-row">
          <div class="pw-stat-box">
            <div class="pw-label">All-Time Low</div>
            <div class="pw-val" style="color: #166534;">${lowFormatted}</div>
          </div>
          <div class="pw-stat-box">
            <div class="pw-label">Average</div>
            <div class="pw-val" style="color: #075985;">${avgFormatted}</div>
          </div>
          <div class="pw-stat-box">
            <div class="pw-label">All-Time High</div>
            <div class="pw-val" style="color: #991B1B;">${highFormatted}</div>
          </div>
        </div>
      </div>

      <!-- Financial Reality Check -->
      <div class="pw-reality-box">
        <span style="font-size: 11px; font-weight: 700; color: #171717; text-transform: uppercase; letter-spacing: 0.04em;">
          Personal Reality Check
        </span>
        <div style="margin-top: 8px; font-size: 12px; line-height: 1.5; color: #333333;">
          <div>⏱️ <strong>Cost in Work:</strong> ${data.work_time_formatted}</div>
          <div style="margin-top: 4px;">🛡️ <strong>Daily Allowance After:</strong> ₹${Number(data.daily_budget_after).toFixed(2)}/day</div>
        </div>
        <p style="font-size: 11px; color: #555555; margin-top: 6px;">
          ${data.affordability_advice}
        </p>
      </div>

      <!-- Quick Action -->
      <div>
        <a href="http://localhost:3000" target="_blank" class="pw-footer-btn">
          Open Full PaisaWise Dashboard &rarr;
        </a>
      </div>
    `;
  }

  // Initialize
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", setupUI);
  } else {
    setupUI();
  }
})();
