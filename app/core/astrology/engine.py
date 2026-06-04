# core/astrology/engine.py - v25.2 Fixed Stars Expansion & System Logic

import swisseph as swe
import pytz
import os
import math
from datetime import datetime, timedelta, timezone

from astral import LocationInfo
from astral.sun import sun

from .vault import ZODIAC_NAMES, SIGN_RULERS, get_dignity 
from .constants import ASTEROIDS
from .constants_fs import FIXED_STARS
from .arabic_lots import calculate_arabic_lots

from .divisions.decan import get_decan
from .divisions.duad import get_duad
from .divisions.dodecatemoria import get_dodecatemoria
from .divisions.egyptian_bounds import get_egyptian_bounds
from .divisions.sabian_engine import get_sabian_index
from .divisions.nakshatra import get_nakshatra_info


BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# 1. 메인 Ephemeris 경로 및 Asteroids 폴더 경로 생성 후 정문화
SWE_MAIN_PATH = os.path.join(BASE_DIR, 'swe').replace('\\', '/')
SWE_AST_PATH = os.path.join(SWE_MAIN_PATH, 'asteroids').replace('\\', '/')

# 2. 운영체제별 경로 구분자 확정 (Windows: ';', Unix/Mac: ':')
path_sep = ';' if os.name == 'nt' else ':'

# 3. 최종 경로 병합 및 라이브러리 주입
final_ephe_path = f"{SWE_MAIN_PATH}{path_sep}{SWE_AST_PATH}"
swe.set_ephe_path(final_ephe_path)

# 🚀 Debug: 서버 터미널에서 엔진이 실제로 어디를 찔러보고 있는지 확인하기 위함
print(f"[ENGINE INIT] Ephemeris Path Enforced: {final_ephe_path}")

WEEKDAY_LORDS = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"]
CHALDEAN_ORDER = ["Saturn", "Jupiter", "Mars", "Sun", "Venus", "Mercury", "Moon"]

TIER_PRIORITY = { "royal": 5, "spica": 4, "major": 3, "Traditional": 2, "common": 1 }

SYMBOL_MAP = {
    "Aries": "♈︎", "Taurus": "♉︎", "Gemini": "♊︎", "Cancer": "♋︎",
    "Leo": "♌︎", "Virgo": "♍︎", "Libra": "♎︎", "Scorpio": "♏︎",
    "Sagittarius": "♐︎", "Capricorn": "♑︎", "Aquarius": "♒︎", "Pisces": "♓︎",
    "Sun": "☉", "Moon": "☽", "Mars": "♂", "Mercury": "☿",
    "Jupiter": "♃", "Venus": "♀", "Saturn": "♄", "Uranus": "♅",
    "Neptune": "♆", "Pluto": "♇", "Ketu": "☋", "Rahu": "☊"
}

TROPICAL_SIGNS = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"]

# 🔑 [New]: Pre-calculate all star positions for the current epoch/system
def calculate_all_star_positions(jd_ut, system, iflgret):
    """
    Returns a list of all fixed stars with their current longitude.
    Handles Sidereal vs Tropical correctly based on flags.
    """
    # Draconic/Ketunic skip fixed stars
    if system in ['draconic', 'ketunic']:
        return []

    active_stars = []
    # If Sidereal, ensure FLG_SIDEREAL is passed (usually handled by caller's iflgret)
    # swe.set_sid_mode must be set BEFORE calling this if sidereal.
    
    for star_key, star_data in FIXED_STARS.items():
        try:
            # swe.fixstar2_ut returns ((lon, lat, dist), name, error)
            res = swe.fixstar2_ut(star_data["swe_name"], jd_ut, iflgret)
            star_lon = res[0][0]
            
            # Format Position String
            s_sign_idx = int(star_lon / 30) % 12
            s_deg = int(star_lon % 30)
            s_min = int((star_lon % 1) * 60)
            s_sec = int(((star_lon % 1) * 60 - s_min) * 60)
            s_sign_name = TROPICAL_SIGNS[s_sign_idx]
            pos_str = f"{s_sign_name},{s_deg}°{s_min}'{s_sec}''"

            active_stars.append({
                "name": star_key,
                "tier": star_data["tier"],
                "lon": star_lon,
                "position": pos_str
            })
        except: continue
        
    return active_stars

# 🔑 [New]: Check conjunctions against pre-calculated stars
def check_star_conjunctions(planet_lon, active_stars, orb_limit):
    conjunctions = []
    for star in active_stars:
        diff = abs(planet_lon - star['lon'])
        if diff > 180: diff = 360 - diff
        
        if diff <= orb_limit:
            conjunctions.append({
                "name": star['name'],
                "tier": star['tier'],
                "orb": round(diff, 4),
                "position": star['position']
            })
    
    # Sort: Tier Descending, then Orb Ascending
    conjunctions.sort(key=lambda x: (TIER_PRIORITY.get(x['tier'], 0), -x['orb']), reverse=True)
    return conjunctions

def get_solar_phase(planet_lon, sun_lon):
    try:
        diff = abs(planet_lon - sun_lon)
        if diff > 180: diff = 360 - diff
        if diff < 0.2833: return "cazimi"
        if diff < 8.5: return "combust"
        if diff < 17.0: return "under_beams"
    except: pass
    return None

def get_julian_day(date_str, time_str, tz_offset=0):
    try:
        y, m, d = map(int, str(date_str).split('-'))
        h, mn, s = map(int, str(time_str).split(':')) if time_str and time_str != "Unknown" else (12, 0, 0)
        return swe.julday(y, m, d, (h + mn/60.0 + s/3600.0) - float(tz_offset))
    except: return swe.julday(2000, 1, 1, 12.0)

def format_dms_pretty(lon, is_retro=False, use_rasi=False):
    try:
        sign_idx = int(lon / 30) % 12
        deg = int(lon % 30)
        m_raw = (lon % 1) * 60
        m, s = int(m_raw), round((m_raw - int(m_raw)) * 60)
        if s >= 60: s = 0; m += 1
        if m >= 60: m = 0; deg += 1
        names = ZODIAC_NAMES["jyotish" if use_rasi else "tropical"]
        return f"{names[sign_idx]},{deg:02d}°{m:02d}'{s:02d}''{',r' if is_retro else ''}"
    except: return "Error"

def get_planetary_lords(jd_ut, lat, lng, tz_offset):
    try:
        y, m, d, h_decimal = swe.revjul(jd_ut)
        h = int(h_decimal); mn = int((h_decimal - h) * 60); s = int(((h_decimal - h) * 60 - mn) * 60)
        dt_utc = datetime(y, m, d, h, mn, s, tzinfo=timezone.utc)
        tz_info = timezone(timedelta(hours=float(tz_offset)))
        dt_local = dt_utc.astimezone(tz_info)
        
        city = LocationInfo("Observer", "Local", "UTC", float(lat), float(lng))
        s_data = sun(city.observer, date=dt_local.date(), tzinfo=tz_info)
        sunrise, sunset = s_data['sunrise'].astimezone(tz_info), s_data['sunset'].astimezone(tz_info)
        
        civil_weekday_idx = (dt_local.weekday() + 1) % 7
        civil_lord = WEEKDAY_LORDS[civil_weekday_idx]
        is_dawn_birth = (dt_local < sunrise)
        
        if is_dawn_birth:
            astro_lord = WEEKDAY_LORDS[(civil_weekday_idx - 1) % 7]
            day_lord_display = f"{astro_lord} | {civil_lord}"
            calc_base_lord = astro_lord
            prev_day_date = dt_local.date() - timedelta(days=1)
            s_data_prev = sun(city.observer, date=prev_day_date, tzinfo=tz_info)
            current_sunrise, current_sunset = s_data_prev['sunrise'].astimezone(tz_info), s_data_prev['sunset'].astimezone(tz_info)
            next_sunrise = sunrise
        else:
            day_lord_display, calc_base_lord = civil_lord, civil_lord
            current_sunrise, current_sunset = sunrise, sunset
            next_day_date = dt_local.date() + timedelta(days=1)
            s_data_next = sun(city.observer, date=next_day_date, tzinfo=tz_info)
            next_sunrise = s_data_next['sunrise'].astimezone(tz_info)

        is_day_time = (current_sunrise <= dt_local < current_sunset)
        if is_day_time:
            start_time, end_time = current_sunrise, current_sunset
            phase_start_lord = calc_base_lord
        else:
            if dt_local >= current_sunset: start_time, end_time = current_sunset, next_sunrise
            else: start_time, end_time = current_sunset, next_sunrise
            phase_start_lord = CHALDEAN_ORDER[(CHALDEAN_ORDER.index(calc_base_lord) + 12) % 7]

        total_duration = (end_time - start_time).total_seconds()
        elapsed = (dt_local - start_time).total_seconds()
        hour_idx = int(elapsed / (total_duration / 12.0)) if total_duration > 0 else 0
        if hour_idx >= 12: hour_idx = 11
        if hour_idx < 0: hour_idx = 0
        
        hour_lord = CHALDEAN_ORDER[(CHALDEAN_ORDER.index(phase_start_lord) + hour_idx) % 7]
        return day_lord_display, hour_lord
    except Exception as e:
        print(f"[ENGINE] ❌ Astral Calc Failed: {str(e)}")
        return "-", "-"

def calculate_principia(date_str, time_str, lat, lng, timezone=0, system='tropical', ayanamsa='lahiri', view='zodiac', h_sys='P', fixed_star_orb=1.0, is_time_unknown=False):
    jd_ut = get_julian_day(date_str, time_str, timezone)
    
    AYAN_MAP = {'fagan-bradley': 0, 'lahiri': 1, 'raman': 3, 'kp': 5, 'yukteswar': 7}
    target_sid_mode = AYAN_MAP.get(ayanamsa.lower(), 1)

    iflgret = swe.FLG_SWIEPH | swe.FLG_SPEED

    try:
        if system == 'sidereal':
            iflgret |= swe.FLG_SIDEREAL
            swe.set_sid_mode(target_sid_mode, 0, 0)
        else: 
            swe.set_sid_mode(0, 0, 0)
    
        # 🚀 [Engine Hardening 1]: Time Unknown 시 Lordship 차별적 방역
        day_lord, hour_lord = get_planetary_lords(jd_ut, lat, lng, timezone)
        if is_time_unknown:
            hour_lord = "-"

        h_code = (h_sys if h_sys else 'P')[0].encode() 
        
        # 1. Base Calculations (House Cusps & Angles)
        if system == 'sidereal': swe.set_sid_mode(target_sid_mode, 0, 0)
        
        try: 
            cusps_raw, ascmc_raw = swe.houses_ex(jd_ut, lat, lng, h_code, iflgret)
        except: 
            cusps_raw, ascmc_raw = swe.houses_ex(jd_ut, lat, lng, b'O', iflgret)

        cusps = list(cusps_raw)
        ascmc = list(ascmc_raw)

        swe.set_sid_mode(0, 0, 0) 
        tn_lon_trop = swe.calc_ut(jd_ut, 11, swe.FLG_SWIEPH | swe.FLG_SPEED)[0][0]

        offset = 0.0
        if system == 'draconic': offset = -tn_lon_trop
        elif system == 'ketunic': offset = -tn_lon_trop + 180

        if offset != 0.0:
            cusps = [(c + offset) % 360 for c in cusps]
            ascmc = [(a + offset) % 360 for a in ascmc]
        
        # 🚀 [WSH ABSOLUTE ALIGNMENT]: Whole Sign일 경우 offset으로 어긋난 커스프를 무조건 각 별자리 0도로 강제 정렬
        if str(h_sys)[0].upper() == 'W':
            asc_deg = ascmc[0]
            base_0 = int(asc_deg / 30) * 30.0
            if len(cusps) == 13:
                for i in range(1, 13):
                    cusps[i] = (base_0 + (i - 1) * 30.0) % 360.0
            else:
                for i in range(len(cusps)):
                    cusps[i] = (base_0 + i * 30.0) % 360.0

        indicator_map = {
            "Sun": 0, "Moon": 1, "Mercury": 2, "Venus": 3, "Mars": 4, "Jupiter": 5, "Saturn": 6,
            "Uranus": 7, "Neptune": 8, "Pluto": 9, "Chiron": 15, "Ceres": 17, "Pallas": 18, "Juno": 19, "Vesta": 20,
            "Mean Lilith": 12, "Lilith (mean)": 12, "True Lilith": 13, "Asteroid Lilith": ASTEROIDS.get("Lilith", 0) + 10000,
            "Eros": ASTEROIDS.get("Eros", 0) + 10000, "Psyche": ASTEROIDS.get("Psyche", 0) + 10000,
            "Moira": ASTEROIDS.get("Moira", 0) + 10000, "Klotho": ASTEROIDS.get("Klotho", 0) + 10000,
            "Lachesis": ASTEROIDS.get("Lachesis", 0) + 10000, "Atropos": ASTEROIDS.get("Atropos", 0) + 10000,
            "North Node (m)": 10, "North Node (t)": 11
        }
        
        results, raw_coords = {}, {}
        use_rasi = (system == 'sidereal' and view == 'nakshatra')
        is_kp_calc = (system == 'sidereal' and ayanamsa.lower() == 'kp')
        
        sun_lon_raw = 0.0
        try:
            if system == 'sidereal': swe.set_sid_mode(target_sid_mode, 0, 0)
            else: swe.set_sid_mode(0, 0, 0)
            sun_lon_raw = swe.calc_ut(jd_ut, 0, iflgret)[0][0]
            sun_lon_raw = (sun_lon_raw + offset) % 360
        except: pass

        try: orb_val = float(fixed_star_orb)
        except: orb_val = 1.0

        if system == 'sidereal': swe.set_sid_mode(target_sid_mode, 0, 0)
        else: swe.set_sid_mode(0, 0, 0)
        
        active_star_list = calculate_all_star_positions(jd_ut, system, iflgret)

        # 2. Calculate Planets
        for name, p_id in indicator_map.items():
            try:
                if system == 'sidereal': swe.set_sid_mode(target_sid_mode, 0, 0)
                else: swe.set_sid_mode(0, 0, 0)

                res = swe.calc_ut(jd_ut, p_id, iflgret)
                lon, is_retro = res[0][0], res[0][3] < 0
                lon = (lon + offset) % 360
                
                sign_idx = int(lon / 30) % 12
                deg_in_sign = lon % 30
                sign_name = TROPICAL_SIGNS[sign_idx]
                
                nak_data = get_nakshatra_info(lon, is_kp=is_kp_calc)
                solar_phase = None
                fixed_stars = []

                if system not in ['draconic', 'ketunic']:
                    fixed_stars = check_star_conjunctions(lon, active_star_list, orb_val)

                if name in ["Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn"]:
                    solar_phase = get_solar_phase(lon, sun_lon_raw)

                results[name] = {
                    "longitude": lon,
                    "dms": format_dms_pretty(lon, is_retro, use_rasi),
                    "is_retrograde": is_retro,
                    "is_anaretic": deg_in_sign >= 29.0,
                    "solar_phase": solar_phase,
                    "fixed_stars": fixed_stars,
                    "ruler": SIGN_RULERS[sign_idx][0],
                    "dignity": get_dignity(name, sign_idx),
                    "duad": SYMBOL_MAP.get(get_duad(sign_name, deg_in_sign), "-"),
                    "dodeca": SYMBOL_MAP.get(get_dodecatemoria(deg_in_sign), "-"),
                    "decan": SYMBOL_MAP.get(get_decan(sign_name, deg_in_sign), "-"),
                    "bound": SYMBOL_MAP.get(get_egyptian_bounds(sign_name, deg_in_sign), "-"),
                    "sabian_index": get_sabian_index(lon),
                    "nakshatra": nak_data,
                    "pada_lord": SYMBOL_MAP.get(nak_data.get("pada_lord"), "-"),
                    "sub_lord": SYMBOL_MAP.get(nak_data.get("sub_lord"), "-") if is_kp_calc else "-"
                }
                if name == "North Node (m)": results["Rahu"] = results[name]
                raw_coords[name] = (lon, is_retro)
            except Exception as e: 
                print(f"[ENGINE ERROR] {name}: {str(e)}")
                results[name] = {"dms": "-", "is_retrograde": False}

        # South Nodes
        for n_type in ["(m)", "(t)"]:
            nn = f"North Node {n_type}"
            if nn in raw_coords:
                sn_lon = (raw_coords[nn][0] + 180) % 360
                sn_sign_idx = int(sn_lon/30)%12
                sn_sign_name = TROPICAL_SIGNS[sn_sign_idx]
                nak_data = get_nakshatra_info(sn_lon, is_kp=is_kp_calc)
                
                sn_stars = []
                if system not in ['draconic', 'ketunic']:
                    sn_stars = check_star_conjunctions(sn_lon, active_star_list, orb_val)

                node_res = {
                    "longitude": sn_lon,
                    "dms": format_dms_pretty(sn_lon, raw_coords[nn][1], use_rasi),
                    "is_retrograde": raw_coords[nn][1],
                    "is_anaretic": (sn_lon % 30) >= 29.0,
                    "fixed_stars": sn_stars,
                    "ruler": SIGN_RULERS[sn_sign_idx][0],
                    "duad": SYMBOL_MAP.get(get_duad(sn_sign_name, sn_lon % 30), "-"),
                    "dodeca": SYMBOL_MAP.get(get_dodecatemoria(sn_lon % 30), "-"),
                    "decan": SYMBOL_MAP.get(get_decan(sn_sign_name, sn_lon % 30), "-"),
                    "bound": SYMBOL_MAP.get(get_egyptian_bounds(sn_sign_name, sn_lon % 30), "-"),
                    "sabian_index": get_sabian_index(sn_lon),
                    "nakshatra": nak_data,
                    "pada_lord": SYMBOL_MAP.get(nak_data.get("pada_lord"), "-"),
                    "sub_lord": SYMBOL_MAP.get(nak_data.get("sub_lord"), "-") if is_kp_calc else "-"
                }
                results[f"South Node {n_type}"] = node_res
                if n_type == "(m)": results["Ketu"] = node_res

        # 🚀 [Engine Hardening 2]: Time Unknown 시 Angles 연산 결과 배포 중단
        if not is_time_unknown:
            asc_val = ascmc[0]
            mc_val = ascmc[1]
            ic_val = (mc_val + 180) % 360
            dsc_val = (asc_val + 180) % 360
            
            angle_map = {
                "Ascendant": asc_val, "Asc.": asc_val, 
                "Immum Coeli": ic_val, "I.C.": ic_val, 
                "Descendant": dsc_val, "Dsc.": dsc_val, 
                "Midheaven": mc_val, "M.C.": mc_val
            }

            for name, lon in angle_map.items():
                ang_sign_idx = int(lon/30)%12
                ang_sign_name = TROPICAL_SIGNS[ang_sign_idx]
                nak_data = get_nakshatra_info(lon, is_kp=is_kp_calc)
                
                ang_stars = []
                if system not in ['draconic', 'ketunic']:
                    ang_stars = check_star_conjunctions(lon, active_star_list, orb_val)

                results[name] = {
                    "longitude": lon,
                    "dms": format_dms_pretty(lon, False, use_rasi),
                    "is_anaretic": (lon % 30) >= 29.0,
                    "fixed_stars": ang_stars,
                    "ruler": SIGN_RULERS[ang_sign_idx][0],
                    "duad": SYMBOL_MAP.get(get_duad(ang_sign_name, lon % 30), "-"),
                    "dodeca": SYMBOL_MAP.get(get_dodecatemoria(lon % 30), "-"),
                    "decan": SWE_DECAN_LIST[swe.get_decan(ang_sign_name, lon % 30)] if 'SWE_DECAN_LIST' in globals() else SYMBOL_MAP.get(get_decan(ang_sign_name, lon % 30), "-"),
                    "bound": SYMBOL_MAP.get(get_egyptian_bounds(ang_sign_name, lon % 30), "-"),
                    "sabian_index": get_sabian_index(lon),
                    "nakshatra": nak_data,
                    "pada_lord": SYMBOL_MAP.get(nak_data.get("pada_lord"), "-"),
                    "sub_lord": SYMBOL_MAP.get(nak_data.get("sub_lord"), "-") if is_kp_calc else "-"
                }

        # 🚀 [Engine Hardening 3]: Time Unknown 시 House Cusp 연산 결과 배포 중단
        houses_data = {}
        if not is_time_unknown:
            if len(cusps) == 13:
                for i in range(1, 13):
                    houses_data[i] = {"longitude": cusps[i], "sign_idx": int(cusps[i]/30)%12}
            else:
                for i, lon in enumerate(cusps):
                    houses_data[i+1] = {"longitude": lon, "sign_idx": int(lon/30)%12}

        # ---------------------------------------------------------
        def _get_house_num(lon, houses_dict):
            if not houses_dict: return "-" # 시간 모름(is_time_unknown)일 때는 하우스 없음
            for i in range(1, 13):
                start = houses_dict[i]['longitude']
                end = houses_dict[i+1]['longitude'] if i < 12 else houses_dict[1]['longitude']
                
                if start < end:
                    if start <= lon < end: return i
                else: # 350°에서 10°로 넘어가는 0도 통과 구간 처리
                    if lon >= start or lon < end: return i
            return 1

        for p_name, p_data in results.items():
            if "longitude" in p_data:
                p_data["house"] = _get_house_num(p_data["longitude"], houses_data)
        # ---------------------------------------------------------

        return {
            "planets": results,
            "houses": houses_data,
            "lords": {"day": day_lord, "hour": hour_lord},
            "meta": {"system": system, "h_sys": h_sys, "view": view, "ayan": ayanamsa}
        }
        
    finally:
        swe.set_sid_mode(0, 0, 0)

