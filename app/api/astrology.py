# app/api/astrology.py - v18.0 Hotfix & Dual Schema

import math
def clean_nans(data):
    if isinstance(data, dict):
        return {k: clean_nans(v) for k, v in data.items()}
    elif isinstance(data, list):
        return [clean_nans(x) for x in data]
    elif isinstance(data, float):
        if math.isnan(data) or math.isinf(data):
            return None
        return data
    return data

from fastapi import APIRouter, Request, Body, Query, HTTPException, Body
from core.astrology.engine import (
    calculate_principia, calculate_arcana, format_dms_pretty, 
    TROPICAL_SIGNS, SYMBOL_MAP # 상수는 엔진에서 빌려옵니다
)
from core.astrology.davison import calculate_davison_midpoint
from core.astrology.composite import generate_composite_data
from core.astrology.engine import format_dms_pretty

from timezonefinder import TimezoneFinder

import sys
import json
import pytz
import re
import importlib # 🚀 [핵심]: 모듈 강제 새로고침 도구
from datetime import datetime
from pydantic import BaseModel
from typing import List, Optional, Dict, Any

from core.astrology.aspects import calculate_all_aspects
from core.astrology.patterns import find_patterns

# 🔑 [Critical]: Reload를 위해 패키지 형태로 임포트
import core.astrology.engine as engine_pkg
import core.astrology.composite as composite_pkg

import core.astrology.domus as domus_pkg
import core.astrology.lagna as lagna_pkg

# Reload 후 함수 임포트
from core.astrology.divisions.decan import get_decan
from core.astrology.divisions.duad import get_duad
from core.astrology.divisions.dodecatemoria import get_dodecatemoria
from core.astrology.divisions.egyptian_bounds import get_egyptian_bounds
from core.astrology.divisions.sabian_engine import get_sabian_index
from core.astrology.aspects import calculate_all_aspects
from core.astrology.patterns import find_patterns

tf = TimezoneFinder()
router = APIRouter(prefix="/api/astro", tags=["astrology"])

import json
from urllib.parse import unquote
from fastapi import Request  # 👈 (이미 있으면 생략)

def get_seed_from_request(request: Request, is_albedo=False):
    """
    🚀 [Stateless Helper]: 프론트엔드가 쏴준 헤더(포스트잇)에서 데이터를 낚아채어 딕셔너리로 변환합니다.
    """
    header_key = 'x-albedo-seed' if is_albedo else 'x-active-seed'
    seed_str = request.headers.get(header_key)
    
    if not seed_str:
        return None
    try:
        return json.loads(unquote(seed_str))
    except:
        return None

def get_safe_float(val, default):
    """None이나 비정상적인 값을 안전하게 float로 변환합니다."""
    try:
        return float(val) if val is not None else default
    except:
        return default

def resolve_seed_hydration(data: dict):
    # 1. 필드명 정규화
    if "birthDate" in data: data["birth_date"] = data["birthDate"]
    if "birthTime" in data: data["birth_time"] = data["birthTime"]
    
    # 🚀 [방역 수복]: Time Unknown 자동 감지 로직
    # birth_time이 없거나, 빈 문자열이거나, "Unknown"인 경우 미상으로 판별합니다.
    raw_time = str(data.get('birth_time', '')).strip()
    if not raw_time or "Unknown" in raw_time or raw_time == "":
        data["is_time_unknown"] = 1
        # 내부 연산 오류 방지를 위해 표준 정오(12:00)를 임시 주입 (엔진에서 플래그로 차단됨)
        data["birth_time"] = "12:00:00" 
    else:
        # 이미 플래그가 1인 경우(Davison 등)를 위해 상태 유지, 없으면 0(정상) 주입
        data["is_time_unknown"] = data.get("is_time_unknown", 0)

    # 2. 좌표 보정 (CITIES 데이터 우선) [cite: 2]
    city_id = data.get("city_id") or data.get("location_key")
    if city_id in CITIES:
        city = CITIES[city_id]
        data["lat"] = city.get("lat")
        data["lng"] = city.get("lon")

    # 🔑 [타입 강제]: 데이터 무결성을 위해 float 형변환 및 기본값(서울) 적용 [cite: 2]
    data["lat"] = get_safe_float(data.get("lat"), 37.5665)
    data["lng"] = get_safe_float(data.get("lng"), 126.9780)

    # 3. IANA 시간대 변환 (문자열 'Asia/Seoul' 등을 숫자 오프셋으로 변환) [cite: 2]
    tz_val = data.get("timezone")
    if tz_val is None or isinstance(tz_val, str):
        # 좌표 기반으로 시간대 식별
        tz_name = tf.timezone_at(lng=data["lng"], lat=data["lat"])
        if tz_name:
            b_date = str(data.get("birth_date") or datetime.now().strftime("%Y-%m-%d"))
            try:
                dt = datetime.strptime(b_date, "%Y-%m-%d")
                # 해당 날짜의 서머타임 등을 고려한 정확한 UTC 오프셋 계산 [cite: 2]
                data["timezone"] = float(pytz.timezone(tz_name).utcoffset(dt).total_seconds() / 3600)
            except: 
                data["timezone"] = 9.0
        else: 
            data["timezone"] = get_safe_float(tz_val, 9.0)
    else:
        data["timezone"] = float(tz_val)

    return data

def restore_ruler_and_dignity(planet_name, sign_idx):
    """컴포지트로 인해 별자리가 바뀐 행성의 새로운 Ruler와 Dignity를 재계산합니다."""
    rulers = {
        0: "Mars", 1: "Venus", 2: "Mercury", 3: "Moon", 
        4: "Sun", 5: "Mercury", 6: "Venus", 7: "Pluto", 
        8: "Jupiter", 9: "Saturn", 10: "Uranus", 11: "Neptune"
    }
    trad_rulers = {7: "Mars", 10: "Saturn", 11: "Jupiter"}
    
    # 1. 룰러(지배성)는 그 자리에 누가 오든 별자리 고유의 주인이므로 그대로 부여
    ruler = rulers.get(sign_idx, "-")
    
    # 🚀 2. 10행성이 아닌 소행성, 교점, 가상점 등은 위계(Dignity)가 없으므로 "-" 반환
    main_planets = ["Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune", "Pluto"]
    if planet_name not in main_planets:
        return ruler, "-"
        
    # 3. 10행성일 경우 기본 위계를 Peregrine으로 설정하고 계산 시작
    dignity = "Peregrine"
    
    # Domicile (룰러십)
    if ruler == planet_name or trad_rulers.get(sign_idx) == planet_name:
        dignity = "Domicile"
    # Detriment (마주보는 별자리, +6)
    elif rulers.get((sign_idx + 6) % 12) == planet_name or trad_rulers.get((sign_idx + 6) % 12) == planet_name:
        dignity = "Detriment"
        
    # Exaltation (기능 항진)
    exaltations = {"Sun": 0, "Moon": 1, "Jupiter": 3, "Mercury": 5, "Saturn": 6, "Mars": 9, "Venus": 11}
    if exaltations.get(planet_name) == sign_idx:
        dignity = "Exaltation"
    # Fall (Exaltation의 마주보는 별자리, +6)
    elif exaltations.get(planet_name) == (sign_idx + 6) % 12:
        dignity = "Fall"
        
    return ruler, dignity

# 🔑 [복구 1]: N1 모듈이 선택한 씨앗을 Station에 등록 (Me 렌더링 필수)
@router.post("/check-in")
async def check_in_seed(request: Request, data: dict = Body(...)):
    # 🚀 이제 프론트가 매번 데이터를 쏴주므로 서버가 기억할 필요가 없습니다.
    return {"status": "success", "message": "Stateless Check-in Complete"}

@router.post("/principia/sync-active")
async def sync_active_seed(request: Request, data: dict = Body(...)):
    return {"status": "success"}

@router.get("/principia/resting")
async def get_principia_resting(
    request: Request,
    system: str = 'tropical', 
    ayanamsa: str = 'lahiri', 
    view: str = 'zodiac',
    h_sys: str = 'P',
    fixed_star_orb: float = 1.0
):
    
    resting_data = get_seed_from_request(request, is_albedo=False)
    if not resting_data: return {"error": "Station is vacant."}

    data = resolve_seed_hydration(resting_data)

    # 🚀 [방역]: 데이터로부터 Time Unknown 플래그 추출
    # 0(정상) 또는 1(미상) 값을 불리언으로 변환하여 엔진에 전달합니다.
    is_unk = bool(data.get("is_time_unknown", 0))

    try:
        # 🔑 수복된 calculate_principia 호출 (is_time_unknown 인자 추가)
        result = engine_pkg.calculate_principia(
            date_str=str(data.get('birth_date', '2000-01-01')),
            time_str=str(data.get('birth_time', '12:00:00')),
            lat=data["lat"],
            lng=data["lng"],
            timezone=data["timezone"],
            system=system, 
            ayanamsa=ayanamsa, 
            view=view,
            h_sys=h_sys,
            fixed_star_orb=fixed_star_orb,
            is_time_unknown=is_unk  # 👈 수복된 엔진 인자 투입
        )
        
        # 🚀 [데이터 이관]: 프론트엔드 N2.js가 락(Lock)을 판단할 수 있도록 플래그 주입
        result['meta'].update({
            "name": data.get("name", "Unknown"),
            "coords": [data["lat"], data["lng"]],
            "h_sys": h_sys,
            "is_time_unknown": 1 if is_unk else 0  # 👈 JS 락 레이어용 데이터
        })
        return result
    except Exception as e:
        print(f"[STATION] ❌ Calculation Failed: {str(e)}")
        return {"error": str(e)}
    
# 🚀 [A4 연결]: Figura Endpoint 신설 (a4.js가 호출함)
@router.get("/figura/reading")
async def get_figura_reading(
    request: Request,
    lot_schema: str = 'paulus',
    h_sys: str = 'P'
):
    """
    A4 Module: FIGURA (Lots & Parts)
    Uses calculate_arcana engine but exposed as /figura/reading
    """
    resting_data = get_seed_from_request(request, is_albedo=True)
    if not resting_data: return {"error": "Station is vacant."}

    data = resolve_seed_hydration(resting_data)

    try:
        result = engine_pkg.calculate_arcana(
            date_str=str(data.get('birth_date', '2000-01-01')),
            time_str=str(data.get('birth_time', '12:00:00')),
            lat=data["lat"],
            lng=data["lng"],
            timezone=data["timezone"],
            lot_schema=lot_schema,
            h_sys=h_sys
        )
        return result
    except Exception as e:
        print(f"[FIGURA] ❌ Calculation Failed: {str(e)}")
        return {"error": str(e)}

@router.get("/arcana/reading")
async def get_arcana_reading(
    request: Request,
    lot_schema: str = 'paulus',
    h_sys: str = 'P'
):
    """
    N4 Module: ARCANA
    lot_schema: 'valens' | 'paulus'
    """
    resting_data = get_seed_from_request(request, is_albedo=False)
    if not resting_data: return {"error": "Station is vacant."}

    data = resolve_seed_hydration(resting_data)

    try:
        result = engine_pkg.calculate_arcana(
            date_str=str(data.get('birth_date', '2000-01-01')),
            time_str=str(data.get('birth_time', '12:00:00')),
            lat=data["lat"],
            lng=data["lng"],
            timezone=data["timezone"],
            lot_schema=lot_schema,
            h_sys=h_sys
        )
        return result
    except Exception as e:
        print(f"[ARCANA] ❌ Calculation Failed: {str(e)}")
        return {"error": str(e)}
    
@router.post("/davison")
async def calculate_davison(data: dict = Body(...)):
    """두 개의 시드를 결합하여 데이비슨 중점을 생성하고 원천 데이터를 보존합니다."""
    try:
        s1 = data.get('seed1')
        s2 = data.get('seed2')
        if not s1 or not s2: return {"error": "Two seeds are required for union."}

        davison_seed = calculate_davison_midpoint(s1, s2)
        davison_seed['seed1'] = s1
        davison_seed['seed2'] = s2
        
        return davison_seed

    except Exception as e:
        print(f"[DAVISON] ❌ Manifestation Failed: {e}")
        return {"error": str(e)}

