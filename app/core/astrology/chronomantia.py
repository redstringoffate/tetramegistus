# app/core/astrology/chronomantia.py

import swisseph as swe
from datetime import datetime

# ------------------------------------------------------------------
# 1. CONSTANTS
# ------------------------------------------------------------------
ZR_PERIODS = {
    "Aries": 15, "Taurus": 8, "Gemini": 20, "Cancer": 25,
    "Leo": 19, "Virgo": 20, "Libra": 8, "Scorpio": 15,
    "Sagittarius": 12, "Capricorn": 27, "Aquarius": 30, "Pisces": 12 
}

ZR_ORDER = [
    "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", 
    "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"
]

FIRDARIA_PERIODS = {
    "Sun": 10, "Venus": 8, "Mercury": 13, "Moon": 9, 
    "Saturn": 11, "Jupiter": 12, "Mars": 7, "Node": 3
}

FIRDARIA_SEQ = {
    'day': ["Sun", "Venus", "Mercury", "Moon", "Saturn", "Jupiter", "Mars", "Node"],
    'night': ["Moon", "Saturn", "Jupiter", "Mars", "Sun", "Venus", "Mercury", "Node"]
}

SUB_TOTAL_WEIGHT = 75 

# ------------------------------------------------------------------
# 2. HELPER FUNCTIONS
# ------------------------------------------------------------------
def get_sign_by_offset(start_sign, offset):
    idx = ZR_ORDER.index(start_sign)
    return ZR_ORDER[(idx + offset) % 12]

def get_opposite_sign(sign_name):
    return get_sign_by_offset(sign_name, 6)

def jd_to_str(jd):
    """Julian Day를 YYYY-MM-DD 문자열로 변환 (오차 방지)"""
    y, m, d, _ = swe.revjul(jd)
    return f"{y:04d}-{m:02d}-{d:02d}"

