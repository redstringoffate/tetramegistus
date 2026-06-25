# app/api/cities.py

from fastapi import APIRouter, Query, HTTPException
import psycopg2.extras
from app.core.database import get_db

router = APIRouter()

# 🌐 주요 국가 코드 -> 풀네임 변환 맵
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
        formatted_results = []
        
        for r in results:
            # 💡 [핵심 수복]: DB 객체의 잠금을 풀고 순수 딕셔너리로 변환하여 에러 원천 차단
            row = dict(r) 
            
            cc = row['country']
            full_country = COUNTRY_MAP.get(cc, cc)
            
            # 미국(US), 캐나다(CA), 호주(AU), 영국(GB)만 주(State)를 표시
            if cc in ('US', 'CA', 'AU', 'GB') and row['state'] and str(row['state']).strip():
                row['label'] = f"{row['city']}, {row['state']}, {full_country}"
            else:
                row['label'] = f"{row['city']}, {full_country}"
                
            formatted_results.append(row)

        return formatted_results

    except Exception as e:
        print(f"💀 [CITY SEARCH ERROR]: {e}")
        raise HTTPException(status_code=500, detail="Database engine error.")
    finally:
        cursor.close()
        conn.close()