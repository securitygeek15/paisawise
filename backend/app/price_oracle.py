from typing import Dict, Any, List, Optional
from decimal import Decimal
import re
import urllib.parse
from datetime import date, timedelta


# Curated catalog of popular products on Amazon / Flipkart / Myntra for instant demo tests
SAMPLE_CATALOG = {
    "sony-wh1000xm5": {
        "name": "Sony WH-1000XM5 Wireless Active Noise Cancelling Headphones",
        "platform": "Amazon",
        "current_price": Decimal("26990.00"),
        "all_time_low": Decimal("24990.00"),
        "all_time_high": Decimal("34990.00"),
        "average_price": Decimal("28990.00"),
        "best_deal_month": "October (Great Indian Festival)",
        "sample_url": "https://www.amazon.in/Sony-WH-1000XM5-Wireless-Cancelling-Headphones/dp/B09XS7JWHH",
        "history_offsets": [-6, -5, -4, -3, -2, -1, 0],
        "history_prices": [31990, 29990, 24990, 28990, 27990, 29490, 26990],
    },
    "apple-iphone-15": {
        "name": "Apple iPhone 15 (128 GB, Black)",
        "platform": "Flipkart",
        "current_price": Decimal("57999.00"),
        "all_time_low": Decimal("51999.00"),
        "all_time_high": Decimal("79900.00"),
        "average_price": Decimal("64999.00"),
        "best_deal_month": "September (Big Billion Days)",
        "sample_url": "https://www.flipkart.com/apple-iphone-15-black-128-gb/p/itm6ac6485515ae4",
        "history_offsets": [-6, -5, -4, -3, -2, -1, 0],
        "history_prices": [71999, 66999, 51999, 54999, 58999, 59999, 57999],
    },
    "apple-macbook-air-m2": {
        "name": "Apple MacBook Air M2 Chip (8GB RAM, 256GB SSD)",
        "platform": "Amazon",
        "current_price": Decimal("79900.00"),
        "all_time_low": Decimal("74990.00"),
        "all_time_high": Decimal("99900.00"),
        "average_price": Decimal("84990.00"),
        "best_deal_month": "August (Independence Sale)",
        "sample_url": "https://www.amazon.in/Apple-MacBook-Laptop-chip-Liquid/dp/B0B3B3W56W",
        "history_offsets": [-6, -5, -4, -3, -2, -1, 0],
        "history_prices": [89900, 84900, 74990, 79900, 81900, 82900, 79900],
    },
    "nike-air-force-1": {
        "name": "Nike Air Force 1 '07 Men's Triple White",
        "platform": "Myntra",
        "current_price": Decimal("8195.00"),
        "all_time_low": Decimal("6795.00"),
        "all_time_high": Decimal("8995.00"),
        "average_price": Decimal("7995.00"),
        "best_deal_month": "July (End of Reason Sale)",
        "sample_url": "https://www.myntra.com/casual-shoes/nike/nike-men-white-air-force-1-07-sneakers/13812836/buy",
        "history_offsets": [-6, -5, -4, -3, -2, -1, 0],
        "history_prices": [8995, 8495, 6795, 7495, 7995, 8195, 8195],
    },
    "kindle-paperwhite": {
        "name": "Kindle Paperwhite (16 GB, 6.8\" display)",
        "platform": "Amazon",
        "current_price": Decimal("14999.00"),
        "all_time_low": Decimal("11999.00"),
        "all_time_high": Decimal("15999.00"),
        "average_price": Decimal("13999.00"),
        "best_deal_month": "Prime Day (July)",
        "sample_url": "https://www.amazon.in/Kindle-Paperwhite-adjustable-battery-Black/dp/B08N3TCP2F",
        "history_offsets": [-6, -5, -4, -3, -2, -1, 0],
        "history_prices": [14999, 13999, 11999, 12999, 14499, 14999, 14999],
    },
}


def detect_platform(url: str) -> str:
    url_lower = url.lower()
    if "amazon." in url_lower:
        return "Amazon"
    elif "flipkart." in url_lower:
        return "Flipkart"
    elif "myntra." in url_lower:
        return "Myntra"
    elif "ajio." in url_lower:
        return "Ajio"
    elif "tatacliq." in url_lower:
        return "Tata CLiQ"
    elif "croma." in url_lower:
        return "Croma"
    return "E-Commerce"


def clean_slug_to_name(slug: str) -> str:
    # replace hyphens, underscores with spaces, capitalize words
    words = [w.capitalize() for w in re.split(r"[-_]+", slug) if len(w) > 1 and not w.isdigit()]
    return " ".join(words[:8]) if words else "Tracked Product"