# [Helper] Sect 판별 (Ascendant 기준 기하학적 판별)
def get_day_night_sect(sun_lon, asc_lon):
    """
    태양의 황도 좌표(sun_lon)와 상승점(asc_lon)의 상관관계를 분석하여 차트의 섹트(Sect)를 판별합니다.
    - Day (낮): 태양이 지평선 위(7~12하우스 구간)에 존재.
    - Night (밤): 태양이 지평선 아래(1~6하우스 구간)에 존재.
    """
    try:
        # 1. 360도 정규화 (입력값 오염 방지)
        s_lon = float(sun_lon) % 360
        a_lon = float(asc_lon) % 360
        
        # 2. 상승점으로부터 태양까지의 반시계 방향(Signs Order) 거리 계산
        # 이 거리가 0° ~ 180° 미만이면 지평선 아래(1~6H)에 있는 것입니다.
        # 이 거리가 180° ~ 360° 미만이면 지평선 위(7~12H)로 떠오른 것입니다.
        diff = (s_lon - a_lon) % 360
        
        # 3. 경계선(Horizon) 정밀 판정
        # 180.0도는 정확히 Descendant(하강점)이며, 이때부터 태양은 지평선 아래로 내려갑니다.
        # 0.0도는 정확히 Ascendant(상승점)이며, 이때부터 태양은 지평선 위로 올라옵니다.
        if 180.0 <= diff < 360.0:
            return True  # Day
        else:
            return False # Night
            
    except (ValueError, TypeError):
        # 데이터 오류 시 안전장치로 낮 차트 기본값 반환
        return True

# [Helper] Hermetic Lots 계산
def calculate_hermetic_lots(asc, sun, moon, mercury, venus, mars, jupiter, saturn, is_day, schema='paulus'):
    def normalize(deg):
        return (deg + 360) % 360

    lots = {}
    
    # 1. Fortune & Spirit (공통)
    if is_day:
        lots['Fortune'] = normalize(asc + moon - sun)
        lots['Spirit']  = normalize(asc + sun - moon)
    else:
        lots['Fortune'] = normalize(asc + sun - moon)
        lots['Spirit']  = normalize(asc + moon - sun)

    f_pos = lots['Fortune']
    s_pos = lots['Spirit']

    # 2. Eros & Necessity (스키마 분기)
    if schema == 'valens':
        # Valens: 낮/밤 공식을 뒤집음 (Standard)
        if is_day:
            lots['Eros'] = normalize(asc + s_pos - f_pos)
            lots['Necessity'] = normalize(asc + f_pos - s_pos)
        else:
            lots['Eros'] = normalize(asc + f_pos - s_pos)
            lots['Necessity'] = normalize(asc + s_pos - f_pos)
    else:
        # Paulus (Default): Valens와 반대 (Sect Reversal 없음 혹은 반대 적용)
        if is_day:
            lots['Eros'] = normalize(asc + venus - s_pos)      
            lots['Necessity'] = normalize(asc + f_pos - mercury) 
        else:
            lots['Eros'] = normalize(asc + s_pos - venus)      
            lots['Necessity'] = normalize(asc + mercury - f_pos) 

    # 3. 나머지 Lots (공통)
    if is_day:
        lots['Courage'] = normalize(asc + f_pos - mars)
        lots['Victory'] = normalize(asc + jupiter - s_pos)
        lots['Nemesis'] = normalize(asc + f_pos - saturn)
    else:
        lots['Courage'] = normalize(asc + mars - f_pos)
        lots['Victory'] = normalize(asc + s_pos - jupiter)
        lots['Nemesis'] = normalize(asc + saturn - f_pos)

    return lots

# [Helper] Syzygy (삭망) 역추적
def get_syzygy(jd):
    flag = swe.FLG_SWIEPH
    
    s_lon = swe.calc_ut(jd, swe.SUN, flag)[0][0]
    m_lon = swe.calc_ut(jd, swe.MOON, flag)[0][0]
    phase_angle = (m_lon - s_lon) % 360
    
    days_since_new = phase_angle / 12.19
    days_since_full = (phase_angle - 180) % 360 / 12.19
    
    syzygy_type = ""
    target_jd = 0
    target_angle = 0
    
    if days_since_new < days_since_full:
        syzygy_type = "New Moon"
        target_jd = jd - days_since_new
        target_angle = 0
    else:
        syzygy_type = "Full Moon"
        target_jd = jd - days_since_full
        target_angle = 180
        
    current_jd = target_jd
    for _ in range(3):
        s = swe.calc_ut(current_jd, swe.SUN, flag)[0][0]
        m = swe.calc_ut(current_jd, swe.MOON, flag)[0][0]
        diff = (m - s) % 360
        delta = diff - target_angle
        if delta > 180: delta -= 360
        elif delta < -180: delta += 360
        
        if abs(delta) < 0.001: break
        current_jd -= (delta / 12.19)
        
    return syzygy_type, current_jd

def calculate_arcana(date_str, time_str, lat, lng, timezone=0, lot_schema='paulus', h_sys='P', system='tropical', ayanamsa='lahiri'):
    jd_ut = get_julian_day(date_str, time_str, timezone)
    iflgret = swe.FLG_SWIEPH | swe.FLG_SPEED
    
    try:
        # 1. Calc Offset (Draconic/Ketunic)
        swe.set_sid_mode(0, 0, 0)
        tn_lon_trop = swe.calc_ut(jd_ut, 11, swe.FLG_SWIEPH | swe.FLG_SPEED)[0][0]
        offset = 0.0
        if system == 'draconic': offset = -tn_lon_trop
        elif system == 'ketunic': offset = -tn_lon_trop + 180

        # 2. Get Bodies (Apply Offset)
        bodies = {
            "Sun": swe.SUN, "Moon": swe.MOON, "Mercury": swe.MERCURY, 
            "Venus": swe.VENUS, "Mars": swe.MARS, "Jupiter": swe.JUPITER, "Saturn": swe.SATURN
        }
        coords = {}
        for name, pid in bodies.items():
            res = swe.calc_ut(jd_ut, pid, iflgret)[0][0]
            coords[name] = (res + offset) % 360

        # 3. Get Angles (Apply Offset)
        try: h_code = h_sys[0].encode()
        except: h_code = b'P'
        cusps_raw, ascmc_raw = swe.houses_ex(jd_ut, lat, lng, h_code, iflgret)
        
        cusps = [(c + offset) % 360 for c in cusps_raw]
        asc_deg = (ascmc_raw[0] + offset) % 360
        vertex_deg = (ascmc_raw[3] + offset) % 360 

        # 🚀 [WSH ABSOLUTE ALIGNMENT for ARCANA]
        try: h_code = str(h_sys)[0].upper().encode()
        except: h_code = b'P'

        if h_code == b'W':
            base_0 = int(asc_deg / 30) * 30.0
            if len(cusps) == 13:
                for i in range(1, 13):
                    cusps[i] = (base_0 + (i - 1) * 30.0) % 360.0
            else:
                for i in range(len(cusps)):
                    cusps[i] = (base_0 + i * 30.0) % 360.0

        is_day = get_day_night_sect(coords["Sun"], asc_deg)
        sect = "Day" if is_day else "Night"

        lots_data = calculate_hermetic_lots(
            asc_deg, coords["Sun"], coords["Moon"], 
            coords["Mercury"], coords["Venus"], coords["Mars"], 
            coords["Jupiter"], coords["Saturn"], 
            is_day,
            schema=lot_schema
        )

        syz_type, syz_jd = get_syzygy(jd_ut)
        syz_sun = (swe.calc_ut(syz_jd, swe.SUN, iflgret)[0][0] + offset) % 360
        syz_moon = (swe.calc_ut(syz_jd, swe.MOON, iflgret)[0][0] + offset) % 360
        syz_point = syz_moon if syz_type == "Full Moon" else syz_sun

        def get_house_num(lon, cusps):
            for i in range(12):
                curr, next_c = cusps[i], cusps[(i+1)%12]
                if curr < next_c:
                    if curr <= lon < next_c: return i + 1
                else:
                    if curr <= lon < 360 or 0 <= lon < next_c: return i + 1
            return 1

        def fmt(deg):
            sign_idx = int(deg/30)
            sign_name = TROPICAL_SIGNS[sign_idx]
            d_in_s = deg % 30
            return {
                "value": deg, "longitude": deg, 
                "dms": format_dms_pretty(deg),
                "house": get_house_num(deg, cusps),
                "sign": sign_idx,
                "sabian": get_sabian_index(deg),
                "duad": SYMBOL_MAP.get(get_duad(sign_name, d_in_s), "-"),
                "dodeca": SYMBOL_MAP.get(get_dodecatemoria(d_in_s), "-"),
                "decan": SYMBOL_MAP.get(get_decan(sign_name, d_in_s), "-"),
                "bound": SYMBOL_MAP.get(get_egyptian_bounds(sign_name, d_in_s), "-")
            }

        return {
            "meta": { "sect": sect, "is_day": is_day, "schema": lot_schema },
            "lots": {k: fmt(v) for k, v in lots_data.items()},
            "vertex": {
                "Vertex": fmt(vertex_deg),
                "Anti-Vertex": fmt((vertex_deg + 180) % 360)
            },
            "syzygy": {
                "name": syz_type,
                "data": fmt(syz_point),
                "date_jd": syz_jd
            }
        }
    finally:
        swe.set_sid_mode(0, 0, 0)

# 🚀 [New Helper]: Purushartha Logic
def get_purushartha_info(nak_id, pada):
    """
    Nakshatra ID (1-27)와 Pada(1-4)를 기반으로 Purushartha(D/A/K/M)를 반환합니다.
    Rule: 
      - Nakshatra Goal: 1(Dharma), 2(Artha), 3(Kama), 4(Moksha) Cycle
      - Pada Goal: 1(D), 2(A), 3(K), 4(M)
    """
    GOALS = ["Moksha", "Dharma", "Artha", "Kama"] # 0, 1, 2, 3 remainder
    PADA_INITIALS = {1: "D", 2: "A", 3: "K", 4: "M"}
    
    nak_goal = GOALS[nak_id % 4]
    pada_goal = PADA_INITIALS.get(pada, "-")
    
    return nak_goal, pada_goal

def calculate_divisio(date_str, time_str, lat, lng, timezone=0, ayanamsa='lahiri'):
    import sys
    import importlib
    
    target_mod = 'core.astrology.divisions.varga_logic'
    if target_mod in sys.modules: del sys.modules[target_mod]
    import core.astrology.divisions.varga_logic as vl_fresh

    jd_ut = get_julian_day(date_str, time_str, timezone)
    iflgret = swe.FLG_SWIEPH | swe.FLG_SPEED 
    
    target_map = {
        "Sun": swe.SUN, "Moon": swe.MOON, "Mercury": swe.MERCURY, 
        "Venus": swe.VENUS, "Mars": swe.MARS, "Jupiter": swe.JUPITER, 
        "Saturn": swe.SATURN, "Uranus": swe.URANUS, "Neptune": swe.NEPTUNE, 
        "Pluto": swe.PLUTO, "Chiron": swe.CHIRON, 
        "Mean Lilith": swe.MEAN_APOG, "True Lilith": swe.OSCU_APOG, 
        "North Node (t)": swe.TRUE_NODE
    }
    
    try:
        # 1. Tropical Calc (Harmonics Base)
        swe.set_sid_mode(0, 0, 0)
        bodies_tropical = {}
        for name, pid in target_map.items():
            try:
                res = swe.calc_ut(jd_ut, pid, iflgret)
                bodies_tropical[name] = {"longitude": res[0][0]} 
            except: bodies_tropical[name] = {"longitude": 0.0}

        try:
            _, ascmc = swe.houses_ex(jd_ut, float(lat), float(lng), b'P', iflgret)
            bodies_tropical['Ascendant'] = {"longitude": ascmc[0]}
        except: bodies_tropical['Ascendant'] = {"longitude": 0.0}

        if 'North Node (t)' in bodies_tropical:
            rahu_lon = bodies_tropical['North Node (t)']['longitude']
            bodies_tropical['South Node (t)'] = {"longitude": (rahu_lon + 180.0) % 360.0}

        # 2. Ayanamsa (Varga Base)
        AYAN_MAP = {'fagan-bradley': 0, 'lahiri': 1, 'raman': 3, 'kp': 5, 'yukteswar': 7}
        target_sid_mode = AYAN_MAP.get(ayanamsa.lower(), 1)
        swe.set_sid_mode(target_sid_mode, 0, 0)
        ayanamsa_val = swe.get_ayanamsa_ut(jd_ut)
        
        # 3. Calculation Loop
        harmonics = {}
        harmonics_raw = {} 
        varga_data = {}
        
        h_levels = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 16, 20, 24, 32]
        v_divs = [1, 2, 3, 4, 6, 7, 8, 9, 10, 12, 16, 20, 24, 30, 60]
        is_kp = (ayanamsa.lower() == 'kp')

        for name, data in bodies_tropical.items():
            trop_lon = data['longitude']
            
            # --- Harmonics (Tropical) ---
            h_row = {}
            h_row_raw = {} 
            for h in h_levels:
                h_lon = (trop_lon * h) % 360.0
                h_row[f"H{h}"] = format_dms_pretty(h_lon)
                h_row_raw[f"H{h}"] = h_lon 
            
            harmonics[name] = h_row
            harmonics_raw[name] = h_row_raw 
            
            # --- Vargas (Sidereal) ---
            sid_lon = (trop_lon - ayanamsa_val) % 360.0
            v_row = {} 
            
            for d in v_divs:
                sign, v_lon, pur_str = vl_fresh.get_varga_details(sid_lon, d, ayanamsa)
                nak_data = get_nakshatra_info(v_lon, is_kp=is_kp)
                
                if is_kp:
                    sub_lord = nak_data.get('sub_lord', '-')
                    sub_symbol = SYMBOL_MAP.get(sub_lord, sub_lord)
                    nak_str = f"{nak_data['name']}-{sub_symbol}"
                else:
                    nak_str = f"{nak_data['name']}-{nak_data.get('pada', 1)}"

                v_row[f"D{d}"] = {
                    "sign": sign,
                    "lon": v_lon,
                    "formatted": format_dms_pretty(v_lon, use_rasi=True),
                    "nakshatra": nak_str,
                    "purushartha": pur_str  
                }
                
                if d == 1:
                    v_row['info'] = format_dms_pretty(v_lon, use_rasi=True)
                    v_row['nakshatra'] = nak_str
                    v_row['purushartha'] = pur_str

            varga_data[name] = v_row

        return {
            "harmonics": harmonics,
            "harmonics_raw": harmonics_raw, 
            "varga": varga_data,
            "meta": {"ayanamsa": ayanamsa, "val": ayanamsa_val}
        }
    finally:
        swe.set_sid_mode(0, 0, 0)

