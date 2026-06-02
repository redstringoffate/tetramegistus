# app/core/astrology/hypostases.py
import swisseph as swe

def find_persona_transit(birth_jd: float, target_lon: float) -> float:
    """
    [N7 헬퍼] 태양이 출생 이후 처음으로 타겟 천체의 도수(target_lon)와 
    컨준션(0도)을 이루는 정확한 시간(Julian Day)을 역산 (오차율 0.000001 이하)
    """
    sun_pos, _ = swe.calc_ut(birth_jd, swe.SUN)
    sun_lon = sun_pos[0]
    
    delta = (target_lon - sun_lon) % 360
    if delta < 0.001:
        return birth_jd
        
    est_jd = birth_jd + (delta / 0.985647)
    
    for _ in range(10):
        pos, _ = swe.calc_ut(est_jd, swe.SUN)
        curr_lon = pos[0]
        
        diff = (target_lon - curr_lon)
        diff = (diff + 180) % 360 - 180 
        
        if abs(diff) < 0.000001:
            break
        est_jd += diff / 0.985647
        
    return est_jd

def get_aries_0_house(houses: dict) -> str:
    """양자리 0도(Aries 0.00°)가 위치한 하우스를 판별"""
    # houses 포맷에 맞게 조정 필요 (아래는 예시)
    for i in range(1, 13):
        curr_c = houses[i]['lon']
        next_c = houses[1]['lon'] if i == 12 else houses[i+1]['lon']
        
        if curr_c > next_c:
            if 0.0 >= curr_c or 0.0 < next_c:
                return f"H{i}"
        else:
            if curr_c <= 0.0 < next_c:
                return f"H{i}"
    return "-"