def analyze_product_url(url: str, custom_name: Optional[str] = None) -> Dict[str, Any]:
    url_lower = url.lower().strip()
    platform = detect_platform(url)

    # 1. Check if URL or slug matches one of our curated known electronics/fashion items
    matched_entry = None
    for key, data in SAMPLE_CATALOG.items():
        if key in url_lower or any(part in url_lower for part in key.split("-") if len(part) > 4):
            matched_entry = data
            break
        # Also check sample url match
        if data["sample_url"].lower() in url_lower or (data["name"].lower() in url_lower):
            matched_entry = data
            break

    today = date.today()

    if matched_entry:
        name = custom_name or matched_entry["name"]
        curr_price = matched_entry["current_price"]
        low_price = matched_entry["all_time_low"]
        high_price = matched_entry["all_time_high"]
        avg_price = matched_entry["average_price"]
        history_raw = matched_entry["history_prices"]
    else:
        # Dynamic fallback for any custom link entered by user
        # Parse slug or path
        parsed = urllib.parse.urlparse(url)
        path_parts = [p for p in parsed.path.split("/") if p]
        slug = path_parts[0] if path_parts else "Product"
        if slug in ["dp", "p", "buy", "product"] and len(path_parts) > 1:
            slug = path_parts[1]

        name = custom_name if (custom_name and custom_name.strip()) else clean_slug_to_name(slug)
        if len(name) < 4:
            name = f"Tracked Item on {platform}"

        # Generate realistic, consistent price points based on URL hash
        seed_hash = sum(ord(c) for c in url)
        base_amt = (seed_hash % 40 + 10) * 500  # e.g. 5,000 to 25,000
        curr_price = Decimal(str(base_amt))
        low_price = round(curr_price * Decimal("0.82"), 2)
        high_price = round(curr_price * Decimal("1.25"), 2)
        avg_price = round((low_price + high_price + curr_price) / Decimal("3.0"), 2)

        # Generate 6 months historical trend
        p1 = float(high_price)
        p2 = float(round(avg_price * Decimal("1.08"), 2))
        p3 = float(low_price)  # festival sale dip
        p4 = float(round(avg_price * Decimal("0.96"), 2))
        p5 = float(round(avg_price * Decimal("1.04"), 2))
        p6 = float(curr_price)
        history_raw = [p1, p2, p3, p4, p5, p6]

    # Build 6-month historical chart points
    history_points = []
    num_pts = len(history_raw)
    for i, p in enumerate(history_raw):
        month_offset = num_pts - 1 - i
        # Calculate date approx month_offset months ago
        dt = today - timedelta(days=month_offset * 30)
        dt_str = dt.strftime("%b %Y")
        is_lowest = Decimal(str(p)) == low_price
        is_highest = Decimal(str(p)) == high_price
        note = "All-Time Low" if is_lowest else ("All-Time High" if is_highest else None)

        history_points.append({
            "date": dt_str,
            "price": float(p),
            "note": note,
        })

    # Evaluate Buy Timing
    diff_from_low = float((curr_price - low_price) / low_price) * 100
    diff_from_avg = float((curr_price - avg_price) / avg_price) * 100

    if diff_from_low <= 6.0:
        timing_verdict = "BUY_NOW"
        timing_title = "Excellent Timing — Near All-Time Low"
        timing_advice = (
            f"Currently priced at ₹{curr_price:,.2f}, within {diff_from_low:.1f}% of its all-time record low "
            f"(₹{low_price:,.2f}). Historical price data indicates this is an optimal buying window on {platform}."
        )
    elif diff_from_avg >= 8.0:
        timing_verdict = "WAIT"
        timing_title = "Wait — Currently Overpriced / Inflated"
        timing_advice = (
            f"Currently priced at ₹{curr_price:,.2f}, which is {diff_from_avg:.1f}% above its typical historical average "
            f"(₹{avg_price:,.2f}) and ₹{curr_price - low_price:,.2f} more than its lowest sale price. We advise waiting for the next promotional event."
        )
    else:
        timing_verdict = "FAIR"
        timing_title = "Fair Price — Around Historical Average"
        timing_advice = (
            f"Priced at ₹{curr_price:,.2f}, closely matching its historical average of ₹{avg_price:,.2f}. "
            f"Not a major discount, but reasonably priced if you need it immediately."
        )

    discount_from_high = round(float((high_price - curr_price) / high_price * 100), 1) if high_price > 0 else 0.0

    return {
        "platform": platform,
        "product_name": name,
        "current_price": curr_price,
        "all_time_low": low_price,
        "all_time_high": high_price,
        "average_price": avg_price,
        "timing_verdict": timing_verdict,
        "timing_title": timing_title,
        "timing_advice": timing_advice,
        "discount_from_high": discount_from_high,
        "history_points": history_points,
    }
