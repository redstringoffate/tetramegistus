import swisseph as swe
from datetime import datetime, timedelta
import pytz

def scan_aleph_day(date_str, lat, lng, tz_offset, ayanamsa='lahiri'):
    """
    [ א ] Aleph: 00:00 ~ 23:59 24시간 자동 스캔 엔진
    생시 보정을 위한 4분 단위 스캔 및 점진적 소거법(Funnel)용 데이터 생성
    """
    # 순환 참조 방지를 위해 engine.py의 유틸리티 지연 임포트
    from .engine import get_julian_day, get_planetary_lords, TROPICAL_SIGNS
    
    try:
        y, m, d = map(int, date_str.split('-'))
        start_dt = datetime(y, m, d, 0, 0, 0)
    except Exception as e:
        raise ValueError(f"Invalid date format: {date_str}")

    jd_start = get_julian_day(date_str, "00:00:00", tz_offset)
    jd_end = get_julian_day(date_str, "23:59:59", tz_offset)
    iflgret = swe.FLG_SWIEPH | swe.FLG_SPEED
    
    flags = set()
    mars_ingress_info = None

    # [1] Mars Ingress (별자리 이동) 당일 판별
    mars_start = swe.calc_ut(jd_start, swe.MARS, iflgret)[0][0]
    mars_end = swe.calc_ut(jd_end, swe.MARS, iflgret)[0][0]
    sign_start_idx = int(mars_start / 30) % 12
    sign_end_idx = int(mars_end / 30) % 12
    
    if sign_start_idx != sign_end_idx:
        flags.add("mars_ingress")
        mars_ingress_info = {
            "from_sign": TROPICAL_SIGNS[sign_start_idx],
            "to_sign": TROPICAL_SIGNS[sign_end_idx]
        }

    # Aspect 판별 헬퍼 함수 (Orb 기본 3.0도)
    def check_aspect(lon1, lon2, orb=3.0, aspect_type='conj'):
        diff = abs(lon1 - lon2)
        if diff > 180: diff = 360 - diff
        if aspect_type == 'conj' and diff <= orb: return True
        if aspect_type == 'square' and abs(diff - 90) <= orb: return True
        return False

    time_blocks = []
    current_block = None
    
    # 4분 단위 스캔 (하루 360회 반복 - Ascendant가 약 1도 이동하는 시간)
    for step in range(0, 24 * 60, 4):
        scan_time = start_dt + timedelta(minutes=step)
        time_str = scan_time.strftime("%H:%M:%S")
        current_time_str = scan_time.strftime("%H:%M")
        
        jd_ut = get_julian_day(date_str, time_str, tz_offset)
        
        # [2] Ascendant & Houses 계산
        swe.set_sid_mode(0, 0, 0)
        try:
            cusps, ascmc = swe.houses_ex(jd_ut, lat, lng, b'P', iflgret)
        except:
            cusps, ascmc = swe.houses_ex(jd_ut, lat, lng, b'O', iflgret)
            
        asc_lon = ascmc[0]
        asc_sign_idx = int(asc_lon / 30) % 12
        asc_sign = TROPICAL_SIGNS[asc_sign_idx]
        
        # [3] Hour Lord 계산
        _, hour_lord = get_planetary_lords(jd_ut, lat, lng, tz_offset)
        
        # [4] 핵심 행성 위치 계산
        mars_res = swe.calc_ut(jd_ut, swe.MARS, iflgret)
        saturn_res = swe.calc_ut(jd_ut, swe.SATURN, iflgret)
        uranus_res = swe.calc_ut(jd_ut, swe.URANUS, iflgret)
        neptune_res = swe.calc_ut(jd_ut, swe.NEPTUNE, iflgret)
        sun_res = swe.calc_ut(jd_ut, swe.SUN, iflgret)
        chiron_res = swe.calc_ut(jd_ut, swe.CHIRON, iflgret)
        
        mars_lon, mars_speed = mars_res[0][0], mars_res[0][3]
        saturn_lon = saturn_res[0][0]
        uranus_lon = uranus_res[0][0]
        neptune_lon = neptune_res[0][0]
        sun_lon = sun_res[0][0]
        chiron_lon = chiron_res[0][0]
        
        # 🚀 [추가] 이 순간(4분 단위)의 정확한 화성 별자리 도출
        current_mars_sign = TROPICAL_SIGNS[int(mars_lon / 30) % 12]
        
        # 하우스 판별기
        def get_house(lon, cusps_arr):
            for i in range(12):
                curr_c = cusps_arr[i]
                next_c = cusps_arr[(i+1)%12]
                if curr_c < next_c:
                    if curr_c <= lon < next_c: return i + 1
                else: # 360도 경계 통과
                    if curr_c <= lon < 360 or 0 <= lon < next_c: return i + 1
            return 1

        saturn_h = get_house(saturn_lon, cusps)
        chiron_h = get_house(chiron_lon, cusps)
        
        # [5] Modifier Flags 감지 로직 (매 스텝마다 검사하여 하루치 집합에 누적)
        deg_in_sign = mars_lon % 30
        if deg_in_sign >= 29.0 or deg_in_sign < 1.0:
            flags.add("mars_anaretic")
            
        if mars_speed < 0:
            flags.add("mars_retrograde")
            
        # Combust는 통상 태양과 8.5도 이내 (설정 필요 시 orb 조절)
        if check_aspect(mars_lon, sun_lon, orb=8.5, aspect_type='conj'): 
            flags.add("mars_combust")
            
        # Mars Aspects (Orb 3.0)
        if check_aspect(mars_lon, saturn_lon, 3.0, 'conj'): flags.add("mars_saturn_conjunction")
        if check_aspect(mars_lon, saturn_lon, 3.0, 'square'): flags.add("mars_saturn_square")
        if check_aspect(mars_lon, uranus_lon, 3.0, 'conj'): flags.add("mars_uranus_conjunction")
        if check_aspect(mars_lon, uranus_lon, 3.0, 'square'): flags.add("mars_uranus_square")
        if check_aspect(mars_lon, neptune_lon, 3.0, 'conj'): flags.add("mars_neptune_conjunction")
        if check_aspect(mars_lon, neptune_lon, 3.0, 'square'): flags.add("mars_neptune_square")

        # Sun Aspects (Orb 3.0)
        if check_aspect(sun_lon, saturn_lon, 3.0, 'conj'): flags.add("sun_saturn_conjunction")
        if check_aspect(sun_lon, uranus_lon, 3.0, 'conj'): flags.add("sun_uranus_conjunction")
        if check_aspect(sun_lon, neptune_lon, 3.0, 'conj'): flags.add("sun_neptune_conjunction")

        # [6] Time Block 분할 로직 (상태 변화 감지)
        # 🚀 [핵심]: state_key에 current_mars_sign을 추가합니다. 
        # 이제 화성이 양자리에서 황소자리로 넘어가는 순간, 블록이 강제로 쪼개집니다!
        state_key = f"{asc_sign}_{hour_lord}_{saturn_h}_{chiron_h}_{current_mars_sign}"
        
        if current_block is None:
            current_block = {
                "start": current_time_str,
                "end": current_time_str,
                "ascendant": asc_sign,
                "hour_lord": hour_lord,
                "saturn_house": str(saturn_h),
                "chiron_house": str(chiron_h),
                "mars_sign": current_mars_sign, # 🚀 각 블록에 화성 별자리 명시!
                "key": state_key
            }
        elif current_block["key"] == state_key:
            # 상태가 동일하면 종료 시간만 연장
            current_block["end"] = current_time_str
        else:
            # 상태가 변했으면 기존 블록을 리스트에 저장하고 새 블록 생성
            time_blocks.append(current_block)
            current_block = {
                "start": current_time_str,
                "end": current_time_str,
                "ascendant": asc_sign,
                "hour_lord": hour_lord,
                "saturn_house": str(saturn_h),
                "chiron_house": str(chiron_h),
                "mars_sign": current_mars_sign, # 🚀 새 블록에도 화성 별자리 명시!
                "key": state_key
            }
            
    # 하루 스캔이 끝나고 남은 마지막 블록 처리
    if current_block:
        current_block["end"] = "23:59" # 자정 직전으로 보정
        time_blocks.append(current_block)

    return {
        "date": date_str,
        "flags": list(flags),
        "mars_sign": TROPICAL_SIGNS[sign_start_idx], # 시작 시점의 화성 별자리 기준
        "mars_ingress_info": mars_ingress_info,
        "timeline_blocks": time_blocks
    }