@router.get("/coagulatio/reading")
async def get_coagulatio_reading(
    request: Request,
    method: str = 'composite',
    mode: str = 'normal',
    system: str = 'tropical',
    ayanamsa: str = 'lahiri',
    view: str = 'zodiac',
    h_sys: str = 'P',
    fixed_star_orb: float = 1.0  # 🚀 [수복]: 사용자 설정 Orb 파라미터 반영
):
    """Albedo Station 데이터를 해석하여 UI 규격으로 반환"""
    albedo_data = get_seed_from_request(request, is_albedo=True)
    if not albedo_data: return {"error": "Albedo Station is vacant."}

    # 엔진 강제 리로드 (최신 방역 및 로직 반영)
    import core.astrology.engine as engine_pkg

    # 1. Davison 분기 수복
    if method == 'davison':
        h_dav = resolve_seed_hydration(albedo_data.copy())
        is_unk = bool(h_dav.get("is_time_unknown", 0))
        
        # 🚀 [수복]: 연산 결과를 변수에 담아 meta 정보를 보강한 뒤 리턴합니다.
        result = engine_pkg.calculate_principia(
            date_str=str(h_dav.get('birth_date', '2000-01-01')),
            time_str=str(h_dav.get('birth_time', '12:00:00')),
            lat=h_dav["lat"],
            lng=h_dav["lng"],
            timezone=h_dav["timezone"],
            system=system, 
            ayanamsa=ayanamsa, 
            view=view, 
            h_sys=h_sys,
            fixed_star_orb=fixed_star_orb,
            is_time_unknown=is_unk
        )
        # 🔑 [Veil Sync]: JS가 인식할 수 있도록 meta에 플래그 강제 업데이트
        result['meta'].update({"is_time_unknown": 1 if is_unk else 0})
        return result

    # 2. Composite 분기
    s1_raw = albedo_data.get('seed1')
    s2_raw = albedo_data.get('seed2')
    if not s1_raw or not s2_raw: return {"error": "Raw seeds missing."}

    h1 = resolve_seed_hydration(s1_raw.copy())
    h2 = resolve_seed_hydration(s2_raw.copy())

    import core.astrology.composite as composite_pkg
    import core.astrology.domus as domus_pkg

    # 🚀 [수정]: 꼼수로 쓰던 calc_sys = 'tropical' 강제 변환 로직 삭제
    # 바로 넘어온 system 파라미터를 적용해서 부모 시드부터 Draconic/Ketunic 연산 수행
    def map_for_engine(hydrated):
        return {
            "date_str": str(hydrated.get('birth_date', '2000-01-01')),
            "time_str": str(hydrated.get('birth_time', '12:00:00')),
            "lat": hydrated["lat"],
            "lng": hydrated["lng"],
            "timezone": hydrated["timezone"],
            "system": system, # 👈 여기가 핵심 (calc_sys 대신 system 직접 투입)
            "ayanamsa": ayanamsa,
            "fixed_star_orb": fixed_star_orb, 
            "is_time_unknown": bool(hydrated.get("is_time_unknown", 0)) 
        }

    calc_h_sys = 'P'
    res1 = engine_pkg.calculate_principia(**map_for_engine(h1), h_sys=calc_h_sys)
    res2 = engine_pkg.calculate_principia(**map_for_engine(h2), h_sys=calc_h_sys)
    
    def clean_cusps(res):
        c_out = {}
        for k, v in res.get('houses', {}).items():
            val = float(v['longitude']) if isinstance(v, dict) else float(v)
            c_out[int(k)] = val
        return c_out

    cusps_a = clean_cusps(res1)
    cusps_b = clean_cusps(res2)

    composite_res = composite_pkg.calculate_composite_chart(
        res1['planets'], res2['planets'], cusps_a, cusps_b
    )
    comp_planets = composite_res['planets']
    comp_cusps = composite_res['houses']

    def enforce_shortest_arc(target_name, p_a, p_b, current_res):
        if target_name not in p_a or target_name not in p_b or target_name not in current_res: return
        lon_a = p_a[target_name]['longitude']
        lon_b = p_b[target_name]['longitude']
        curr_lon = current_res[target_name]['longitude']
        
        diff = abs(lon_a - lon_b)
        if diff > 180: mid = (lon_a + lon_b + 360) / 2
        else: mid = (lon_a + lon_b) / 2
        mid %= 360
        
        if abs(curr_lon - mid) > 90 and abs(curr_lon - mid) < 270:
            current_res[target_name]['longitude'] = (curr_lon + 180) % 360

    # ... (앞부분 동일) ...
    enforce_shortest_arc('Ascendant', res1['planets'], res2['planets'], comp_planets)
    enforce_shortest_arc('Midheaven', res1['planets'], res2['planets'], comp_planets)

    # 🚀 항성 결합 (시프트 이전에 물리적 실제 위치를 기준으로 먼저 계산)
    jd_ref = engine_pkg.get_julian_day(h1['birth_date'], h1['birth_time'], h1['timezone'])
    iflg = 0x0001 | 0x0100 
    if system == 'sidereal': iflg |= 0x10000
    active_stars = engine_pkg.calculate_all_star_positions(jd_ref, system, iflg)

    for key, p_data in comp_planets.items():
        p_data['fixed_stars'] = engine_pkg.check_star_conjunctions(p_data['longitude'], active_stars, fixed_star_orb)

    # 🚀 [순서 변경 2]: Shift 완료 후 Anti-Composite로 180도 플립
    if mode == 'anti':
        comp_planets, comp_cusps = composite_pkg.apply_anti_composite(comp_planets, comp_cusps)

    cusps_simple = {}
    for k, v in comp_cusps.items():
        val = float(v['longitude']) if isinstance(v, dict) else float(v)
        cusps_simple[int(k)] = val

    # 🚀 [글로벌 미상 플래그 확인]: 부모 시드 중 하나라도 미상인지 체크
    is_unk_global = bool(h1.get('is_time_unknown') or h2.get('is_time_unknown'))

    # 🚀 [수복 로직]: 시간이 정확하고 정상적인 12개의 하우스가 도출되었을 때만 할당 진행
    if not is_unk_global and len(cusps_simple) == 12:
        comp_planets = domus_pkg.assign_houses_to_planets(comp_planets, cusps_simple)
    else:
        # 시간이 없거나 하우스가 붕괴된 경우 기본값('-') 처리하여 KeyError 방지
        for p_key, p_val in comp_planets.items():
            p_val['house'] = '-'

    final_res = {
        "planets": {},
        "meta": res1.get("meta", {}), 
        "lords": {"day": "-", "hour": "-"}
    }
    
    # 최종 데이터 포맷팅
    for key, p_data in comp_planets.items():
        lon = p_data['longitude']
        sign_idx = int(lon / 30) % 12
        sign_name = TROPICAL_SIGNS[sign_idx]
        deg_in_sign = lon % 30
        
        # 🚀 [수복]: 컴포지트 연산으로 빈 껍데기가 된 행성에 Ruler와 Dignity 생명 불어넣기
        r_name, dig = restore_ruler_and_dignity(p_data.get('name', key), sign_idx)
        p_data['ruler'] = r_name
        p_data['dignity'] = dig
        
        found_house = str(p_data.get('house', '-'))
        
        formatted_planet = p_data.copy()
        formatted_planet.update({
            "dms": format_dms_pretty(lon),
            "sign": sign_idx,
            "is_anaretic": deg_in_sign >= 29.0,
            "duad": SYMBOL_MAP.get(get_duad(sign_name, deg_in_sign), "-"),
            "dodeca": SYMBOL_MAP.get(get_dodecatemoria(deg_in_sign), "-"),
            "decan": SYMBOL_MAP.get(get_decan(sign_name, deg_in_sign), "-"),
            "bound": SYMBOL_MAP.get(get_egyptian_bounds(sign_name, deg_in_sign), "-"),
            "sabian_index": get_sabian_index(lon),
            "solar_phase": None,
            "house": found_house
        })
        final_res["planets"][key] = formatted_planet

    final_res['meta'].update({
        "is_time_unknown": 1 if (h1.get('is_time_unknown') or h2.get('is_time_unknown')) else 0
    })

    return final_res

@router.post("/coagulatio/sync-active")
async def sync_active_albedo(request: Request, data: dict = Body(...)):
    return {"status": "success"}

# ---------------------------------------------------------
# [Endpoint: Domus (The FINAL FIX)]
# ---------------------------------------------------------
@router.get("/domus/reading")
async def get_domus_reading(
    request: Request,
    system: str = 'tropical', 
    ayanamsa: str = 'lahiri', 
    view: str = 'zodiac', 
    h_sys: str = 'P',
    fixed_star_orb: float = 1.0,
    lot_schema: str = 'paulus'
):
    resting_data = get_seed_from_request(request, is_albedo=False)
    if not resting_data: return {"error": "Station is vacant."}

    # 🔥 [Module Sanctuary]: 엔진 및 하위 모듈 Force Reload
    # 이것이 없으면 엔진 수정을 해도 옛날 로직이 돌아가서 Draconic Cusp가 안 바뀜
    import core.astrology.engine as engine_pkg
    import core.astrology.domus as domus_pkg
    import core.astrology.lagna as lagna_pkg

    data = resolve_seed_hydration(resting_data)

    try:
        # 1. Base Calculations (엔진이 Draconic Cusp 계산함)
        base_res = engine_pkg.calculate_principia(
            date_str=str(data.get('birth_date', '2000-01-01')),
            time_str=str(data.get('birth_time', '12:00:00')),
            lat=data["lat"], lng=data["lng"], timezone=data["timezone"],
            system=system, ayanamsa=ayanamsa, view='zodiac',
            h_sys=h_sys, fixed_star_orb=fixed_star_orb
        )

        # 🚀 [Dual Schema Logic]: Paulus와 Valens 두 가지 버전을 모두 계산
        # 1) Standard (Paulus)
        lots_res_std = engine_pkg.calculate_arcana(
            date_str=str(data.get('birth_date', '2000-01-01')),
            time_str=str(data.get('birth_time', '12:00:00')),
            lat=data["lat"], lng=data["lng"], timezone=data["timezone"],
            lot_schema='paulus', h_sys=h_sys, system=system, ayanamsa=ayanamsa
        )
        
        # 2) Secondary (Valens) - Eros/Necessity 추출용
        lots_res_val = engine_pkg.calculate_arcana(
            date_str=str(data.get('birth_date', '2000-01-01')),
            time_str=str(data.get('birth_time', '12:00:00')),
            lat=data["lat"], lng=data["lng"], timezone=data["timezone"],
            lot_schema='valens', h_sys=h_sys, system=system, ayanamsa=ayanamsa
        )

        # 3) Merge & Rename (소행성 'Eros'와의 충돌 방지 및 Dual Schema 적용)
        merged_lots = {}
        # 기본 Lot들에 "Lot of" 접두어 붙이기
        for k, v in lots_res_std.get('lots', {}).items():
            merged_lots[f"Lot of {k}"] = v 
        
        # Valens 버전 주입 (Eros, Necessity)
        if 'Eros' in lots_res_val['lots']:
            merged_lots['Lot of Eros (Valens)'] = lots_res_val['lots']['Eros']
        if 'Necessity' in lots_res_val['lots']:
            merged_lots['Lot of Necessity (Valens)'] = lots_res_val['lots']['Necessity']

        planets = base_res['planets']
        cusps = base_res['houses']

        # 🚀 [추가]: Draconic / Ketunic 시스템일 경우 교점(Nodes) 원천 삭제
        if system in ['draconic', 'ketunic']:
            for n_key in ['Rahu', 'Ketu', 'North Node (m)', 'South Node (m)', 'North Node (t)', 'South Node (t)']:
                planets.pop(n_key, None)

        # 🛠️ Sanitization (Cusps)
        def to_pure_float(val):
            if val is None: return 0.0
            if isinstance(val, dict): return float(val.get('longitude', val.get('value', 0.0)))
            try: return float(val)
            except: return 0.0

        cusps_simple = {int(k): to_pure_float(v) for k, v in cusps.items()}

        # 2. Call Modules
        # (Draconic으로 변환된 cusps_simple이 들어가므로, domus.py는 자동으로 시스템 반영됨)
        planets = domus_pkg.assign_houses_to_planets(planets, cusps_simple)
        domus_data = domus_pkg.analyze_house_ranges(cusps_simple)

        # 3. Jaimini (Sidereal Only)
        if system == 'sidereal':
            asc_lon = cusps_simple.get(1, 0.0)
            asc_sign_idx = int(asc_lon / 30) % 12
            lagnas = lagna_pkg.calculate_all_jaimini_padas(planets, cusps_simple, asc_sign_idx)
            for entry in domus_data:
                if entry['house_num'] in lagnas:
                    entry['lagna_info'] = lagnas[entry['house_num']]

        # 🔥 [Anaretic Injection]: 행성들에 Anaretic 플래그 추가 (29도 이상)
        for p_key, p_val in planets.items():
            if 'longitude' in p_val:
                deg_in_sign = p_val['longitude'] % 30
                p_val['is_anaretic'] = (deg_in_sign >= 29.0)

        # 4. Domain Sorting
        syzygy_data = lots_res_std.get('syzygy', {}).get('data')
        
        contents = domus_pkg.sort_contents_by_house(
            planets, 
            merged_lots,
            lots_res_std.get('vertex'),
            syzygy_data,
            cusps_simple
        )

        angle_keys = ["Ascendant", "Midheaven", "Descendant", "Immum Coeli"]
        angles_fs = {k: planets[k].get('fixed_stars', []) for k in angle_keys if k in planets}

        return {
            "meta": base_res['meta'],
            "domus": domus_data,
            "contents": contents,
            "angles_fs": angles_fs,
            "planets": planets
        }

    except Exception as e:
        print(f"[DOMUS] CRITICAL FAIL: {e}")
        import traceback
        traceback.print_exc()
        return {"error": str(e)}

