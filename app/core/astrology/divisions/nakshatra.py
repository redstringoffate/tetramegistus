# app/core/astrology/divisions/nakshatra.py

NAKSHATRAS = [
    "Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira", "Ardra", 
    "Punarvasu", "Pushya", "Ashlesha", "Magha", "Purva Phalguni", "Uttara Phalguni", 
    "Hasta", "Chitra", "Swati", "Vishakha", "Anuradha", "Jyeshtha", 
    "Mula", "Purva Ashadha", "Uttara Ashadha", "Shravana", "Dhanishta", "Shatabhisha", 
    "Purva Bhadrapada", "Uttara Bhadrapada", "Revati"
]

# 나크샤트라별 룰러 (Ketu부터 시작하는 Vimshottari 순서)
NAK_RULERS = ["Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury"] * 3

# Navamsa Pada Lord Sequence
PADA_LORD_SEQUENCE = ["Mars", "Venus", "Mercury", "Moon", "Sun", "Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Saturn", "Jupiter"] * 9

# 🔑 [수복]: KP Sub-Lord 계산을 위한 Vimshottari 상수 정의 (Import 제거)
# 순서: Ketu, Venus, Sun, Moon, Mars, Rahu, Jupiter, Saturn, Mercury
DASHA_PLANETS = ["Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury"]
DASHA_YEARS = [7, 20, 6, 10, 7, 18, 16, 19, 17]
# 각 나크샤트라의 시작 로드 인덱스 (Ashwini=Ketu(0), Bharani=Venus(1)...)
NAK_LORD_START = [i % 9 for i in range(27)]

def get_nakshatra_info(abs_degree: float, is_kp: bool = False):
    deg = abs_degree % 360
    nak_arc = 360 / 27  # 13.3333...
    pada_arc = nak_arc / 4 # 3.3333...
    
    nak_idx = int(deg / nak_arc)
    # 안전장치: 360도 경계값 처리
    if nak_idx >= 27: nak_idx = 0
    
    pada_in_nak = int((deg % nak_arc) / pada_arc) + 1
    global_pada_idx = int(deg / pada_arc) + 1
    
    pada_lord = PADA_LORD_SEQUENCE[(global_pada_idx - 1) % 108] # 인덱스 오버플로우 방지 (% 108)
    
    sub_lord = "-"
    if is_kp:
        # 🔑 [수복]: 파일 내 상수 직접 참조
        try:
            rel_minutes = ((deg % nak_arc) * 60) # 해당 나크샤트라 내 진입 분(Minute)
            start_lord_idx = NAK_LORD_START[nak_idx]
            
            # Vimshottari 비율에 따른 Sub-Lord 구간 탐색
            # 1 Nakshatra = 800 minutes (13deg 20min)
            # Total Dasha Years = 120
            acc = 0
            for i in range(9):
                p_idx = (start_lord_idx + i) % 9
                # 공식: (행성기간 / 120) * 800분
                zone = (DASHA_YEARS[p_idx] / 120.0) * 800.0
                acc += zone
                if rel_minutes < acc:
                    sub_lord = DASHA_PLANETS[p_idx]
                    break
        except Exception:
            sub_lord = "ERR"

    return {
        "name": NAKSHATRAS[nak_idx],
        "number": nak_idx + 1,
        "ruler": NAK_RULERS[nak_idx],
        "pada": pada_in_nak,
        "pada_index": global_pada_idx,
        "pada_lord": pada_lord,
        "sub_lord": sub_lord
    }