def calculate_codex_tenebris(date_str, time_str, lat, lng, timezone=0, ayanamsa='lahiri', dichotomy='traditional', fixed_star_orb=1.5, h_sys='P', is_time_unknown=False):
    """
    CODEX TENEBRIS (N8) - v27.2 Retrograde Logic Fixes
    """
    
    codex_grid = [
        {
            "minor_asteroids": [], "tropical": [], "sidereal": [], 
            "draconic": [], "ketunic": [], "arabic_lots": [],
            "tropical_h": 0, "sidereal_h": 0, "draconic_h": 0, "ketunic_h": 0
        } for _ in range(360)
    ]

    def get_idx(lon): return int(lon) % 360

    CSS_MAP = {
        "Planets": ["Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune", "Pluto"],
        "Major Asteroids": ["Chiron", "Ceres", "Pallas", "Juno", "Vesta", "Asteroid Eros", "Psyche", "Asteroid Lilith"],
        "Lilith & Nodes": ["Mean Lilith", "True Lilith", "Rahu", "Ketu", "North Node (t)", "South Node (t)"],
        "Fates": ["Moira", "Klotho", "Lachesis", "Atropos"],
        "Angles": ["Ascendant", "Midheaven", "Descendant", "Immum Coeli"],
        "Vertex": ["Vertex", "Anti-Vertex"],
        "Syzygy": ["Syzygy", "New Moon", "Full Moon"]
    }

    def enforce_wsh_cusps(res_obj):
        if h_sys != 'W' or is_time_unknown: return
        
        # 1. 현재 시스템의 Ascendant 위치 확보
        asc_entry = res_obj['planets'].get('Ascendant') or res_obj['planets'].get('Asc.')
        if not asc_entry: return
        asc_lon = asc_entry['longitude']
        
        # 2. 해당 별자리의 0도 계산 (예: 15.5도 -> 0.0도)
        base_0 = int(asc_lon / 30) * 30.0
        
        # 3. 1~12하우스 커스프 재설정
        for i in range(1, 13):
            # 정확히 30도씩 더해서 부동소수점 오차 없이 정수 단위로 떨어지게 함
            new_lon = (base_0 + (i - 1) * 30.0) % 360.0
            
            # 엔진 결과 덮어쓰기
            if i in res_obj['houses']:
                res_obj['houses'][i]['longitude'] = new_lon
                res_obj['houses'][i]['sign_idx'] = int(new_lon / 30)

    # 1. Principia 계산 (Tropical)
    trop_res = calculate_principia(
        date_str, time_str, lat, lng, timezone, 
        system='tropical', view='zodiac', fixed_star_orb=fixed_star_orb, is_time_unknown=is_time_unknown
    )
    
    enforce_wsh_cusps(trop_res)

    raw_day = trop_res['lords'].get('day', '-')
    raw_hour = trop_res['lords'].get('hour', '-')
    day_lords = [d.strip() for d in raw_day.split('|')]
    hour_lords = [h.strip() for h in raw_hour.split('|')]

    def make_obj(name, lon, is_retro=False, forced_css=None, fixed_stars=None, is_node=False):
        # 1. CSS Class
        css_class = forced_css
        if not css_class:
            if name in CSS_MAP["Planets"]: css_class = "p-planet"
            elif name in CSS_MAP["Major Asteroids"]: css_class = "p-major"
            elif name in CSS_MAP["Lilith & Nodes"]: css_class = "p-node"
            elif name in CSS_MAP["Fates"]: css_class = "p-fate"
            elif name in CSS_MAP["Angles"]: css_class = "p-angle"
            elif name in CSS_MAP["Vertex"]: css_class = "p-vertex"
            elif name in CSS_MAP["Syzygy"]: css_class = "p-syzygy"
            elif "cusp" in name: css_class = "p-cusp"
            elif "Lot" in name or "(v)" in name: css_class = "p-lot"
            else: css_class = "p-minor"

        # Lord Logic
        is_day_lord = (name in day_lords)
        is_hour_lord = (name in hour_lords)
        tooltip_prefix = ""
        
        if is_day_lord: css_class += " lord-day"; tooltip_prefix += "[Day Lord]"
        if is_hour_lord: css_class += " lord-hour"; tooltip_prefix += "[Hour Lord]"
        if tooltip_prefix: tooltip_prefix += " "

        star_marker, hover_stars = "", ""
        if fixed_stars:
            for s in fixed_stars:
                if s['tier'] in ['royal', 'spica']: star_marker += "<b>*</b>"
                else: star_marker += "*"
                hover_stars += f"\n★ {s['name']} | {s['position']}"

        # 2. Text Formatting (Retrograde)
        display_text = name
        if is_retro and not is_node: display_text += " (r)"
        dms_text = tooltip_prefix + format_dms_pretty(lon, is_retro) + hover_stars

        return {
            "name": name, "text": display_text, "html_suffix": star_marker,
            "lon": lon, "dms": dms_text, "css": css_class,
            "fixed_stars": fixed_stars
        }

    # 🚀 [Helper Update]: Sabian Interval Filling Logic (Sort by Position)
    def map_houses_to_grid(cusps, target_key):
        if not cusps: return
        # 1. 그리드 초기화
        for i in range(360): 
            codex_grid[i][target_key] = 0

        # 2. 커스프 데이터를 (사비안인덱스, 하우스번호) 형태로 변환하여 리스트 생성
        # int(lon)은 해당 도수가 속한 사비안 인덱스(0~359)와 일치합니다.
        # 예: 1.5도 -> index 1 (Aries 2)
        sorted_cusps = []
        for h, lon in cusps.items():
            sabian_idx = int(lon) % 360 
            sorted_cusps.append((sabian_idx, h))
        
        # 3. 휠 위의 실제 위치 순서대로 정렬 (이것이 핵심입니다!)
        sorted_cusps.sort(key=lambda x: x[0])

        # 4. 구간 채우기 루프 (현재 커스프 ~ 다음 커스프 전까지)
        count = len(sorted_cusps)
        for i in range(count):
            curr_start, curr_h = sorted_cusps[i]
            next_start, _ = sorted_cusps[(i + 1) % count] # 다음 커스프 (마지막이면 처음으로)

            # Case A: 일반적인 구간 (예: 10 ~ 40)
            if curr_start < next_start:
                for idx in range(curr_start, next_start):
                    codex_grid[idx][target_key] = curr_h
            
            # Case B: 360도를 넘어가는 구간 (예: 350 ~ 20, Aries 0도 통과)
            else:
                # 1) 현재 위치부터 359(끝)까지
                for idx in range(curr_start, 360):
                    codex_grid[idx][target_key] = curr_h
                # 2) 0부터 다음 커스프 전까지
                for idx in range(0, next_start):
                    codex_grid[idx][target_key] = curr_h

    # ==========================================================
    # 1. Tropical
    # ==========================================================
    SKIP_ALIASES = ["Asc.", "M.C.", "Dsc.", "I.C.", "North Node (m)", "South Node (m)", "Lilith (mean)"]

    for name, data in trop_res['planets'].items():
        if name in SKIP_ALIASES: continue
        
        final_name = name; is_node_flag = False
        if name == "North Node" or name == "Rahu": final_name = "Rahu"; is_node_flag = True
        elif name == "South Node" or name == "Ketu": final_name = "Ketu"; is_node_flag = True
        elif name == "North Node (t)": final_name = "North Node (t)"; is_node_flag = True
        elif name == "South Node (t)": final_name = "South Node (t)"; is_node_flag = True
        elif name == "Eros": final_name = "Asteroid Eros"
        elif name == "Lilith": final_name = "Asteroid Lilith"
        elif name == "Mean Lilith": is_node_flag = True

        idx = get_idx(data['longitude'])
        codex_grid[idx]['tropical'].append(make_obj(
            final_name, data['longitude'], data.get('is_retrograde'), 
            fixed_stars=data.get('fixed_stars'), is_node=is_node_flag
        ))

    t_cusps = {}
    if not is_time_unknown: # 🚀 방역: 미상일 때 하우스 커스프 로직 스킵
        for h_num, data in trop_res['houses'].items():
            t_cusps[h_num] = data['longitude']
            
            # 🚀 [Logic Change]: Whole House('W')가 아니면 1,4,7,10 커스프 생략 (Angle과 중복되므로)
            # Whole House라면 1h Cusp(Sign 0도)와 Ascendant(Angle)가 다르므로 모두 표시
            if h_sys != 'W' and h_num in [1, 4, 7, 10]: 
                continue 
            
            idx = get_idx(data['longitude'])
            codex_grid[idx]['tropical'].append(make_obj(f"{h_num}h cusp", data['longitude'], forced_css="p-cusp"))
    
    map_houses_to_grid(t_cusps, 'tropical_h')

    # ==========================================================
    # 2. Hermetic Lots & Vertex
    # ==========================================================
    # calculate_arcana 내부에서 is_time_unknown 체크가 필요하지만, 
    # 현재 구조상 calculate_principia에만 인자가 들어갔습니다.
    # 안전을 위해 여기서 직접 호출을 제어합니다.
    arcana_res = {}

    if not is_time_unknown:
        # Time Unknown이 아니면 정상 계산
        arcana_res = calculate_arcana(date_str, time_str, lat, lng, timezone, lot_schema='paulus', system='tropical', h_sys=h_sys)
        
        # Lots Mapping
        if 'lots' in arcana_res:
            for name, data in arcana_res['lots'].items():
                idx = get_idx(data['value'])
                codex_grid[idx]['tropical'].append(make_obj(name, data['value'], forced_css="lot-hermetic"))

        # Valens Variant
        try:
            valens_res = calculate_arcana(date_str, time_str, lat, lng, timezone, lot_schema='valens', system='tropical', h_sys=h_sys)
            for k in ['Eros', 'Necessity']:
                if k in valens_res['lots']:
                    data = valens_res['lots'][k]
                    idx = get_idx(data['value'])
                    codex_grid[idx]['tropical'].append(make_obj(f"{k} (v)", data['value'], forced_css="lot-hermetic"))
        except: pass

        # Vertex
        if 'vertex' in arcana_res:
            for v_name, v_data in arcana_res['vertex'].items():
                idx = get_idx(v_data['value'])
                codex_grid[idx]['tropical'].append(make_obj(v_name, v_data['value'], forced_css="p-vertex"))

        # Syzygy (시간 의존적이지 않지만, 맥락상 같이 묶음)
        if 'syzygy' in arcana_res:
            s_data = arcana_res['syzygy']
            idx = get_idx(s_data['data']['value'])
            codex_grid[idx]['tropical'].append(make_obj("Syzygy", s_data['data']['value'], forced_css="p-syzygy"))

    # ==========================================================
    # 3. Sidereal, Draconic, Ketunic (Loop)
    # ==========================================================
    for sys_name in ['sidereal', 'draconic', 'ketunic']:
        res = calculate_principia(
            date_str, time_str, lat, lng, timezone, 
            system=sys_name, ayanamsa=ayanamsa, fixed_star_orb=fixed_star_orb,
            h_sys=h_sys, is_time_unknown=is_time_unknown # 🚀 전달
        )
        
        enforce_wsh_cusps(res)

        s_cusps = {}
        if not is_time_unknown:
            for h_num, data in res['houses'].items(): s_cusps[h_num] = data['longitude']
        
        map_houses_to_grid(s_cusps, f'{sys_name}_h')

        for name, data in res['planets'].items():
            if name in SKIP_ALIASES: continue
            if sys_name in ['draconic', 'ketunic'] and ('Node' in name or 'Rahu' in name or 'Ketu' in name): continue
            
            final_name = name; is_node_flag = False
            if name == "North Node" or name == "Rahu": final_name = "Rahu"; is_node_flag = True
            elif name == "South Node" or name == "Ketu": final_name = "Ketu"; is_node_flag = True
            elif name == "North Node (t)": final_name = "North Node (t)"; is_node_flag = True
            elif name == "South Node (t)": final_name = "South Node (t)"; is_node_flag = True
            elif name == "Eros": final_name = "Asteroid Eros"
            elif name == "Lilith": final_name = "Asteroid Lilith"
            elif name == "Mean Lilith": is_node_flag = True

            idx = get_idx(data['longitude'])
            codex_grid[idx][sys_name].append(make_obj(
                final_name, data['longitude'], data.get('is_retrograde'), 
                fixed_stars=data.get('fixed_stars'), is_node=is_node_flag
            ))
        
        if not is_time_unknown:
            for h_num, data in res['houses'].items():
                # 🚀 [Logic Change]: Whole House('W')가 아니면 앵글 중복 생략
                if h_sys != 'W' and h_num in [1, 4, 7, 10]: 
                    continue 
                idx = get_idx(data['longitude'])
                codex_grid[idx][sys_name].append(make_obj(f"{h_num}h cusp", data['longitude'], forced_css="p-cusp"))

    # ==========================================================
    # 4. Arabic Lots (Time Unknown -> Skip)
    # ==========================================================
    if not is_time_unknown:
        # Syzygy 정보 확보 (arcana_res가 존재해야 함)
        p_new_moon, p_full_moon = 0.0, 0.0
        if 'syzygy' in arcana_res:
            s_data = arcana_res['syzygy']
            if s_data['name'] == 'New Moon': p_new_moon = s_data['data']['value']
            else: p_full_moon = s_data['data']['value']
        
        fortune_lon = 0.0; spirit_lon = 0.0
        if 'lots' in arcana_res:
            for name, data in arcana_res['lots'].items():
                if name == 'Fortune': fortune_lon = data['value']
                if name == 'Spirit': spirit_lon = data['value']

        # 데이터 준비
        points = {k: v['longitude'] for k, v in trop_res['planets'].items()}
        house_cusps = {k: v['longitude'] for k, v in trop_res['houses'].items()}
        ruler_map = {}
        from .vault import SIGN_RULERS 
        for h_num, h_data in trop_res['houses'].items():
            s_idx = h_data['sign_idx']
            raw_ruler = SIGN_RULERS[s_idx]
            if isinstance(raw_ruler, (list, tuple)):
                ruler_map[h_num] = raw_ruler[-1] if dichotomy == 'modern' else raw_ruler[0]
            else: ruler_map[h_num] = raw_ruler
        
        lord_of_hour_name = trop_res['lords']['hour']
        lord_of_hour_lon = points.get(lord_of_hour_name, 0.0)

        try:
            arabic_results = calculate_arabic_lots(
                points, house_cusps, ruler_map, lord_of_hour_lon, 
                p_new_moon, p_full_moon, fortune_lon, spirit_lon
            )
            for lot_name, lon in arabic_results.items():
                idx = get_idx(lon)
                codex_grid[idx]['arabic_lots'].append(make_obj(lot_name, lon, forced_css="arabic-lot"))
        except: pass

    # ==========================================================
    # 5. Minor Asteroids (🚀 FIXED RETROGRADE LOGIC)
    # ==========================================================
    from .constants import ASTEROIDS, N8_RENDER_TARGETS
    EXCLUDE_LIST = [
        'Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 
        'Uranus', 'Neptune', 'Pluto', 'Chiron', 'Ceres', 'Pallas', 'Juno', 'Vesta',
        'North Node', 'South Node', 'Rahu', 'Ketu', 'Mean Lilith', 'True Lilith', 'Lilith'
    ]
    jd_ut = get_julian_day(date_str, time_str, timezone)
    
    for name in N8_RENDER_TARGETS:
        if name in EXCLUDE_LIST: continue
        ast_num = ASTEROIDS.get(name)
        if not ast_num: continue

        try:
            swe_id = ast_num + 10000 
            # 🚀 [FIX]: FLG_SPEED 플래그를 추가하여 속도 정보를 가져옴
            res = swe.calc_ut(jd_ut, swe_id, swe.FLG_SWIEPH | swe.FLG_SPEED)
            lon = res[0][0]
            speed = res[0][3] # Longitude Speed (Index 3)
            
            # 속도가 음수면 역행
            is_retro = speed < 0
            
            idx = get_idx(lon)
            # 🚀 [FIX]: is_retro 전달
            codex_grid[idx]['minor_asteroids'].append(make_obj(name, lon, is_retro=is_retro))
        except: continue

    for i in range(360):
        for col in ['minor_asteroids', 'tropical', 'sidereal', 'draconic', 'ketunic', 'arabic_lots']:
            codex_grid[i][col].sort(key=lambda x: x['lon'])

    return codex_grid

# core/astrology/engine.py 하단

def calculate_codex_lucis(
    seed_data: dict,     
    partner_data: dict,  
    ayanamsa: str = 'lahiri',
    dichotomy: str = 'traditional',
    fixed_star_orb: float = 1.5
):
    """
    🚀 [A8 Engine]: Codex Lucis
    """
    # 1. 런타임 임포트
    from .davison import calculate_davison_midpoint
    from .composite import generate_composite_data
    # 🚀 [Import]: principia 계산 함수가 없으면 임포트 (engine.py 내부에 있으므로 생략 가능하나 안전상)
    # calculate_principia는 이 파일 내부에 정의되어 있다고 가정합니다.

    # 2. 결과 담을 그릇 초기화
    empty_grid = lambda: [{
        "minor_asteroids": [], "tropical": [], "sidereal": [], 
        "draconic": [], "ketunic": [], "arabic_lots": [], "main": [] 
    } for _ in range(360)]

    grid_seed = empty_grid()
    grid_partner = empty_grid()
    grid_davison = empty_grid()
    grid_composite = empty_grid()

    try:
        # 3. [Davison]: 좌표 및 시간 계산
        dav_coord = calculate_davison_midpoint(seed_data, partner_data)
        
        # 키값 표준화 (birth_date vs date)
        d_date = dav_coord.get('birth_date') or dav_coord.get('date')
        d_time = dav_coord.get('birth_time') or dav_coord.get('time')
        d_tz = dav_coord.get('timezone', 0)

        # 4. [Composite]: Principia(행성 위치) 계산 후 합성
        # 🚀 [FIX]: calculate_principia에는 dichotomy, orb, system 인자를 넣지 않습니다.
        # 오직 위치 계산에 필요한 시공간과 아야남사만 전달합니다.
        p1_res = calculate_principia(
            date_str=str(seed_data.get('birth_date')), time_str=str(seed_data.get('birth_time')),
            lat=seed_data.get('lat'), lng=seed_data.get('lng'), timezone=seed_data.get('timezone'),
            ayanamsa=ayanamsa
        )
        p2_res = calculate_principia(
            date_str=str(partner_data.get('birth_date')), time_str=str(partner_data.get('birth_time')),
            lat=partner_data.get('lat'), lng=partner_data.get('lng'), timezone=partner_data.get('timezone'),
            ayanamsa=ayanamsa
        )
        
        # Composite 생성
        comp_raw = generate_composite_data(p1_res, p2_res) 

        # 5. 차트별 그리드 생성 실행 (Codex Tenebris Engine)
        
        # Seed (A1)
        grid_seed = calculate_codex_tenebris(
            date_str=str(seed_data.get('birth_date')), time_str=str(seed_data.get('birth_time')),
            lat=seed_data.get('lat'), lng=seed_data.get('lng'), timezone=seed_data.get('timezone'),
            ayanamsa=ayanamsa, dichotomy=dichotomy, fixed_star_orb=fixed_star_orb
        )

        # Partner
        grid_partner = calculate_codex_tenebris(
            date_str=str(partner_data.get('birth_date')), time_str=str(partner_data.get('birth_time')),
            lat=partner_data.get('lat'), lng=partner_data.get('lng'), timezone=partner_data.get('timezone'),
            ayanamsa=ayanamsa, dichotomy=dichotomy, fixed_star_orb=fixed_star_orb
        )

        # Davison (Ordinatio)
        if d_date and d_time:
            grid_davison = calculate_codex_tenebris(
                date_str=str(d_date), time_str=str(d_time),
                lat=dav_coord['lat'], lng=dav_coord['lng'], timezone=d_tz, 
                ayanamsa=ayanamsa, dichotomy=dichotomy, fixed_star_orb=fixed_star_orb
            )

        # Composite (Coagulatio)
        grid_composite = map_composite_to_grid(comp_raw)

    except Exception as e:
        print(f"[A8 ENGINE FAIL] Error: {e}")
        import traceback
        traceback.print_exc()

    return {
        "seed": grid_seed,
        "partner": grid_partner,
        "davison": grid_davison,
        "composite": grid_composite
    }