class ChronosEngine:
    def __init__(self, birth_jd):
        # 🚀 [CORE]: 모든 계산은 실수(float)인 Julian Day로 수행하여 정밀도 유지
        self.birth_jd = float(birth_jd)
        self.tropical_year = 365.242199 # 더 정확한 회귀년(Tropical Year) 기준

    def _add_years_jd(self, jd, years):
        return jd + (years * self.tropical_year)

    # ==================================================================
    # 🌟 MODULE 1: Zodiacal Releasing (JD Logic)
    # ==================================================================
    def calculate_zr(self, start_sign, lot_degree, levels=3, years_range=100):
        results = []
        l1_total_years = ZR_PERIODS[start_sign]
        passed_ratio = lot_degree / 30.0
        passed_days = (l1_total_years * self.tropical_year) * passed_ratio
        
        virtual_start_jd = self.birth_jd - passed_days
        current_jd = virtual_start_jd
        l1_cursor = start_sign
        final_end_jd = self.birth_jd + (years_range * self.tropical_year)

        for _ in range(100):
            if current_jd >= final_end_jd: break
            
            duration_years = ZR_PERIODS[l1_cursor]
            period_end_jd = current_jd + (duration_years * self.tropical_year)
            
            if period_end_jd > self.birth_jd:
                l1_data = {
                    "level": 1, "sign": l1_cursor,
                    "start": jd_to_str(current_jd), # 🚀 [FIX]: 날짜 강제 고정(Clamp) 해제
                    "real_start_jd": current_jd,
                    "end": jd_to_str(period_end_jd),
                    "sub_periods": []
                }
                if levels >= 2:
                    l1_data["sub_periods"] = self._generate_zr_subs(
                        major_sign=l1_cursor,
                        start_jd=current_jd,
                        end_jd=period_end_jd, # 🚀 [FIX]: 부모의 정확한 종료 지점을 하사
                        level=2, max_level=levels
                    )
                results.append(l1_data)

            current_jd = period_end_jd
            l1_cursor = get_sign_by_offset(l1_cursor, 1)
        return results

    # 🚀 [FIX]: major_duration_years 대신 end_jd를 직접 받아 빈틈없이 루프를 돕니다.
    def _generate_zr_subs(self, major_sign, start_jd, end_jd, level, max_level):
        subs = []
        current_jd = start_jd
        cursor_sign = major_sign
        is_first_turn = True 
        
        for _ in range(500): # L3가 L2를 채우기 위한 충분한 루프 횟수
            if current_jd >= end_jd - 0.0001: break
            
            weight = ZR_PERIODS[cursor_sign]
            if level == 2:
                duration_days = weight * (self.tropical_year / 12.0)
            else:
                duration_days = float(weight)

            period_end_jd = current_jd + duration_days
            if period_end_jd > end_jd: period_end_jd = end_jd

            if period_end_jd > self.birth_jd:
                # 🚀 [Logic Update]: LB 판별을 생성 시점에 미리 수행
                # 다음 별자리가 시작 별자리(major_sign)와 같다면, 이번 루프가 끝나고 점프해야 함
                next_raw = get_sign_by_offset(cursor_sign, 1)
                will_jump = (not is_first_turn and next_raw == major_sign)
                
                sub_data = {
                    "level": level, "sign": cursor_sign,
                    "start": jd_to_str(current_jd),
                    "real_start_jd": current_jd,
                    "end": jd_to_str(period_end_jd),
                    "is_lb": False # 초기값
                }
                
                if level < max_level:
                    sub_data["sub_periods"] = self._generate_zr_subs(
                        major_sign=cursor_sign,
                        start_jd=current_jd,
                        end_jd=period_end_jd, # 🚀 [FIX]: 계산된 종료 지점 물려주기
                        level=level+1, max_level=max_level
                    )
                subs.append(sub_data)

            current_jd = period_end_jd
            next_candidate = get_sign_by_offset(cursor_sign, 1)
            
            if not is_first_turn and next_candidate == major_sign:
                cursor_sign = get_opposite_sign(major_sign)
            else:
                cursor_sign = next_candidate
                
            is_first_turn = False

        for i in range(1, len(subs)):
            if subs[i]['sign'] != get_sign_by_offset(subs[i-1]['sign'], 1):
                subs[i]['is_lb'] = True # 이 칸만 붉게 변함

        return subs

    # ==================================================================
    # 🌟 MODULE 2: Profection & Firdaria
    # ==================================================================
    def calculate_firdaria(self, is_day_birth):
        sequence = FIRDARIA_SEQ['day'] if is_day_birth else FIRDARIA_SEQ['night']
        firdaria_tree = []
        current_jd = self.birth_jd
        
        for planet in sequence:
            main_years = FIRDARIA_PERIODS[planet]
            period_end_jd = self._add_years_jd(current_jd, main_years)
            
            main_data = {
                "planet": planet, "type": "Main", 
                "start": jd_to_str(current_jd), 
                "end": jd_to_str(period_end_jd), 
                "sub_periods": []
            }
            
            if planet != "Node":
                sub_start_jd = current_jd
                base_sub_seq = [p for p in sequence if p != "Node"]
                start_idx = base_sub_seq.index(planet)
                rotated_seq = base_sub_seq[start_idx:] + base_sub_seq[:start_idx]
                
                for sub_planet in rotated_seq:
                    sub_weight = FIRDARIA_PERIODS[sub_planet]
                    sub_duration_years = main_years * (sub_weight / SUB_TOTAL_WEIGHT)
                    sub_end_jd = self._add_years_jd(sub_start_jd, sub_duration_years)
                    
                    main_data["sub_periods"].append({
                        "planet": sub_planet, "type": "Sub", 
                        "start": jd_to_str(sub_start_jd), 
                        "end": jd_to_str(sub_end_jd)
                    })
                    sub_start_jd = sub_end_jd
            
            firdaria_tree.append(main_data)
            current_jd = period_end_jd
        return firdaria_tree

    def calculate_profections(self, asc_sign, years_count=100):
        profections = []
        start_idx = ZR_ORDER.index(asc_sign)
        for age in range(years_count + 1):
            current_idx = (start_idx + age) % 12
            prof_sign = ZR_ORDER[current_idx]
            
            start_jd = self.birth_jd + (age * self.tropical_year)
            end_jd = self.birth_jd + ((age + 1) * self.tropical_year)
            
            ruler = self._get_domicile_ruler(prof_sign)
            profections.append({
                "age": age, "sign": prof_sign, "ruler": ruler,
                "start_date": jd_to_str(start_jd),
                "end_date": jd_to_str(end_jd)
            })
        return profections

    def _get_domicile_ruler(self, sign):
        rulers = {
            "Aries": "Mars", "Taurus": "Venus", "Gemini": "Mercury", "Cancer": "Moon",
            "Leo": "Sun", "Virgo": "Mercury", "Libra": "Venus", "Scorpio": "Mars",
            "Sagittarius": "Jupiter", "Capricorn": "Saturn", "Aquarius": "Saturn", "Pisces": "Jupiter"
        }
        return rulers.get(sign, "")