# ====================================================================
# [ מ ] C2_MEM: Dasha & Pada Timefinder Engine (Fuzzy Logic)
# ====================================================================

DASHA_SEQ = [
    ("Ketu", 7), ("Venus", 20), ("Sun", 6), ("Moon", 10), 
    ("Mars", 7), ("Rahu", 18), ("Jupiter", 16), ("Saturn", 19), ("Mercury", 17)
]

PADA_PURUSHARTHA = {1: "Dharma", 2: "Artha", 3: "Kama", 4: "Moksha"}

# 🚀 낙샤트라 27수 이름 매핑 추가
NAKSHATRAS = [
    "Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira", "Ardra",
    "Punarvasu", "Pushya", "Ashlesha", "Magha", "Purva Phalguni", "Uttara Phalguni",
    "Hasta", "Chitra", "Swati", "Vishakha", "Anuradha", "Jyeshtha",
    "Mula", "Purva Ashadha", "Uttara Ashadha", "Shravana", "Dhanishta",
    "Shatabhisha", "Purva Bhadrapada", "Uttara Bhadrapada", "Revati"
]

def get_dasha_timeline(sidereal_moon_lon):
    nak_len = 13 + 1/3
    pada_len = 3 + 1/3
    
    nak_idx = int(sidereal_moon_lon / nak_len)
    pada = int((sidereal_moon_lon % nak_len) / pada_len) + 1
    fraction_left = 1.0 - ((sidereal_moon_lon % nak_len) / nak_len)
    
    start_idx = nak_idx % 9
    first_dasha, first_years = DASHA_SEQ[start_idx]
    
    balance_years = fraction_left * first_years
    
    timeline = []
    current_age = 0.0
    timeline.append((current_age, current_age + balance_years, first_dasha))
    current_age += balance_years
    
    idx = (start_idx + 1) % 9
    while current_age < 40.0:
        dasha_lord, years = DASHA_SEQ[idx]
        timeline.append((current_age, current_age + years, dasha_lord))
        current_age += years
        idx = (idx + 1) % 9
        
    # 🚀 낙샤트라 이름 추출
    nak_name = NAKSHATRAS[nak_idx % 27]
    purushartha = PADA_PURUSHARTHA.get((nak_idx % 4) + 1, "Dharma")
    pada_purushartha = PADA_PURUSHARTHA.get(pada, "Dharma")
    
    return timeline, purushartha, pada_purushartha, nak_name