# core/astrology/engine.py

def _ensure_float_tz(tz_val, date_str=None):
    """'Asia/Seoul' 같은 타임존 문자열을 Principia가 이해하는 float로 변환"""
    try:
        return float(tz_val)
    except (ValueError, TypeError):
        try:
            import pytz
            from datetime import datetime
            tz = pytz.timezone(tz_val)
            dt = datetime.strptime(date_str, '%Y-%m-%d') if date_str else datetime.now()
            return tz.utcoffset(dt).total_seconds() / 3600.0
        except:
            return 9.0 # 기본값 KST

# app/core/astrology/engine.py (Partial Update: Codex Lucis)

def calculate_codex_lucis(
    seed_data: dict,     
    partner_data: dict,  
    ayanamsa: str = 'lahiri',
    dichotomy: str = 'traditional',
    fixed_star_orb: float = 1.5,
    h_sys: str = 'P'
):
    """
    🚀 [A8 Engine]: Codex Lucis - House-First Angle Alignment (User Request Fixed)
    """
    from .davison import calculate_davison_midpoint
    # 🚀 [A3 Logic Import]
    from .composite import generate_composite_data, calculate_composite_chart

    empty_grid = lambda: [{
        "minor_asteroids": [], "tropical": [], "sidereal": [], 
        "draconic": [], "ketunic": [], "arabic_lots": [], 
        "main": [], "anti": [], "main_h": 0, "anti_h": 0
    } for _ in range(360)]

    grid_seed, grid_partner = empty_grid(), empty_grid()
    grid_davison, grid_composite = empty_grid(), empty_grid()

    try:
        unk_a = bool(seed_data.get("is_time_unknown", 0))
        unk_b = bool(partner_data.get("is_time_unknown", 0))
        global_unk = unk_a or unk_b 

        tz1 = seed_data.get('timezone', 0)
        tz2 = partner_data.get('timezone', 0)

        # PART A: Individual Charts
        grid_seed = calculate_codex_tenebris(
            date_str=str(seed_data.get('birth_date')), time_str=str(seed_data.get('birth_time')),
            lat=seed_data.get('lat'), lng=seed_data.get('lng'), timezone=tz1,
            ayanamsa=ayanamsa, dichotomy=dichotomy, fixed_star_orb=fixed_star_orb,
            h_sys=h_sys, is_time_unknown=unk_a 
        )

        grid_partner = calculate_codex_tenebris(
            date_str=str(partner_data.get('birth_date')), time_str=str(partner_data.get('birth_time')),
            lat=partner_data.get('lat'), lng=partner_data.get('lng'), timezone=tz2,
            ayanamsa=ayanamsa, dichotomy=dichotomy, fixed_star_orb=fixed_star_orb,
            h_sys=h_sys, is_time_unknown=unk_b 
        )

        # PART B: Davison
        dav_coord = calculate_davison_midpoint(seed_data, partner_data)
        if dav_coord.get('birth_date'):
            grid_davison = calculate_codex_tenebris(
                date_str=str(dav_coord['birth_date']), time_str=str(dav_coord['birth_time']),
                lat=dav_coord['lat'], lng=dav_coord['lng'], timezone=dav_coord.get('timezone', 0),
                ayanamsa=ayanamsa, dichotomy=dichotomy, fixed_star_orb=fixed_star_orb,
                h_sys=h_sys, is_time_unknown=global_unk 
            )

        # ══════════════════════════════════════════════════════
        # PART C: Composite Chart
        # ══════════════════════════════════════════════════════
        # 주의: 여기서 is_time_unknown을 True로 주면 행성 위치조차 계산 안될 수 있으므로 기본 호출하되,
        # 아래에서 앵글 사용을 철저히 차단합니다.
        p1_res = calculate_principia(
            date_str=str(seed_data.get('birth_date')), time_str=str(seed_data.get('birth_time')),
            lat=seed_data.get('lat'), lng=seed_data.get('lng'), timezone=tz1,
            ayanamsa=ayanamsa, h_sys='P' 
        )
        p2_res = calculate_principia(
            date_str=str(partner_data.get('birth_date')), time_str=str(partner_data.get('birth_time')),
            lat=partner_data.get('lat'), lng=partner_data.get('lng'), timezone=tz2,
            ayanamsa=ayanamsa, h_sys='P'
        )
        
        # 1. Cusps Extraction
        def clean_cusps(res):
            c_out = {}
            for k, v in res['houses'].items():
                val = float(v['longitude']) if isinstance(v, dict) else float(v)
                c_out[int(k)] = val
            return c_out

        cusps_a = clean_cusps(p1_res)
        cusps_b = clean_cusps(p2_res)

        # 2. Calculate Composite (A3 Core)
        comp_res_full = calculate_composite_chart(p1_res['planets'], p2_res['planets'], cusps_a, cusps_b)
        
        comp_raw_objs = comp_res_full['planets'] 
        comp_houses_objs = comp_res_full['houses'] 

        # 🚀 [Fix 1]: Force Angles 로직을 'Time Known'일 때만 수행
        # 미상일 때는 하우스 커스프 자체가 무의미하므로 앵글을 덮어씌우는 행위 자체를 차단
        if not global_unk:
            def get_h_lon(h_idx):
                if h_idx in comp_houses_objs:
                    obj = comp_houses_objs[h_idx]
                    return float(obj['longitude']) if isinstance(obj, dict) else float(obj)
                return None

            h1_val = get_h_lon(1)
            h4_val = get_h_lon(4)
            h7_val = get_h_lon(7)
            h10_val = get_h_lon(10)

            if h1_val is not None: comp_raw_objs['Ascendant'] = {'longitude': h1_val}
            if h4_val is not None: comp_raw_objs['Immum Coeli'] = {'longitude': h4_val}
            if h7_val is not None: comp_raw_objs['Descendant'] = {'longitude': h7_val}
            if h10_val is not None: comp_raw_objs['Midheaven'] = {'longitude': h10_val}

        # 4. Flatten & Mapping
        final_comp_raw = {}
        comp_cusps = {}

        # 🚀 [Fix 2]: Flatten 단계에서 앵글 원천 차단
        # global_unk 상태라면 Asc/MC 등 앵글 키가 아예 사전에 들어가지 않도록 막습니다.
        SKIP_ANGLES = ["Ascendant", "Midheaven", "Descendant", "Immum Coeli", "Asc.", "M.C.", "Dsc.", "I.C."]

        for k, v in comp_raw_objs.items():
            # 미상일 때 앵글 키는 무조건 스킵
            if global_unk and k in SKIP_ANGLES: continue
            
            val = v['longitude'] if isinstance(v, dict) else v
            final_comp_raw[k] = val

        if not global_unk:
            for h, v in comp_houses_objs.items():
                val = v['longitude'] if isinstance(v, dict) else v
                final_comp_raw[f"House {h}"] = val
                comp_cusps[h] = val

        # Ghost Cleaning (하우스 커스프 숫자 키 제거)
        final_comp_raw = {
            k: v for k, v in final_comp_raw.items() 
            if "cusp" not in k and not str(k).isdigit() 
        }

        # Anti-Composite 생성
        # (위에서 이미 앵글을 다 뺐으므로 여기서는 단순히 180도만 돌리면 됩니다)
        anti_comp_raw = {name: (lon + 180.0) % 360.0 for name, lon in final_comp_raw.items()}

        grid_composite = map_composite_to_grid(final_comp_raw, sub_key='main', h_sys='P')
        grid_composite = map_composite_to_grid(anti_comp_raw, sub_key='anti', existing_grid=grid_composite, h_sys='P')

        # 6. Background Tinting
        if not global_unk and comp_cusps:
            # (1) Tint Main Composite
            sorted_cusps = sorted([(lon, h) for h, lon in comp_cusps.items()], key=lambda x: x[0])
            count = len(sorted_cusps)
            for idx in range(count):
                curr_lon, curr_h = sorted_cusps[idx]
                next_lon, _ = sorted_cusps[(idx + 1) % count]
                start, end = int(curr_lon) % 360, int(next_lon) % 360
                
                if start < end:
                    for d in range(start, end): grid_composite[d]['main_h'] = curr_h
                else:
                    for d in range(start, 360): grid_composite[d]['main_h'] = curr_h
                    for d in range(0, end): grid_composite[d]['main_h'] = curr_h

            # (2) Tint Anti-Composite
            sorted_anti_cusps = sorted([((lon + 180) % 360, h) for h, lon in comp_cusps.items()], key=lambda x: x[0])
            count_a = len(sorted_anti_cusps)
            for idx in range(count_a):
                curr_lon, curr_h = sorted_anti_cusps[idx]
                next_lon, _ = sorted_anti_cusps[(idx + 1) % count_a]
                start, end = int(curr_lon) % 360, int(next_lon) % 360

                if start < end:
                    for d in range(start, end): grid_composite[d]['anti_h'] = curr_h
                else:
                    for d in range(start, 360): grid_composite[d]['anti_h'] = curr_h
                    for d in range(0, end): grid_composite[d]['anti_h'] = curr_h

    except Exception as e:
        print(f"[A8 ENGINE FAIL] {e}")
        import traceback
        traceback.print_exc()

    return {"seed": grid_seed, "partner": grid_partner, "davison": grid_davison, "composite": grid_composite}

def map_composite_to_grid(comp_bodies, sub_key='main', existing_grid=None, h_sys='P'):
    grid = existing_grid if existing_grid else [{"minor_asteroids": [], "main": [], "anti": [], "main_h": 0, "anti_h": 0} for _ in range(360)]
    if not comp_bodies: return grid

    SKIP_ALIASES = ["Asc.", "M.C.", "Dsc.", "I.C.", "North Node (m)", "South Node (m)", "Lilith (mean)"]

    for name, lon in comp_bodies.items():
        if name in SKIP_ALIASES: continue
        
        final_name = name
        if name == "Eros": final_name = "Asteroid Eros"
        elif name == "Lilith": final_name = "Asteroid Lilith"
        
        abs_deg = int(lon) % 360
        display_name, css_class = final_name, "p-planet"

        import re
        house_match = re.search(r'\d+', name)
        # 하우스/커스프 처리
        if "House" in name or "cusp" in name or (house_match and name.isdigit()):
            # 🚀 [WSH Check]: Whole Sign이면 앵글과 겹쳐도 1,4,7,10 모두 표시
            # Placidus면 앵글과 겹치는 1,4,7,10 생략
            h_num = int(house_match.group())
            if h_sys != 'W' and h_num in [1, 4, 7, 10]: continue
            
            display_name, css_class = f"{h_num}h cusp", "p-cusp"

        if name in ["Ascendant", "Midheaven", "Descendant", "Immum Coeli"]: css_class = "p-angle"
        elif "Node" in name or name in ["Rahu", "Ketu"]: css_class = "p-node"

        grid[abs_deg][sub_key].append({
            "name": final_name,
            "text": display_name, 
            "dms": format_dms_pretty(lon), 
            "css": css_class
        }) 
    return grid

# ─────────────────────────────────────────────────────────────
# 🚀 C1 NATAL TRANSLATOR
# ─────────────────────────────────────────────────────────────
def calculate_c1_natal(seed_data, ayanamsa='lahiri', dichotomy='traditional', h_sys='P', active_subs=None, orb=1.5):
    if active_subs is None: active_subs = []
    
    # 1. N8 Engine Call (Proven Logic)
    is_unk = bool(seed_data.get('is_time_unknown', 0))
    n8_grid = calculate_codex_tenebris(
        date_str=str(seed_data.get('year')) + "-" + str(seed_data.get('month')) + "-" + str(seed_data.get('day')),
        time_str=f"{seed_data.get('hour')}:{seed_data.get('min')}:00",
        lat=seed_data.get('lat'), lng=seed_data.get('lng'), timezone=seed_data.get('tz'),
        ayanamsa=ayanamsa, dichotomy=dichotomy, fixed_star_orb=orb, 
        h_sys=h_sys, is_time_unknown=is_unk
    )

    c1_grid = [{} for _ in range(360)]
    
    KEY_MAP = {
        'minor_asteroids': 'asteroids',
        'tropical': 'tropical',
        'sidereal': 'sidereal',
        'draconic': 'draconic',
        'ketunic': 'ketunic',
        'arabic_lots': 'arabic'
    }

    for i in range(360):
        src_cell = n8_grid[i]
        tgt_cell = c1_grid[i]
        
        for n8_key, c1_key in KEY_MAP.items():
            if n8_key in src_cell and src_cell[n8_key]:
                # 🚀 [FIX]: 중복 방지 (Set) 및 Star Marker 보정
                unique_items = []
                seen_names = set()
                
                for item in src_cell[n8_key]:
                    # Normalize Name for deduplication
                    chk_name = item['name']
                    if chk_name == "North Node (t)": chk_name = "Rahu" # Treat as same group if needed, or keep separate?
                    # Codex Tenebris Logic already normalizes "North Node" -> "Rahu"
                    # But just in case:
                    if chk_name in seen_names: continue
                    seen_names.add(chk_name)
                    
                    new_item = item.copy()
                    if new_item.get('fixed_stars'):
                        new_item['text'] = f"{new_item['text']}*" # Add visual marker
                    unique_items.append(new_item)
                
                tgt_cell[c1_key] = unique_items
                
        # House Background
        if 'tropical_h' in src_cell: tgt_cell['tropical_h'] = src_cell['tropical_h']
        if 'sidereal_h' in src_cell: tgt_cell['sidereal_h'] = src_cell['sidereal_h']
        if 'draconic_h' in src_cell: tgt_cell['draconic_h'] = src_cell['draconic_h']
        if 'ketunic_h' in src_cell: tgt_cell['ketunic_h'] = src_cell['ketunic_h']

    return c1_grid


# app/core/astrology/engine.py

