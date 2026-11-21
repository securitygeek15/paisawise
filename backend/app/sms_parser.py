import re
from datetime import date, datetime
from decimal import Decimal
from typing import Dict, Any, List, Optional


MERCHANT_CATEGORY_MAP = {
    # Food & Dining
    "swiggy": ("Swiggy", "Dining & Cafes"),
    "zomato": ("Zomato", "Dining & Cafes"),
    "mcdonald": ("McDonald's", "Dining & Cafes"),
    "starbucks": ("Starbucks", "Dining & Cafes"),
    "chai point": ("Chai Point", "Dining & Cafes"),
    "chaayos": ("Chaayos", "Dining & Cafes"),
    "domino": ("Domino's Pizza", "Dining & Cafes"),
    "kfc": ("KFC", "Dining & Cafes"),
    "burger king": ("Burger King", "Dining & Cafes"),
    "pizza hut": ("Pizza Hut", "Dining & Cafes"),
    "subway": ("Subway", "Dining & Cafes"),
    "haldiram": ("Haldiram's", "Dining & Cafes"),
    "cafe coffee day": ("Cafe Coffee Day", "Dining & Cafes"),

    # Groceries & Food
    "blinkit": ("Blinkit", "Groceries & Food"),
    "zepto": ("Zepto", "Groceries & Food"),
    "instamart": ("Instamart", "Groceries & Food"),
    "bigbasket": ("BigBasket", "Groceries & Food"),
    "bb daily": ("BigBasket Daily", "Groceries & Food"),
    "dmart": ("D-Mart", "Groceries & Food"),
    "d-mart": ("D-Mart", "Groceries & Food"),
    "spencer": ("Spencer's", "Groceries & Food"),
    "nature basket": ("Nature's Basket", "Groceries & Food"),
    "milkbasket": ("Milkbasket", "Groceries & Food"),
    "supermarket": ("Supermarket", "Groceries & Food"),
    "grocery": ("Local Grocery", "Groceries & Food"),

    # Shopping & E-Commerce
    "amazon": ("Amazon", "Shopping"),
    "flipkart": ("Flipkart", "Shopping"),
    "myntra": ("Myntra", "Shopping"),
    "ajio": ("Ajio", "Shopping"),
    "nykaa": ("Nykaa", "Shopping"),
    "reliance digital": ("Reliance Digital", "Shopping"),
    "croma": ("Croma Electronics", "Shopping"),
    "vijay sales": ("Vijay Sales", "Shopping"),
    "tata cliq": ("Tata CLiQ", "Shopping"),
    "zara": ("Zara", "Shopping"),
    "h&m": ("H&M", "Shopping"),
    "uniqlo": ("Uniqlo", "Shopping"),
    "decathlon": ("Decathlon", "Shopping"),

    # Transportation & Travel
    "uber": ("Uber", "Transportation"),
    "ola": ("Ola Cabs", "Transportation"),
    "rapido": ("Rapido", "Transportation"),
    "metro": ("Metro Rail", "Transportation"),
    "irctc": ("IRCTC Train Booking", "Transportation"),
    "makemytrip": ("MakeMyTrip", "Travel"),
    "cleartrip": ("Cleartrip", "Travel"),
    "yatra": ("Yatra", "Travel"),
    "indigo": ("IndiGo Airlines", "Travel"),
    "air india": ("Air India", "Travel"),
    "petrol": ("Fuel Station", "Transportation"),
    "fuel": ("Fuel Station", "Transportation"),
    "indian oil": ("Indian Oil Fuel", "Transportation"),
    "bpcl": ("Bharat Petroleum", "Transportation"),
    "hpcl": ("Hindustan Petroleum", "Transportation"),
    "shell": ("Shell Fuel", "Transportation"),

    # Entertainment & Subscriptions
    "netflix": ("Netflix", "Entertainment & Subs"),
    "spotify": ("Spotify", "Entertainment & Subs"),
    "prime video": ("Amazon Prime Video", "Entertainment & Subs"),
    "hotstar": ("Disney+ Hotstar", "Entertainment & Subs"),
    "sonyliv": ("SonyLIV", "Entertainment & Subs"),
    "zee5": ("Zee5", "Entertainment & Subs"),
    "bookmyshow": ("BookMyShow", "Entertainment & Subs"),
    "pvr": ("PVR Cinemas", "Entertainment & Subs"),
    "inox": ("INOX Cinemas", "Entertainment & Subs"),
    "apple": ("Apple Services", "Entertainment & Subs"),
    "google play": ("Google Play", "Entertainment & Subs"),
    "steam": ("Steam Games", "Entertainment & Subs"),
    "playstation": ("PlayStation Store", "Entertainment & Subs"),

    # Utilities & Internet
    "electricity": ("Electricity Board", "Utilities & Internet"),
    "bescom": ("Bescom Electricity", "Utilities & Internet"),
    "airtel": ("Airtel Recharge/Bill", "Utilities & Internet"),
    "jio": ("Jio Telecom", "Utilities & Internet"),
    "vodafone": ("Vi Telecom", "Utilities & Internet"),
    "vi telecom": ("Vi Telecom", "Utilities & Internet"),
    "broadband": ("Broadband Internet", "Utilities & Internet"),
    "act fibernet": ("ACT Fibernet", "Utilities & Internet"),
    "gas": ("Gas Utility", "Utilities & Internet"),

    # Health & Fitness
    "apollo": ("Apollo Pharmacy", "Health & Fitness"),
    "pharmeasy": ("PharmEasy", "Health & Fitness"),
    "1mg": ("Tata 1mg", "Health & Fitness"),
    "practo": ("Practo Healthcare", "Health & Fitness"),
    "cult.fit": ("Cult.fit Gym", "Health & Fitness"),
    "gym": ("Fitness Gym", "Health & Fitness"),
    "medplus": ("MedPlus Pharmacy", "Health & Fitness"),

    # Income & Payroll
    "salary": ("Monthly Salary", "Salary"),
    "payroll": ("Payroll Credit", "Salary"),
    "stipend": ("Stipend Credit", "Salary"),
    "dividend": ("Dividend Income", "Investments"),
    "interest": ("Bank Interest", "Investments"),
    "refund": ("Merchant Refund", "Other"),
}


