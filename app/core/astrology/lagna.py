# core/astrology/lagna.py — v2.1 Final Safe

from core.astrology.engine import format_dms_pretty

SIGN_NAMES = [
    "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
    "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"
]

JAIMINI_RULERS = {
    0: ['Mars'], 1: ['Venus'], 2: ['Mercury'], 3: ['Moon'], 4: ['Sun'], 5: ['Mercury'],
    6: ['Venus'], 7: ['Mars', 'Ketu'], 8: ['Jupiter'], 9: ['Saturn'], 10: ['Saturn', 'Rahu'], 11: ['Jupiter']
}

def get_sign_strength(sign_idx, planets):
    count = 0
    for p in planets.values():
        p_sign = int(p['longitude'] / 30) % 12
        if p_sign == sign_idx: count += 1
    return count

def get_stronger_lord(sign_idx, lords, planets):
    if len(lords) == 1: return lords[0]
    l1, l2 = lords[0], lords[1]
    if l1 not in planets or l2 not in planets: return l1
    s1 = get_sign_strength(int(planets[l1]['longitude']/30)%12, planets)
    s2 = get_sign_strength(int(planets[l2]['longitude']/30)%12, planets)
    return l1 if s1 >= s2 else l2

def calculate_pada(origin_sign_idx, planets):
    lords = JAIMINI_RULERS[origin_sign_idx]
    ruler_name = get_stronger_lord(origin_sign_idx, lords, planets)
    if ruler_name not in planets: return None

    ruler_lon = planets[ruler_name]['longitude']
    ruler_sign_idx = int(ruler_lon / 30) % 12
    
    dist = (ruler_sign_idx - origin_sign_idx) % 12
    arudha_sign_idx = (ruler_sign_idx + dist) % 12
    
    # 🚀 Jaimini Exceptions (Arudha can never be in 1st or 7th)
    if dist == 0: arudha_sign_idx = (arudha_sign_idx + 9) % 12    # in 1st -> moves to 10th
    elif dist == 6: arudha_sign_idx = (arudha_sign_idx + 3) % 12  # in 1st -> moves to 4th
    elif dist == 3: arudha_sign_idx = (arudha_sign_idx + 3) % 12  # in 7th -> moves to 10th
    elif dist == 9: arudha_sign_idx = (arudha_sign_idx + 9) % 12  # in 7th -> moves to 4th (🚨 이 줄이 누락되어 있었음!)

    return {"sign": arudha_sign_idx, "ruler": ruler_name}

def calculate_all_jaimini_padas(planets, cusps_input, asc_sign_idx):
    results = {}
    
    # 안전한 데이터 추출
    raw_cusps = {}
    for k, v in cusps_input.items():
        if isinstance(v, dict): raw_cusps[k] = float(v.get('longitude', 0.0))
        else: raw_cusps[k] = float(v)

    for h_num in range(1, 13):
        cusp_lon = raw_cusps[h_num]
        origin_sign = int(cusp_lon / 30) % 12
        
        pada_data = calculate_pada(origin_sign, planets)
        
        if pada_data:
            p_sign = pada_data['sign']
            deg_in_sign = cusp_lon % 30
            final_lon = (p_sign * 30) + deg_in_sign
            
            label = f"A{h_num}"
            if h_num == 1: label = "AL"
            if h_num == 12: label = "UL"
            
            sign_name = SIGN_NAMES[p_sign]
            rel_house = (p_sign - asc_sign_idx) % 12 + 1
            position_str = f"{sign_name} {rel_house}H"
            
            results[h_num] = {
                "label": label,
                "lon": final_lon,
                "dms": format_dms_pretty(final_lon),
                "position_str": position_str,
                "sign": p_sign,
                "ruler": pada_data['ruler']
            }
            
    return results