def calculate_c1_conjunction(p1_data, p2_data, ayanamsa='lahiri', dichotomy='traditional', h_sys='P', active_subs=None, orb=1.5):
    """
    C1 Tabula Conjunction Engine (Restored & Fixed)
    """
    if active_subs is None: active_subs = []
    c1_grid = [{} for _ in range(360)]

    # ---------------------------------------------------------
    # A. COMPOSITE (Sync with A8 Logic)
    # ---------------------------------------------------------
    need_comp = 'comp_main' in active_subs or 'comp_anti' in active_subs
    if need_comp:
        try:
            from .composite import calculate_composite_chart
            
            # 1. 미상 여부 확인
            unk_a = bool(p1_data.get("is_time_unknown", 0))
            unk_b = bool(p2_data.get("is_time_unknown", 0))
            global_unk = unk_a or unk_b
            
            # 2. Principia (Base Charts) - 🚀 is_time_unknown 전달 필수
            def get_p_res(d, is_unk):
                return calculate_principia(
                    date_str=f"{d['year']}-{d['month']}-{d['day']}",
                    time_str=f"{d['hour']}:{d['min']}:00",
                    lat=d['lat'], lng=d['lng'], timezone=d['tz'],
                    system='tropical', ayanamsa=ayanamsa, h_sys='P', 
                    fixed_star_orb=orb, is_time_unknown=is_unk 
                )
            
            p1_res = get_p_res(p1_data, unk_a)
            p2_res = get_p_res(p2_data, unk_b)

            # 3. Clean Cusps (실수형 변환)
            def clean_cusps(res):
                c_out = {}
                for k, v in res.get('houses', {}).items():
                    val = float(v['longitude']) if isinstance(v, dict) else float(v)
                    c_out[int(k)] = val
                return c_out

            cusps_a = clean_cusps(p1_res)
            cusps_b = clean_cusps(p2_res)

            # 4. Composite Calculation (Core Logic)
            comp_res_full = calculate_composite_chart(p1_res['planets'], p2_res['planets'], cusps_a, cusps_b)
            
            comp_raw_objs = comp_res_full.get('planets', {})
            comp_houses_objs = comp_res_full.get('houses', {})

            # 5. [Fix]: 앵글-하우스 강제 동기화 (Time Known일 때만)
            if not global_unk:
                def get_h_lon(h_idx):
                    if h_idx in comp_houses_objs:
                        obj = comp_houses_objs[h_idx]
                        return float(obj['longitude']) if isinstance(obj, dict) else float(obj)
                    return None

                h1 = get_h_lon(1); h4 = get_h_lon(4); h7 = get_h_lon(7); h10 = get_h_lon(10)
                
                # 하우스 커스프 값을 앵글 값으로 덮어씌움 (불일치 방지)
                if h1 is not None: comp_raw_objs['Ascendant'] = h1
                if h4 is not None: comp_raw_objs['Immum Coeli'] = h4
                if h7 is not None: comp_raw_objs['Descendant'] = h7
                if h10 is not None: comp_raw_objs['Midheaven'] = h10

            # 6. Flatten Data
            final_comp_raw = {}
            comp_cusps = {}
            
            SKIP_ANGLES = ["Ascendant", "Midheaven", "Descendant", "Immum Coeli", "Asc.", "M.C.", "Dsc.", "I.C."]
            
            for k, v in comp_raw_objs.items():
                # 미상일 경우 앵글 키는 무조건 건너뜀
                if global_unk and k in SKIP_ANGLES: continue
                
                val = float(v['longitude']) if isinstance(v, dict) else float(v)
                final_comp_raw[k] = val

            if not global_unk:
                for h, v in comp_houses_objs.items():
                    val = float(v['longitude']) if isinstance(v, dict) else float(v)
                    final_comp_raw[f"House {h}"] = val
                    comp_cusps[h] = val

            # Ghost Cleaning (커스프 중복 키 제거)
            final_comp_raw = {
                k: v for k, v in final_comp_raw.items() 
                if "cusp" not in k and not str(k).isdigit() 
            }

            # Anti-Composite
            anti_comp_raw = {name: (lon + 180.0) % 360.0 for name, lon in final_comp_raw.items()}

            # 7. Helper: Inject into C1 Grid
            # 항성 계산 (p1 기준 정오)
            jd_ref = get_julian_day(f"{p1_data['year']}-{p1_data['month']}-{p1_data['day']}", "12:00", 0)
            active_stars = calculate_all_star_positions(jd_ref, 'tropical', swe.FLG_SWIEPH|swe.FLG_SPEED)

            def inject_composite(source_data, target_key):
                SKIP = ["Asc.", "M.C.", "Dsc.", "I.C.", "North Node (m)", "South Node (m)", "Lilith (mean)"]
                
                for name, lon in source_data.items():
                    if name in SKIP: continue
                    
                    final_name = name
                    # Name Standardization
                    if name == "North Node" or name == "Rahu": final_name = "Rahu"
                    elif name == "South Node" or name == "Ketu": final_name = "Ketu"
                    elif name == "Eros": final_name = "Asteroid Eros"
                    elif name == "Lilith": final_name = "Asteroid Lilith"

                    display_name, css_class = final_name, "p-planet"
                    
                    # Check House Cusp
                    import re
                    is_house = False
                    house_match = re.search(r'\d+', name)
                    if "House" in name or "cusp" in name or (house_match and name.startswith("House")):
                        is_house = True
                        if house_match:
                            h_val = int(house_match.group())
                            # WSH Check: Placidus면 앵글 겹침 생략
                            if h_sys != 'W' and h_val in [1, 4, 7, 10]: continue 
                            display_name = f"{h_val}h cusp"
                            css_class = "p-cusp"

                    # Check Angles & Nodes
                    if name in ["Ascendant", "Midheaven", "Descendant", "Immum Coeli"]: css_class = "p-angle"
                    elif "Node" in name or name in ["Rahu", "Ketu"]: css_class = "p-node"

                    # Check Stars
                    stars = check_star_conjunctions(lon, active_stars, orb)
                    if stars: display_name += "*"

                    abs_deg = int(lon) % 360
                    if target_key not in c1_grid[abs_deg]: c1_grid[abs_deg][target_key] = []
                    
                    c1_grid[abs_deg][target_key].append({
                        "name": final_name,
                        "text": display_name,
                        "lon": lon,
                        "dms": format_dms_pretty(lon), 
                        "css": css_class,
                        "fixed_stars": stars
                    })
            
            # 8. Inject Data
            if 'comp_main' in active_subs:
                inject_composite(final_comp_raw, 'comp_main')
            if 'comp_anti' in active_subs:
                inject_composite(anti_comp_raw, 'comp_anti')

            # 9. Background Tinting (Fix for Composite vs Anti)
            if not global_unk and comp_cusps:
                # (1) Main Tint
                if 'comp_main' in active_subs:
                    sorted_cusps = sorted([(lon, h) for h, lon in comp_cusps.items()], key=lambda x: x[0])
                    cnt = len(sorted_cusps)
                    for idx in range(cnt):
                        curr_lon, curr_h = sorted_cusps[idx]
                        next_lon, _ = sorted_cusps[(idx + 1) % cnt]
                        start, end = int(curr_lon) % 360, int(next_lon) % 360
                        
                        if start < end:
                            for d in range(start, end): c1_grid[d]['comp_main_h'] = curr_h
                        else:
                            for d in range(start, 360): c1_grid[d]['comp_main_h'] = curr_h
                            for d in range(0, end): c1_grid[d]['comp_main_h'] = curr_h
                
                # (2) Anti Tint
                if 'comp_anti' in active_subs:
                    sorted_anti = sorted([((lon + 180)%360, h) for h, lon in comp_cusps.items()], key=lambda x: x[0])
                    cnt_a = len(sorted_anti)
                    for idx in range(cnt_a):
                        curr_lon, curr_h = sorted_anti[idx]
                        next_lon, _ = sorted_anti[(idx + 1) % cnt_a]
                        start, end = int(curr_lon) % 360, int(next_lon) % 360
                        
                        if start < end:
                            for d in range(start, end): c1_grid[d]['comp_anti_h'] = curr_h
                        else:
                            for d in range(start, 360): c1_grid[d]['comp_anti_h'] = curr_h
                            for d in range(0, end): c1_grid[d]['comp_anti_h'] = curr_h

        except Exception as e:
            print(f"[C1 CONJUNCTION FAIL] {e}")
            import traceback
            traceback.print_exc()

    # ---------------------------------------------------------
    # B. DAVISON (Recursion via Tenebris - Preserved)
    # ---------------------------------------------------------
    davi_keys = [k for k in active_subs if k.startswith('davi_')]
    if davi_keys:
        try:
            from .davison import calculate_davison_midpoint
            def to_raw(d): return {'birth_date': f"{d['year']}-{d['month']}-{d['day']}", 'birth_time': f"{d['hour']}:{d['min']}:00", 'lat': d['lat'], 'lng': d['lng'], 'timezone': d['tz']}
            
            d_seed = calculate_davison_midpoint(to_raw(p1_data), to_raw(p2_data))
            
            # Davison Time Unknown 여부 확인 (부모 중 하나라도 모르면 Davison도 모름)
            unk_a = bool(p1_data.get("is_time_unknown", 0))
            unk_b = bool(p2_data.get("is_time_unknown", 0))
            d_unk = unk_a or unk_b

            d_n8_grid = calculate_codex_tenebris(
                date_str=d_seed['birth_date'], time_str=d_seed['birth_time'],
                lat=d_seed['lat'], lng=d_seed['lng'], timezone=d_seed['timezone'],
                ayanamsa=ayanamsa, dichotomy=dichotomy, fixed_star_orb=orb, h_sys=h_sys,
                is_time_unknown=d_unk # 🚀 Davison도 미상 로직 적용
            )
            
            DAVI_MAP = {
                'tropical': 'davi_tro', 'sidereal': 'davi_sid', 'minor_asteroids': 'davi_ast',
                'draconic': 'davi_dra', 'ketunic': 'davi_ket', 'arabic_lots': 'davi_lot'
            }
            
            for i in range(360):
                src_cell = d_n8_grid[i]
                tgt_cell = c1_grid[i]
                
                for n8_k, c1_k in DAVI_MAP.items():
                    if c1_k in active_subs and n8_k in src_cell and src_cell[n8_k]:
                        new_items = []
                        seen = set()
                        for item in src_cell[n8_k]: 
                            if item['name'] in seen: continue
                            seen.add(item['name'])
                            
                            new_item = item.copy()
                            if new_item.get('fixed_stars'):
                                new_item['text'] = f"{new_item['text']}*"
                            new_items.append(new_item)

                        if c1_k not in tgt_cell: tgt_cell[c1_k] = []
                        tgt_cell[c1_k].extend(new_items)
                
                # 🚀 [Fix]: Davison Draconic/Ketunic House Tinting Support
                if 'tropical_h' in src_cell and 'davi_tro' in active_subs: tgt_cell['davi_tro_h'] = src_cell['tropical_h']
                if 'sidereal_h' in src_cell and 'davi_sid' in active_subs: tgt_cell['davi_sid_h'] = src_cell['sidereal_h']
                if 'draconic_h' in src_cell and 'davi_dra' in active_subs: tgt_cell['davi_dra_h'] = src_cell['draconic_h']
                if 'ketunic_h' in src_cell and 'davi_ket' in active_subs: tgt_cell['davi_ket_h'] = src_cell['ketunic_h']

        except Exception as e:
            print(f"[C1 DAVISON FAIL] {e}")

    return c1_grid

# ════════════════════════════════════════════════════════
# N9: CHRONOMANTIA ORCHESTRATOR (v32.0 Exact-Start)
# ════════════════════════════════════════════════════════

def _format_natal_info(principia_data, is_sidereal=False):
    """
    [Restore]: 누락되었던 Natal 정보 포맷팅 헬퍼 함수
    Format: "[Day Lord] Gemini,10°46'26'' | Domicile"
    """
    RASI_NAMES = ["Mesha", "Vrishabha", "Mithuna", "Karka", "Simha", "Kanya", "Tula", "Vrischika", "Dhanu", "Makara", "Kumbha", "Meena"]
    TROP_NAMES = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"]
    NAMES = RASI_NAMES if is_sidereal else TROP_NAMES
    
    meta_out = {}
    
    # Lords 정보 추출
    lords = principia_data.get('lords', {})
    if not lords: 
        lords = principia_data.get('meta', {}).get('rulers', {})

    # 파이프(|) 뒤의 요일 정보 제거 ("Mars | Tuesday" -> "Mars")
    day_lord_raw = str(lords.get('day_lord') or lords.get('day', '-')).split('|')[0].strip()
    hour_lord_raw = str(lords.get('hour_lord') or lords.get('hour', '-')).split('|')[0].strip()
    
    # KP 아야남사 확인
    ayan = principia_data.get('meta', {}).get('ayan', 'lahiri').lower()
    is_kp = (ayan == 'kp')

    for p_name, p_data in principia_data.get('planets', {}).items():
        lon = p_data.get('longitude', 0.0)
        sign_idx = int(lon / 30) % 12
        deg_in_sign = lon % 30
        
        sign_str = NAMES[sign_idx]
        dms = _to_dms_str(deg_in_sign)
        
        dig_info = p_data.get('dignity')
        dignity_str = '-'
        if isinstance(dig_info, dict):
            dignity_str = dig_info.get('ruler_status') or dig_info.get('term') or '-'
        elif isinstance(dig_info, str):
            dignity_str = dig_info
            
        # Lordship Tagging
        tags = []
        p_clean = str(p_name).lower()
        if p_clean == day_lord_raw.lower(): tags.append("[Day Lord]")
        if p_clean == hour_lord_raw.lower(): tags.append("[Hour Lord]")
        
        tag_prefix = " ".join(tags) + " " if tags else ""
        
        # Final Format
        full_text = f"{tag_prefix}{sign_str},{dms} | {dignity_str}"
        
        # 🚀 2. Sidereal일 경우 하단에 낙샤트라 및 Pada/Sub-lord 정보 추가
        if is_sidereal:
            nak_data = p_data.get('nakshatra', {})
            nak_name = nak_data.get('name', '-')
            
            # KP 모드면 Sub Lord, 아니면 Pada Lord 심볼 가져오기
            if is_kp:
                lord_sym = p_data.get('sub_lord', '-')
            else:
                lord_sym = p_data.get('pada_lord', '-')
                
            full_text += f"\n{nak_name} | {lord_sym}"
        
        meta_out[p_name] = full_text
        
    return meta_out

def calculate_n9_timeline(seed_data, mode='zodiac', ayanamsa='lahiri'):
    from . import chronomantia as cm_tool
    from . import jyotish as jy_tool
    
    # 1. Parsing
    try:
        if seed_data.get('birth_date'): date_str = str(seed_data['birth_date']).split('T')[0]
        elif seed_data.get('birthDate'): date_str = str(seed_data['birthDate']).split('T')[0]
        else:
            y, m, d = seed_data.get('year', 2000), seed_data.get('month', 1), seed_data.get('day', 1)
            date_str = f"{y}-{m:02d}-{d:02d}"

        if seed_data.get('birth_time'): time_str = str(seed_data['birth_time'])
        else:
            h, mn = seed_data.get('hour', 12), seed_data.get('min', 0)
            time_str = f"{h:02d}:{mn:02d}:00"
        if len(time_str.split(':')) == 2: time_str += ":00"

        tz_val = seed_data.get('tz', seed_data.get('timezone', 9.0))
        tz = _ensure_float_tz(tz_val, date_str)
        
        try: lat, lng = float(seed_data.get('lat', 37.56)), float(seed_data.get('lng', 126.97))
        except: lat, lng = 37.56, 126.97
        
        jd_birth = get_julian_day(date_str, time_str, tz)
        birth_dt = datetime.strptime(date_str, "%Y-%m-%d")

    except Exception as e:
        print(f"[N9 Parsing Fail]: {e}")
        return {"meta": {}, "timeline": []}

    # 2. Principia Data Fetch (Formatting용)
    # Tropical (Zodiac용)
    trop_data = calculate_principia(date_str, time_str, lat, lng, timezone=tz, system='tropical')
    
    # Sidereal (Jyotish용) - ayanamsa 적용
    sid_data = calculate_principia(date_str, time_str, lat, lng, timezone=tz, system='sidereal', ayanamsa=ayanamsa)

    # 3. Meta Formatting (Translator)
    # 요청하신 포맷: "[Day Lord] Gemini,10°... | Domicile"
    trop_meta = _format_natal_info(trop_data, is_sidereal=False)
    sid_meta = _format_natal_info(sid_data, is_sidereal=True)

    # 4. Mode Execution
    if mode == 'jyotish':
        # 바로 return 하지 않고 변수에 담음
        final_result = _process_jyotish_mode(birth_dt, sid_data, trop_meta, sid_meta, ayanamsa, jy_tool)
    else:
        # 🚀 [CORE FIX]: N9 전용 Sect 및 Lots 독립 계산
        try:
            p = trop_data['planets']
            coords = {
                "Sun": p['Sun']['longitude'], "Moon": p['Moon']['longitude'],
                "Mercury": p['Mercury']['longitude'], "Venus": p['Venus']['longitude'],
                "Mars": p['Mars']['longitude'], "Jupiter": p['Jupiter']['longitude'],
                "Saturn": p['Saturn']['longitude']
            }
            asc_deg = p['Ascendant']['longitude']

            is_day_n9 = get_day_night_sect(coords["Sun"], asc_deg)

            lots_raw = calculate_hermetic_lots(
                asc_deg, coords["Sun"], coords["Moon"], 
                coords["Mercury"], coords["Venus"], coords["Mars"], 
                coords["Jupiter"], coords["Saturn"], 
                is_day_n9, schema='paulus'
            )
            
            lots_n9 = {k: {"longitude": v} for k, v in lots_raw.items()}

        except Exception as e:
            print(f"[N9 Local Calc Error]: {e}")
            arc_res = calculate_arcana(date_str, time_str, lat, lng, timezone=tz)
            lots_n9 = arc_res['lots']
            is_day_n9 = arc_res['meta']['is_day']

        # 🚀 [FIX]: 7개의 인자를 전달합니다. (여기서도 변수에 담음)
        final_result = _process_zodiac_mode(jd_birth, birth_dt, trop_data, lots_n9, trop_meta, cm_tool, is_day_n9)

    # 🚀 [백엔드 원천 봉쇄]: 프론트엔드가 다음 날짜를 추측하지 않도록 실제 다음 날짜를 꽂아줌
    merged_timeline = final_result.get('timeline', [])
    for i in range(len(merged_timeline)):
        if i + 1 < len(merged_timeline):
            merged_timeline[i]['next_date'] = merged_timeline[i+1]['date']
        else:
            merged_timeline[i]['next_date'] = "9999-12-31"

    # 최종적으로 여기서 리턴
    return final_result


# 🚀 [FIX]: 7번째 인자(is_day)를 받도록 함수 정의 수정
def _process_zodiac_mode(jd_birth, birth_dt, principia, lots_n9, natal_meta, cm_tool, is_day):
    """ Zodiac Mode (Receives Fixed Sect & Lots) """
    chrono_engine = cm_tool.ChronosEngine(jd_birth)
    
    # 🚀 [Stable]: 인자로 받은 고정 Lots 사용 (재계산 X)
    lots_raw = lots_n9
    
    zr_events = []
    SIGNS = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"]
    
    for lot_name in ['Spirit', 'Fortune', 'Eros']:
        lot_data = lots_raw.get(lot_name, {})
        # lots_n9 구조에 따라 longitude 추출 (dict인지 float인지 확인)
        lot_lon = lot_data.get('longitude') if isinstance(lot_data, dict) else lot_data
        if lot_lon is None: lot_lon = 0.0
            
        sign_idx = int(lot_lon / 30) % 12
        sign_name = SIGNS[sign_idx]
        deg_in_sign = lot_lon % 30
        
        # Chronomantia 호출
        nested_zr = chrono_engine.calculate_zr(sign_name, deg_in_sign, levels=3)
        
        for l1 in nested_zr:
            for l2 in l1.get('sub_periods', []):
                is_l2_lb = l2.get('is_lb', False)
                for l3 in l2.get('sub_periods', []):
                    is_l3_lb = l3.get('is_lb', False)
                    final_lb = is_l2_lb or is_l3_lb
                    
                    zr_events.append({
                        "date": _fmt_date(l3['start']),
                        "type": "zr",
                        "lot": lot_name.lower(),
                        "l1": l1['sign'], 
                        "l2": l2['sign'], 
                        "l3": l3['sign'],
                        # 🚀 [FIX]: 합치지 않고 각각의 레벨 정보를 보존합니다.
                        "l1_lb": False, 
                        "l2_lb": is_l2_lb,
                        "l3_lb": is_l3_lb,
                        "real_start_jd": l3.get('real_start_jd')
                    })

    # 2. Firdaria & Profection
    firdaria_events = []
    # 🚀 [Fix]: 정확히 판별된 is_day 값을 전달
    for main in chrono_engine.calculate_firdaria(is_day):
        for sub in main.get('sub_periods', []):
            firdaria_events.append({
                "date": _fmt_date(sub['start']), "type": "firdaria",
                "main": main['planet'], "sub": sub['planet']
            })

    asc_lon = principia['planets'].get('Ascendant', {}).get('longitude', 0.0)
    asc_sign = SIGNS[int(asc_lon / 30) % 12]
    raw_prof = chrono_engine.calculate_profections(asc_sign)
    prof_events = [{"date": _fmt_date(p['start_date']), "type": "profection", "sign": p['sign']} for p in raw_prof]

    # 3. Merge with State Rolling (Exact Start Fix)
    merged = _merge_timelines(jd_birth, zr_events, firdaria_events, prof_events, birth_dt)
    
    # 🚀 [UI Export]: Lots와 Ascendant의 정확한 좌표 문자열 변환
    formatted_lots = {}
    for k, v in lots_raw.items():
        lon = v.get('longitude') if isinstance(v, dict) else v
        formatted_lots[k] = format_dms_pretty(lon)
        
    formatted_asc = format_dms_pretty(asc_lon)

    return {
        "meta": {
            "mode": "zodiac", 
            "sect": "Day" if is_day else "Night",
            "lots": formatted_lots,       # -> Spirit/Fortune/Eros 헤더 툴팁용
            "ascendant": formatted_asc,   # -> Profections 헤더 툴팁용
            "natal_planets": natal_meta
        },
        "timeline": merged
    }

