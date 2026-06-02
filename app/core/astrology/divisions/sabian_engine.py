# app/core/astrology/divisions/sabian_engine.py

import math

def get_sabian_index(abs_degree: float) -> int:
    """
    천체의 절대 도수(0~359.99)를 받아 Sabian Index(0~359)를 반환합니다.
    - 0.00 <= deg < 1.00 -> Index 0
    - 359.00 <= deg < 360.00 -> Index 359
    """
    # 360도 범위를 벗어나지 않도록 보정
    deg = abs_degree % 360
    
    # 내림 처리를 통해 0~359 인덱스 산출
    return math.floor(deg)

def get_sabian_coordinate(sign: str, deg_in_sign: float) -> int:
    """
    사인과 사인 내 도수를 받아 절대 인덱스를 산출합니다.
    """
    SIGNS = [
        "Aries", "Taurus", "Gemini", "Cancer", 
        "Leo", "Virgo", "Libra", "Scorpio", 
        "Sagittarius", "Capricorn", "Aquarius", "Pisces"
    ]
    sign_idx = SIGNS.index(sign)
    return (sign_idx * 30) + math.floor(deg_in_sign)