def get_fuzzy_dasha_info(sidereal_moon_lon):
    timeline, purushartha, pada_purushartha, nak_name = get_dasha_timeline(sidereal_moon_lon)
    
    birth_dasha = [timeline[0][2]] 
    child_start, child_end = 0.0, 8.5
    child_grahas = []
    for d_start, d_end, lord in timeline:
        overlap = max(0, min(child_end, d_end) - max(child_start, d_start))
        if overlap >= 1.0: child_grahas.append(lord)
            
    if not child_grahas: child_grahas = [timeline[0][2]]
        
    shift_age = None
    shift_graha = []
    for i, (d_start, d_end, lord) in enumerate(timeline):
        if d_end >= 4.0 and d_end <= 35.0:
            shift_age = d_end
            if i + 1 < len(timeline):
                shift_graha.append(timeline[i+1][2])
            break
            
    if not shift_graha: shift_graha = [timeline[-1][2]]

    shifts = {"child": False, "puberty": False, "p_puberty": False, "20s": False}
    if shift_age is not None:
        s_min, s_max = shift_age - 1.0, shift_age + 1.0
        if s_min < 9.5 and s_max > 4.0: shifts["child"] = True
        if s_min < 18.5 and s_max > 9.5: shifts["puberty"] = True 
        if s_min < 22.5 and s_max > 18.5: shifts["p_puberty"] = True
        if s_min < 29.0 and s_max > 22.5: shifts["20s"] = True
        
    return birth_dasha, child_grahas, shifts, purushartha, pada_purushartha, shift_graha, nak_name

