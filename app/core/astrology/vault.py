# app/core/astrology/vault.py

ZODIAC_NAMES = {
    "tropical": ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"],
    "jyotish": ["Mesha", "Vrishabha", "Mithuna", "Karka", "Simha", "Kanya", "Tula", "Vrishchika", "Dhanu", "Makara", "Kumbha", "Meena"]
}

# 🔑 [수복]: 이중 지배성 반영 (Traditional & Modern Rulers)
SIGN_RULERS = {
    0: ["Mars"], 1: ["Venus"], 2: ["Mercury"], 3: ["Moon"], 4: ["Sun"], 5: ["Mercury"],
    6: ["Venus"], 7: ["Mars", "Pluto"], 8: ["Jupiter"], 9: ["Saturn"], 10: ["Saturn", "Uranus"], 11: ["Jupiter", "Neptune"]
}

# 🔑 [수복]: 현대 행성(천해명)은 Domicile만 인정하며, 고전 행성은 전체 위계 유지
DIGNITY_MAP = {
    "Sun": {"domicile": [4], "exalt": 0, "fall": 6},
    "Moon": {"domicile": [3], "exalt": 1, "fall": 7},
    "Mars": {"domicile": [0, 7], "exalt": 9, "fall": 3},
    "Venus": {"domicile": [1, 6], "exalt": 11, "fall": 5},
    "Mercury": {"domicile": [2, 5], "exalt": 14, "fall": 11}, # 14는 가상의 인덱스(Virgo 고도) 혹은 별도 처리
    "Jupiter": {"domicile": [8, 11], "exalt": 3, "fall": 9},
    "Saturn": {"domicile": [9, 10], "exalt": 6, "fall": 0},
    # 현대 행성: Domicile만 정의 (Exaltation, Fall 개념 배제)
    "Uranus": {"domicile": [10]},
    "Neptune": {"domicile": [11]},
    "Pluto": {"domicile": [7]}
}

def get_dignity(planet_name, sign_idx):
    """행성과 별자리 인덱스를 받아 Dignity 상태를 반환"""
    rules = DIGNITY_MAP.get(planet_name)
    if not rules: return None
    
    # Domicile 체크 (공통)
    if sign_idx in rules.get("domicile", []): return "Domicile"
    
    # 현대 행성(천해명)은 여기서 종료 (Domicile이 아니면 무조건 Peregrine)
    if planet_name in ["Uranus", "Neptune", "Pluto"]:
        return "Peregrine"
    
    # 고전 행성 전용 위계 체크
    if sign_idx == rules.get("exalt"): return "Exaltation"
    if sign_idx == rules.get("fall"): return "Fall"
    
    # Detriment 계산 (Domicile의 대척점)
    detriment_signs = [(d + 6) % 12 for d in rules.get("domicile", [])]
    if sign_idx in detriment_signs: return "Detriment"
    
    return "Peregrine"

def format_zodiac_info(lon, mode='tropical'):
    """360도 좌표를 별자리 30도 체계로 변환"""
    sign_idx = int(lon / 30)
    degree_in_sign = lon % 30
    names = ZODIAC_NAMES["jyotish" if mode == "jyotish" else "tropical"]
    
    d = int(degree_in_sign)
    m = int((degree_in_sign - d) * 60)
    # s = int((degree_in_sign - d - m/60) * 3600) # 필요시 초 단위 추가
    
    return f"{d:02d}° {names[sign_idx]} {m:02d}'", sign_idx