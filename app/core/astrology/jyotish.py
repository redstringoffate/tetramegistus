# app/core/astrology/jyotish.py

from datetime import datetime, timedelta
from .jyotish_constants import NAKSHATRAS, DASHA_TABLE, DASHA_REMAINING

class VimshottariEngine:
    def __init__(self):
        # Vimshottari Lord Sequence (Fixed Order)
        self.DASHA_ORDER = ["Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury"]

    def calculate_dasha(self, birth_date: datetime, moon_lon_decimal: float):
        """
        [Hardcoded Lookup Strategy]
        상수 테이블을 참조하여 정확한 날짜 트리를 생성합니다.
        """
        # 1. Nakshatra 및 Ruler 식별
        norm_lon = moon_lon_decimal % 360
        nak_info = NAKSHATRAS[0] # Fallback
        
        for info in NAKSHATRAS:
            if info["start"] <= norm_lon < info["end"]:
                nak_info = info
                break
        
        ruler = nak_info["ruler"]
        
        # 2. Balance(잔여 기간) 계산
        # 낙샤트라 내 진행도(분) 계산 (13도 20분 = 800분)
        # 0.0 ~ 13.3333... 도 사이의 값을 0~799 분으로 변환
        deg_traversed = norm_lon - nak_info["start"]
        minutes_traversed = int(deg_traversed * 60)
        
        # 범위 안전장치 (0~799)
        minutes_traversed = max(0, min(minutes_traversed, 799))
        
        # 잔여 일수 Lookup (Key가 integer인지 확인 필요, snippet상 integer)
        # DASHA_REMAINING[ruler]가 딕셔너리라고 가정
        balance_days = DASHA_REMAINING.get(ruler, {}).get(minutes_traversed, 0)
        
        # 3. 가상의 대운 시작일(Theoretical Start) 역산
        # (이론상 이 대운이 시작했어야 할 날짜 = 생일 - (전체길이 - 잔여일))
        first_dasha_full_days = DASHA_TABLE[ruler]["length"]
        passed_days = first_dasha_full_days - balance_days
        current_date = birth_date - timedelta(days=passed_days)
        
        # 4. 전체 시퀀스 생성 (Tree Structure Build)
        timeline = []
        
        # 태어난 대운부터 시작하여 순환 (Start with Birth Ruler)
        start_idx = self.DASHA_ORDER.index(ruler)
        
        # 120년 주기 (9개 행성) 생성 루프
        for i in range(9):
            p_idx = (start_idx + i) % 9
            lord = self.DASHA_ORDER[p_idx]
            
            # Level 1 Data Check
            if lord not in DASHA_TABLE: continue
            l1_data = DASHA_TABLE[lord]
            l1_days = l1_data["length"]
            
            l1_start = current_date
            l1_end = l1_start + timedelta(days=l1_days)
            
            # L1 Node (기본 구조)
            l1_node = {
                "planet": lord,
                "start_date": l1_start,
                "end_date": l1_end,
                "sub_periods": [] 
            }
            
            # 최적화: 생일 이전에 이미 끝나버린 대운은 L2 계산 스킵 (L1만 기록하거나 스킵 가능)
            # 여기서는 구조적 완결성을 위해 계산하되, 필요 시 필터링 가능
            # if l1_end > birth_date: ...
            
            # ──────── L2 Generation (Bhukti) ────────
            # L2 순서는 L1 Lord부터 시작
            l2_start_cursor = l1_start
            l2_start_idx = self.DASHA_ORDER.index(lord)
            
            for j in range(9):
                l2_p_idx = (l2_start_idx + j) % 9
                sub_lord = self.DASHA_ORDER[l2_p_idx]
                
                # L2 Data Lookup
                # 구조: DASHA_TABLE[lord]["sub"][sub_lord] -> { "length": int, "sub": { ... } }
                if sub_lord not in l1_data["sub"]: continue
                l2_data_raw = l1_data["sub"][sub_lord]
                l2_days = l2_data_raw["length"]
                
                l2_end = l2_start_cursor + timedelta(days=l2_days)
                
                l2_node = {
                    "planet": sub_lord,
                    "start_date": l2_start_cursor,
                    "end_date": l2_end,
                    "sub_periods": []
                }
                
                # ──────── L3 Generation (Antara) ────────
                # L3 순서는 L2 Lord부터 시작
                l3_start_cursor = l2_start_cursor
                l3_start_idx = self.DASHA_ORDER.index(sub_lord)
                
                # 생일 이후에 끝나는 구간만 상세 계산 (Performance Optimization)
                if l2_end > birth_date:
                    for k in range(9):
                        l3_p_idx = (l3_start_idx + k) % 9
                        sub_sub_lord = self.DASHA_ORDER[l3_p_idx]
                        
                        # L3 Data Lookup
                        # 구조: DASHA_TABLE[lord]["sub"][sub_lord]["sub"][sub_sub_lord] -> int (days)
                        if sub_sub_lord not in l2_data_raw["sub"]: continue
                        l3_days = l2_data_raw["sub"][sub_sub_lord]
                        
                        l3_end = l3_start_cursor + timedelta(days=l3_days)
                        
                        # L3 Node
                        l3_node = {
                            "planet": sub_sub_lord,
                            "start_date": l3_start_cursor,
                            "end_date": l3_end
                        }
                        
                        # 생일 이후 데이터만 담기 (선택적)
                        if l3_end > birth_date:
                            l2_node["sub_periods"].append(l3_node)
                            
                        l3_start_cursor = l3_end

                # L2 Node 추가 (L3가 비어있어도 L2는 추가)
                if l2_end > birth_date:
                    l1_node["sub_periods"].append(l2_node)
                
                l2_start_cursor = l2_end
                
            # L1 Node 추가
            if l1_end > birth_date:
                timeline.append(l1_node)
            
            # 다음 대운 시작일 업데이트
            current_date = l1_end
            
        return timeline