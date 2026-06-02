# app/core/astrology/davison.py — v52.0 Astrodienst Precision Match

import math
from datetime import datetime, timezone, timedelta
from zoneinfo import ZoneInfo
from timezonefinder import TimezoneFinder

try:
    from api.cities import CITIES
except ImportError:
    CITIES = {}

tf = TimezoneFinder()

# ════════════════════════════════════
# 1. Robust Helpers
# ════════════════════════════════════

def safe_float(val, default=0.0):
    try:
        return float(val)
    except (TypeError, ValueError):
        return default

def get_coords_safe(seed):
    if seed.get('lat') is not None and seed.get('lng') is not None:
        return safe_float(seed['lat']), safe_float(seed['lng'])
    
    if seed.get('latitude') is not None and seed.get('longitude') is not None:
        return safe_float(seed['latitude']), safe_float(seed['longitude'])

    loc_name = seed.get('location', '')
    if loc_name:
        for city_data in CITIES.values():
            if city_data.get('label') == loc_name:
                return safe_float(city_data.get('lat')), safe_float(city_data.get('lon'))
    
    return 37.5665, 126.9780

def get_real_offset_safe(seed, dt_naive, lat, lng):
    try:
        tz_name = tf.timezone_at(lng=lng, lat=lat)
        if tz_name:
            try:
                return ZoneInfo(tz_name).utcoffset(dt_naive).total_seconds() / 3600.0
            except:
                return round(lng / 15.0)
    except Exception: pass
    
    val = seed.get('timezone')
    if val is not None: return safe_float(val, 9.0)
    return 9.0

# ════════════════════════════════════
# 2. Astronomy Engine (Pure Python)
# ════════════════════════════════════

