# app/core/astrology/divisions/varga_logic.py

import math

# ---------------------------------------------------------
# Helper & Constants (From user's d*.py files)
# ---------------------------------------------------------

def _wrap_rasi(num: int) -> int:
    """Safely wraps sign number to 1-12 range."""
    return ((num - 1) % 12) + 1

# D30 Constants (From d30.py)
MALE_SIGNS = {1, 3, 5, 7, 9, 11}
D30_MALE = [1, 3, 5, 9, 11] # Aries, Gemini, Leo, Sagittarius, Aquarius
D30_FEMALE = [2, 6, 10, 12, 8] # Taurus, Virgo, Capricorn, Pisces, Scorpio

# ---------------------------------------------------------
# Main Logic
# ---------------------------------------------------------

def get_varga_details(lon: float, division: int, ayanamsa: str = 'lahiri'):
    """
    Calculates the Varga Sign and Exact Longitude.
    Logic STRICTLY ported from user's d*.py files (Streamlit App).
    """
    sign_idx = int(lon / 30) # 0-11
    sign_num = sign_idx + 1  # 1-12
    deg_in_sign = lon % 30
    
    target_sign = 1 

    # D1 (Rasi)
    if division == 1:
        target_sign = sign_num

    # D2 (Hora) - Ported from d2.py
    elif division == 2:
        if sign_num % 2 == 0: # Even
            target_sign = 4 if deg_in_sign < 15 else 5
        else: # Odd
            target_sign = 5 if deg_in_sign < 15 else 4

    # D3 (Drekkana) - Ported from d3.py
    elif division == 3:
        if deg_in_sign < 10: target_sign = sign_num
        elif deg_in_sign < 20: target_sign = _wrap_rasi(sign_num + 4)
        else: target_sign = _wrap_rasi(sign_num + 8)

    # D4 (Chaturthamsa) - Ported from d4.py
    elif division == 4:
        idx = 0
        if deg_in_sign < 7.5: idx = 0
        elif deg_in_sign < 15: idx = 1
        elif deg_in_sign < 22.5: idx = 2
        else: idx = 3
        
        if sign_num % 2 != 0: target_sign = _wrap_rasi(sign_num + idx)
        else: target_sign = _wrap_rasi(sign_num + (4 - idx)) # Reverse for Even

    # D6 (Shashtamsa) - Ported from d6.py
    elif division == 6:
        idx = int(deg_in_sign / 5.0)
        if idx > 5: idx = 5
        if sign_num % 2 != 0: target_sign = _wrap_rasi(sign_num + idx)
        else: target_sign = _wrap_rasi(sign_num + (6 - idx))

    # D7 (Saptamsa) - Ported from d7.py
    elif division == 7:
        idx = int(deg_in_sign / (30/7))
        if idx > 6: idx = 6
        if sign_num % 2 != 0: target_sign = _wrap_rasi(sign_num + idx)
        else: target_sign = _wrap_rasi(sign_num + (7 - idx))

    # D8 (Ashtamsa) - Ported from d8.py
    elif division == 8:
        idx = int(deg_in_sign / 3.75)
        if idx > 7: idx = 7
        if sign_num % 2 != 0: target_sign = _wrap_rasi(sign_num + idx)
        else: target_sign = _wrap_rasi(sign_num - idx) # Unique Logic (base - idx)

    # D9 (Navamsa) - Ported from d9.py
    # This logic produces Dhanu(9) for Cancer 13deg, matching your screenshot.
    elif division == 9:
        idx = int(deg_in_sign / (30/9))
        if idx > 8: idx = 8
        if sign_num % 2 != 0: target_sign = _wrap_rasi(sign_num + idx)
        else: target_sign = _wrap_rasi(sign_num + (8 - idx))

    # D10 (Dasamsa) - Ported from d10.py
    elif division == 10:
        idx = int(deg_in_sign / 3.0)
        if idx > 9: idx = 9
        if sign_num % 2 != 0: target_sign = _wrap_rasi(sign_num + idx)
        else: target_sign = _wrap_rasi(sign_num + (9 - idx))

    # D12 (Dwadasamsa) - Ported from d12.py
    elif division == 12:
        idx = int(deg_in_sign / 2.5)
        if idx > 11: idx = 11
        target_sign = _wrap_rasi(sign_num + idx)

    # D16 (Shodashamsa) - Ported from d16.py
    elif division == 16:
        idx = int(deg_in_sign / 1.875)
        if idx > 15: idx = 15
        if sign_num % 2 != 0: target_sign = _wrap_rasi(sign_num + idx)
        else: target_sign = _wrap_rasi(sign_num - idx) # Reverse (base - idx)

    # D20 (Vimshamsa) - Ported from d20.py
    elif division == 20:
        idx = int(deg_in_sign / 1.5)
        if idx > 19: idx = 19
        if sign_num % 2 != 0: target_sign = _wrap_rasi(sign_num + idx)
        else: target_sign = _wrap_rasi(sign_num + (19 - idx))

    # D24 (Chaturvimshamsa) - Ported from d24.py
    elif division == 24:
        idx = int(deg_in_sign / 1.25)
        if idx > 23: idx = 23
        if sign_num % 2 != 0: target_sign = _wrap_rasi(sign_num + idx)
        else: target_sign = _wrap_rasi(sign_num + (23 - idx))

    # D30 (Trimsamsa) - Ported from d30.py
    elif division == 30:
        # User Logic: 6 degrees per segment (Equal)
        idx = int(deg_in_sign // 6)
        if idx > 4: idx = 4
        
        if sign_num in MALE_SIGNS:
            target_sign = D30_MALE[idx]
        else:
            target_sign = D30_FEMALE[idx]

    # D60 (Shashtiamsa) - Ported from d60.py
    elif division == 60:
        idx = int(deg_in_sign / 0.5)
        if idx > 59: idx = 59
        if sign_num % 2 != 0: target_sign = _wrap_rasi(sign_num + idx)
        else: target_sign = _wrap_rasi(sign_num + (59 - idx))

    # Fallback (D27, D40, D45 - Not in uploaded files)
    else: 
        abs_deg = (sign_num - 1) * 30 + deg_in_sign
        target_sign = int((abs_deg * division) / 30) % 12 + 1

    # 1. 분할도 상의 절대 도수 도출
    final_absolute_lon = (target_sign - 1) * 30 + deg_in_sign

    # 🚀 2. [추가] Nakshatra & Pada 기반 Purushartha 연산
    NAK_LEN = 360 / 27   # 13.3333...
    PADA_LEN = 360 / 108 # 3.3333...
    
    nak_idx = int(final_absolute_lon / NAK_LEN)
    puru_list = ["Dharma", "Artha", "Kama", "Moksha"]
    nak_puru = puru_list[nak_idx % 4]

    # KP 아야남사일 경우 낙샤트라 푸루샤르타만 리턴
    if ayanamsa.lower() == 'kp':
        final_purushartha = nak_puru
    else:
        # 그 외의 경우 파다(Pada) 푸루샤르타까지 계산하여 결합 (예: Dharma-K)
        deg_in_nak = final_absolute_lon % NAK_LEN
        pada_idx = int(deg_in_nak / PADA_LEN)
        pada_initials = ["D", "A", "K", "M"]
        pada_p = pada_initials[pada_idx % 4]
        final_purushartha = f"{nak_puru}-{pada_p}"

    # 3. 3개의 값을 리턴
    return target_sign, final_absolute_lon, final_purushartha