def _process_jyotish_mode(birth_dt, sid_principia, trop_meta, sid_meta, ayanamsa, jy_tool):
    """ Jyotish Mode """
    moon_lon = sid_principia['planets']['Moon']['longitude']
    
    v_engine = jy_tool.VimshottariEngine()
    dasha_tree = v_engine.calculate_dasha(birth_dt, moon_lon)
    
    flat_dasha = []
    birth_date_str = birth_dt.strftime("%Y-%m-%d")

    # Flatten Loop
    if dasha_tree:
        for l1 in dasha_tree:
            p1 = l1.get('planet', '-')
            subs = l1.get('sub_periods') or []
            if not subs:
                flat_dasha.append({"date": _fmt_date(l1['start_date']), "l1": p1, "l2": "-", "l3": "-"})
            else:
                for l2 in subs:
                    p2 = l2.get('planet', '-')
                    sub_subs = l2.get('sub_periods') or []
                    if not sub_subs:
                        flat_dasha.append({"date": _fmt_date(l2['start_date']), "l1": p1, "l2": p2, "l3": "-"})
                    else:
                        for l3 in sub_subs:
                            flat_dasha.append({"date": _fmt_date(l3['start_date']), "l1": p1, "l2": p2, "l3": l3.get('planet', '-')})

    # 🚀 [Jyotish Clamping]: 이론적 시작일이 언제건, 첫 줄은 무조건 생일이어야 함
    # 1. 날짜순 정렬
    flat_dasha.sort(key=lambda x: x['date'])
    
    final_timeline = []
    found_birth_period = False
    
    for i, row in enumerate(flat_dasha):
        row_date = row['date']
        
        # 생일보다 미래의 데이터는 그대로 추가
        if row_date > birth_date_str:
            final_timeline.append(row)
        
        # 생일 이전이거나 같은 데이터 처리 (Interval 찾기)
        elif row_date <= birth_date_str:
            # 다음 행의 날짜를 확인
            next_date = flat_dasha[i+1]['date'] if i+1 < len(flat_dasha) else "9999-12-31"
            
            # "현재 행 시작일 <= 생일 < 다음 행 시작일" 이면, 이 구간이 생일 당시의 구간임
            if row_date <= birth_date_str < next_date:
                # 🚀 Start Date를 생일로 강제 변경(Clamp)하여 추가
                row_copy = row.copy()
                row_copy['date'] = birth_date_str
                final_timeline.append(row_copy)
                found_birth_period = True

    for r in final_timeline: r['age'] = _calc_age(r['date'], birth_dt)

    # 🚀 [UI Export]: Jyotish Mahadasha 기준점(Sidereal Moon) 포맷팅
    formatted_moon = format_dms_pretty(moon_lon, use_rasi=True)

    return {
        "meta": {
            "mode": "jyotish", 
            "ayanamsa": ayanamsa, 
            "moon_position": formatted_moon,   # -> Mahadasha 헤더 툴팁용
            "tropical_planets": trop_meta,     # -> 행성 Hover 시 윗줄 
            "sidereal_planets": sid_meta       # -> 행성 Hover 시 아랫줄
        },
        "timeline": final_timeline
    }

def _merge_timelines(birth_jd, zr, firdaria, prof, birth_dt):
    """
    Zodiac Timeline Merge (v32.2 State Preservation & LB Isolation)
    Julian Day(JD)를 기반으로 정렬하고 동일 날짜 이벤트를 병합하여 '역류 현상'을 방지합니다.
    """
    import copy # 상태(State)의 깊은 복사를 위해 필요
    all_events = []
    birth_date_str = birth_dt.strftime("%Y-%m-%d")
    
    # 1. 모든 이벤트를 Julian Day(JD)와 함께 수집
    # ZR: 개별 레벨의 LB 상태를 보존함 (v24 규격)
    for e in zr:
        jd = e.get('real_start_jd')
        if jd is None:
            # real_start_jd가 없는 경우를 대비한 안전장치 (문자열 파싱)
            try:
                y, m, d = map(int, e['date'].split('-'))
                jd = swe.julday(y, m, d, 12.0)
            except: jd = birth_jd
        all_events.append({'jd': float(jd), 'date': e['date'], 'data': e, 'src': 'zr'})

    # Firdaria
    for e in firdaria:
        try:
            y, m, d = map(int, e['date'].split('-'))
            jd = swe.julday(y, m, d, 12.0)
        except: jd = birth_jd
        all_events.append({'jd': float(jd), 'date': e['date'], 'data': e, 'src': 'firdaria'})

    # Profection
    for e in prof:
        try:
            y, m, d = map(int, e['date'].split('-'))
            jd = swe.julday(y, m, d, 12.0)
        except: jd = birth_jd
        all_events.append({'jd': float(jd), 'date': e['date'], 'data': e, 'src': 'prof'})

    # 생일(Birth) 이벤트를 강제 주입하여 타임라인의 시작점 보장
    all_events.append({'jd': float(birth_jd), 'date': birth_date_str, 'data': {'type': 'birth'}, 'src': 'birth'})

    # 2. 정렬 (1순위: 정밀한 JD 시간순, 2순위: 소스 우선순위)
    src_priority = {'birth': 0, 'zr': 1, 'firdaria': 2, 'prof': 3}
    all_events.sort(key=lambda x: (x['jd'], src_priority[x['src']]))

    # 3. 상태(State) 초기화 - 각 레벨별 LB 플래그 독립 운영
    state = {
        'zr': {
            'spirit':  {'l1': '-', 'l2': '-', 'l3': '-', 'l1_lb': False, 'l2_lb': False, 'l3_lb': False},
            'fortune': {'l1': '-', 'l2': '-', 'l3': '-', 'l1_lb': False, 'l2_lb': False, 'l3_lb': False},
            'eros':    {'l1': '-', 'l2': '-', 'l3': '-', 'l1_lb': False, 'l2_lb': False, 'l3_lb': False}
        },
        'firdaria': {'main': '-', 'sub': '-'},
        'profections': '-'
    }
    
    final_rows_dict = {}

    # 4. 시간순으로 상태 업데이트 및 날짜별 '최종 상태' 덮어쓰기
    for evt in all_events:
        d_str = evt['date']
        e = evt['data']
        src = evt['src']

        # 상태 업데이트 (이전 상태는 유지하면서 변화된 값만 Overwrite)
        if src == 'zr':
            state['zr'][e['lot']] = {
                'l1': e['l1'], 'l2': e['l2'], 'l3': e['l3'],
                'l1_lb': e.get('l1_lb', False),
                'l2_lb': e.get('l2_lb', False),
                'l3_lb': e.get('l3_lb', False)
            }
        elif src == 'firdaria':
            state['firdaria'] = {'main': e['main'], 'sub': e['sub']}
        elif src == 'prof':
            state['profections'] = e['sign']

        # 생일 이전 데이터는 상태(State) 기어만 돌리고, 실제 출력 행에는 담지 않음
        if d_str < birth_date_str:
            continue

        # 딕셔너리에 '날짜'를 키로 저장하여, 같은 날에 발생한 이벤트 중 가장 마지막 상태만 남김
        final_rows_dict[d_str] = {
            "date": d_str,
            "zr": copy.deepcopy(state['zr']),
            "firdaria": copy.deepcopy(state['firdaria']),
            "profections": state['profections']
        }

    # 5. 최종 데이터 생성 (Transit 오버레이 및 Age 계산)
    sorted_dates = sorted(final_rows_dict.keys())
    
    # 🚀 [FIX]: 통일된 변수명 사용
    final_rows = [] 
    
    # Terminology Undefined 방지를 위해 내부에서 기호 맵 재정의
    Z_SYMBOLS = ["♈︎", "♉︎", "♊︎", "♋︎", "♌︎", "♍︎", "♎︎", "♏︎", "♐︎", "♑︎", "♒︎", "♓︎"]
    birth_year = birth_dt.year

    for d_str in sorted_dates:
        row = final_rows_dict[d_str]
        
        # Transit 계산 로직 (목성~명왕성)
        transits = {}
        try:
            dt = datetime.strptime(d_str, "%Y-%m-%d")
            curr_jd = swe.julday(dt.year, dt.month, dt.day, 12.0) # 정오 기준
            targets = [('Jupiter', 5), ('Saturn', 6), ('Uranus', 7), ('Neptune', 8), ('Pluto', 9)]
            for name, pid in targets:
                # FLG_SPEED 추가로 속도 정보 확보하여 역행(r) 판별
                xx, _ = swe.calc_ut(curr_jd, pid, swe.FLG_SWIEPH | swe.FLG_SPEED)
                lon, speed = xx[0], xx[3]
                sign_idx = int(lon / 30) % 12
                sym = Z_SYMBOLS[sign_idx]
                t_name = TROPICAL_SIGNS[sign_idx] # 전역 변수 참조
                dms = _to_dms_str(lon % 30)       # 전역 헬퍼 참조
                
                retro = ",r" if speed < 0 else ""
                transits[name] = {"sign": sym, "full_text": f"{t_name},{dms}{retro}"}
        except: pass

        row["transits"] = transits
        row["age"] = int(d_str.split('-')[0]) - birth_year
        
        # 🚀 [FIX]: final_rows 리스트에 append
        final_rows.append(row)
        
    # 🚀 [FIX]: final_rows 반환
    return final_rows

def _to_dms_str(deg_float):
    d = int(deg_float)
    m = int((deg_float - d) * 60)
    s = int(((deg_float - d) * 60 - m) * 60)
    return f"{d}°{m:02d}'{s:02d}''"

def _fmt_date(d):
    return d.strftime("%Y-%m-%d") if isinstance(d, datetime) else str(d).split('T')[0]

def _calc_age(t, b):
    if not isinstance(t, datetime):
        try: t = datetime.strptime(str(t).split('T')[0], "%Y-%m-%d")
        except: return 0
    return t.year - b.year

# ════════════════════════════════════════════════════════
# A9: SYNCHRONICUM ORCHESTRATOR (v1.3 Albedo Standard)
# ════════════════════════════════════════════════════════

def calculate_a9_synchronicum(seed_data, mode='zodiac', subMode='davison', ayanamsa='lahiri'):
    from .davison import calculate_davison_midpoint
    import copy
    
    # 1. Albedo(A1) 시드 내부에서 두 사람의 데이터 추출
    p1_data = seed_data.get('p1') or seed_data.get('seed1') or seed_data.get('person1') or seed_data
    p2_data = seed_data.get('p2') or seed_data.get('seed2') or seed_data.get('person2') or seed_data

    # 2. 강력한 데이터 정규화
    def to_raw(d):
        if not d: return {'birth_date': '2000-01-01', 'birth_time': '12:00:00', 'lat': 0.0, 'lng': 0.0, 'timezone': 0.0}
        
        # Date 파싱
        b_date = d.get('birth_date') or d.get('date')
        if not b_date:
            y = int(d.get('year') or 2000)
            m = int(d.get('month') or 1)
            d_day = int(d.get('day') or 1)
            b_date = f"{y}-{m:02d}-{d_day:02d}"
        b_date_str = str(b_date).split('T')[0]
            
        # Time 파싱
        b_time = d.get('birth_time') or d.get('time')
        if not b_time:
            hr = int(d.get('hour') or 12)
            mn = int(d.get('min') or 0)
            b_time = f"{hr:02d}:{mn:02d}:00"
            
        # 🚀 [FIX]: 기존 엔진의 _ensure_float_tz 헬퍼 함수를 사용하여 깔끔하게 변환
        tz_val = d.get('tz') if d.get('tz') is not None else d.get('timezone', 9.0)
        tz_float = _ensure_float_tz(tz_val, b_date_str)
            
        return {
            'birth_date': b_date_str, 
            'birth_time': str(b_time), 
            'lat': float(d.get('lat') or 37.56), 
            'lng': float(d.get('lng') or 126.97), 
            'timezone': tz_float
        }
        
    raw_a = to_raw(p1_data)
    raw_b = to_raw(p2_data)
    dav_coord = calculate_davison_midpoint(raw_a, raw_b)
    
    raw_d = {
        'birth_date': str(dav_coord['birth_date']).split('T')[0],
        'birth_time': str(dav_coord['birth_time']),
        'lat': dav_coord['lat'],
        'lng': dav_coord['lng'],
        'timezone': dav_coord.get('timezone', 0.0)
    }
    
    # 3. N9 코어 엔진을 통해 타임라인 생성
    res_a = calculate_n9_timeline(raw_a, mode=mode, ayanamsa=ayanamsa)
    res_b = calculate_n9_timeline(raw_b, mode=mode, ayanamsa=ayanamsa)
    res_d = calculate_n9_timeline(raw_d, mode=mode, ayanamsa=ayanamsa)
    
    # 4. 시간 병합을 위한 기준점 세팅
    all_dates = set()
    for r in res_a['timeline']: all_dates.add(r['date'])
    for r in res_b['timeline']: all_dates.add(r['date'])
    for r in res_d['timeline']: all_dates.add(r['date'])
    sorted_dates = sorted(list(all_dates))
    
    state_a, state_b, state_d = None, None, None
    idx_a, idx_b, idx_d = 0, 0, 0
    len_a = len(res_a['timeline'])
    len_b = len(res_b['timeline'])
    len_d = len(res_d['timeline'])
    merged_timeline = []
    
    birth_a = raw_a['birth_date']
    birth_b = raw_b['birth_date']
    birth_d = raw_d['birth_date']
    
    # 🚀 쌍둥이(3일 미만 차이) 여부 판별
    dt_a = datetime.strptime(birth_a, "%Y-%m-%d")
    dt_b = datetime.strptime(birth_b, "%Y-%m-%d")
    days_diff = abs((dt_a - dt_b).days)
    is_twins = days_diff < 3
    
    first_born_date = min(birth_a, birth_b)
    later_born_date = max(birth_a, birth_b)
    later_born = 'a' if birth_a > birth_b else 'b'
    
    # 🚀 모드에 따른 정확한 시작점 지정
    if mode == 'zodiac':
        if subMode == 'davison':
            actual_start_date = birth_d
        else: # synastry (나중에 태어난 사람 기준)
            actual_start_date = later_born_date
    else: # jyotish (먼저 태어난 사람 기준)
        actual_start_date = first_born_date

    ref_year = int(actual_start_date.split('-')[0])
    
    # 🚀 [추가]: 이전 상태 기억 변수 및 시나스트리 전용 핑거프린트 헬퍼
    prev_a, prev_b, prev_d = None, None, None

    def get_synastry_fp(st):
        """Synastry 화면에 렌더링되는 핵심 정보(L1, L2)만 추출하여 튜플로 반환 (L3 무시)"""
        if not st: return None
        zr = st.get('zr', {})
        fird = st.get('firdaria', {})
        jyo_l1 = st.get('l1') # Jyotish 모드 대비용
        jyo_l2 = st.get('l2')
        
        return (
            zr.get('spirit', {}).get('l1'), zr.get('spirit', {}).get('l2'),
            zr.get('fortune', {}).get('l1'), zr.get('fortune', {}).get('l2'),
            zr.get('eros', {}).get('l1'), zr.get('eros', {}).get('l2'),
            fird.get('main'), fird.get('sub'),
            st.get('profections'),
            jyo_l1, jyo_l2
        )

    # 5. 시간 동기화 루프
    for d in sorted_dates:
        # 지정된 시작일 이전의 데이터는 무시하고 스킵
        if d < actual_start_date: continue 
            
        while idx_a < len_a and res_a['timeline'][idx_a]['date'] <= d:
            state_a = res_a['timeline'][idx_a]
            idx_a += 1
        while idx_b < len_b and res_b['timeline'][idx_b]['date'] <= d:
            state_b = res_b['timeline'][idx_b]
            idx_b += 1
        while idx_d < len_d and res_d['timeline'][idx_d]['date'] <= d:
            state_d = res_d['timeline'][idx_d]
            idx_d += 1
            
        # 🚀 [핵심 수복]: 모드(Zodiac vs Jyotish)에 따른 필터링 완벽 분리
        if mode == 'jyotish':
            # Jyotish는 A, Davison, B 모두가 한 화면에 렌더링되므로 셋 중 하나라도 변하면 기록
            if state_a is prev_a and state_b is prev_b and state_d is prev_d:
                continue
        else:
            # Zodiac은 탭(subMode)에 따라 보이는 대상이 다르므로 엄격히 필터링
            if subMode == 'davison':
                if state_d is prev_d:
                    continue
            else:
                if get_synastry_fp(state_a) == get_synastry_fp(prev_a) and get_synastry_fp(state_b) == get_synastry_fp(prev_b):
                    continue
                
        # 상태 최신화
        prev_a = state_a
        prev_b = state_b
        prev_d = state_d
            
        current_transit = {}
        if state_a and 'transits' in state_a: current_transit = state_a['transits']
        elif state_b and 'transits' in state_b: current_transit = state_b['transits']
        elif state_d and 'transits' in state_d: current_transit = state_d['transits']

        row = {
            "date": d,
            "age": int(d.split('-')[0]) - ref_year,
            "transits": current_transit,
            "a": copy.deepcopy(state_a), "veil_a": state_a is None,
            "b": copy.deepcopy(state_b), "veil_b": state_b is None,
            "dav": copy.deepcopy(state_d), "veil_d": state_d is None
        }
        merged_timeline.append(row)
        
    # 6. 장막 텍스트 연출
    # 🚀 Jyotish 모드일 때만, 그리고 생일 차이가 3일 이상 날 때만 텍스트 부여
    if mode == 'jyotish' and not is_twins:
        for i in range(len(merged_timeline) - 1):
            curr_row = merged_timeline[i]
            next_row = merged_timeline[i+1]
            
            if curr_row['veil_d'] and not next_row['veil_d']:
                curr_row['veil_text_dav'] = "Let there be Light."
                
            if later_born == 'a':
                if curr_row['veil_a'] and not next_row['veil_a']:
                    curr_row['veil_text_a'] = "Consummatum est."
            else:
                if curr_row['veil_b'] and not next_row['veil_b']:
                    curr_row['veil_text_b'] = "Consummatum est."
                
