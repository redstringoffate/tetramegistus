# app/core/models.py
from pydantic import BaseModel, Field, validator
from typing import Optional

class NatalBase(BaseModel):
    """
    [Source: 20] 모든 차트의 공통 형상.
    v13 수복: timezone 및 has_body(실체 여부) 필드 추가.
    """
    idx: int = Field(..., description="영구 고유 인덱스")
    name: str
    birth_date: str    # YYYY-MM-DD
    birth_time: str    # HH:MM:SS or Unknown 
    location: str
    lat: Optional[float] = None
    lng: Optional[float] = None
    timezone: str = "0" # 🔑 [v13]: UTC Offset (e.g., "9", "-5")
    is_unknown_time: bool = False
    has_body: int = 1   # 🔑 [v13]: 1: Natal(실체), 0: Composite(투영)
    is_seed: int = 1    # 1: Seed, 0: Temporary (차후 확장용)

    @validator('birth_time')
    def validate_time_format(cls, v, values):
        """[Source: 29] 모든 시간은 HH:MM:SS 포맷을 유지해야 합니다."""
        if values.get('is_unknown_time') or v == "Unknown":
            return "Unknown"
        # SS가 빠진 HH:MM 형태라면 수복하여 저장
        if len(v) == 5 and ":" in v:
            return f"{v}:00"
        return v

class AnchorMe(NatalBase):
    """
    [Source: 21] 시스템의 기점 [me] (Index 0).
    절대적인 닻이며, 실체(has_body=1)여야만 합니다.
    """
    idx: int = 0
    name: str = "[me]"
    has_body: int = 1

    @validator('idx')
    def force_anchor_index(cls, v):
        if v != 0:
            raise ValueError("AnchorMe의 인덱스는 반드시 0이어야 합니다.")
        return v

class TravelingSeed(NatalBase):
    """
    [Source: 22] 이후 생성되는 순차적 시드 (Index 1..n).
    Sequential Assignment 법칙을 따릅니다.
    """
    has_body: int = 1

    @validator('idx')
    def validate_index_range(cls, v):
        if v <= 0:
            raise ValueError("TravelingSeed의 인덱스는 0보다 커야 합니다. (0은 [me] 전용)")
        return v

class CompositeManifest(NatalBase):
    """
    [v13 수복]: Albedo 단계에서 생성될 합성 차트 규격.
    has_body=0 태그와 부모 인덱스 정보를 포함합니다.
    """
    has_body: int = 0
    parent_idx_1: int
    parent_idx_2: int

def get_next_index(cursor, user_id: str) -> int:
    """[PostgreSQL 수복]: 새로운 시드의 영구 인덱스를 발급합니다."""
    try:
        # 🚀 [수복]: SQLite의 '?' 대신 PostgreSQL의 '%s' 사용
        cursor.execute("SELECT MAX(idx) as max_idx FROM natal_charts WHERE user_id = %s", (user_id,))
        row = cursor.fetchone()
        
        # 🚀 [수복]: RealDictCursor가 반환하는 dict 형태에 맞춰 안전하게 추출
        if row and row.get('max_idx') is not None:
            return int(row['max_idx']) + 1
            
        return 1  # 0번 인덱스는 [me] 앵커가 차지하므로, 첫 동반자는 1번부터 시작
    except Exception as e:
        print(f"--- [INDEX GENERATION ERROR]: {e} ---")
        return 1