@router.get("/ordinatio/reading")
async def get_ordinatio_reading(
    request: Request,
    system: str = 'tropical', 
    ayanamsa: str = 'lahiri', 
    view: str = 'zodiac', 
    h_sys: str = 'P',
    fixed_star_orb: float = 1.0,
    method: str = 'composite', 
    anti: str = 'off'          
):
    """
    A3 Module: ORDINATIO (Davison Vertex Fix & Composite Geometry)
    """
    albedo_data = get_seed_from_request(request, is_albedo=True)
    if not albedo_data: return {"error": "Station is vacant. Please run A1 first."}

    s1_raw = albedo_data.get('seed1')
    s2_raw = albedo_data.get('seed2')
    if not s1_raw or not s2_raw: return {"error": "Albedo seeds missing or corrupted."}

    seed_a = resolve_seed_hydration(s1_raw.copy())
    seed_b = resolve_seed_hydration(s2_raw.copy())

    import core.astrology.engine
    engine_pkg = core.astrology.engine
    
    import core.astrology.domus as domus_pkg
    import core.astrology.lagna as lagna_pkg
    import core.astrology.davison as davison_pkg
    import core.astrology.composite as composite_pkg

    try:
        final_planets = {}
        final_cusps = {}
        final_lots = {}
        final_syzygy = None
        
        # Vertex는 Davison에서만 존재 (Composite는 기하학적으로 Vertex 정의 불가)
        final_vertex = None 
        
        meta_info = {"method": method, "anti": anti, "system": system}

        # ════════════════════════════════
        # BRANCH A: DAVISON (With Vertex)
        # ════════════════════════════════
        if method == 'davison':
            davison_seed = davison_pkg.calculate_davison_midpoint(seed_a, seed_b)
            
            # Davison은 단일 시공간 차트이므로 Whole House('W') 직접 적용 가능
            base_res = engine_pkg.calculate_principia(
                date_str=davison_seed['birth_date'], time_str=davison_seed['birth_time'],
                lat=davison_seed['lat'], lng=davison_seed['lng'], timezone=davison_seed['timezone'],
                system=system, ayanamsa=ayanamsa, view='zodiac',
                h_sys=h_sys, fixed_star_orb=fixed_star_orb
            )
            
            # Lots Calculation
            lots_res_std = engine_pkg.calculate_arcana(
                date_str=davison_seed['birth_date'], time_str=davison_seed['birth_time'],
                lat=davison_seed['lat'], lng=davison_seed['lng'], timezone=davison_seed['timezone'],
                lot_schema='paulus', h_sys=h_sys, system=system, ayanamsa=ayanamsa
            )
            lots_res_val = engine_pkg.calculate_arcana(
                date_str=davison_seed['birth_date'], time_str=davison_seed['birth_time'],
                lat=davison_seed['lat'], lng=davison_seed['lng'], timezone=davison_seed['timezone'],
                lot_schema='valens', h_sys=h_sys, system=system, ayanamsa=ayanamsa
            )

            # Lots Merge
            for k, v in lots_res_std.get('lots', {}).items():
                final_lots[f"Lot of {k}"] = v
            if 'Eros' in lots_res_val['lots']:
                final_lots['Lot of Eros (Valens)'] = lots_res_val['lots']['Eros']
            if 'Necessity' in lots_res_val['lots']:
                final_lots['Lot of Necessity (Valens)'] = lots_res_val['lots']['Necessity']

            final_planets = base_res['planets']
            final_cusps = base_res['houses']
            final_syzygy = lots_res_std.get('syzygy', {}).get('data')
            
            # Vertex 딕셔너리 확보
            final_vertex = lots_res_std.get('vertex') 

        # ════════════════════════════════
        # BRANCH B: COMPOSITE (Shortest Arc Fixed & Shift Preserved)
        # ════════════════════════════════
        else:
            calc_h_sys = 'P' 
            # 🚀 [수정]: calc_sys 강제 할당 삭제, 부모 차트부터 요청받은 system으로 연산
            res_a = engine_pkg.calculate_principia(
                date_str=str(seed_a.get('birth_date')), time_str=str(seed_a.get('birth_time')),
                lat=seed_a["lat"], lng=seed_a["lng"], timezone=seed_a["timezone"],
                system=system, ayanamsa=ayanamsa, h_sys=calc_h_sys # 👈 system 파라미터 직결
            )
            res_b = engine_pkg.calculate_principia(
                date_str=str(seed_b.get('birth_date')), time_str=str(seed_b.get('birth_time')),
                lat=seed_b["lat"], lng=seed_b["lng"], timezone=seed_b["timezone"],
                system=system, ayanamsa=ayanamsa, h_sys=calc_h_sys # 👈 system 파라미터 직결
            )

            def clean_cusps(res):
                c_out = {}
                for k, v in res['houses'].items():
                    val = float(v['longitude']) if isinstance(v, dict) else float(v)
                    c_out[int(k)] = val
                return c_out
            cusps_a = clean_cusps(res_a)
            cusps_b = clean_cusps(res_b)

            composite_res = composite_pkg.calculate_composite_chart(
                res_a['planets'], res_b['planets'], cusps_a, cusps_b
            )
            final_planets = composite_res['planets']
            final_cusps = composite_res['houses']

            def enforce_shortest_arc(target_name, p_a, p_b, current_res):
                if target_name not in p_a or target_name not in p_b or target_name not in current_res: return
                lon_a = p_a[target_name]['longitude']
                lon_b = p_b[target_name]['longitude']
                curr_lon = current_res[target_name]['longitude']

                diff = abs(lon_a - lon_b)
                if diff > 180: mid = (lon_a + lon_b + 360) / 2
                else: mid = (lon_a + lon_b) / 2
                mid %= 360

                if abs(curr_lon - mid) > 90 and abs(curr_lon - mid) < 270:
                    current_res[target_name]['longitude'] = (curr_lon + 180) % 360

            enforce_shortest_arc('Ascendant', res_a['planets'], res_b['planets'], final_planets)
            enforce_shortest_arc('Midheaven', res_a['planets'], res_b['planets'], final_planets)

            # 🚀 [순서 변경 2]: Shift가 완료된 차트를 마지막에 Anti-Composite로 통째로 180도 뒤집습니다.
            if anti == 'on':
                final_planets, final_cusps = composite_pkg.apply_anti_composite(
                    final_planets, final_cusps
                )

            # Format Planets
            for p_key, p_val in final_planets.items():
                p_lon = p_val['longitude']
                sign_idx = int(p_lon / 30) % 12
                sign_name = engine_pkg.TROPICAL_SIGNS[sign_idx]

                deg_in_sign = p_lon % 30
                
                # 🚀 [수복]: Ruler & Dignity 재계산 후 주입
                r_name, dig = restore_ruler_and_dignity(p_val.get('name', p_key), sign_idx)
                p_val['ruler'] = r_name
                p_val['dignity'] = dig
                
                p_val.update({
                    "dms": engine_pkg.format_dms_pretty(p_lon),
                    "sign": sign_idx,
                    "duad": engine_pkg.SYMBOL_MAP.get(engine_pkg.get_duad(sign_name, deg_in_sign), "-"),
                    "dodeca": engine_pkg.SYMBOL_MAP.get(engine_pkg.get_dodecatemoria(deg_in_sign), "-"),
                    "decan": engine_pkg.SYMBOL_MAP.get(engine_pkg.get_decan(sign_name, deg_in_sign), "-"),
                    "bound": engine_pkg.SYMBOL_MAP.get(engine_pkg.get_egyptian_bounds(sign_name, deg_in_sign), "-"),
                    "sabian_index": engine_pkg.get_sabian_index(p_lon)
                })

        # ════════════════════════════════
        # COMMON: DOMUS ANALYSIS & SORTING
        # ════════════════════════════════
        cusps_simple = {}
        for k, v in final_cusps.items():
            val = float(v['longitude']) if isinstance(v, dict) else float(v)
            cusps_simple[int(k)] = val

        # 🚀 [방역]: 교점(Nodes) 원천 삭제 (시프트에 써먹었으니 이제 폐기)
        if system in ['draconic', 'ketunic']:
            for n_key in ['Rahu', 'Ketu', 'North Node (m)', 'South Node (m)', 'North Node (t)', 'South Node (t)']:
                final_planets.pop(n_key, None)

        # Assign Houses
        final_planets = domus_pkg.assign_houses_to_planets(final_planets, cusps_simple)
        
        # 🔥 [Anaretic Injection]: 행성들에 Anaretic 플래그 추가 (29도 이상)
        for p_key, p_val in final_planets.items():
            if 'longitude' in p_val:
                deg_in_sign = p_val['longitude'] % 30
                p_val['is_anaretic'] = (deg_in_sign >= 29.0)

        # Davison Vertex 하우스 할당 로직 안전화
        if final_vertex and isinstance(final_vertex, dict):
            for v_name, v_obj in final_vertex.items():
                if not isinstance(v_obj, dict) or 'longitude' not in v_obj:
                    continue
                
                v_lon = v_obj['longitude']
                
                found_house = 1
                for h_num in range(1, 13):
                    cur = cusps_simple[h_num]
                    nxt = cusps_simple[h_num+1] if h_num < 12 else cusps_simple[1]
                    
                    if cur < nxt:
                        if cur <= v_lon < nxt: 
                            found_house = h_num
                            break
                    else: 
                        if cur <= v_lon < 360 or 0 <= v_lon < nxt: 
                            found_house = h_num
                            break
                
                v_obj['house'] = found_house

        domus_data = domus_pkg.analyze_house_ranges(cusps_simple)

        # Jaimini (Sidereal + Davison Only)
        if system == 'sidereal' and method == 'davison':
            asc_lon = cusps_simple.get(1, 0.0)
            asc_sign_idx = int(asc_lon / 30) % 12
            lagnas = lagna_pkg.calculate_all_jaimini_padas(final_planets, cusps_simple, asc_sign_idx)
            for entry in domus_data:
                if entry['house_num'] in lagnas:
                    entry['lagna_info'] = lagnas[entry['house_num']]

        # Sorting Contents
        contents = domus_pkg.sort_contents_by_house(
            final_planets, 
            final_lots, 
            final_vertex, 
            final_syzygy,
            cusps_simple
        )

        # Extract Angles (Fixed Stars)
        angle_keys = ["Ascendant", "Midheaven", "Descendant", "Immum Coeli", "Asc.", "M.C.", "Dsc.", "I.C."]
        angles_fs = {}
        for k in angle_keys:
            if k in final_planets and 'fixed_stars' in final_planets[k]:
                norm_key = "Ascendant" if k.startswith("Asc") else ("Midheaven" if k.startswith("M.C") or k.startswith("Mid") else ("Descendant" if k.startswith("Dsc") or k.startswith("Des") else "Immum Coeli"))
                angles_fs[norm_key] = final_planets[k]['fixed_stars']

        return {
            "meta": meta_info,
            "domus": domus_data,
            "contents": contents,
            "angles_fs": angles_fs,
            "planets": final_planets
        }

    except Exception as e:
        import traceback
        traceback.print_exc()
        return {"error": str(e)}
    
# ---------------------------------------------------------
# [Endpoint: Schema (N5 Module)]
# ---------------------------------------------------------