def parse_date_from_text(text: str) -> date:
    """Parses transaction date from SMS or returns today's date."""
    # Patterns like 12-Nov-26, 12-NOV-2026, 14Nov26, 12/11/2026, 12-11-2026
    month_map = {
        "jan": 1, "feb": 2, "mar": 3, "apr": 4, "may": 5, "jun": 6,
        "jul": 7, "aug": 8, "sep": 9, "oct": 10, "nov": 11, "dec": 12
    }

    # Format 1: 12-Nov-26 or 12-Nov-2026 or 14Nov26 or 12 Nov 2026
    m1 = re.search(r'\b(\d{1,2})[-/\s]?([a-zA-Z]{3})[-/\s]?(\d{2,4})\b', text)
    if m1:
        day = int(m1.group(1))
        mon_str = m1.group(2).lower()
        yr_val = int(m1.group(3))
        year = (2000 + yr_val) if yr_val < 100 else yr_val
        if mon_str in month_map:
            try:
                return date(year, month_map[mon_str], day)
            except ValueError:
                pass

    # Format 2: 12-11-2026 or 12/11/26
    m2 = re.search(r'\b(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})\b', text)
    if m2:
        day = int(m2.group(1))
        month = int(m2.group(2))
        yr_val = int(m2.group(3))
        year = (2000 + yr_val) if yr_val < 100 else yr_val
        if 1 <= month <= 12 and 1 <= day <= 31:
            try:
                return date(year, month, day)
            except ValueError:
                pass

    return date.today()


def parse_amount_from_text(text: str) -> Optional[Decimal]:
    """Extracts currency amount from SMS string."""
    # Matches: Rs. 1,299.00 / Rs 450 / INR 85,000.00 / for Rs.240.00 / debited by 850
    patterns = [
        r'(?:rs\.?|inr)\s*([0-9,]+(?:\.[0-9]{1,2})?)',
        r'(?:debited with|debited by|spent|credited with|credited by|paid)\s*(?:rs\.?|inr)?\s*([0-9,]+(?:\.[0-9]{1,2})?)',
        r'([0-9,]+(?:\.[0-9]{1,2})?)\s*(?:rs\.?|inr)',
    ]
    for p in patterns:
        match = re.search(p, text, re.IGNORECASE)
        if match:
            raw = match.group(1).replace(',', '')
            try:
                val = Decimal(raw)
                if val > 0:
                    return val
            except Exception:
                continue
    return None


def parse_type_from_text(text: str) -> str:
    """Determines if the transaction is an income or an expense."""
    lower = text.lower()
    income_keywords = ["credited", "received", "deposited", "refund", "salary", "cashback", "reversed"]
    for kw in income_keywords:
        if kw in lower:
            return "income"
    return "expense"


