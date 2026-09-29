"""
Utility functions for billing, currency formatting, and Indian numbering conversion.
"""
from decimal import Decimal, ROUND_HALF_UP


ONES = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
    "Seventeen", "Eighteen", "Nineteen"
]

TENS = [
    "", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"
]


def _convert_below_thousand(n: int) -> str:
    """Convert an integer < 1000 into words."""
    result = []
    hundreds = n // 100
    remainder = n % 100

    if hundreds > 0:
        result.append(f"{ONES[hundreds]} Hundred")

    if remainder > 0:
        if hundreds > 0:
            result.append("and")
        if remainder < 20:
            result.append(ONES[remainder])
        else:
            ten = remainder // 10
            one = remainder % 10
            if one > 0:
                result.append(f"{TENS[ten]} {ONES[one]}")
            else:
                result.append(TENS[ten])

    return " ".join(result)


def amount_to_words_inr(amount) -> str:
    """
    Convert a monetary amount into words using the Indian numbering system.
    e.g. 220.00 -> 'Two Hundred and Twenty Rupees Only'
         1000.00 -> 'One Thousand Rupees Only'
         123456.78 -> 'One Lakh Twenty Three Thousand Four Hundred and Fifty Six Rupees and Seventy Eight Paise Only'
    """
    if amount is None:
        return "Zero Rupees Only"

    try:
        dec = Decimal(str(amount)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    except Exception:
        return "Zero Rupees Only"

    if dec < 0:
        dec = abs(dec)

    rupees = int(dec)
    paise = int(round((dec - Decimal(rupees)) * 100))

    if rupees == 0 and paise == 0:
        return "Zero Rupees Only"

    parts = []

    # Indian numbering breakdown:
    # Crores: >= 10,000,000
    # Lakhs: >= 100,000
    # Thousands: >= 1,000
    # Hundreds / Tens / Units: remainder

    crores = rupees // 10000000
    rem = rupees % 10000000

    lakhs = rem // 100000
    rem = rem % 100000

    thousands = rem // 1000
    rem = rem % 1000

    if crores > 0:
        parts.append(f"{_convert_below_thousand(crores)} Crore")

    if lakhs > 0:
        parts.append(f"{_convert_below_thousand(lakhs)} Lakh")

    if thousands > 0:
        parts.append(f"{_convert_below_thousand(thousands)} Thousand")

    if rem > 0:
        parts.append(_convert_below_thousand(rem))

    words_rupees = " ".join(parts).strip()
    if words_rupees:
        result = f"{words_rupees} Rupees"
    else:
        result = "Zero Rupees"

    if paise > 0:
        words_paise = _convert_below_thousand(paise)
        result += f" and {words_paise} Paise"

    return f"{result} Only"