@router.get("/theory/patterns/definitions")
async def get_pattern_definitions():
    print("[DEBUG] Fetching Pattern Definitions")
    try:
        with open('app/data/render/patterns.json', 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"[ERROR] Failed to load patterns.json: {e}")
        return {}

@router.get("/schema/reading")
async def get_schema_reading(
    request: Request,
    mode: str = 'unus',
    s1: str = 'tropical', 
    s2: str = 'draconic'
):
    print(f"[DEBUG] Schema Reading Request: mode={mode}, s1={s1}, s2={s2}")
    try:
        # 1. Station 데이터 확보 및 Hydration
        resting_data = get_seed_from_request(request, is_albedo=False)
        if not resting_data: 
            return {"error": "Station is vacant."}
        
        # 🚀 [방역]: Time Unknown 플래그 확보
        data = resolve_seed_hydration(resting_data.copy())
        is_time_unknown = bool(data.get("is_time_unknown", 0))

        lat = float(data.get("lat", 0.0))
        lng = float(data.get("lng", 0.0))
        tz = data.get("timezone", 0) 
        date_str = str(data.get('birth_date'))
        time_str = str(data.get('birth_time'))

        def get_bodies(sys_name, suffix=""):
            bodies = {}
            try:
                # Principia (Planets + Angles)
                p_res = engine_pkg.calculate_principia(
                    date_str=date_str, time_str=time_str,
                    lat=lat, lng=lng, timezone=tz,
                    system=sys_name, ayanamsa='lahiri', view='zodiac'
                )
                
                if 'planets' in p_res:
                    for k, v in p_res['planets'].items():
                        name = k
                        if 'North Node' in name or 'True Node' in name:
                            if '(m)' in name: continue 
                            name = 'Rahu'
                        elif 'South Node' in name:
                            if '(m)' in name: continue
                            name = 'Ketu'
                        elif 'Lilith' in name:
                            if '(mean)' in name: continue
                        elif name == 'Eros':
                            name = 'Asteroid Eros'
                        # 정규화
                        elif 'Descendant' in name: name = 'Dsc.'
                        elif 'Immum Coeli' in name: name = 'I.C.'
                        elif 'Midheaven' in name: name = 'M.C.'
                        elif 'Ascendant' in name: name = 'Asc.'
                        
                        bodies[name + suffix] = v['longitude']
                
                # 2. Arcana (Hermetic Lots 수복)
                l_res = engine_pkg.calculate_arcana(
                    date_str=date_str, time_str=time_str,
                    lat=lat, lng=lng, timezone=tz,
                    lot_schema='paulus', h_sys='P', system=sys_name, ayanamsa='lahiri'
                )
                if 'lots' in l_res:
                    for k, v in l_res['lots'].items():
                        # 🚀 [수복]: "Lot of Fortune" -> "Fortune" (JS 매칭)
                        clean_key = k.replace("Lot of ", "")
                        bodies[clean_key + suffix] = v['longitude']

                # 🚀 [수복]: 누락되었던 Vertex 추출
                if 'vertex' in l_res:
                    for k, v in l_res['vertex'].items():
                        bodies[k + suffix] = v['longitude']

                # 🚀 [수복]: 누락되었던 Syzygy 추출
                if 'syzygy' in l_res and l_res['syzygy'].get('data'):
                    bodies['Syzygy' + suffix] = l_res['syzygy']['data']['longitude']

                # 3. Arcana (Valens Variant 수복)
                try:
                    l_res_v = engine_pkg.calculate_arcana(
                        date_str=date_str, time_str=time_str,
                        lat=lat, lng=lng, timezone=tz,
                        lot_schema='valens', h_sys='P', system=sys_name, ayanamsa='lahiri'
                    )
                    if 'lots' in l_res_v:
                        for k, v in l_res_v['lots'].items():
                            if 'Necessity' in k or 'Eros' in k:
                                # 🚀 [수복]: Valens 버전도 이름 깎아서 (v) 부착
                                clean_key = k.replace("Lot of ", "")
                                bodies[f"{clean_key} (v){suffix}"] = v['longitude']
                except: pass 

            except Exception as ex:
                print(f"[ERROR] Body calculation failed for {sys_name}: {ex}")
            
            return bodies

        # 2. 모드별 데이터 병합
        bodies_data = {}
        if mode == 'unus':
            bodies_data = get_bodies(s1)
        else:
            bodies_data.update(get_bodies(s1, "_1"))
            bodies_data.update(get_bodies(s2, "_2"))

        # 🚀 [Filter]: Aspect Calculation Scope (User Request)
        calc_bodies = {}
        excluded_keywords = []
        
        # 🚀 [FIX]: Draconic / Ketunic 시스템일 경우 교점(Nodes) 원천 배제
        if mode == 'unus':
            if s1 in ['draconic', 'ketunic']:
                excluded_keywords.extend(['Rahu', 'Ketu', 'North Node (t)', 'South Node (t)'])
        else:
            if s1 in ['draconic', 'ketunic']:
                excluded_keywords.extend(['Rahu_1', 'Ketu_1', 'North Node (t)_1', 'South Node (t)_1'])
            if s2 in ['draconic', 'ketunic']:
                excluded_keywords.extend(['Rahu_2', 'Ketu_2', 'North Node (t)_2', 'South Node (t)_2'])

        for k, v in bodies_data.items():
            is_excluded = any(ex in k for ex in excluded_keywords)
            if not is_excluded:
                calc_bodies[k] = v

        # 3. 최적화된 기하학적 패턴 및 어스펙트 연산
        aspects = calculate_all_aspects(calc_bodies)
        patterns = find_patterns(aspects, mode=mode)
        
        # Intersectus Filter (기존 로직 유지)
        if mode == 'intersectus':
            aspects = [
                a for a in aspects 
                if (a['p1'].endswith('_1') and a['p2'].endswith('_2')) or 
                   (a['p1'].endswith('_2') and a['p2'].endswith('_1'))
            ]
            patterns = [
                p for p in patterns
                if any(k.endswith('_1') for k in p.values() if isinstance(k, str)) and
                   any(k.endswith('_2') for k in p.values() if isinstance(k, str))
            ]

        return clean_nans({
            "bodies": bodies_data, 
            "aspects": aspects, 
            "patterns": patterns,
            "meta": {
                "status": "V19_FILTERED", 
                "method": mode,
                "is_time_unknown": 1 if is_time_unknown else 0
            }
        })

    except Exception as e:
        import traceback
        traceback.print_exc()
        return {"error": str(e)}

@router.get("/aspectus/reading")
async def get_aspectus_reading(
    request: Request,
    mode: str = 'unus',
    method: str = 'composite', 
    s1: str = 'default', 
    s2: str = 'default'
):
    try:
        # 1. Albedo Station 무결성 확인
        station_data = get_seed_from_request(request, is_albedo=True)
        if not station_data or 'seed1' not in station_data:
            return {"error": "Albedo Station Empty"}

        raw_s1 = station_data['seed1']
        raw_s2 = station_data['seed2']

        # 🚀 [방역 1]: Hydration 및 Time Unknown 감지
        h1 = resolve_seed_hydration(raw_s1.copy())
        h2 = resolve_seed_hydration(raw_s2.copy())
        
        is_unk_1 = bool(h1.get("is_time_unknown", 0))
        is_unk_2 = bool(h2.get("is_time_unknown", 0))
        
        # Davison/Composite는 두 시드 중 하나라도 모르면 앵글을 신뢰할 수 없음
        global_is_unknown = 1 if (is_unk_1 or is_unk_2) else 0

        # 헬퍼 함수: 엔진 페이로드 생성
        def to_engine_payload(hydrated_seed, system):
            return {
                "date_str": str(hydrated_seed.get('birth_date')),
                "time_str": str(hydrated_seed.get('birth_time')),
                "lat": float(hydrated_seed.get('lat', 37.5665)),
                "lng": float(hydrated_seed.get('lng', 126.9780)),
                "timezone": float(hydrated_seed.get('timezone', 9.0)),
                "system": system,
                "ayanamsa": 'lahiri'
            }

        final_bodies = {}

        # ════════════════════════════════════════════════
        # CASE 1: UNUS (Tropical 고정 합성 데이터)
        # ════════════════════════════════════════════════
        if mode == 'unus':
            if method == 'davison':
                dav_raw = calculate_davison_midpoint(raw_s1, raw_s2)
                # Davison 중간 시드도 Hydration을 거쳐야 안전함
                dav_h = resolve_seed_hydration(dav_raw.copy())
                
                p = to_engine_payload(dav_h, 'tropical')
                res = engine_pkg.calculate_principia(**p)
                arc = engine_pkg.calculate_arcana(**p, lot_schema='paulus')
                
                # 1. 행성 (정문화 적용)
                final_bodies = {normalize_name(k): v['longitude'] for k, v in res.get('planets', {}).items()}
                
                # 2. 🚀 [수복]: Hermetic Lots 이름 깎기 (JS 매칭용)
                if 'lots' in arc:
                    for k, v in arc['lots'].items():
                        clean_key = k.replace("Lot of ", "") 
                        final_bodies[clean_key] = v['longitude']

                # 3. 🚀 [수복]: Vertex 및 Syzygy 데이터 누락 보강
                if 'vertex' in arc:
                    for k, v in arc['vertex'].items():
                        final_bodies[k] = v['longitude']
                if 'syzygy' in arc and arc['syzygy'].get('data'):
                    final_bodies['Syzygy'] = arc['syzygy']['data']['longitude']
                try:
                    arc_v = engine_pkg.calculate_arcana(**p, lot_schema='valens')
                    if 'lots' in arc_v:
                        for k, v in arc_v['lots'].items():
                            if 'Necessity' in k or 'Eros' in k:
                                clean_key = k.replace("Lot of ", "")
                                final_bodies[f"{clean_key} (v)"] = v['longitude']
                except: pass

            else:
                p1 = to_engine_payload(h1, 'tropical')
                p2 = to_engine_payload(h2, 'tropical')
                r1 = engine_pkg.calculate_principia(**p1)
                r2 = engine_pkg.calculate_principia(**p2)
                c_map = generate_composite_data(r1, r2)
                final_bodies = {normalize_name(k): lon for k, lon in c_map.items()}

        # ════════════════════════════════════════════════
        # CASE 2: INTERSECTUS (복합 시스템 교차 검증)
        # ════════════════════════════════════════════════
        else:
            def resolve_nexus(sys_str):
                if sys_str == 'composite': return None, 'tropical', 'composite'
                parts = sys_str.split('_')
                prefix = parts[0].lower()
                sys_name = parts[1].lower() if len(parts) > 1 else 'tropical'
                if prefix == 'd': return calculate_davison_midpoint(raw_s1, raw_s2), sys_name, 'principia'
                if prefix == 'a': return h1, sys_name, 'principia' # Hydrated S1
                if prefix == 'b': return h2, sys_name, 'principia' # Hydrated S2
                return h1, sys_name, 'principia'

            for i, s_val in enumerate([s1, s2], 1):
                target, sys_name, t_type = resolve_nexus(s_val)
                # target이 raw 딕셔너리일 경우를 대비해 한번 더 hydration 체크 (안전장치)
                target_h = resolve_seed_hydration(target.copy()) if isinstance(target, dict) else h1

                if t_type == 'composite':
                    ra = engine_pkg.calculate_principia(**to_engine_payload(h1, sys_name))
                    rb = engine_pkg.calculate_principia(**to_engine_payload(h2, sys_name))
                    bodies = {normalize_name(k): v for k, v in generate_composite_data(ra, rb).items()}
                else:
                    p = to_engine_payload(target_h, sys_name)
                    res = engine_pkg.calculate_principia(**p)
                    arc = engine_pkg.calculate_arcana(**p, lot_schema='paulus')
                    bodies = {normalize_name(k): v['longitude'] for k, v in res.get('planets', {}).items()}
                    
                    # 🚀 [수복]: Intersectus에서도 Lots 이름 깎기 적용
                    if 'lots' in arc:
                        for k, v in arc['lots'].items():
                            clean_key = k.replace("Lot of ", "")
                            bodies[clean_key] = v['longitude']
                    try:
                        arc_v = engine_pkg.calculate_arcana(**p, lot_schema='valens')
                        if 'lots' in arc_v:
                            for k, v in arc_v['lots'].items():
                                if 'Necessity' in k or 'Eros' in k:
                                    clean_key = k.replace("Lot of ", "")
                                    bodies[f"{clean_key} (v)"] = v['longitude']
                    except: pass
                
                for k, v in bodies.items(): final_bodies[f"{k}_{i}"] = v

        # 🚀 [Filter]: 사용자 요청대로 필터 목록 비움 (엔진 레벨 방역에 의존) + Node 필터링
        aspects_source = {}
        excluded_keywords = []
        
        if global_is_unknown:
            # 미상일 때 앵글/랏 어스펙트 계산 차단은 유지
            excluded_keywords.extend([
                "Asc.", "M.C.", "Dsc.", "I.C.", 
                "Lot of", "Eros (v)", "Vertex", "Syzygy", "Fortune", "Spirit", 
                "Necessity", "Eros (H)", "Courage", "Victory", "Nemesis"
            ])

        # 🚀 [FIX]: Draconic / Ketunic 시스템일 경우 교점(Nodes) 원천 배제
        if mode == 'intersectus':
            # A5의 파라미터는 'a_draconic', 'b_tropical' 형식이므로 잘라서 판별
            sys1 = s1.split('_')[1].lower() if '_' in s1 else 'tropical'
            sys2 = s2.split('_')[1].lower() if '_' in s2 else 'tropical'
            
            if sys1 in ['draconic', 'ketunic']:
                excluded_keywords.extend(['Rahu_1', 'Ketu_1', 'North Node (t)_1', 'South Node (t)_1'])
            if sys2 in ['draconic', 'ketunic']:
                excluded_keywords.extend(['Rahu_2', 'Ketu_2', 'North Node (t)_2', 'South Node (t)_2'])

        for k, v in final_bodies.items():
            is_excluded = any(ex in k for ex in excluded_keywords)
            if not is_excluded:
                aspects_source[k] = v

        # 3. 어스펙트 및 패턴 연산 (필터링된 소스 사용)
        all_aspects = calculate_all_aspects(aspects_source, mode=mode)
        all_patterns = find_patterns(all_aspects, mode=mode)

        if mode == 'intersectus':
            aspects = [
                a for a in all_aspects 
                if (a['p1'].endswith('_1') and a['p2'].endswith('_2')) or 
                   (a['p1'].endswith('_2') and a['p2'].endswith('_1'))
            ]
            patterns = []
            for p in all_patterns:
                p_keys = [p.get(f'p{i}') for i in range(1, 7) if p.get(f'p{i}') and p.get(f'p{i}') != '-']
                has_s1 = any(k.endswith('_1') for k in p_keys)
                has_s2 = any(k.endswith('_2') for k in p_keys)
                if has_s1 and has_s2:
                    patterns.append(p)
        else:
            aspects = all_aspects
            patterns = all_patterns

        return clean_nans({
            "bodies": final_bodies, # 전체 리스트 (앵글 포함, 위치 확인용)
            "aspects": aspects,     # 필터링됨 (앵글/랏 제외)
            "patterns": patterns,
            "meta": {
                "status": "V19_FILTERED", 
                "method": method,
                "is_time_unknown": global_is_unknown # 🚀 [Meta] UI 제어용 플래그
            }
        })

    except Exception as e:
        import traceback
        traceback.print_exc()
        return {"error": str(e)}
    