def parse_payment_method(text: str, tx_type: str) -> str:
    """Infers the payment method (UPI, Credit Card, Debit Card, Bank Transfer)."""
    lower = text.lower()
    if "upi" in lower or "vpa" in lower or "gpay" in lower or "phonepe" in lower or "paytm" in lower:
        return "UPI"
    if "credit card" in lower or "card ending" in lower or "creditcard" in lower:
        return "Credit Card"
    if "debit card" in lower or "atm" in lower:
        return "Debit Card"
    if "neft" in lower or "imps" in lower or "rtgs" in lower or "salary" in lower or "net banking" in lower:
        return "Bank Transfer"
    return "UPI" if tx_type == "expense" else "Bank Transfer"


def parse_merchant_and_category(text: str, tx_type: str) -> tuple[str, str]:
    """Identifies merchant name and spending category using heuristic matching and regex."""
    lower = text.lower()

    # 1. Exact catalog matching
    for key, (m_name, m_cat) in MERCHANT_CATEGORY_MAP.items():
        if key in lower:
            return m_name, m_cat

    # 2. Regex heuristics for VPA / Merchant identifiers
    # to VPA swiggy@icici -> Swiggy
    vpa_match = re.search(r'to\s+vpa\s+([a-zA-Z0-9_\-\.]+)(?:@[a-zA-Z0-9]+)', text, re.IGNORECASE)
    if vpa_match:
        cand = vpa_match.group(1).replace('.', ' ').strip().title()
        if len(cand) >= 2:
            return cand, "Dining & Cafes" if "food" in cand.lower() else "Shopping"

    # at AMAZON INDIA on / at UBER on
    at_match = re.search(r'\bat\s+([a-zA-Z0-9\s\.\*]+?)(?:\s+on|\s+dated|\s+ref|\s+avail|\.|$)', text, re.IGNORECASE)
    if at_match:
        cand = at_match.group(1).replace('*', ' ').strip().title()
        if len(cand) >= 3 and not cand.lower().startswith("acct"):
            return cand, "Shopping"

    # transfer to Zomato UPI
    to_match = re.search(r'transfer\s+to\s+([a-zA-Z0-9\s]+?)(?:\s+upi|\s+ref|\s+on|\.|$)', text, re.IGNORECASE)
    if to_match:
        cand = to_match.group(1).strip().title()
        if len(cand) >= 3:
            return cand, "Other"

    # 3. Fallbacks based on transaction type
    if tx_type == "income":
        return "Account Deposit", "Salary"
    return "Merchant Payment", "Shopping"


def parse_single_sms(sms_text: str) -> Optional[Dict[str, Any]]:
    """Parses a single SMS notification into structured transaction fields."""
    cleaned = sms_text.strip()
    if not cleaned or len(cleaned) < 10:
        return None

    amount = parse_amount_from_text(cleaned)
    if not amount:
        return None

    tx_type = parse_type_from_type = parse_type_from_text(cleaned)
    tx_date = parse_date_from_text(cleaned)
    method = parse_payment_method(cleaned, tx_type)
    name, category = parse_merchant_and_category(cleaned, tx_type)

    # Calculate heuristic confidence score
    confidence = 0.95 if name not in ("Merchant Payment", "Account Deposit") else 0.80

    return {
        "name": name,
        "amount": amount,
        "type": tx_type,
        "category": category,
        "transaction_date": tx_date,
        "payment_method": method,
        "notes": f"Imported via Offline SMS Parser: {cleaned[:60]}...",
        "confidence": confidence,
        "raw_text": cleaned,
    }


def parse_sms_batch(raw_input: str) -> List[Dict[str, Any]]:
    """Parses multi-line or concatenated SMS alerts into a list of transactions."""
    if not raw_input or not raw_input.strip():
        return []

    # Split by newlines, or delimiters like "---" or common SMS header patterns
    lines = raw_input.strip().split("\n")
    results = []

    current_sms = []
    for line in lines:
        line_str = line.strip()
        if not line_str:
            if current_sms:
                parsed = parse_single_sms(" ".join(current_sms))
                if parsed:
                    results.append(parsed)
                current_sms = []
            continue

        # If line starts a new bank notification, parse previous buffer
        is_new_header = bool(re.match(r'^(rs\.?|inr|alert|dear|your\s+a/?c|acct|paid|received|sent)', line_str, re.IGNORECASE))
        if is_new_header and current_sms:
            parsed = parse_single_sms(" ".join(current_sms))
            if parsed:
                results.append(parsed)
            current_sms = [line_str]
        else:
            current_sms.append(line_str)

    if current_sms:
        parsed = parse_single_sms(" ".join(current_sms))
        if parsed:
            results.append(parsed)

    return results