def get_julian_date(dt):
    a = (14 - dt.month) // 12
    y = dt.year + 4800 - a
    m = dt.month + 12*a - 3
    jd = dt.day + ((153*m + 2)//5) + 365*y + y//4 - y//100 + y//400 - 32045
    jd += (dt.hour - 12) / 24.0 + dt.minute / 1440.0 + dt.second / 86400.0
    return jd

def get_gmst(dt):
    jd = get_julian_date(dt)
    T = (jd - 2451545.0) / 36525.0
    gmst = 280.46061837 + 360.98564736629 * (jd - 2451545.0) + 0.000387933 * T**2 - T**3 / 38710000.0
    return gmst % 360

def get_mc(dt, lon):
    gmst = get_gmst(dt)
    ramc = (gmst + lon) % 360
    # J2000 기준 초정밀 황도경사각(Obliquity) 적용
    eps = math.radians(23.4392911) 
    ramc_rad = math.radians(ramc)
    y = math.sin(ramc_rad)
    x = math.cos(ramc_rad) * math.cos(eps)
    return math.degrees(math.atan2(y, x)) % 360

def get_ramc_from_mc(mc_deg):
    """
    🚀 [Astrodienst 정밀 보정 핵심] 
    황도경도(Ecliptic MC)를 적경(Equatorial RAMC)으로 역변환합니다.
    """
    eps = math.radians(23.4392911)
    mc_rad = math.radians(mc_deg)
    y = math.sin(mc_rad) * math.cos(eps)
    x = math.cos(mc_rad)
    return math.degrees(math.atan2(y, x)) % 360

def get_shortest_distance(a, b):
    d = b - a
    while d <= -180: d += 360
    while d > 180: d -= 360
    return d

def get_geodesic_midpoint(lat1, lng1, lat2, lng2):
    mid_lat = (lat1 + lat2) / 2
    diff_lng = lng2 - lng1
    while diff_lng <= -180: diff_lng += 360
    while diff_lng > 180: diff_lng -= 360
    mid_lng = lng1 + (diff_lng / 2.0)
    while mid_lng <= -180: mid_lng += 360
    while mid_lng > 180: mid_lng -= 360
    return mid_lat, mid_lng

# ════════════════════════════════════
# 3. Main Function
# ════════════════════════════════════

def calculate_davison_midpoint(seed1, seed2):
    """
    🚀 [Davison v52.0]: Astrodienst 오차 수복 및 MC/RAMC 정밀 보정 버전
    """
    # 1. 좌표 추출
    lat1, lng1 = get_coords_safe(seed1)
    lat2, lng2 = get_coords_safe(seed2)
    
    def resolve_time(s):
        raw_t = s.get('birth_time')
        is_unk = (not raw_t or raw_t == "Unknown" or raw_t == "")
        final_t = "12:00:00" if is_unk else raw_t
        return final_t, is_unk

    t1, unk1 = resolve_time(seed1)
    t2, unk2 = resolve_time(seed2)
    is_davison_unknown = (unk1 or unk2)

    # 2. 시간 파싱 및 UTC 변환
    dt1_n = datetime.strptime(f"{seed1['birth_date']} {t1}", "%Y-%m-%d %H:%M:%S")
    dt2_n = datetime.strptime(f"{seed2['birth_date']} {t2}", "%Y-%m-%d %H:%M:%S")
    
    off1 = get_real_offset_safe(seed1, dt1_n, lat1, lng1)
    off2 = get_real_offset_safe(seed2, dt2_n, lat2, lng2)
    
    dt1_utc = dt1_n.replace(tzinfo=timezone(timedelta(hours=off1))).astimezone(timezone.utc)
    dt2_utc = dt2_n.replace(tzinfo=timezone(timedelta(hours=off2))).astimezone(timezone.utc)
    
    # 3. Mean Time 및 Geodesic Midpoint
    diff = dt2_utc - dt1_utc
    mean_dt_utc = dt1_utc + (diff / 2)
    mid_lat, mid_lng = get_geodesic_midpoint(lat1, lng1, lat2, lng2)
    
    # 4. MC Synchronization (Astrodienst 정밀 로직)
    correction_seconds = 0
    try:
        # 4-1. 두 사람의 Ecliptic MC 계산
        mc1, mc2 = get_mc(dt1_utc, lng1), get_mc(dt2_utc, lng2)
        
        # 4-2. 황도경도(Ecliptic) 상의 정확한 목표 중간점 산출
        mc_comp = (mc1 + get_shortest_distance(mc1, mc2) / 2.0) % 360
        
        # 4-3. 목표 Ecliptic MC를 시간과 1:1 비례하는 RAMC(적경)로 역변환
        ramc_comp = get_ramc_from_mc(mc_comp)
        
        # 4-4. 현재 구해진 평균 시간의 RAMC 산출
        ramc_dav = (get_gmst(mean_dt_utc) + mid_lng) % 360
        
        # 4-5. RAMC 간의 최단 거리를 구함
        diff_final = get_shortest_distance(ramc_dav, ramc_comp)
        if diff_final > 90: diff_final -= 180
        elif diff_final < -90: diff_final += 180
        
        # 4-6. 적경(RAMC)의 1도는 정확히 240초와 일치하므로 100% 정밀 변환
        correction_seconds = diff_final * 240.0
    except: 
        correction_seconds = 0

    # 5. 시간 반올림 보정 (1초 누락/절사 방지)
    final_dt_utc = mean_dt_utc + timedelta(seconds=correction_seconds)
    if final_dt_utc.microsecond >= 500000:
        final_dt_utc += timedelta(seconds=1)
    final_dt_utc = final_dt_utc.replace(microsecond=0)
    
    # 6. Display Logic 및 타임존
    final_offset = off1 if abs(off1 - off2) < 0.5 else get_real_offset_safe({}, final_dt_utc, mid_lat, mid_lng)
    mid_dt_local = final_dt_utc.astimezone(timezone(timedelta(hours=final_offset)))
    
    # 7. 결과 반환
    res = {
        "idx": "DAVISON",
        "name": f"Union of {seed1.get('name', 'Unknown')} & {seed2.get('name', 'Unknown')}",
        "birth_date": mid_dt_local.strftime("%Y-%m-%d"),
        "location": "Davison Midpoint", 
        "lat": round(mid_lat, 4),
        "lng": round(mid_lng, 4),
        "timezone": float(final_offset),
        "has_body": 0,
        "is_seed": 1,
        "is_time_unknown": 1 if is_davison_unknown else 0
    }

    if is_davison_unknown:
        res["birth_time"] = "Time Unknown"
    else:
        res["birth_time"] = mid_dt_local.strftime("%H:%M:%S")

    return res