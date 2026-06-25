# app/api/cities.py

from fastapi import APIRouter, Query
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
            # 🛡️ [절대 방어]: DB 객체와 연을 끊고 완벽하게 새로운 딕셔너리를 창조합니다.
            city_name = r.get('city', '')
            state_name = r.get('state', '')
            country_code = r.get('country', '')
            
            full_country = COUNTRY_MAP.get(country_code, country_code)
            
            # 미국(US), 캐나다(CA), 호주(AU), 영국(GB)만 주(State)를 표시
            if country_code in ('US', 'CA', 'AU', 'GB') and state_name and str(state_name).strip():
                label = f"{city_name}, {state_name}, {full_country}"
            else:
                label = f"{city_name}, {full_country}"
                
            formatted_results.append({
                "city": city_name,
                "state": state_name,
                "country": country_code,
                "lat": float(r.get('lat', 0.0)),
                "lng": float(r.get('lng', 0.0)),
                "tz": r.get('tz', ''),
                "label": label
            })

        return formatted_results

    except Exception as e:
        print(f"💀 [CITY SEARCH ERROR]: {e}")
        return []  # 🚀 서버가 터져도 프론트엔드가 멈추지 않도록 빈 배열 반환
    finally:
        cursor.close()
        conn.close()