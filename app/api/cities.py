# app/api/cities.py

from fastapi import APIRouter, Query, HTTPException
import psycopg2.extras
from app.core.database import get_db

router = APIRouter()

# 🌐 주요 국가 코드 -> 풀네임 변환 맵 (UI 표시용)
COUNTRY_MAP = {
    "KR": "Korea", "JP": "Japan", "CN": "China", "TW": "Taiwan",
    "US": "US", "GB": "UK", "CA": "Canada", "AU": "Australia",
    "FR": "France", "DE": "Germany", "IT": "Italy", "ES": "Spain",
    "RU": "Russia", "IN": "India", "BR": "Brazil", "VN": "Vietnam"
}

@router.get("/api/cities")
def search_cities(q: str = Query("", description="도시 이름 검색어")):
    if not q or len(q) < 2:
        return []

    conn = get_db()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    
    try:
        search_pattern = f"%{q}%"
        # SQL에서는 순수 데이터만 가져옵니다.
        cursor.execute("""
            SELECT 
                city_name AS city, 
                state_name AS state, 
                country_code AS country, 
                lat, 
                lng, 
                timezone AS tz
            FROM world_cities
            WHERE city_name ILIKE %s
            ORDER BY population DESC, city_name ASC
            LIMIT 30
        """, (search_pattern,))
        
        results = cursor.fetchall()
        
        # 🚀 [데이터 정화]: '11' 같은 한국/일본의 행정구역 코드를 차단하고 국가명을 치환합니다.
        for r in results:
            cc = r['country']
            full_country = COUNTRY_MAP.get(cc, cc) # 맵에 없으면 기존 코드(예: AF) 유지
            
            # 미국(US), 캐나다(CA), 호주(AU), 영국(GB)만 주(State)를 표시
            if cc in ('US', 'CA', 'AU', 'GB') and r['state'] and str(r['state']).strip():
                r['label'] = f"{r['city']}, {r['state']}, {full_country}"
            else:
                r['label'] = f"{r['city']}, {full_country}"

        return results

    except Exception as e:
        print(f"💀 [CITY SEARCH ERROR]: {e}")
        raise HTTPException(status_code=500, detail="Database engine error.")
    finally:
        cursor.close()
        conn.close()