def normalize_name(name):
    if 'Node' in name: return 'Rahu' if 'North' in name else 'Ketu'
    if name == 'Eros': return 'Asteroid Eros'
    name_map = {"Ascendant": "Asc.", "Midheaven": "M.C.", "Descendant": "Dsc.", "Immum Coeli": "I.C.", "Lilith (mean)": "Mean Lilith"}
    return name_map.get(name, name)

# ---------------------------------------------------------
# [Endpoint: Divisio (N6 Module) - FINAL INTEGRATION]
# ---------------------------------------------------------
@router.get("/divisio/reading")
async def get_divisio_reading(
    request: Request,
    ayanamsa: str = 'lahiri'
):
    """
    N6 Divisio Module: [v19.2 Sanitas Logica]
    생시 미상(Time Unknown) 시 정밀도가 생명인 Varga(분점도) 연산을 차단합니다.
    """
    import importlib
    import sys

    try:
        resting_data = get_seed_from_request(request, is_albedo=False)
        if not resting_data: 
            return {"error": "Station is vacant."}
        
        import core.astrology.engine as engine_fresh
        
        # 1. 데이터 보정 및 방역 플래그 확보
        data = resolve_seed_hydration(resting_data)
        is_unk = bool(data.get("is_time_unknown", 0)) # 🚀 [방역]: 미상 여부 판별

        # 2. 엔진 실행
        result = engine_fresh.calculate_divisio(
            date_str=str(data.get('birth_date', '2000-01-01')),
            time_str=str(data.get('birth_time', '12:00:00')),
            lat=data["lat"], lng=data["lng"], timezone=data["timezone"],
            ayanamsa=ayanamsa
        )

        # 3. 🚀 [Varga Lockdown]: 미상일 경우 Varga 데이터를 삭제하여 프론트엔드 노출 차단
        varga_data = result['varga']
        if is_unk:
            varga_data = {} # 🔒 정밀 시간이 필요한 분점도 데이터 폐쇄

        return {
            "status": "success",
            "meta": {
                "name": data.get("name", "Unknown"),
                "ayanamsa": ayanamsa,
                "ayanamsa_value": result['meta']['val'],
                "is_time_unknown": 1 if is_unk else 0 # 🚀 JS UI 락 제어용 플래그
            },
            "data": {
                "harmonics": result['harmonics'],
                "varga": varga_data # 🚀 수복된 데이터 전달
            }
        }

    except Exception as e:
        import traceback
        traceback.print_exc()
        return {"error": str(e)}
    
# 🚀 [N6 필수 추가]: 이 부분이 없어서 프론트엔드가 데이터를 못 가져오고 있습니다.
@router.get("/theory/vargas/definitions")
async def get_varga_definitions():
    """N6 Module: Fetch Varga Definitions JSON"""
    try:
        # 파일 경로가 정확한지 확인해주세요 (app/data/render/vargas.json)
        with open('app/data/render/vargas.json', 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"[ERROR] Failed to load vargas.json: {e}")
        return {}


@router.get("/aspects/harmonic/{h_level}")
async def get_harmonic_aspects(h_level: int, body: str, request: Request):
    """
    N6 Module: Calculate aspects using pre-calculated harmonic positions.
    """
    try:
        resting_data = get_seed_from_request(request, is_albedo=False)
        if not resting_data: return {"aspects": []}

        import core.astrology.engine as engine_fresh
        
        data = resolve_seed_hydration(resting_data)
        
        # 1. Call calculate_divisio to get RAW harmonic positions
        # 🚀 사용자 요청대로 이미 계산된 로직을 재활용합니다.
        result = engine_fresh.calculate_divisio(
            date_str=str(data.get('birth_date', '2000-01-01')),
            time_str=str(data.get('birth_time', '12:00:00')),
            lat=data["lat"], lng=data["lng"], timezone=data["timezone"]
        )
        
        # 2. Extract Raw Floats for the requested H-Level
        raw_map = result.get('harmonics_raw', {})
        target_positions = {}
        
        target_key = f"H{h_level}"
        
        for name, h_data in raw_map.items():
            if target_key in h_data:
                target_positions[name] = h_data[target_key]

        if not target_positions:
            return {"aspects": []}

        # 3. Calculate Aspects
        from core.astrology.aspects import calculate_all_aspects
        all_aspects = calculate_all_aspects(target_positions)
        
        # 4. Filter for N5-compatible format
        # N5 expects: [{ aspect: 'Trine', target: 'Mars', orb: 1.2 }, ...]
        filtered = []
        for a in all_aspects:
            if a['p1'] == body:
                filtered.append({"aspect": a['aspect'], "target": a['p2'], "orb": a['orb']})
            elif a['p2'] == body:
                filtered.append({"aspect": a['aspect'], "target": a['p1'], "orb": a['orb']})
                
        return {"aspects": filtered}

    except Exception as e:
        print(f"[ASPECT ERROR] {e}")
        return {"aspects": []}

# ---------------------------------------------------------
# [Endpoint: Multiplicatio (A6 Module)]
# ---------------------------------------------------------

@router.get("/multiplicatio/reading")
async def get_multiplicatio_reading(request: Request, ayanamsa: str = 'lahiri'):
    """
    A6 Module: MULTIPLICATIO
    부모 시드 중 하나라도 미상일 경우 Varga 합성을 차단합니다.
    """
    request: Request
    try:
        albedo_data = get_seed_from_request(request, is_albedo=True)
        if not albedo_data: 
            return {"status": "retry", "message": "Station Warming Up"}

        import core.astrology.engine as engine_pkg
        
        # 1. 데이터 보정 및 합성 미상 여부 확인
        data = resolve_seed_hydration(albedo_data)
        
        # 🚀 [A6 방역]: Composite/Davison 시드 중 하나라도 Unknown이면 전체 락
        # resolve_seed_hydration 내부에서 이미 부모 시드들을 검사하여 is_time_unknown을 합산함
        is_unk = bool(data.get("is_time_unknown", 0))

        result = engine_pkg.calculate_divisio(
            date_str=str(data.get('birth_date', '2000-01-01')),
            time_str=str(data.get('birth_time', '12:00:00')),
            lat=float(data.get("lat", 37.5665)),
            lng=float(data.get("lng", 126.9780)),
            timezone=float(data.get("timezone", 9.0)),
            ayanamsa=ayanamsa
        )

        # 2. 🚀 [Varga Lockdown]: A6용 잠금 처리
        varga_data = result['varga']
        if is_unk:
            varga_data = {}

        return clean_nans({
            "status": "success",
            "meta": {
                "name": data.get("name", "Unknown") or "ALBEDO_CONIUNCTIO",
                "ayanamsa": ayanamsa,
                "ayanamsa_value": result['meta']['val'],
                "is_time_unknown": 1 if is_unk else 0 # 🚀 JS UI 락 제어용 플래그
            },
            "data": {
                "harmonics": result['harmonics'],
                "varga": varga_data
            }
        })

    except Exception as e:
        print(f"[A6 SANITAS FAIL] {str(e)}")
        return {"status": "retry", "message": str(e)}

@router.get("/aspects/harmonic/albedo/{h_level}")
async def get_harmonic_aspects_albedo(h_level: int, body: str, request: Request, ayanamsa: str = 'lahiri'):
    """
    A6 Module: Calculate aspects for Albedo Harmonic Chart.
    [v19.0 Absolute Defense]: Fallback parser for missing harmonics_raw.
    """
    try:
        # 1. Albedo Station 데이터 확보
        albedo_data = get_seed_from_request(request, is_albedo=True)
        if not albedo_data: 
            return {"aspects": [], "error": "No Albedo Session"}

        import core.astrology.engine as engine_pkg
        data = resolve_seed_hydration(albedo_data)
        
        # 2. 엔진 연산 (Ayanamsa 동적 할당)
        result = engine_pkg.calculate_divisio(
            date_str=str(data.get('birth_date', '2000-01-01')),
            time_str=str(data.get('birth_time', '12:00:00')),
            lat=float(data.get("lat", 37.5665)),
            lng=float(data.get("lng", 126.9780)),
            timezone=float(data.get("timezone", 9.0)),
            ayanamsa=ayanamsa 
        )
        
        # 3. 좌표 데이터 추출
        raw_map = result.get('harmonics_raw', {})
        target_positions = {}
        target_key = f"H{h_level}"
        
        # 🚀 [방어 로직 A]: harmonics_raw가 정상 존재할 경우
        if raw_map and any(target_key in v for v in raw_map.values()):
            for name, h_data in raw_map.items():
                if target_key in h_data:
                    target_positions[name] = float(h_data[target_key])
        else:
            # 🚀 [방어 로직 B]: raw가 증발했다면 텍스트를 정밀 분해해서 Float으로 강제 역산
            zodiac_map = {"Ari": 0, "Tau": 30, "Gem": 60, "Can": 90, "Leo": 120, "Vir": 150, 
                          "Lib": 180, "Sco": 210, "Sag": 240, "Cap": 270, "Aqu": 300, "Pis": 330}
            formatted_map = result.get('harmonics', {})
            import re
            
            for name, h_data in formatted_map.items():
                if target_key in h_data:
                    val_str = str(h_data[target_key])
                    match = re.search(r"([A-Za-z]{3})[a-z]*\s*(\d+)°(\d+)'?", val_str)
                    if match:
                        sign_abbr = match.group(1).capitalize()
                        deg = int(match.group(2))
                        minute = int(match.group(3))
                        base_deg = zodiac_map.get(sign_abbr, 0)
                        target_positions[name] = base_deg + deg + (minute / 60.0)

        if not target_positions:
            return {"aspects": [], "error": "Target positions extraction failed."}

        # 4. Aspect 계산
        from core.astrology.aspects import calculate_all_aspects
        all_aspects = calculate_all_aspects(target_positions)
        
        # 5. 천체 매칭 (대소문자 무시로 매칭 미스 원천 차단)
        filtered = []
        body_lower = body.lower()
        for a in all_aspects:
            if a['p1'].lower() == body_lower:
                filtered.append({"aspect": a['aspect'], "target": a['p2'], "orb": a['orb']})
            elif a['p2'].lower() == body_lower:
                filtered.append({"aspect": a['aspect'], "target": a['p1'], "orb": a['orb']})
                
        return clean_nans({"aspects": filtered})

    except Exception as e:
        print(f"[A6 ASPECT ERROR] {str(e)}")
        return {"aspects": [], "error": str(e)}