def scan_mem_day(date_str, time_blocks, tz_offset):
    from .engine import get_julian_day  
    
    swe.set_sid_mode(1, 0, 0)
    iflgret = swe.FLG_SWIEPH | swe.FLG_SPEED | swe.FLG_SIDEREAL
    
    results = []
    current_block = None
    minutes_to_scan = []
    
    if not time_blocks:
        start_dt = datetime.strptime(f"{date_str} 00:00", "%Y-%m-%d %H:%M")
        for i in range(24 * 60):
            minutes_to_scan.append(start_dt + timedelta(minutes=i))
    else:
        for b in time_blocks:
            start_dt = datetime.strptime(f"{date_str} {b['start']}", "%Y-%m-%d %H:%M")
            end_dt = datetime.strptime(f"{date_str} {b['end']}", "%Y-%m-%d %H:%M")
            curr = start_dt
            while curr <= end_dt:
                minutes_to_scan.append(curr)
                curr += timedelta(minutes=1)
                
    for dt in minutes_to_scan:
        time_str = dt.strftime("%H:%M")
        jd = get_julian_day(date_str, time_str + ":00", tz_offset)
        moon_pos, _ = swe.calc_ut(jd, swe.MOON, iflgret)
        sidereal_moon_lon = moon_pos[0]
        
        birth_dasha, child_grahas, shifts, purushartha, pada_purushartha, shift_graha, nak_name = get_fuzzy_dasha_info(sidereal_moon_lon)
        
        birth_str = "|".join(birth_dasha)
        graha_str = "|".join(child_grahas)
        shift_g_str = "|".join(shift_graha)
        shift_str = f"{shifts['child']}_{shifts['puberty']}_{shifts['p_puberty']}_{shifts['20s']}"
        state_key = f"{nak_name}_{purushartha}_{pada_purushartha}_{birth_str}_{graha_str}_{shift_g_str}_{shift_str}"
        
        if current_block is None:
            current_block = {
                "start": time_str, "end": time_str,
                "nakshatra": nak_name,                 # 👈 Nakshatra 이름 추가
                "purushartha": purushartha,        
                "pada_purushartha": pada_purushartha,  
                "birth_dasha": birth_dasha, 
                "child_graha": child_grahas, 
                "shift_graha": shift_graha,  
                "shifts": shifts, 
                "key": state_key
            }
        elif current_block["key"] == state_key:
            current_block["end"] = time_str
        else:
            results.append(current_block)
            current_block = {
                "start": time_str, "end": time_str,
                "nakshatra": nak_name,
                "purushartha": purushartha,
                "pada_purushartha": pada_purushartha,
                "birth_dasha": birth_dasha, 
                "child_graha": child_grahas, 
                "shift_graha": shift_graha, 
                "shifts": shifts,
                "key": state_key
            }
            
    if current_block:
        results.append(current_block)
        
    return results

