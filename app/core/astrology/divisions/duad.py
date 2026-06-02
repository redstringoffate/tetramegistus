# core/astrology/divisions/duad.py

"""
Duad (Dwadasamsa)
- 12 divisions per sign
- 2.5° each
- First duad starts from the sign itself
"""

DUAD_SEQUENCE = [
    "Aries", "Taurus", "Gemini", "Cancer",
    "Leo", "Virgo", "Libra", "Scorpio",
    "Sagittarius", "Capricorn", "Aquarius", "Pisces"
]

DUADS = {
    sign: DUAD_SEQUENCE[i:] + DUAD_SEQUENCE[:i]
    for i, sign in enumerate(DUAD_SEQUENCE)
}


def get_duad(sign: str, deg: float) -> str:
    """
    deg: sign-relative degree (0 <= deg < 30)
    """
    index = int(deg / 2.5)

    # 🔒 안전장치 (필수)
    if index < 0:
        index = 0
    elif index > 11:
        index = 11

    return DUADS[sign][index]