# 🚀 [N8 Fix]: 프론트엔드가 사비안 심볼 전체를 요청할 때 응답하는 창구
@router.get("/theory/sabian/definitions")
async def get_sabian_definitions():
    try:
        # 서버 내부의 실제 파일 경로에서 읽어서 JSON으로 반환
        with open('app/data/render/sabian.json', 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"[ERROR] Sabian JSON missing: {e}")
        return {}

# 🚀 [N8 Fix]: 아라빅 랏 정의 파일 배급소
@router.get("/theory/arabic/definitions")
async def get_arabic_definitions():
    try:
        with open('app/data/render/arabic_lots.json', 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"[ERROR] Arabic JSON missing: {e}")
        return {}

@router.get("/theory/asteroids/definitions")
async def get_asteroid_definitions():
    try:
        # asteroid_meanings.json 파일을 읽어서 반환
        with open('app/data/render/asteroid_meanings.json', 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"[ERROR] Asteroid Meanings JSON missing: {e}")
        return {}

@router.get("/codex/reading")
async def get_codex_reading(
    request: Request,
    ayanamsa: str = 'lahiri',
    dichotomy: str = 'traditional',
    orb: float = 1.5,
    h_sys: str = 'P'
):
    try:
        # 1. Station 데이터 확보
        resting_data = get_seed_from_request(request, is_albedo=False)
        if not resting_data: 
            return {"error": "Station is vacant."}

        # 2. 엔진 리로드 (안전장치)
        import core.astrology.constants as const_pkg
        import core.astrology.engine as engine_pkg

        # 3. 데이터 준비
        data = resolve_seed_hydration(resting_data)
        is_unk = bool(data.get("is_time_unknown", 0))

        # 4. Codex 연산 실행 (orb 파라미터 전달)
        codex_grid = engine_pkg.calculate_codex_tenebris(
            date_str=str(data.get('birth_date', '2000-01-01')),
            time_str=str(data.get('birth_time', '12:00:00')),
            lat=data["lat"],
            lng=data["lng"],
            timezone=data["timezone"],
            ayanamsa=ayanamsa,
            dichotomy=dichotomy,
            fixed_star_orb=orb,
            h_sys=h_sys,
            is_time_unknown=is_unk
        )
        
        # 5. 메타데이터와 함께 반환
        return {
            "status": "success",
            "meta": {
                "name": data.get("name", "Unknown"),
                "ayanamsa": ayanamsa,
                "dichotomy": dichotomy,
                "orb_used": orb,
                "h_sys": h_sys,
                "is_time_unknown": 1 if is_unk else 0
            },
            "grid": codex_grid 
        }

    except Exception as e:
        import traceback
        traceback.print_exc()
        return {"error": str(e)}