# 🚀 [백엔드 원천 봉쇄]: 프론트엔드가 다음 날짜를 추측하지 않도록 실제 다음 날짜를 꽂아줌
    for i in range(len(merged_timeline)):
        if i + 1 < len(merged_timeline):
            merged_timeline[i]['next_date'] = merged_timeline[i+1]['date']
        else:
            merged_timeline[i]['next_date'] = "9999-12-31"

    return {
        "status": "success",
        "data": {
            "meta": {
                "A": res_a.get('meta', {}),
                "B": res_b.get('meta', {}),
                "Davison": res_d.get('meta', {})
            },
            "timeline": merged_timeline
        }
    }

# ════════════════════════════════════════════════════════
# A10: RESONANTIA MATRIX ENGINE (v3.1 Time Unknown Defense)
# ════════════════════════════════════════════════════════
def calculate_resonantia_matrix(p1, p2, p_dav, mode, category, h_sys='P'):
    """
    A10 전용 4원 매트릭스 엔진.
    Time Unknown 시드의 앵글/하우스/랏 계산을 차단하고, 
    부모 중 하나라도 미상일 경우 Davison/Composite도 미상 처리합니다.
    """
    import core.astrology.domus as domus_pkg
    import core.astrology.composite as composite_pkg
    
    # 1. 🚀 [미상 여부(Time Unknown) 판별 및 전파]
    unk_a = bool(p1.get('is_time_unknown', 0))
    unk_b = bool(p2.get('is_time_unknown', 0))
    unk_dav = unk_a or unk_b  # 부모 중 한 명이라도 모르면 합성 차트들도 모름

    # 하우스 시스템 강제 추출
    actual_h_sys = p1.get('h_sys', h_sys)

    # TypeError 방지를 위해 내부 연산용 페이로드 정규화
    def sanitize(p):
        d = p.copy()
        for key in ['h_sys', 'system', 'ayanamsa', 'is_time_unknown']:
            d.pop(key, None)
        return d

    p1_clean = sanitize(p1)
    p2_clean = sanitize(p2)
    pd_clean = sanitize(p_dav)
    
    sys_name = p1.get('system', 'tropical')
    ayan = p1.get('ayanamsa', 'lahiri')

    # 2. 개별 시드 연산 (각자의 is_time_unknown 상태 전달)
    res_a = calculate_principia(**p1_clean, system=sys_name, ayanamsa=ayan, h_sys=actual_h_sys, is_time_unknown=unk_a)
    res_b = calculate_principia(**p2_clean, system=sys_name, ayanamsa=ayan, h_sys=actual_h_sys, is_time_unknown=unk_b)
    res_dav = calculate_principia(**pd_clean, system=sys_name, ayanamsa=ayan, h_sys=actual_h_sys, is_time_unknown=unk_dav)

    # 3. 무결성 하우스 계산기 (미상일 경우 무조건 "-" 반환)
    def get_house_num(lon, cusps_dict):
        if not cusps_dict: return "-"
        for i in range(1, 13):
            curr_c = cusps_dict[i]
            next_c = cusps_dict[i+1] if i < 12 else cusps_dict[1]
            if curr_c < next_c:
                if curr_c <= lon < next_c: return i
            else: # 물고기자리 -> 양자리 경계 통과 시
                if curr_c <= lon < 360 or 0 <= lon < next_c: return i
        return 1

    def sync_houses(res, is_unk):
        # 🚀 미상이거나 커스프가 없으면 하우스 할당 스킵
        if is_unk or not res.get('houses'): 
            for k, v in res.get('planets', {}).items():
                v['house'] = "-"
            return res, {}

        cusps = {int(k): (v['longitude'] if isinstance(v, dict) else v) for k, v in res['houses'].items()}
        res['planets'] = domus_pkg.assign_houses_to_planets(res['planets'], cusps)
        
        # 확실한 하우스 데이터 강제 주입
        for k, v in res['planets'].items():
            lon = v['longitude'] if isinstance(v, dict) else v
            v['house'] = get_house_num(lon, cusps)
            
        return res, cusps

    res_a, cusps_a = sync_houses(res_a, unk_a)
    res_b, cusps_b = sync_houses(res_b, unk_b)
    res_dav, cusps_dav = sync_houses(res_dav, unk_dav)

    # 4. Arcana (Hermetic) 연산 (🚀 시간이 미상인 시드는 계산을 아예 스킵)
    arc_a_p, arc_b_p, arc_a_v, arc_b_v = {}, {}, {}, {}
    arc_dav_p, arc_dav_v = {}, {}
    
    if category == 'hermetic':
        arc_args = {"h_sys": actual_h_sys, "system": sys_name, "ayanamsa": ayan}
        if not unk_a: arc_a_p = calculate_arcana(**p1_clean, lot_schema='paulus', **arc_args)
        if not unk_b: arc_b_p = calculate_arcana(**p2_clean, lot_schema='paulus', **arc_args)
        if not unk_dav: arc_dav_p = calculate_arcana(**pd_clean, lot_schema='paulus', **arc_args)
        try:
            if not unk_a: arc_a_v = calculate_arcana(**p1_clean, lot_schema='valens', **arc_args)
            if not unk_b: arc_b_v = calculate_arcana(**p2_clean, lot_schema='valens', **arc_args)
            if not unk_dav: arc_dav_v = calculate_arcana(**pd_clean, lot_schema='valens', **arc_args)
        except: pass

    # 5. Composite Chart 연산
    comp_res = {}
    if category != 'hermetic':
        # 🚀 [수복 완료]: Composite은 하우스 설정(WSH 등)과 무관하게 항상 일관된 공간적 진실(Placidus)을 기반으로 합성해야 180도 뒤집힘(H2->H8) 현상이 발생하지 않습니다.
        tmp_a = calculate_principia(**p1_clean, system=sys_name, ayanamsa=ayan, h_sys='P', is_time_unknown=unk_a)
        tmp_b = calculate_principia(**p2_clean, system=sys_name, ayanamsa=ayan, h_sys='P', is_time_unknown=unk_b)
        
        c_cusps_a = {int(k): (v['longitude'] if isinstance(v, dict) else v) for k, v in tmp_a.get('houses', {}).items()}
        c_cusps_b = {int(k): (v['longitude'] if isinstance(v, dict) else v) for k, v in tmp_b.get('houses', {}).items()}
        
        c_res = composite_pkg.calculate_composite_chart(res_a['planets'], res_b['planets'], c_cusps_a, c_cusps_b)
        c_planets = c_res['planets']
        
        c_cusps = {}
        if not unk_dav:
            # Composite Angles 180도 뒤집힘 방지
            if 'Ascendant' in c_planets and 'Midheaven' in c_planets:
                mc_lon = c_planets['Midheaven']['longitude']
                asc_lon = c_planets['Ascendant']['longitude']
                if (asc_lon - mc_lon) % 360 > 180:
                    c_planets['Ascendant']['longitude'] = (asc_lon + 180) % 360
                if 'Descendant' in c_planets:
                    c_planets['Descendant']['longitude'] = (c_planets['Ascendant']['longitude'] + 180) % 360
                if 'Immum Coeli' in c_planets:
                    c_planets['Immum Coeli']['longitude'] = (c_planets['Midheaven']['longitude'] + 180) % 360
            
            # 어떠한 인위적인 재조정(WSH 덮어쓰기) 없이 순수 Placidus 합성 결과를 그대로 사용합니다.
            c_cusps = {int(k): (v['longitude'] if isinstance(v, dict) else v) for k, v in c_res.get('houses', {}).items()}
            c_planets = domus_pkg.assign_houses_to_planets(c_planets, c_cusps)
        else:
            for ang in ["Ascendant", "Midheaven", "Descendant", "Immum Coeli", "Asc.", "M.C.", "Dsc.", "I.C."]:
                c_planets.pop(ang, None)

        # UI용 포맷 데이터 및 하우스 정보 강제 주입
        for k, v in c_planets.items():
            lon = v['longitude'] if isinstance(v, dict) else v
            
            # 🔥 [수복]: 여기서 드디어 mode를 확인하고 180도를 뒤집습니다!
            if mode in ['anti', 'anticomposite']:
                lon = (lon + 180.0) % 360.0

            v.update({
                "longitude": lon,
                "dms": format_dms_pretty(lon),
                "sabian_index": get_sabian_index(lon),
                "is_retrograde": False,
                "dignity": "-",
                "house": get_house_num(lon, c_cusps) if not unk_dav else "-"
            })
        comp_res = {"planets": c_planets}

    # 6. 데이터 플래트닝(Flattening) 헬퍼
    def map_a10_name(name):
        if name == 'Eros': return 'Asteroid Eros'
        if name == 'True Node': return 'North Node (t)'
        if name == 'Mean Node': return 'North Node (m)'
        return name

    def flatten_chart(principia, arc_p, arc_v, is_unk):
        flat = {}
        if 'planets' in principia:
            for k, v in principia['planets'].items():
                name = map_a10_name(k)
                # Angles 카테고리이거나 앵글 자체인 경우, 또는 시간 미상이면 하우스 정보를 "-"로 처리
                is_angle_item = any(x in name for x in ["Ascendant", "Midheaven", "Descendant", "Immum Coeli"])
                
                if is_unk or is_angle_item or category == 'angles':
                    house_info = "-"
                else:
                    house_info = v.get("house", "-")
                
                flat[name] = {
                    "dms": v.get("dms", "-"),
                    "sabian_index": v.get("sabian_index", 0),
                    "is_retrograde": v.get("is_retrograde", False),
                    "dignity": v.get("dignity", "-"),
                    "house": house_info
                }
        
        if 'lots' in arc_p:
            for k, v in arc_p['lots'].items():
                name = k.replace("Lot of ", "")
                if name == "Eros": name = "Eros"
                flat[name] = { "dms": v.get("dms", "-"), "sabian_index": v.get("sabian", 0), "dignity": "-", "house": v.get("house", "-") }
        if 'vertex' in arc_p:
            for k, v in arc_p['vertex'].items():
                flat[k] = { "dms": v.get("dms", "-"), "sabian_index": v.get("sabian", 0), "dignity": "-", "house": v.get("house", "-") }
        if 'syzygy' in arc_p and arc_p['syzygy'].get('data'):
            sz = arc_p['syzygy']['data']
            flat['Syzygy'] = { "dms": sz.get("dms", "-"), "sabian_index": sz.get("sabian", 0), "dignity": "-", "house": sz.get("house", "-") }
        if 'lots' in arc_v:
            for k, v in arc_v['lots'].items():
                if k in ['Necessity', 'Eros']:
                    flat[f"{k} (v)"] = { "dms": v.get("dms", "-"), "sabian_index": v.get("sabian", 0), "dignity": "-", "house": v.get("house", "-") }
        return flat

    # 7. 최종 4원 매트릭스 병합 (각 시드별 is_unk 플래그를 넘겨 독립 처리)
    f_a = flatten_chart(res_a, arc_a_p, arc_a_v, unk_a)
    f_b = flatten_chart(res_b, arc_b_p, arc_b_v, unk_b)
    f_dav = flatten_chart(res_dav, arc_dav_p, arc_dav_v, unk_dav)
    f_comp = flatten_chart(comp_res, {}, {}, unk_dav) if comp_res else {}

    result = {}
    all_keys = set(f_a.keys()).union(f_b.keys(), f_dav.keys(), f_comp.keys())
    for k in all_keys:
        result[k] = { "a": f_a.get(k), "b": f_b.get(k), "davison": f_dav.get(k), "comp": f_comp.get(k) }
    
    return result

# ════════════════════════════════════════════════════════
# N7: HYPOSTASES ENGINE (Persona Matrix Orchestrator)
# ════════════════════════════════════════════════════════

def find_persona_transit(birth_jd: float, target_lon: float) -> float:
    """[N7 헬퍼] 출생 이후 태양이 타겟 천체의 위치(target_lon)와 첫 컨준션(0도)을 맺는 UTC 기준 시간(JD)을 탐색합니다."""
    import swisseph as swe
    sun_pos, _ = swe.calc_ut(birth_jd, swe.SUN)
    sun_lon = sun_pos[0]
    
    delta = (target_lon - sun_lon) % 360
    if delta < 0.001: 
        return birth_jd
        
    est_jd = birth_jd + (delta / 0.985647) # 태양의 일일 평균 이동 속도로 1차 추정
    
    for _ in range(10):
        pos, _ = swe.calc_ut(est_jd, swe.SUN)
        curr_lon = pos[0]
        
        diff = (target_lon - curr_lon)
        diff = (diff + 180) % 360 - 180 
        
        if abs(diff) < 0.000001: # 오차율 0.000001 이하로 수렴 시 종료
            break
        est_jd += diff / 0.985647
        
    return est_jd

def _get_n7_house_num(lon, houses_dict):
    """도수(lon)가 위치한 하우스 번호(H1~H12)를 정확히 판별합니다."""
    if not houses_dict: return "-"
    for i in range(1, 13):
        curr_c = houses_dict.get(i, {}).get('longitude', 0.0)
        next_c = houses_dict.get(i+1 if i < 12 else 1, {}).get('longitude', 0.0)
        
        if curr_c < next_c:
            if curr_c <= lon < next_c: return f"H{i}"
        else: # 360도 경계선(Pisces -> Aries) 통과 구간
            if curr_c <= lon < 360 or 0 <= lon < next_c: return f"H{i}"
    return "H1"

def _lords_to_symbols(lord_str):
    """[N7 헬퍼] Day Lord / Hour Lord의 행성 영문명을 기호(Symbol)로 변환합니다."""
    if not lord_str or lord_str == "-": return "-"
    syms = {"Sun": "☉", "Moon": "☽", "Mercury": "☿", "Venus": "♀", "Mars": "♂", "Jupiter": "♃", "Saturn": "♄"}
    parts = [p.strip() for p in lord_str.split('|')]
    return " | ".join([syms.get(p, p) for p in parts])

# ════════════════════════════════════════════════════════
# N7: HYPOSTASES ENGINE (Persona Matrix Orchestrator)
# ════════════════════════════════════════════════════════

def find_persona_transit(birth_jd: float, target_lon: float, system: str, ayanamsa: str) -> float:
    """
    [N7 궁극 헬퍼] 
    출생 이후 해당 시스템(Tropical/Sidereal/Draconic/Ketunic)의 트랜짓 태양이 
    타겟 천체의 '시스템 기준 고유 위치(target_lon)'와 정확히 컨준션(0.0000도)을 맺는 UTC 시간(JD)을 탐색합니다.
    """
    import swisseph as swe
    
    AYAN_MAP = {'fagan-bradley': 0, 'lahiri': 1, 'raman': 3, 'kp': 5, 'yukteswar': 7}
    target_sid_mode = AYAN_MAP.get(ayanamsa.lower(), 1)
    iflgret = swe.FLG_SWIEPH | swe.FLG_SPEED
    
    def get_system_sun(jd):
        # 1. Sidereal 모드 세팅
        if system == 'sidereal':
            flags = iflgret | swe.FLG_SIDEREAL
            swe.set_sid_mode(target_sid_mode, 0, 0)
        else:
            flags = iflgret
            swe.set_sid_mode(0, 0, 0)
            
        sun_lon = swe.calc_ut(jd, swe.SUN, flags)[0][0]
        
        # 2. Draconic/Ketunic 오프셋(Rahu) 세팅
        if system in ['draconic', 'ketunic']:
            tn_lon = swe.calc_ut(jd, 11, iflgret)[0][0] # 11 = True Node
            offset = -tn_lon if system == 'draconic' else (-tn_lon + 180)
            sun_lon = (sun_lon + offset) % 360
            
        swe.set_sid_mode(0, 0, 0) # 리셋
        return sun_lon

    birth_sun_lon = get_system_sun(birth_jd)
    
    delta = (target_lon - birth_sun_lon) % 360
    if delta < 0.001: 
        return birth_jd
        
    # 태양의 일일 평균 이동 속도(약 0.985도)로 1차 추정
    est_jd = birth_jd + (delta / 0.985647) 
    
    # 정밀 수치 해석 루프 (Newton-Raphson 기반)
    for _ in range(15):
        curr_lon = get_system_sun(est_jd)
        diff = (target_lon - curr_lon)
        diff = (diff + 180) % 360 - 180 
        
        # 오차율 0.000001 이하 수렴 시 종료
        if abs(diff) < 0.000001: 
            break
            
        # Draconic 태양은 노드의 역행 덕분에 하루 약 1.03도씩 움직이므로 Tropical보다 미세하게 더 빨리 타겟을 밟습니다.
        est_jd += diff / 0.985647
        
    return est_jd

def _get_n7_house_num(lon, houses_dict):
    """도수(lon)가 위치한 하우스 번호(H1~H12)를 정확히 판별합니다."""
    if not houses_dict: return "-"
    for i in range(1, 13):
        curr_c = houses_dict.get(i, {}).get('longitude', 0.0)
        next_c = houses_dict.get(i+1 if i < 12 else 1, {}).get('longitude', 0.0)
        
        if curr_c < next_c:
            if curr_c <= lon < next_c: return f"H{i}"
        else:
            if curr_c <= lon < 360 or 0 <= lon < next_c: return f"H{i}"
    return "H1"

