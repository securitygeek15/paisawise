// PaisaWise Background Service Worker (Manifest V3)

const DEFAULT_API_URL = "http://127.0.0.1:8000";

// Ensure auth token (auto-login with demo if not already stored)
async function getAuthToken(apiUrl = DEFAULT_API_URL) {
  const stored = await chrome.storage.local.get(["auth_token", "user_email"]);
  if (stored.auth_token) {
    return stored.auth_token;
  }

  try {
    const res = await fetch(`${apiUrl}/api/auth/demo`, {
      method: "POST",
      headers: { "Content-Type": "application/json" }
    });
    if (res.ok) {
      const data = await res.json();
      await chrome.storage.local.set({
        auth_token: data.access_token,
        user_email: data.user?.email || "demo@paisawise.local"
      });
      return data.access_token;
    }
  } catch (err) {
    console.warn("PaisaWise local backend unreachable:", err);
  }
  return null;
}

// Handle messages from content script or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "CHECK_PRICE") {
    handlePriceCheck(request.url, request.override_price, request.custom_name)
      .then(sendResponse)
      .catch((err) => sendResponse({ success: false, error: err.message }));
    return true; // Keep channel open for async response
  }

  if (request.action === "GET_OVERVIEW") {
    handleGetOverview()
      .then(sendResponse)
      .catch((err) => sendResponse({ success: false, error: err.message }));
    return true;
  }

  if (request.action === "CHECK_HEALTH") {
    checkBackendHealth()
      .then(sendResponse)
      .catch((err) => sendResponse({ success: false, error: err.message }));
    return true;
  }
});

async function checkBackendHealth() {
  const { api_url = DEFAULT_API_URL } = await chrome.storage.local.get(["api_url"]);
  try {
    const res = await fetch(`${api_url}/api/health`, { method: "GET" });
    if (res.ok) {
      const data = await res.json();
      return { success: true, healthy: true, data };
    }
    return { success: false, healthy: false };
  } catch (err) {
    return { success: false, healthy: false, error: err.message };
  }
}

async function handlePriceCheck(productUrl, overridePrice, customName) {
  const { api_url = DEFAULT_API_URL } = await chrome.storage.local.get(["api_url"]);
  const token = await getAuthToken(api_url);

  const headers = { "Content-Type": "application/json" };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(`${api_url}/api/analytics/price-check`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        url: productUrl,
        override_price: overridePrice || null,
        custom_name: customName || null
      })
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.detail || `Request failed with status ${res.status}`);
    }

    const data = await res.json();
    return { success: true, data };
  } catch (err) {
    return {
      success: false,
      error: err.message || "Failed to analyze product. Make sure PaisaWise local backend is running (python run.py)."
    };
  }
}

async function handleGetOverview() {
  const { api_url = DEFAULT_API_URL } = await chrome.storage.local.get(["api_url"]);
  const token = await getAuthToken(api_url);

  const headers = { "Content-Type": "application/json" };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(`${api_url}/api/analytics/overview`, {
      method: "GET",
      headers
    });
    if (!res.ok) throw new Error("Could not fetch overview");
    const data = await res.json();
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}