@router.get("/codex/lucis/reading")
async def get_codex_lucis_reading(
    request: Request,
    ayanamsa: str = Query('lahiri'),
    dichotomy: str = Query('traditional'),
    orb: float = Query(1.5),
    h_sys: str = Query('P') # 🚀 [필수]: 하우스 설정 수신
):
    try:
        station_data = get_seed_from_request(request, is_albedo=True)
        if not station_data: return {"error": "Albedo Station Empty"}

        # 1. Hydration (여기서 is_time_unknown, lat, lng 등이 보정됨)
        p_a = resolve_seed_hydration(station_data.get('seed1', {}).copy())
        p_b = resolve_seed_hydration(station_data.get('seed2', {}).copy())

        # 🛑 [여기에 들어갑니다! 보정 직후 데이터가 어떻게 오염됐는지 터미널에 출력]
        print("\n=== [HYDRATION CORRUPTION CHECK] ===")
        print(f"Seed A ({p_a.get('name')}): Date {p_a.get('birth_date')} | Time {p_a.get('birth_time')} | Lat {p_a.get('lat')} | Lng {p_a.get('lng')} | TZ {p_a.get('timezone')}")
        print(f"Seed B ({p_b.get('name')}): Date {p_b.get('birth_date')} | Time {p_b.get('birth_time')} | Lat {p_b.get('lat')} | Lng {p_b.get('lng')} | TZ {p_b.get('timezone')}")
        print("======================================\n")

        import core.astrology.engine as engine_pkg
        
        # 2. 엔진 호출 (Principia가 아닌 Lucis 호출)
        lucis_data = engine_pkg.calculate_codex_lucis(
            seed_data=clean_nans(p_a),
            partner_data=clean_nans(p_b),
            ayanamsa=ayanamsa, 
            dichotomy=dichotomy, 
            fixed_star_orb=orb,
            h_sys=h_sys # 👈 하우스 시스템 전달
        )

        return {
            "status": "success", 
            "grids": lucis_data,
            "meta": {"h_sys": h_sys}
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        return {"error": str(e)}

class C1PersonData(BaseModel):
    name: str; birth_date: str; birth_time: str; is_time_unknown: int; lat: float; lng: float; timezone: str

class C1Item(BaseModel):
    id: str; type: str; name: str; natal_data: Optional[C1PersonData] = None; p1: Optional[C1PersonData] = None; p2: Optional[C1PersonData] = None

class C1Request(BaseModel):
    items: List[Dict[str, Any]]; ayanamsa: str='lahiri'; dichotomy: str='traditional'; h_sys: str='P'; orb: float=1.5

# 🛠️ [Helper]: Robust Data Parser (Fixed in v19.0)
def parse_c1_data(raw: Dict[str, Any]) -> Dict[str, Any]:
    try:
        b_date = str(raw.get('birth_date', '2000-01-01')).strip()
        b_time = str(raw.get('birth_time', '12:00:00')).strip()
        b_date = re.sub(r'[./]', '-', b_date)
        if '-' in b_date:
            try: y, m, d = map(int, b_date.split('-'))
            except: y, m, d = 2000, 1, 1
        else: y, m, d = 2000, 1, 1
        try:
            parts = b_time.split(':'); h = int(parts[0]); min_ = int(parts[1]) if len(parts) > 1 else 0
        except: h, min_ = 12, 0
        lat = float(raw.get('lat', 0.0)); lng = float(raw.get('lng', 0.0))
        
        # 🚀 [FIX]: Timezone Auto-Detect
        raw_tz = raw.get('timezone')
        tz = 0.0
        try:
            tz = float(raw_tz)
        except (ValueError, TypeError):
            # Auto-detect using coordinates
            try:
                tz_name = tf.timezone_at(lng=lng, lat=lat)
                if tz_name:
                    dt = datetime(y, m, d)
                    tz = float(pytz.timezone(tz_name).utcoffset(dt).total_seconds() / 3600)
            except: tz = 0.0

        return {"year": y, "month": m, "day": d, "hour": h, "min": min_, "lat": lat, "lng": lng, "tz": tz, "is_time_unknown": raw.get("is_time_unknown", 0)}
    except Exception as e:
        print(f"[C1] Parse Error: {e} | Raw: {raw}")
        return {"year": 2000, "month": 1, "day": 1, "hour": 12, "min": 0, "lat": 0.0, "lng": 0.0, "tz": 0.0}

@router.post("/c1/calculate")
async def calculate_c1_tabula(payload: C1Request):
    try:
        import core.astrology.engine as engine_pkg;
        results = {}
        for item in payload.items:
            try:
                item_id = item.get('id'); item_type = item.get('type'); active_subs = item.get('active_subs', [])
                if not active_subs: continue
                if item_type == 'natal':
                    seed_data = parse_c1_data(item)
                    grid = engine_pkg.calculate_c1_natal(
                        seed_data=seed_data, ayanamsa=payload.ayanamsa, dichotomy=payload.dichotomy, h_sys=payload.h_sys, active_subs=active_subs, orb=payload.orb
                    )
                    results[item_id] = grid
                elif item_type == 'conjunction':
                    p1_raw = item.get('p1'); p2_raw = item.get('p2')
                    if not p1_raw or not p2_raw: continue
                    p1_data = parse_c1_data(p1_raw); p2_data = parse_c1_data(p2_raw)
                    grid = engine_pkg.calculate_c1_conjunction(
                        p1_data=p1_data, p2_data=p2_data, ayanamsa=payload.ayanamsa, dichotomy=payload.dichotomy, h_sys=payload.h_sys, active_subs=active_subs, orb=payload.orb
                    )
                    results[item_id] = grid
            except Exception as inner_e:
                print(f"[C1] Engine Error {item.get('name')}: {inner_e}"); import traceback; traceback.print_exc(); continue
        return {"results": results}
    except Exception as e: return {"error": str(e)}

# app/api/astrology.py (파일 맨 아래 함수 교체)

# ════════════════════════════════════════════════════════
# N9: CHRONOMANTIA ENDPOINT (Zombie Engine Fix)
# ════════════════════════════════════════════════════════
@router.post("/chronomantia/timeline")
async def get_chronomantia_timeline(
    seed: dict = Body(..., embed=True),
    mode: str = Body(..., embed=True),
    ayanamsa: str = Body("lahiri", embed=True)
):
    try:
        # 🚀 [CORE FIX]: 엔진 모듈 강제 새로고침 (Hot Reload)
        # 이것이 없으면 수정한 engine.py의 로직(Hover 데이터 생성 등)이 반영되지 않습니다.
        import core.astrology.engine as engine_pkg
        
        # 🚀 [DATA STREAM]: 엔진에서 계산된 meta(natal_planets 포함)와 timeline을 그대로 반환
        result = engine_pkg.calculate_n9_timeline(seed, mode, ayanamsa)
        
        return {
            "status": "success", 
            "data": result 
            # result 구조: { "meta": { "natal_planets": {...} }, "timeline": [...] }
        }
        
    except Exception as e:
        print(f"❌ [N9 Router Error]: {str(e)}")
        import traceback
        traceback.print_exc()
        # 프론트엔드가 에러를 우아하게 처리하도록 500 대신 에러 메시지 반환 가능
        # 하지만 명확한 디버깅을 위해 500 유지
        raise HTTPException(status_code=500, detail=f"Chronomantia Calculation Failed: {str(e)}")
    
# ════════════════════════════════════════════════════════
# A9: SYNCHRONICUM ENDPOINT (Albedo Standard GET)
# ════════════════════════════════════════════════════════
@router.get("/synchronicum/reading")
async def get_synchronicum_reading(
    request: Request,
    mode: str = Query("zodiac"),
    subMode: str = Query("davison"),
    ayanamsa: str = Query("lahiri")
):
    try:
        import core.astrology.engine as engine_pkg

        # 🚀 [ALBEDO FIX]: 프론트엔드가 보내는 N1 시드를 무시하고, 서버의 Albedo Station에서 A1 합성 시드를 꺼냅니다.
        albedo_data = get_seed_from_request(request, is_albedo=True)
        if not albedo_data or 'seed1' not in albedo_data:
            return {"error": "Albedo Station is vacant. Please run A1 first."}

        # 엔진 호출
        result = engine_pkg.calculate_a9_synchronicum(
            seed_data=albedo_data,
            mode=mode,
            subMode=subMode,
            ayanamsa=ayanamsa
        )
        return result

    except Exception as e:
        import traceback
        traceback.print_exc()
        return {"status": "error", "message": str(e)}

# ════════════════════════════════════════════════════════
# A10: RESONANTIA ENDPOINT (v3.3 Tooltip Name & Time Unknown Fix)
# ════════════════════════════════════════════════════════
@router.get("/resonantia/reading")
async def get_resonantia_reading(
    request: Request,
    system: str = Query('tropical'),
    ayanamsa: str = Query('lahiri'),
    mode: str = Query('composite'), 
    anti: str = Query('off'),        # 🚀 [추가]: 프론트엔드의 Anti-Composite 토글 상태 수신
    category: str = Query('planets'),
    h_sys: str = Query('P')
):
    try:
        import core.astrology.engine as engine_pkg

        # 1. Albedo Station 무결성 확인
        albedo_data = get_seed_from_request(request, is_albedo=True)
        if not albedo_data or 'seed1' not in albedo_data:
            return {"error": "Albedo Station is vacant."}

        s1_raw = albedo_data['seed1']
        s2_raw = albedo_data['seed2']

        # 2. Hydration 및 미상(Unknown) 방역
        h1 = resolve_seed_hydration(s1_raw.copy())
        h2 = resolve_seed_hydration(s2_raw.copy())
        
        global_is_unknown = 1 if (h1.get("is_time_unknown") or h2.get("is_time_unknown")) else 0

        dav_raw = calculate_davison_midpoint(s1_raw, s2_raw)
        dav_h = resolve_seed_hydration(dav_raw.copy())

        # 🚀 [수정]: Time Unknown 상태를 감지하여 텍스트 강제 변환
        def get_natal_str(h):
            date_str = str(h.get('birth_date', '2000-01-01'))
            if int(h.get('is_time_unknown', 0)) == 1:
                return f"{date_str}, Time Unknown"
                
            time_str = str(h.get('birth_time', '12:00:00'))[:5] # 초(ss) 제거
            return f"{date_str}, {time_str}"
            
        info_a = get_natal_str(h1)
        info_b = get_natal_str(h2)
        info_dav = get_natal_str(dav_h)

        # 3. 페이로드 생성
        def to_payload(h):
            return {
                "date_str": str(h.get('birth_date', '2000-01-01')),
                "time_str": str(h.get('birth_time', '12:00:00')),
                "lat": float(h.get('lat', 0.0)),
                "lng": float(h.get('lng', 0.0)),
                "timezone": float(h.get('timezone', 0.0)),
                "system": system,
                "ayanamsa": ayanamsa,
                "h_sys": h_sys,
                "is_time_unknown": int(h.get("is_time_unknown", 0))
            }

        p1 = to_payload(h1)
        p2 = to_payload(h2)
        p_dav = to_payload(dav_h)

        # 🚀 [수복]: Anti-composite 상태일 경우 엔진이 인식할 수 있도록 모드 이름 변환
        engine_mode = "anticomposite" if (mode == 'composite' and anti == 'on') else mode

        # 4. 엔진 호출 (mode 대신 engine_mode 전달)
        matrix_data = engine_pkg.calculate_resonantia_matrix(p1, p2, p_dav, engine_mode, category, h_sys=h_sys)

        return clean_nans({
            "status": "success",
            "data": matrix_data,
            "meta": {
                "is_time_unknown": global_is_unknown,
                "is_time_unknown_a": int(h1.get("is_time_unknown", 0)),
                "is_time_unknown_b": int(h2.get("is_time_unknown", 0)),
                "is_time_unknown_dav": global_is_unknown,
                "h_sys": h_sys,
                "info_a": info_a,
                "info_b": info_b,
                "info_davison": info_dav # 🚀 JS 배열과 일치하도록 info_davison으로 키 이름 수정!
            }
        })

    except Exception as e:
        import traceback
        traceback.print_exc()
        return {"error": str(e)}

# ════════════════════════════════════════════════════════
# N7: HYPOSTASES ENDPOINT (Persona Matrix Integration)
# ════════════════════════════════════════════════════════
@router.get("/hypostases/reading")
async def get_hypostases_reading(
    request: Request,
    category: str = Query('planets'),
    system: str = Query('tropical'),
    ayanamsa: str = Query('lahiri'),
    h_sys: str = Query('P')
):
    try:
        # 1. Station 데이터 확보 및 무결성 확인
        resting_data = get_seed_from_request(request, is_albedo=False)
        if not resting_data: 
            return {"error": "Station is vacant."}

        # 2. 엔진 리로드 (안전장치 및 최신 로직 강제 반영)
        import core.astrology.engine as engine_pkg

        # 3. 데이터 보정 및 방역 (Time Unknown 플래그 등 확보)
        data = resolve_seed_hydration(resting_data.copy())
        is_unk = bool(data.get("is_time_unknown", 0))

        # 4. 타겟 리스트 매핑 (N7 규격)
        TARGET_MAP = {
            "planets": ["Sun (Natal)", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune", "Pluto"],
            "asteroids": ["Chiron", "Ceres", "Juno", "Pallas", "Vesta", "Asteroid Eros", "Psyche"],
            "lilith": ["Mean Lilith", "True Lilith", "Asteroid Lilith", "North Node (t)", "Rahu", "South Node (t)", "Ketu"],
            "fates": ["Moira", "Klotho", "Lachesis", "Atropos"],
            "angles": ["Ascendant", "Immum Coeli", "Descendant", "Midheaven"],
            "hermetic": ["Fortune", "Spirit", "Necessity", "Necessity (v)", "Eros", "Eros (v)", "Courage", "Victory", "Nemesis", "Vertex", "Syzygy"]
        }
        targets = TARGET_MAP.get(category, TARGET_MAP["planets"])

        # 5. 중앙 엔진 연산 호출 (engine.py에 추가한 calculate_hypostases_matrix)
        matrix_data = engine_pkg.calculate_hypostases_matrix(
            natal_seed=data,
            targets=targets,
            system=system,
            ayanamsa=ayanamsa,
            h_sys=h_sys
        )

        # 6. 결과 반환 (clean_nans 및 메타데이터 포함)
        return clean_nans({
            "status": "success",
            "category": category,
            "system": system,
            "data": matrix_data,
            "meta": {
                "name": data.get("name", "Unknown"),
                "h_sys": h_sys,
                "ayanamsa": ayanamsa,
                "is_time_unknown": 1 if is_unk else 0 # 🚀 JS UI 락 제어용 플래그
            }
        })

    except Exception as e:
        import traceback
        traceback.print_exc()
        return {"error": str(e)}

@router.get("/evocationes/reading")
async def get_evocationes_reading(
    request: Request,
    category: str = Query('planets'),
    system: str = Query('tropical'),
    ayanamsa: str = Query('lahiri'),
    h_sys: str = Query('P')
):
    try:
        # 1. Albedo Station 데이터 확보
        albedo_data = get_seed_from_request(request, is_albedo=True)
        if not albedo_data or 'seed1' not in albedo_data:
            return {"error": "Albedo Station is vacant."}

        import core.astrology.engine as engine_pkg
        import core.astrology.davison as davison_pkg
        import importlib

        # 2. 🚀 A1 두 사람의 데이터를 가져와 Davison(Coniunctio) 시드로 합성
        s1_raw = albedo_data['seed1']
        s2_raw = albedo_data['seed2']
        dav_raw = davison_pkg.calculate_davison_midpoint(s1_raw, s2_raw)
        
        # Davison 시드를 엔진이 먹을 수 있게 Hydration 및 방역
        dav_hydrated = resolve_seed_hydration(dav_raw.copy())
        is_unk = bool(dav_hydrated.get("is_time_unknown", 0))

        # 3. 타겟 리스트 매핑 (N7과 완벽히 동일)
        TARGET_MAP = {
            "planets": ["Sun (Natal)", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune", "Pluto"],
            "asteroids": ["Chiron", "Ceres", "Juno", "Pallas", "Vesta", "Asteroid Eros", "Psyche"],
            "lilith": ["Mean Lilith", "True Lilith", "Asteroid Lilith", "North Node (t)", "Rahu", "South Node (t)", "Ketu"],
            "fates": ["Moira", "Klotho", "Lachesis", "Atropos"],
            "angles": ["Ascendant", "Immum Coeli", "Descendant", "Midheaven"],
            "hermetic": ["Fortune", "Spirit", "Necessity", "Necessity (v)", "Eros", "Eros (v)", "Courage", "Victory", "Nemesis", "Vertex", "Syzygy"]
        }
        targets = TARGET_MAP.get(category, TARGET_MAP["planets"])

        # 4. 🚀 N7이 쓰던 중앙 엔진 연산(hypostases_matrix)에 Davison 시드를 밀어넣어 재활용!
        matrix_data = engine_pkg.calculate_hypostases_matrix(
            natal_seed=dav_hydrated,
            targets=targets,
            system=system,
            ayanamsa=ayanamsa,
            h_sys=h_sys
        )

        return clean_nans({
            "status": "success",
            "category": category,
            "system": system,
            "data": matrix_data,
            "meta": {
                "name": "CONIUNCTIO", # A7 화면에 표시될 이름
                "h_sys": h_sys,
                "ayanamsa": ayanamsa,
                "is_time_unknown": 1 if is_unk else 0 
            }
        })

    except Exception as e:
        import traceback
        traceback.print_exc()
        return {"error": str(e)}

from pydantic import BaseModel

# 프론트엔드에서 넘어오는 C2 Aleph 데이터 규격 검증용 스키마
class AlephRequest(BaseModel):
    date: str
    lat: float
    lng: float
    timezone: str = "UTC"

@router.post("/citrinitas/aleph/scan")
async def scan_aleph_rectification(payload: AlephRequest):
    """
    [C2: HORA OCCULTA] [ א ] Aleph - Planetary Lord Rectification
    프론트엔드의 좌표와 날짜를 받아 하루 전체를 스캔하고 플래그를 반환합니다.
    """
    import sys
    import importlib
    import traceback
    
    try:
        
        import core.astrology.rectification as rect_pkg
        import core.astrology.engine as engine_pkg
        
        # 엔진이 먹기 좋게 딕셔너리 형태로 조립
        seed_data = {
            "date": payload.date,
            "lat": payload.lat,
            "lng": payload.lng,
            "timezone": payload.timezone
        }
        
        # C2 Aleph 엔진 호출
        result = engine_pkg.calculate_c2_aleph(seed_data)
        
        if "error" in result:
            return {"error": result["error"]}
            
        return result
        
    except Exception as e:
        print(f"❌ [C2 ALEPH ROUTER] Error: {e}")
        traceback.print_exc()
        return {"error": str(e)}
    
class MemScanRequest(BaseModel):
    date: str
    lat: float
    lng: float
    timezone: str
    age: int

@router.post("/citrinitas/mem/scan")
async def scan_citrinitas_mem(req: MemScanRequest):
    import traceback
    
    try:
        # 🚨 미친 무한 재부팅 루프의 원인이었던 del sys.modules 강제 갱신 삭제 완료 🚨
        from app.core.astrology.engine import calculate_c2_mem
        
        result = calculate_c2_mem(req.dict())
        
        if result.get("status") == "error":
            raise Exception(result.get("error"))
            
        return result
        
    except Exception as e:
        print(f"❌ [C2 MEM ROUTER] Error: {e}")
        traceback.print_exc()
        from fastapi import HTTPException
        raise HTTPException(status_code=500, detail=str(e))

class ShinScanRequest(BaseModel):
    date: str
    timezone: str
    time_blocks: List[Dict[str, Any]]  # 스캔 대상이 될 시간대 배열 (24h or 필터링된 블록)

@router.post("/citrinitas/shin/scan")
async def scan_citrinitas_shin(req: ShinScanRequest):
    import traceback
    
    try:
        from app.core.astrology.engine import calculate_c2_shin
        
        result = calculate_c2_shin(req.dict())
        
        if "error" in result:
            return {"error": result["error"]}
            
        return clean_nans(result)
        
    except Exception as e:
        print(f"❌ [C2 SHIN ROUTER] Error: {e}")
        traceback.print_exc()
        return {"error": str(e)}

from app.core.astrology.c3_illumination import calculate_ruach

class RuachRequest(BaseModel):
    phase1_answers: Dict[str, str]  # 예: {"q1": "A", "q2": "Shin", "q3": "ROLL_DICE"}
    phase2_answers: List[str]       # 예: ["Mars", "Venus", "Moon"]

@router.post("/citrinitas/ruach/reveal")
async def reveal_ruach_ritual(req: RuachRequest):
    """
    [ ר ] C3 RUACH 엔드포인트
    천체력 연산 없이, 순수 무의식 가중치와 백엔드 RNG(다이스)만을 사용하여 최종 룬을 반환합니다.
    """
    payload = {
        "phase1_answers": req.phase1_answers,
        "phase2_answers": req.phase2_answers
    }
    
    try:
        result = calculate_ruach(payload) # [cite: 7, 9]
        
        # ==========================================
        # 🔮 콘솔 로깅 (CMD 실시간 모니터링)
        # ==========================================
        print("\n" + "═"*55)
        print(" 🔮 [ C3 : RUACH ] RITUAL REVEAL TRIGGERED 🔮")
        print("═"*55)
        print(f" 📥 [USER INPUT] Phase 1 (Mother): {req.phase1_answers}")
        print(f" 📥 [USER INPUT] Phase 2 (Planet): {req.phase2_answers}")
        print("-" * 55)
        
        # 엔진에서 계산된 가중치 점수 및 타이브레이커 로그 출력
        debug_scores = result.get("debug_scores", {})
        print(f" ⚖️  [WEIGHTS] Mother Scores: {debug_scores.get('mother_scores')}")
        print(f" ⚖️  [WEIGHTS] Planet Scores: {debug_scores.get('planet_scores')}")
        print(f" 🎲 [TIE-BREAKER] Tool Used:   {result.get('tie_breaker_log')}")
        print("-" * 55)
        
        print(f" ✨ [RESULT] Mother: {result.get('winning_mother')} | Planet: {result.get('winning_planet')}")
        print(f" 📜 [FINAL RUNE] {result.get('final_rune')} (Num: {result.get('numerology')})")
        print("═"*55 + "\n")
        
        return result
        
    except Exception as e:
        print(f"\n ❌ [ERROR] Ruach Engine Failed: {str(e)}\n")
        return {"error": f"Ruach Engine Failed: {str(e)}"}

from app.core.astrology.c3_illumination import calculate_nefesh_phase1, calculate_nefesh_reveal
from pydantic import BaseModel
from typing import Dict, List, Optional

# ==========================================
# [ C4 : NEFESH ] Request Models
# ==========================================
class NefeshPhase1Request(BaseModel):
    answers: Dict[str, str]

class NefeshRevealRequest(BaseModel):
    answers: Dict[str, str]
    winning_purushartha: Optional[str] = None       # 🚀 프론트에서 보낸 1차 결과
    valid_numerology_keys: Optional[List[str]] = None # 🚀 프론트에서 보낸 수비학 번호표

# ==========================================
# 1. Phase 1: Purushartha 필터링 라우터
# ==========================================
@router.post("/citrinitas/nefesh/phase1")
async def phase1_nefesh_ritual(req: NefeshPhase1Request):
    payload = {"answers": req.answers}
    try:
        result = calculate_nefesh_phase1(payload)
        
        print("\n" + "═"*55)
        print(" 🔮 [ C3 : NEFESH ] PHASE 1 (PURUSHARTHA) TRIGGERED")
        print("═"*55)
        print(f" 📥 [USER INPUT] Phase 1: {req.answers}")
        print(f" ⚖️  [WINNER] Purushartha: {result.get('winning_purushartha')}")
        print(f" 🔢 [SURVIVORS] Valid Numerology Keys: {result.get('valid_numerology_keys')}")
        print("═"*55 + "\n")
        
        return result
    except Exception as e:
        print(f"\n ❌ [ERROR] Nefesh Phase 1 Failed: {str(e)}\n")
        return {"error": str(e)}

# ==========================================
# 2. Phase 2 & 3: 최종 Reveal 라우터
# ==========================================
@router.post("/citrinitas/nefesh/reveal")
async def reveal_nefesh_ritual(req: NefeshRevealRequest):
    # 🚀 이제 프론트가 보낸 Kama를 버리지 않고 안전하게 전달합니다.
    payload = {
        "answers": req.answers,
        "winning_purushartha": req.winning_purushartha,
        "valid_numerology_keys": req.valid_numerology_keys
    }
    try:
        result = calculate_nefesh_reveal(payload)
        debug_scores = result.get("debug_scores", {})
        puru_scores = debug_scores.get("purushartha_scores", {})
        num_scores = debug_scores.get("numerology_scores", {})
        
        print("\n" + "═"*60)
        print(" 🔮 [ C3 : NEFESH ] RITUAL REVEAL TRIGGERED 🔮")
        print("═"*60)
        print(f" 📥 [USER TOTAL INPUT]: {req.answers}")
        print("-" * 60)
        print(f" ⚖️  [PHASE 1 WEIGHTS] Purushartha: {puru_scores}")
        print(f" ⚖️  [PHASE 2 WEIGHTS] Numerology:  {num_scores}")
        print("-" * 60)
        print(f" 🎯 [FILTER 1] Purushartha: {result.get('main_purushartha')}")
        print(f" 🎯 [FILTER 2] Numerology:  {result.get('numerology_number')} (Internal Key: {result.get('numerology_key')})")
        print(f" 🎲 [FAKE RNG] Pada Roll:   Pada {result.get('pada_num')} ({result.get('pada_purushartha')} / {result.get('pada_planet')})")
        print("-" * 60)
        print(f" ✨ [RESULT] Nakshatra: {result.get('nakshatra')}")
        print(f" 📜 [SABIAN] {result.get('sabian_key')} : {result.get('sabian_text_ko')}")
        print("═"*60 + "\n")
        
        return result
    except Exception as e:
        print(f"\n ❌ [ERROR] Nefesh Reveal Engine Failed: {str(e)}\n")
        return {"error": str(e)}

from core.astrology.c3_illumination import calculate_chayah_reveal

# 파일 상단 Pydantic 모델 모음 영역에 추가
class ChayahRevealRequest(BaseModel):
    answers: Dict[str, str] = {}

# (주의: 파일 상단 import 부분에 c3_illumination에서 calculate_chayah_reveal을 불러오도록 추가해야 합니다)
# from core.astrology.c3_illumination import calculate_chayah_reveal

# ---------------------------------------------------------
# 파일 하단 라우터 영역에 추가
# ---------------------------------------------------------
@router.post("/citrinitas/chayah/reveal")
def chayah_ritual_reveal(req: ChayahRevealRequest):
    payload = {
        "answers": req.answers
    }
    try:
        result = calculate_chayah_reveal(payload)
        
        # 터미널 디버깅용 예쁜 로그 출력
        print("\n" + "═"*60)
        print(" 🌌 [ C3 : CHAYAH ] ORACLE OF STARS TRIGGERED 🌌")
        print("═"*60)
        print(f" 📥 [USER TOTAL INPUT]: {req.answers}")
        print("-" * 60)
        print(f" 🎯 [STATUS]: {result.get('status')}")
        
        if result.get('status') == 'needs_tiebreaker':
            print(f" ⚠️ [TIE-BREAKER NEEDED]: {result.get('type')}")
            print(f" 🔗 [CANDIDATES]: {result.get('candidates')}")
        elif result.get('status') == 'success':
            print(f" 🌟 [FINAL STAR]: {result.get('final_star')} (Graha: {result.get('final_graha')})")
            print(f" ⚙️ [DEBUG INFO]: {result.get('debug')}")
        elif result.get('status') == 'bad_end':
            print(f" 💀 [BAD ENDING TRIPPED] Minus Stack Reached 10")
            
        print("═"*60 + "\n")
        
        return result
    except Exception as e:
        print(f"Chayah Reveal Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import importlib # 🚀 [필수]: 모듈 강제 새로고침 도구

class NeshamahDrawRequest(BaseModel):
    tool: str                           
    spread_type: Optional[str] = None   
    count: Optional[int] = 1            

@router.post("/citrinitas/neshamah/draw")
async def draw_neshamah_tools(req: NeshamahDrawRequest):
    try:
        # 🚀 [핵심 방역]: FastAPI가 옛날 코드를 실행하지 못하도록 엔진을 강제로 최신화합니다.
        import core.astrology.c3_illumination as ill_pkg
        
        # 명칭 정규화
        engine_tool = req.tool
        if engine_tool == "astro_dice": engine_tool = "dice"
        if engine_tool == "witchs_rune": engine_tool = "rune"

        # 🚀 강제 새로고침된 최신 엔진(메이저 전용 로직이 포함된 버전)을 호출합니다.
        result = ill_pkg.NeshamahDivinationEngine.draw(
            tool=engine_tool,
            spread_type=req.spread_type,
            count=req.count
        )
        
        if result.get("status") == "error":
            print(f"\n ❌ [ERROR] Neshamah Engine Failed: {result.get('message')}\n")
            return result
        
        print("\n" + "═"*60)
        print(" 🔮 [ C3 : NESHAMAH ] DIVINATION DRAW TRIGGERED 🔮")
        print("═"*60)
        print(f" 📥 [REQUEST] Tool: {engine_tool.upper()} | Spread: {req.spread_type} | Count: {req.count}")
        print("-" * 60)
        
        drawn_items = result.get("drawn_results", [])
        total_items = result.get("total_items", 0)
        
        print(f" 🎯 [STATUS] Success | Total Items Drawn: {total_items}")
        
        if engine_tool == "tarot":
            card_names = [f"[{i+1}] {item.get('card_id', 'Unknown')}" for i, item in enumerate(drawn_items)]
            print(f" 🃏 [TAROT DRAWN] {' | '.join(card_names)}")
            
        elif engine_tool == "dice":
            dice_strs = []
            for item in drawn_items:
                raw = item.get("raw", {})
                dice_strs.append(f"{raw.get('planet')} in {raw.get('sign')} (H{raw.get('house')})")
            print(f" 🎲 [ASTRO DICE] {' | '.join(dice_strs)}")
            
        elif engine_tool == "rune":
            rune_names = [item.get("raw", {}).get("name", "Unknown") for item in drawn_items]
            print(f" 🪨 [WITCH'S RUNE] {' | '.join(rune_names)}")
            
        print("═"*60 + "\n")
        
        return result
        
    except Exception as e:
        print(f"\n ❌ [ERROR] Neshamah Engine Exception: {str(e)}\n")
        return {"status": "error", "message": str(e)}

# ════════════════════════════════════════════════════════
# YECHIDAH ENDPOINT (The Final Soul Gate Resolution)
# ════════════════════════════════════════════════════════
from core.astrology.c3_illumination import calculate_yechidah_reveal

class YechidahRevealRequest(BaseModel):
    answers: Dict[str, str]

@router.post("/citrinitas/yechidah/reveal")
async def reveal_yechidah_ritual(req: YechidahRevealRequest):
    """
    [ יחידה ] C3 YECHIDAH 엔드포인트
    7개 문항의 행성 및 기둥 정렬 답변을 기하학적 토폴로지 네트워크로 연쇄 하강 계산합니다.
    """
    payload = {
        "answers": req.answers
    }
    try:
        # 중앙 무의식 연쇄 엔진 가동
        result = calculate_yechidah_reveal(payload)
        debug_scores = result.get("debug_scores", {})
        
        # ==========================================
        # 🔮 콘솔 로깅 (CMD 실시간 모니터링 모듈)
        # ==========================================
        print("\n" + "═"*60)
        print(" 🔮 [ C3 : YECHIDAH ] RITUAL REVEAL TRIGGERED 🔮")
        print("═"*60)
        print(f" 📥 [USER TOTAL INPUT]: {req.answers}")
        print("-" * 60)
        print(f" ⚖️  [VECTORS] Planet Vector: {debug_scores.get('planet_vector')}")
        print(f" ⚖️  [VECTORS] Pillar Vector: {debug_scores.get('pillar_vector')}")
        print("-" * 60)
        print(f" ✨ [RESULT] Sephiroth: {str(result.get('final_sephiroth')).upper()}")
        print(f" 🔗 [RESULT] Path:       {result.get('final_path')}")
        print(f" 🔺 [RESULT] Triangle:   {result.get('final_triangle')}")
        
        # Da'at 심연의 문이 열렸을 때 터미널 경고등 연출
        if result.get('daat_triggered'):
            print(f" 👁️  [🚨 SYSTEM NOTICE] DA'AT INTERCEPTOR ACTIVATED: ABYSS GATE OPENED.")
        else:
            print(f" 👁️  [STATUS] Da'at Gate Remains Sealed.")
            
        print("═"*60 + "\n")
        
        return result
        
    except Exception as e:
        print(f"\n ❌ [ERROR] Yechidah Reveal Engine Failed: {str(e)}\n")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Yechidah Engine Error: {str(e)}")