def _lords_to_symbols(lord_str):
    if not lord_str or lord_str == "-": return "-"
    syms = {"Sun": "☉", "Moon": "☽", "Mercury": "☿", "Venus": "♀", "Mars": "♂", "Jupiter": "♃", "Saturn": "♄"}
    parts = [p.strip() for p in lord_str.split('|')]
    return " | ".join([syms.get(p, p) for p in parts])

def calculate_hypostases_matrix(natal_seed: dict, targets: list, system: str, ayanamsa: str, h_sys: str) -> dict:
    """
    [N7 정제 엔진] 
    요청받은 시스템(System)을 기준으로 지표와 트랜짓 태양을 정밀 추적하여 해당 시스템 고유의 페르소나 시공간을 연성합니다.
    """
    from datetime import datetime, timedelta
    
    # 1. Base Seed 파싱
    date_str = natal_seed.get('birth_date', '2000-01-01')
    if 'T' in date_str: date_str = date_str.split('T')[0]
    time_str = natal_seed.get('birth_time', '12:00:00')
    lat = float(natal_seed.get('lat', 0.0))
    lng = float(natal_seed.get('lng', 0.0))
    tz = float(natal_seed.get('timezone', 0.0))
    birth_jd = get_julian_day(date_str, time_str, tz)

    # 🚀 [CORE FIX]: Tropical 임시 레퍼런스를 전부 삭제하고, 처음부터 요청된 시스템(System) 네이탈 차트만 연산하여 타겟 좌표로 삼습니다.
    n_data = calculate_principia(date_str, time_str, lat, lng, timezone=tz, system=system, ayanamsa=ayanamsa, h_sys=h_sys)
    n_arcana_p = calculate_arcana(date_str, time_str, lat, lng, timezone=tz, lot_schema='paulus', system=system, ayanamsa=ayanamsa, h_sys=h_sys)
    try: n_arcana_v = calculate_arcana(date_str, time_str, lat, lng, timezone=tz, lot_schema='valens', system=system, ayanamsa=ayanamsa, h_sys=h_sys)
    except: n_arcana_v = {'lots': {}}

    n_targets = n_data.get('planets', {}).copy()
    
    # 소행성 등 이름 정리
    if "Eros" in n_targets: n_targets["Asteroid Eros"] = n_targets.pop("Eros")
    if "True Node" in n_targets: n_targets["North Node (t)"] = n_targets.pop("True Node")
    elif "North Node" in n_targets: n_targets["North Node (t)"] = n_targets.pop("North Node")
    if "South Node" in n_targets: n_targets["South Node (t)"] = n_targets.pop("South Node")
    if "Mean Node" in n_targets: n_targets["Rahu"] = n_targets.pop("Mean Node")
    elif "North Node (m)" in n_targets: n_targets["Rahu"] = n_targets.pop("North Node (m)")
    if "South Node (m)" in n_targets: n_targets["Ketu"] = n_targets.pop("South Node (m)")
    
    if "North Node (t)" in n_targets and "South Node (t)" not in n_targets:
        n_targets["South Node (t)"] = {'longitude': (n_targets["North Node (t)"]['longitude'] + 180) % 360}
    if "Rahu" in n_targets and "Ketu" not in n_targets:
        n_targets["Ketu"] = {'longitude': (n_targets["Rahu"]['longitude'] + 180) % 360}

    for k, v in n_arcana_p.get('lots', {}).items(): n_targets[k] = {'longitude': v['value']}
    for k, v in n_arcana_v.get('lots', {}).items():
        if k in ['Eros', 'Necessity']: n_targets[f"{k} (v)"] = {'longitude': v['value']}
    for k, v in n_arcana_p.get('vertex', {}).items(): n_targets[k] = {'longitude': v['value']}
    if 'syzygy' in n_arcana_p: n_targets['Syzygy'] = {'longitude': n_arcana_p['syzygy']['data']['value']}

    result_charts = {}
    
    # 3. 페르소나 차트 생성 루프
    for target in targets:
        query_target = target.replace(" (Natal)", "")
        lookup_key = query_target
        
        if lookup_key == "Sun":
            p_data, p_arc_p, p_arc_v = n_data, n_arcana_p, n_arcana_v
            p_date, p_time = date_str, time_str
        else:
            if lookup_key not in n_targets:
                continue
            
            ref_key = lookup_key
            if ref_key == "South Node (t)": ref_key = "North Node (t)"
            if ref_key == "Ketu": ref_key = "Rahu"  
            
            target_lon = n_targets[ref_key]['longitude']
            if lookup_key in ["South Node (t)", "Ketu"]:
                target_lon = (target_lon + 180) % 360

            # 🚀 [핵심 수복]: 시스템 전용 함수로 탐색 (Draconic이면 Draconic 궤도에서 추적!)
            persona_jd = find_persona_transit(birth_jd, target_lon, system, ayanamsa)
            
            import swisseph as swe
            year, month, day, fr_hour = swe.revjul(persona_jd, swe.GREG_CAL)
            total_seconds = int(round(fr_hour * 3600))
            hour = total_seconds // 3600
            minute = (total_seconds % 3600) // 60
            second = total_seconds % 60
            
            try:
                utc_dt = datetime(year, month, day) + timedelta(hours=hour, minutes=minute, seconds=second)
            except ValueError:
                utc_dt = datetime(year, month, day, 0, 0, 0) # Fallback
                
            local_dt = utc_dt + timedelta(hours=tz)
            p_date = local_dt.strftime("%Y-%m-%d")
            p_time = local_dt.strftime("%H:%M:%S")
            
            p_data = calculate_principia(p_date, p_time, lat, lng, timezone=tz, system=system, ayanamsa=ayanamsa, h_sys=h_sys)
            p_arc_p = calculate_arcana(p_date, p_time, lat, lng, timezone=tz, lot_schema='paulus', system=system, ayanamsa=ayanamsa, h_sys=h_sys)
            try: p_arc_v = calculate_arcana(p_date, p_time, lat, lng, timezone=tz, lot_schema='valens', system=system, ayanamsa=ayanamsa, h_sys=h_sys)
            except: p_arc_v = {'lots': {}}

        # 4. 데이터 정제
        p_planets = p_data.get('planets', {})
        houses_dict = p_data.get('houses', {})
        lords = p_data.get('lords', {})
        
        points_out = {}
        keys_to_skip = ["Asc.", "Dsc.", "I.C.", "M.C.", "Descendant.", "Midheaven.", "Immum Coeli."]
        
        for k, v in p_planets.items():
            if k in keys_to_skip: continue
            
            kn = k
            if k == "Sun": kn = "Sun (Natal)"
            elif k in ["True Node", "North Node"]: kn = "North Node (t)"
            elif k == "South Node": kn = "South Node (t)"
            elif k in ["Mean Node", "North Node (m)"]: kn = "Rahu"  
            elif k == "South Node (m)": kn = "Ketu"
            elif k == "Eros": kn = "Asteroid Eros"
            elif k in ["Lilith (mean)", "Mean Lilith"]: kn = "Mean Lilith"
            elif k in ["Lilith (true)", "True Lilith"]: kn = "True Lilith"
            
            p_entry = {
                "longitude": v.get("longitude", 0.0),
                "dms": v.get("dms", "-"),
                "is_retrograde": v.get("is_retrograde", False),
                "house": _get_n7_house_num(v.get('longitude', 0), houses_dict),
                "duad": v.get("duad", "-"),
                "dodeca": v.get("dodeca", "-"),
                "decan": v.get("decan", "-"),
                "bound": v.get("bound", "-"),
                "sabian_index": v.get("sabian_index", "")
            }
            points_out[kn] = p_entry

        if "North Node (t)" in points_out and "South Node (t)" not in points_out:
            nn = points_out["North Node (t)"]
            sn_lon = (nn["longitude"] + 180) % 360
            try:
                from .engine import format_dms_pretty
                sn_dms = format_dms_pretty(sn_lon)
            except:
                sn_dms = f"{int(sn_lon)}°{int((sn_lon - int(sn_lon))*60):02d}'{int((sn_lon * 3600) % 60):02d}''"

            points_out["South Node (t)"] = {
                "longitude": sn_lon, "dms": sn_dms, "is_retrograde": nn["is_retrograde"],
                "house": _get_n7_house_num(sn_lon, houses_dict),
                "duad": "-", "dodeca": "-", "decan": "-", "bound": "-", "sabian_index": ""
            }

        if "Rahu" in points_out and "Ketu" not in points_out:
            nn = points_out["Rahu"]
            sn_lon = (nn["longitude"] + 180) % 360
            try:
                from .engine import format_dms_pretty
                sn_dms = format_dms_pretty(sn_lon)
            except:
                sn_dms = f"{int(sn_lon)}°{int((sn_lon - int(sn_lon))*60):02d}'{int((sn_lon * 3600) % 60):02d}''"

            points_out["Ketu"] = {
                "longitude": sn_lon, "dms": sn_dms, "is_retrograde": nn["is_retrograde"],
                "house": _get_n7_house_num(sn_lon, houses_dict),
                "duad": "-", "dodeca": "-", "decan": "-", "bound": "-", "sabian_index": ""
            }

        for k, v in p_arc_p.get('lots', {}).items():
            points_out[k] = {"longitude": v.get("value", 0.0), "dms": v.get("dms", "-"), "is_retrograde": False, "house": f"H{v.get('house', '-')}", "duad": v.get("duad", "-"), "dodeca": v.get("dodeca", "-"), "decan": v.get("decan", "-"), "bound": v.get("bound", "-"), "sabian_index": v.get("sabian", "")}
        for k, v in p_arc_v.get('lots', {}).items():
            if k in ['Eros', 'Necessity']:
                points_out[f"{k} (v)"] = {"longitude": v.get("value", 0.0), "dms": v.get("dms", "-"), "is_retrograde": False, "house": f"H{v.get('house', '-')}", "duad": v.get("duad", "-"), "dodeca": v.get("dodeca", "-"), "decan": v.get("decan", "-"), "bound": v.get("bound", "-"), "sabian_index": v.get("sabian", "")}
        for k, v in p_arc_p.get('vertex', {}).items():
            points_out[k] = {"longitude": v.get("value", 0.0), "dms": v.get("dms", "-"), "is_retrograde": False, "house": f"H{v.get('house', '-')}", "duad": v.get("duad", "-"), "dodeca": v.get("dodeca", "-"), "decan": v.get("decan", "-"), "bound": v.get("bound", "-"), "sabian_index": v.get("sabian", "")}
        if 'syzygy' in p_arc_p:
            sz = p_arc_p['syzygy']['data']
            points_out['Syzygy'] = {"longitude": sz.get("value", 0.0), "dms": sz.get("dms", "-"), "is_retrograde": False, "house": f"H{sz.get('house', '-')}", "duad": sz.get("duad", "-"), "dodeca": sz.get("dodeca", "-"), "decan": sz.get("decan", "-"), "bound": sz.get("bound", "-"), "sabian_index": sz.get("sabian", "")}

        domus_map = {f"H{i}": [] for i in range(1, 13)}
        for p_name, p_data in points_out.items():
            h_key = p_data.get('house')
            if h_key in domus_map:
                domus_map[h_key].append(p_name)

        cusps_map = {}
        for i in range(1, 13):
            if h_sys in ['P', 'K', 'R', 'C', 'E'] and i in [1, 4, 7, 10]:
                continue
            c_lon = houses_dict.get(i, {}).get("longitude")
            if c_lon is not None:
                cusps_map[f"H{i}"] = c_lon

        result_charts[target] = {
            "chart_info": {
                "datetime": f"{p_date} {p_time}", 
                "day_lord": _lords_to_symbols(str(lords.get('day', '-')).strip()),
                "hour_lord": _lords_to_symbols(str(lords.get('hour', '-')).strip()),
                "aries_0_house": _get_n7_house_num(0.0, houses_dict)
            },
            "points": points_out,
            "domus": domus_map,
            "cusps": cusps_map
        }

    return result_charts

def calculate_c2_aleph(seed_data):
    """
    [C2: HORA OCCULTA] Aleph Rectification Wrapper
    rectification.py의 순수 연산 결과를 받아 UI 렌더링용 메타데이터와 플래그를 조립합니다.
    """
    import core.astrology.rectification as rect_pkg
    import traceback
    
    try:
        # 1. 데이터 파싱 및 안전장치
        date_str = str(seed_data.get('date', '2000-01-01'))
        lat = float(seed_data.get('lat', 37.5665))
        lng = float(seed_data.get('lng', 126.9780))
        
        # Timezone 안전 변환 (문자열 방어)
        tz_val = seed_data.get('timezone', 0.0)
        
        # _ensure_float_tz가 engine.py 내부에 있다고 가정합니다. 
        # 만약 없다면 tz_offset = float(tz_val) 로 처리해도 무방합니다.
        tz_offset = _ensure_float_tz(tz_val, date_str) 
        
        # 2. Rectification 코어 스캔 실행 (00:00 ~ 23:59)
        # 여기서 anaretic_mars, mars_retrograde, mars_saturn_conjunction(orb 3) 플래그가 추출됨
        scan_result = rect_pkg.scan_aleph_day(date_str, lat, lng, tz_offset)
        
        # 3. 데이터 요약 (UI의 Question Phase에서 필요한 후보군 추출)
        # 🚀 [Fix 1]: rectification.py의 반환 키 이름인 'timeline_blocks'를 사용합니다.
        blocks = scan_result['timeline_blocks']
        
        # Set을 이용해 하루 동안 등장한 유니크한 조합들만 추출
        unique_asc = list(set([b['ascendant'] for b in blocks]))
        unique_hl = list(set([b['hour_lord'] for b in blocks]))
        
        # 🚀 [Fix 2]: 분리된 saturn_house와 chiron_house를 하나의 문자열 키로 조합합니다.
        unique_pairs = list(set([f"{b['saturn_house']}|{b['chiron_house']}" for b in blocks]))
        
        # 4. 프론트엔드 규격에 맞춰 최종 반환
        return {
            "status": "success",
            "meta": {
                "date": date_str,
                "coordinates": [lat, lng],
                "timezone": tz_offset,
                "summary": {
                    "total_blocks": len(blocks),
                    "ascendants": unique_asc,
                    "hour_lords": unique_hl,
                    "sat_chi_pairs": unique_pairs
                }
            },
            # 프론트엔드의 renderDisclaimer()가 받아서 JSON modifier 문구를 띄울 핵심 데이터
            "flags": scan_result['flags'],  
            
            # 🚀 [Fix 3]: 프론트엔드의 양자택일 및 화성 문항 렌더링에 반드시 필요한 데이터 전달
            "mars_sign": scan_result.get('mars_sign'),
            "mars_ingress_info": scan_result.get('mars_ingress_info'),
            
            # 00:00 ~ 23:59 까지의 시간표 분할 데이터
            "timeline_blocks": blocks       
        }
        
    except Exception as e:
        traceback.print_exc()
        return {"error": f"Aleph Engine Wrapper Failed: {str(e)}"}

def calculate_c2_mem(data: dict):
    """
    프론트엔드에서 받은 생년월일과 Aleph 통과 시간대(time_blocks)를 바탕으로
    Dasha & Purushartha 타임라인 블록을 계산하여 반환합니다.
    """
    date_str = data.get('date')
    tz_val = data.get('timezone', 0)
    tz_offset = _ensure_float_tz(tz_val, date_str) 
    
    # 프론트엔드(Aleph 결과)에서 넘어온 {"start": "14:00", "end": "14:23"} 형태의 배열
    time_blocks = data.get('time_blocks', [])
    
    try:
        from .rectification import scan_mem_day
        blocks = scan_mem_day(date_str, time_blocks, tz_offset)
        
        # 🚀 프론트엔드가 참고할 수 있도록 요약 키 명칭 변경
        unique_puru = list(set([b.get('purushartha', 'Unknown') for b in blocks]))
        unique_pada = list(set([b.get('pada_purushartha', 'Unknown') for b in blocks]))
        
        return {
            "status": "success",
            "meta": {
                "date": date_str,
                "timezone": tz_offset,
                "summary": {
                    "total_blocks": len(blocks),
                    "purusharthas": unique_puru,       # Nakshatra 기반
                    "pada_purusharthas": unique_pada    # Pada 기반
                }
            },
            "timeline_blocks": blocks
        }
    except Exception as e:
        import traceback
        return {
            "status": "error", 
            "error": str(e),
            "trace": traceback.format_exc()
        }

def calculate_c2_shin(data: dict):
    """
    독립된 서브모듈 Shin의 엔진 래퍼.
    전달받은 time_blocks를 바탕으로 Arudha Padas 및 Tropical/Sidereal Asc 조합을 계산하여 반환합니다.
    """
    import traceback
    
    date_str = data.get('date')
    tz_val = data.get('timezone', 0)
    
    # engine.py 내부의 시간 보정 함수 사용
    from .engine import _ensure_float_tz
    tz_offset = _ensure_float_tz(tz_val, date_str) 
    
    # 어떤 형태의 time_blocks든 유연하게 수용
    time_blocks = data.get('time_blocks', [])
    
    if not time_blocks:
        return {"error": "No time blocks provided."}

    try:
        from .rectification import scan_shin_day
        blocks = scan_shin_day(date_str, time_blocks, tz_offset)
        
        # 렌더링에 필요한 고유 하우스(옵션) 요약 추출 (프론트엔드 폼 생성용)
        unique_al = list(set([b['arudha']['AL']['house'] for b in blocks]))
        unique_a7 = list(set([b['arudha']['A7']['house'] for b in blocks]))
        unique_a10 = list(set([b['arudha']['A10']['house'] for b in blocks]))
        unique_ul = list(set([b['arudha']['UL']['house'] for b in blocks]))
        unique_combinations = list(set([f"{b['tropical_asc'].lower()}_{b['sidereal_asc'].lower()}" for b in blocks]))
        
        return {
            "status": "success",
            "meta": {
                "date": date_str,
                "timezone": tz_offset,
                "summary": {
                    "AL_options": sorted(unique_al, key=int),
                    "A7_options": sorted(unique_a7, key=int),
                    "A10_options": sorted(unique_a10, key=int),
                    "UL_options": sorted(unique_ul, key=int),
                    "Asc_combinations": unique_combinations
                }
            },
            "blocks": blocks
        }
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return {"error": f"Shin Engine Wrapper Failed: {str(e)}"}