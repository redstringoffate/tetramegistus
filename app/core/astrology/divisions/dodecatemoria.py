# core/astrology/divisions/dodecatemoria.py

"""
Dodecatemoria
- Same for every sign
- 3° / 2° alternating
- Always Aries → Pisces sequence
"""

DODECATEMORIA_TABLE = [
    ("Aries", 0, 3),
    ("Taurus", 3, 5),
    ("Gemini", 5, 8),
    ("Cancer", 8, 10),
    ("Leo", 10, 13),
    ("Virgo", 13, 15),
    ("Libra", 15, 18),
    ("Scorpio", 18, 20),
    ("Sagittarius", 20, 23),
    ("Capricorn", 23, 25),
    ("Aquarius", 25, 28),
    ("Pisces", 28, 30),
]


def get_dodecatemoria(deg: float) -> str:
    """
    deg: sign-relative degree (0 <= deg < 30)
    """
    for sign, start, end in DODECATEMORIA_TABLE:
        if start <= deg < end:
            return sign
    return None