def scan_shin_day(date_str, time_blocks, tz_offset, ayanamsa='lahiri'):
    """
    [ ש ] Shin: Arudha Ascendant & Core Identity 스캔 엔진
    """
    from .engine import get_julian_day, get_planetary_lords, TROPICAL_SIGNS
    import swisseph as swe
    from datetime import datetime, timedelta

    # (경로 설정 및 초기화 생략 - 기존 코드와 동일)
    
    results = []

    for block in time_blocks:
        start_time_str = block.get("start", "00:00")
        end_time_str = block.get("end", "23:59")
        lat = block.get("lat", 37.5665) 
        lng = block.get("lng", 126.9780)

        y, m, d = map(int, date_str.split('-'))
        h_s, min_s = map(int, start_time_str.split(':'))
        h_e, min_e = map(int, end_time_str.split(':'))

        current_dt = datetime(y, m, d, h_s, min_s, 0)
        end_dt = datetime(y, m, d, h_e, min_e, 59)

        current_group = None

        while current_dt <= end_dt:
            time_str = current_dt.strftime("%H:%M")
            time_str_full = current_dt.strftime("%H:%M:%S")

            # 1. Tropical Ascendant
            swe.set_sid_mode(0)
            jd_ut = get_julian_day(date_str, time_str_full, tz_offset)
            cusps, ascmc = swe.houses(jd_ut, lat, lng, b'W')
            trop_asc_deg = ascmc[0]
            trop_asc_sign_idx = int(trop_asc_deg / 30) % 12
            trop_asc_name = TROPICAL_SIGNS[trop_asc_sign_idx]

            # 2. Sidereal Ascendant (Lahiri)
            swe.set_sid_mode(swe.SIDM_LAHIRI)
            cusps_sid, ascmc_sid = swe.houses_ex(jd_ut, lat, lng, b'W', swe.FLG_SIDEREAL)
            sid_asc_deg = ascmc_sid[0]
            sid_asc_sign_idx = int(sid_asc_deg / 30) % 12
            sid_asc_name = TROPICAL_SIGNS[sid_asc_sign_idx]

            # 3. Arudha Padas 계산
            # 🚀 lagna.py가 요구하는 9행성(Rahu/Ketu 포함)의 Sidereal 도수 딕셔너리 생성
            planets_data = {}
            target_bodies = {
                "Sun": swe.SUN, "Moon": swe.MOON, "Mercury": swe.MERCURY, 
                "Venus": swe.VENUS, "Mars": swe.MARS, "Jupiter": swe.JUPITER, "Saturn": swe.SATURN,
                "Rahu": swe.MEAN_NODE # Rahu 필수 추가
            }
            for p_name, p_id in target_bodies.items():
                lon = swe.calc_ut(jd_ut, p_id, swe.FLG_SWIEPH | swe.FLG_SIDEREAL)[0][0]
                planets_data[p_name] = {'longitude': lon}
                
            # Ketu 위치 추가 (Rahu의 180도 반대편)
            planets_data["Ketu"] = {'longitude': (planets_data["Rahu"]['longitude'] + 180) % 360}

            cusps_input = {i: cusps_sid[i-1] for i in range(1, 13)}
            
            from .lagna import calculate_all_jaimini_padas
            padas = calculate_all_jaimini_padas(planets_data, cusps_input, sid_asc_sign_idx)

            # 헬퍼 함수: 에러 방지 및 정확한 상대 하우스 반환
            def get_arudha_info(pada_key):
                if pada_key not in padas:
                    return "Unknown", "0"
                sign_idx = padas[pada_key]['sign']
                house_num = ((sign_idx - sid_asc_sign_idx) % 12) + 1
                return TROPICAL_SIGNS[sign_idx], str(house_num)

            # 🚨 문자열('A1')이 아닌 정수(1)로 조회해야 정상적으로 매칭됨!
            al_sign, al_house = get_arudha_info(1)
            a7_sign, a7_house = get_arudha_info(7)
            a10_sign, a10_house = get_arudha_info(10)
            ul_sign, ul_house = get_arudha_info(12) # UL은 12하우스

            # 상태 키 (이 중 하나라도 바뀌면 새로운 블록으로 분리)
            state_key = f"{trop_asc_name}_{sid_asc_name}_{al_house}_{a7_house}_{a10_house}_{ul_house}"

            if current_group is None:
                current_group = {
                    "start": time_str,
                    "end": time_str,
                    "tropical_asc": trop_asc_name,
                    "sidereal_asc": sid_asc_name,
                    "arudha": {
                        "AL": {"sign": al_sign, "house": al_house},
                        "A7": {"sign": a7_sign, "house": a7_house},
                        "A10": {"sign": a10_sign, "house": a10_house},
                        "UL": {"sign": ul_sign, "house": ul_house}
                    },
                    "key": state_key
                }
            elif current_group["key"] == state_key:
                current_group["end"] = time_str
            else:
                results.append(current_group)
                current_group = {
                    "start": time_str,
                    "end": time_str,
                    "tropical_asc": trop_asc_name,
                    "sidereal_asc": sid_asc_name,
                    "arudha": {
                        "AL": {"sign": al_sign, "house": al_house},
                        "A7": {"sign": a7_sign, "house": a7_house},
                        "A10": {"sign": a10_sign, "house": a10_house},
                        "UL": {"sign": ul_sign, "house": ul_house}
                    },
                    "key": state_key
                }

            current_dt += timedelta(minutes=1)
        
        if current_group:
            results.append(current_group)

    # 병합 로직 (기존과 동일)
    final_blocks = []
    for r in results:
        if final_blocks and final_blocks[-1]["key"] == r["key"]:
            final_blocks[-1]["end"] = r["end"]
        else:
            final_blocks.append(r)

    return final_blocks