# app/core/astrology/composite.py

import math

def calculate_midpoint(lon1, lon2):
    """두 경도 사이의 최단 거리 중점 산출 (Circular Logic)"""
    l1, l2 = float(lon1) % 360, float(lon2) % 360
    diff = abs(l1 - l2)
    if diff <= 180:
        return (l1 + l2) / 2.0
    else:
        return ((l1 + l2 + 360) / 2.0) % 360.0

# ---------------------------------------------------------
# [Legacy]: Coagulatio (A2) 모듈 호환용
# ---------------------------------------------------------
def generate_composite_data(res1, res2, mode='normal'):
    composite_coords = {}
    s1_planets = res1.get('planets', {})
    s2_planets = res2.get('planets', {})
    common_keys = set(s1_planets.keys()) & set(s2_planets.keys())
    
    for key in common_keys:
        lon1 = s1_planets[key].get('longitude')
        lon2 = s2_planets[key].get('longitude')
        if lon1 is None or lon2 is None: continue
        
        mid = calculate_midpoint(lon1, lon2)
        if mode == 'anti': mid = (mid + 180.0) % 360.0
        composite_coords[key] = mid
    return composite_coords

# ---------------------------------------------------------
# [Modern]: A3 (Ordinatio) 전용 Logic - MC Anchor Fix
# ---------------------------------------------------------
def calculate_composite_chart(planets_a, planets_b, cusps_a, cusps_b):
    final_planets = {}
    final_cusps = {}

    # 1. 행성 중점 계산 (Planets)
    all_p_keys = set(planets_a.keys()) | set(planets_b.keys())
    for key in all_p_keys:
        p1 = planets_a.get(key)
        p2 = planets_b.get(key)
        if not p1 or not p2: continue 
        try:
            val1 = float(p1.get('longitude', 0))
            val2 = float(p2.get('longitude', 0))
            mid_val = calculate_midpoint(val1, val2)
            
            final_planets[key] = {
                "name": p1.get('name', key),
                "longitude": mid_val,
                "dms": "", "speed": 0, "house": 0, "dignity": "-", "is_retro": False
            }
        except: continue

    # 🚀 [추가된 방역 로직]: 한 쪽이라도 하우스(cusps) 데이터가 없다면 하우스 연산을 원천 차단합니다.
    if not cusps_a or not cusps_b:
        return { "planets": final_planets, "houses": {}, "lots": {} }

    # 2. 하우스 중점 계산 (MC Anchor Logic)
    # MC(10하우스)는 "하늘의 꼭대기"이므로 가장 신뢰할 수 있는 기준점입니다.
    # 나머지 하우스들이 MC를 기준으로 올바른 반구에 있는지 검증합니다.
    
    def get_val(obj):
        return float(obj.get('longitude', 0)) if isinstance(obj, dict) else float(obj)

    # 2-1. MC(10h) 우선 확정
    mc_a = get_val(cusps_a.get(10, 0))
    mc_b = get_val(cusps_b.get(10, 0))
    mc_mid = calculate_midpoint(mc_a, mc_b)
    final_cusps[10] = mc_mid # Anchor Point

    # 2-2. 나머지 하우스 정렬 검증
    for k in range(1, 13):
        if k == 10: continue # 이미 계산함
        if k not in cusps_a: continue
        
        v1 = get_val(cusps_a[k])
        v2 = get_val(cusps_b.get(k, 0))
        
        # 일단 단순 중점을 구함
        mid = calculate_midpoint(v1, v2)
        
        # 🔑 [Slot Enforcement]: MC로부터의 '기대 거리'와 비교
        # 하우스는 반시계 방향으로 10h(0) -> 11h(30) -> ... 1h(90/Asc) ... 순서여야 함
        # Python의 음수 모듈러 연산은 -270%360 = 90으로 자동 보정되어 안전함
        expected_offset_from_mc = ((k - 10) * 30) % 360
        actual_offset = (mid - mc_mid) % 360
        
        # 기대 위치와의 오차 계산 (원형 거리)
        delta = abs(actual_offset - expected_offset_from_mc)
        if delta > 180: delta = 360 - delta
        
        # 오차가 90도 이상이면 "뒤집힌(Flipped)" 것으로 간주하고 180도 회전
        # 예: Asc가 Dsc 위치에 찍히면 오차가 약 180도가 되므로 조건 충족 -> Flip
        if delta > 90:
            mid = (mid + 180.0) % 360.0
            
        final_cusps[k] = mid

    return { "planets": final_planets, "houses": final_cusps, "lots": {} }

def apply_anti_composite(planets, cusps):
    def flip(val): return (float(val) + 180.0) % 360.0
    
    new_planets = {}
    for k, p in planets.items():
        new_p = p.copy()
        new_p['longitude'] = flip(p['longitude'])
        new_planets[k] = new_p
        
    new_cusps = {k: flip(v) for k, v in cusps.items()}
    return new_planets, new_cusps