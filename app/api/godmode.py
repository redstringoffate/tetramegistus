# app/api/godmode.py
import re
import os
import json
import shutil

import psycopg2   # 🚀 [추가]
from psycopg2.extras import RealDictCursor # 🚀 [추가]
import calendar
# ... (나머지 동일)
from api.auth import verify_google_otp
from core.database import get_db, delete_user_entire_data

from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, HTTPException, Depends, Request, Form, UploadFile, File
from fastapi.responses import JSONResponse
from core.panopticon import get_pano_db

router = APIRouter()

# ---------------------------------------------------------
# ⚖️ [Lv1: Akashic Records] - 영혼 열람 및 공허 귀환(Purge)
# ---------------------------------------------------------

@router.get("/api/godmode/akashic/souls")
async def get_akashic_records(request: Request, search: str = None):
    """[The Purge]: 귀속된 모든 영혼의 리스트를 열람합니다."""
    current_user = request.cookies.get("session_user_id")
    god_token = request.cookies.get("god_token")
    if current_user != "admin@tetramegistus.com" or not god_token:
        return JSONResponse(status_code=403, content={"error": "Unauthorized soul."})

    conn = get_db()
    # 🚀 [수복]: RealDictCursor 장착
    cursor = conn.cursor(cursor_factory=RealDictCursor)

    # 🚀 [수복]: datetime(..., '+9 hours') ➔ + INTERVAL '9 hours' 로 번역
    query = "SELECT email, created_at + INTERVAL '9 hours' as created_at, last_login FROM users WHERE email != 'admin@tetramegistus.com'"
    params = []
    
    if search:
        query += " AND email LIKE %s" # 🚀 %s 변경
        params.append(f"%{search}%")
    
    query += " ORDER BY created_at ASC"
    
    cursor.execute(query, params)
    rows = cursor.fetchall()
    
    cursor.close()
    conn.close()
    return [dict(row) for row in rows]

@router.get("/api/godmode/akashic/seed/{email}")
async def get_soul_seed(email: str, request: Request):
    """[Omniscient Hover]: 특정 영혼의 진정한 기원([me] 시드)을 관측합니다."""
    current_user = request.cookies.get("session_user_id")
    god_token = request.cookies.get("god_token")
    if current_user != "admin@tetramegistus.com" or not god_token:
        return JSONResponse(status_code=403, content={"error": "Unauthorized soul."})

    conn = get_db()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    cursor.execute("SELECT * FROM natal_charts WHERE user_id = %s AND idx = 0", (email,))
    seed = cursor.fetchone()
    
    cursor.close()
    conn.close()
    
    if seed:
        return dict(seed)
    return JSONResponse(status_code=404, content={"error": "Seed not found in the void."})

@router.post("/api/godmode/akashic/purge")
async def purge_soul(request: Request, target_email: str = Form(...), otp_code: str = Form(...)):
    """[Purge Ritual]: 최종 결계(OTP)를 뚫고 영혼을 강제 소멸시킵니다."""
    current_user = request.cookies.get("session_user_id")
    god_token = request.cookies.get("god_token")
    if current_user != "admin@tetramegistus.com" or not god_token:
        return JSONResponse(status_code=403, content={"status": "error", "message": "Unauthorized soul."})
    
    # 🚀 [수복]: auth.py에 만들어둔 함수 하나로 깔끔하게 퉁칩니다.
    if not verify_google_otp(otp_code):
        return {"status": "error", "message": "The Void rejects your code."}
        
    # 2. 🛡️ 어드민 자살 방지
    if target_email.lower() == "admin@tetramegistus.com":
        return {"status": "error", "message": "The Prime Node cannot be unmade."}

    # 3. 💀 데이터베이스 완전 파괴 집행
    success = delete_user_entire_data(target_email)
    
    if success:
        print(f"💀 [THE PURGE]: Admin successfully eradicated '{target_email}'.")
        return {"status": "success", "message": f"Soul '{target_email}' has been returned to the Void."}
    else:
        return {"status": "error", "message": "Failed to eradicate the soul."}
    
# ---------------------------------------------------------
# 👁️ [Lv2: Omniscience] - Panopticon Analytics API
# ---------------------------------------------------------

KST = timezone(timedelta(hours=9))

def get_planet_symbol(weekday_int):
    """요일(0=월~6=일)을 행성 기호로 변환"""
    symbols = {0: '☽', 1: '♂', 2: '☿', 3: '♃', 4: '♀', 5: '♄', 6: '☉'}
    return symbols.get(weekday_int, '')

def format_chronos(total_seconds):
    """초 단위 시간을 d h m s 포맷으로 변환"""
    if not total_seconds: return "0s"
    d = total_seconds // 86400
    h = (total_seconds % 86400) // 3600
    m = (total_seconds % 3600) // 60
    s = total_seconds % 60
    
    parts = []
    if d > 0: parts.append(f"{d}d")
    if h > 0: parts.append(f"{h}h")
    if m > 0: parts.append(f"{m}m")
    parts.append(f"{s}s")
    return " ".join(parts)

@router.get("/api/godmode/panopticon/data")
async def get_panopticon_data(request: Request, mode: str = 'supra', sub_mode: str = 'numero', time_unit: str = 'day'):
    if not request.cookies.get("pano_token"):
        return JSONResponse(status_code=403, content={"error": "Unauthorized"})

    conn = get_pano_db()
    # 🚀 [수복 1]: 중복 선언(cursor = conn.cursor()) 제거 완료
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    now_kst = datetime.now(KST)
    base_date_str = request.query_params.get('base_date')
    
    if base_date_str and base_date_str != 'null':
        base_kst = datetime.strptime(base_date_str, '%Y-%m-%d').replace(tzinfo=KST)
    else:
        base_kst = now_kst

    today_str = now_kst.strftime('%Y-%m-%d')

    # 🚀 [수복 2]: 모든 datetime()과 ? 를 PostgreSQL 표준으로 번역
    cursor.execute("SELECT COUNT(DISTINCT session_id) as c FROM traffic_logs WHERE (timestamp + INTERVAL '9 hours')::date = %s", (today_str,))
    today_total = cursor.fetchone()['c'] or 0

    labels = []
    total_data = []
    anima_data = []
    table_rows = []
    period_label = "" 

    # ---------------------------------------------------------
    # 📊 1. Supra - Numero 
    # ---------------------------------------------------------
    if mode == 'supra' and sub_mode == 'numero':
        
        if time_unit == 'month':
            target_base = base_kst
            period_label = target_base.strftime('%y %b')
            
            for i in range(11, -1, -1):
                target_month = target_base.month - i 
                target_year = target_base.year       
                
                while target_month <= 0:
                    target_month += 12
                    target_year -= 1
                    
                last_day = calendar.monthrange(target_year, target_month)[1]
                target_date = datetime(target_year, target_month, 1)
                label = target_date.strftime('%y %b') 
                
                start_str = f"{target_year}-{target_month:02d}-01 00:00:00"
                end_str = f"{target_year}-{target_month:02d}-{last_day:02d} 23:59:59"
                
                cursor.execute("""
                    SELECT COUNT(DISTINCT session_id) as t, COUNT(DISTINCT user_id) as a, SUM(duration) as d
                    FROM traffic_logs WHERE (timestamp + INTERVAL '9 hours') BETWEEN %s AND %s
                """, (start_str, end_str))
                res = cursor.fetchone()
                
                v_t, v_a, v_d = (res['t'] or 0) if res else 0, (res['a'] or 0) if res else 0, (res['d'] or 0) if res else 0
                labels.append(label); total_data.append(v_t); anima_data.append(v_a)
                table_rows.append({"date": label, "chronos": format_chronos(v_d), "anima": v_a, "total": v_t})

        elif time_unit == 'week':
            start_of_this_week = base_kst - timedelta(days=(base_kst.weekday() + 1) % 7)
            target_base_sunday = start_of_this_week
            target_base_saturday = target_base_sunday + timedelta(days=6)
            
            period_label = f"{target_base_sunday.strftime('%y.%m.%d.')} - {target_base_saturday.strftime('%y.%m.%d.')}"
            
            for i in range(9, -1, -1):
                sunday = (target_base_sunday - timedelta(weeks=i))
                saturday = sunday + timedelta(days=6)
                
                label = f"{sunday.strftime('%y.%m.%d')}-{saturday.strftime('%y.%m.%d')}."
                
                cursor.execute("""
                    SELECT COUNT(DISTINCT session_id) as t, COUNT(DISTINCT user_id) as a, SUM(duration) as d
                    FROM traffic_logs WHERE (timestamp + INTERVAL '9 hours')::date BETWEEN %s AND %s
                """, (sunday.strftime('%Y-%m-%d'), saturday.strftime('%Y-%m-%d')))
                res = cursor.fetchone()
                
                v_t, v_a, v_d = res['t'] or 0, res['a'] or 0, res['d'] or 0
                labels.append(label); total_data.append(v_t); anima_data.append(v_a)
                table_rows.append({"date": label, "chronos": format_chronos(v_d), "anima": v_a, "total": v_t})

        else: # day
                period_label = f"{base_kst.strftime('%Y.%m.%d.')} ({get_planet_symbol(base_kst.weekday())})"
                
                last_month = None
                for i in range(29, -1, -1):
                    target_date = base_kst - timedelta(days=i) 
                    d_str = target_date.strftime('%Y-%m-%d')
                    
                    planet = get_planet_symbol(target_date.weekday())
                    table_label = f"{target_date.strftime('%Y.%m.%d.')} ({planet})"
                    
                    day = target_date.day
                    suffix = 'th' if 11 <= day <= 13 else {1: 'st', 2: 'nd', 3: 'rd'}.get(day % 10, 'th')
                    day_str = f"{day}{suffix}"
                    
                    cur_month = target_date.strftime('%b') 
                    
                    if last_month != cur_month:
                        chart_label = [day_str, cur_month]
                        last_month = cur_month
                    else:
                        chart_label = day_str
                    
                    cursor.execute("""
                        SELECT COUNT(DISTINCT session_id) as t, COUNT(DISTINCT user_id) as a, SUM(duration) as d
                        FROM traffic_logs WHERE (timestamp + INTERVAL '9 hours')::date = %s
                    """, (d_str,))
                    res = cursor.fetchone()
                    
                    v_t, v_a, v_d = res['t'] or 0, res['a'] or 0, res['d'] or 0
                    
                    labels.append(chart_label)
                    total_data.append(v_t)
                    anima_data.append(v_a)
                    table_rows.append({"date": table_label, "chronos": format_chronos(v_d), "anima": v_a, "total": v_t})

        conn.close()
        return JSONResponse(content={
            "today_total": today_total,
            "period_label": period_label, 
            "chart": {
                "labels": labels,
                "datasets": [
                    {"label": "Total", "data": total_data, "borderColor": "#49dce1", "backgroundColor": "rgba(73, 220, 225, 0.1)"},
                    {"label": "Anima", "data": anima_data, "borderColor": "#ff5252", "backgroundColor": "transparent", "borderDash": [5, 5]}
                ]
            },
            "table": table_rows
        })

    # ---------------------------------------------------------
    # ⏳ 2. Supra - Chronos
    # ---------------------------------------------------------
    elif mode == 'supra' and sub_mode == 'chronos':
        if base_date_str and base_date_str != 'null':
            target_date_obj = base_kst
        else:
            target_date_obj = now_kst - timedelta(days=1)
            
        period_label = f"{target_date_obj.strftime('%Y.%m.%d.')} ({get_planet_symbol(target_date_obj.weekday())})"
        prev_date_obj = target_date_obj - timedelta(days=1)
        
        if target_date_obj.year == now_kst.year and target_date_obj.month == now_kst.month:
            avg_month_obj = (target_date_obj.replace(day=1) - timedelta(days=1)).replace(day=1)
        else:
            avg_month_obj = target_date_obj.replace(day=1)
            
        days_in_avg_month = calendar.monthrange(avg_month_obj.year, avg_month_obj.month)[1]
        
        def get_hourly_data(start_str, end_str, is_avg=False):
            cursor.execute("""
                SELECT hr, COUNT(session_id) as cnt FROM (
                    SELECT session_id, TO_CHAR(MIN(timestamp + INTERVAL '9 hours'), 'HH24') as hr
                    FROM traffic_logs
                    WHERE (timestamp + INTERVAL '9 hours') BETWEEN %s::timestamp AND %s::timestamp
                    GROUP BY session_id
                ) as subq GROUP BY hr
            """, (start_str, end_str))
            
            data_dict = {row['hr']: row['cnt'] for row in cursor.fetchall()}
            result = []
            for h in range(24):
                val = data_dict.get(f"{h:02d}", 0)
                result.append(round(val / days_in_avg_month, 1) if is_avg else val)
            return result
            
        t_data = get_hourly_data(f"{target_date_obj.strftime('%Y-%m-%d')} 00:00:00", f"{target_date_obj.strftime('%Y-%m-%d')} 23:59:59")
        p_data = get_hourly_data(f"{prev_date_obj.strftime('%Y-%m-%d')} 00:00:00", f"{prev_date_obj.strftime('%Y-%m-%d')} 23:59:59")
        a_data = get_hourly_data(f"{avg_month_obj.year}-{avg_month_obj.month:02d}-01 00:00:00", f"{avg_month_obj.year}-{avg_month_obj.month:02d}-{days_in_avg_month:02d} 23:59:59", is_avg=True)
        
        labels = [f"{h:02d}" for h in range(24)]
        t_lbl = f"{calendar.month_abbr[target_date_obj.month]} {target_date_obj.day:02d}"
        p_lbl = f"{calendar.month_abbr[prev_date_obj.month]} {prev_date_obj.day:02d}"
        a_lbl = f"{calendar.month_abbr[avg_month_obj.month]} Avg"
        
        table_rows = [{"time": f"{h:02d}:00-{h:02d}:59", "avg": a_data[h], "prev": p_data[h], "target": t_data[h]} for h in range(24)]
        
        conn.close()
        return JSONResponse(content={
            "today_total": today_total,
            "chronos_mode": True,
            "period_label": period_label,
            "target_date_str": target_date_obj.strftime('%Y-%m-%d'),
            "chart": {
                "labels": labels,
                "datasets": [
                    {"label": a_lbl, "data": a_data, "borderColor": "#cccccc", "borderWidth": 2, "borderDash": [], "pointRadius": 0, "order": 3},
                    {"label": p_lbl, "data": p_data, "borderColor": "#49dce1", "borderWidth": 2, "borderDash": [], "pointRadius": 4, "order": 2},
                    {"label": t_lbl, "data": t_data, "borderColor": "#00d084", "borderWidth": 3, "borderDash": [], "pointRadius": 4, "order": 1}
                ]
            },
            "table": table_rows
        })

    # ---------------------------------------------------------
    # 🌍 3. Supra - Terra
    # ---------------------------------------------------------
    elif mode == 'supra' and sub_mode == 'terra':
        if time_unit == 'month':
            target_base = base_kst
            first_day_this_month = target_base.replace(day=1)
            last_day = calendar.monthrange(target_base.year, target_base.month)[1]
            start_str = first_day_this_month.strftime('%Y-%m-01 00:00:00')
            end_str = f"{target_base.year}-{target_base.month:02d}-{last_day:02d} 23:59:59"
            period_label = target_base.strftime('%y %b') 
        elif time_unit == 'week':
            target_base = base_kst
            start_of_week = target_base - timedelta(days=(target_base.weekday() + 1) % 7) 
            end_of_week = start_of_week + timedelta(days=6)
            start_str = start_of_week.strftime('%Y-%m-%d 00:00:00')
            end_str = end_of_week.strftime('%Y-%m-%d 23:59:59')
            period_label = f"{start_of_week.strftime('%y.%m.%d.')} - {end_of_week.strftime('%y.%m.%d.')}" 
        else: # day
            target_date = base_kst 
            start_str = target_date.strftime('%Y-%m-%d 00:00:00')
            end_str = target_date.strftime('%Y-%m-%d 23:59:59')
            period_label = f"{target_date.strftime('%Y.%m.%d.')} ({get_planet_symbol(target_date.weekday())})" 

        flags = {
            "South Korea": "🇰🇷", "United States": "🇺🇸", "USA": "🇺🇸", "China": "🇨🇳", 
            "Japan": "🇯🇵", "Germany": "🇩🇪", "India": "🇮🇳", "United Kingdom": "🇬🇧", "UK": "🇬🇧",
            "France": "🇫🇷", "Brazil": "🇧🇷", "Italy": "🇮🇹", "Canada": "🇨🇦", "Russia": "🇷🇺",
            "Australia": "🇦🇺", "Mexico": "🇲🇽", "Spain": "🇪🇸", "Indonesia": "🇮🇩", 
            "Netherlands": "🇳🇱", "Saudi Arabia": "🇸🇦", "Turkey": "🇹🇷", "Switzerland": "🇨🇭",
            "Taiwan": "🇹🇼", "Vietnam": "🇻🇳", "Other": "🌐"
        }

        terra_data = []
        total_hits = 0
        try:
            cursor.execute("""
                SELECT country, COUNT(DISTINCT session_id) as cnt 
                FROM traffic_logs 
                WHERE (timestamp + INTERVAL '9 hours') BETWEEN %s AND %s 
                GROUP BY country 
                ORDER BY cnt DESC
            """, (start_str, end_str))
            rows = cursor.fetchall()
            for r in rows:
                c_name = r['country'] if r['country'] and r['country'].strip() != '' else 'Other'
                cnt = r['cnt']
                total_hits += cnt
                found = next((item for item in terra_data if item['name'] == c_name), None)
                if found: found['count'] += cnt
                else: terra_data.append({"name": c_name, "count": cnt})
        except Exception:
            cursor.execute("SELECT COUNT(DISTINCT session_id) as cnt FROM traffic_logs WHERE (timestamp + INTERVAL '9 hours') BETWEEN %s AND %s", (start_str, end_str))
            r = cursor.fetchone()
            if r and r['cnt']:
                total_hits = r['cnt']
                terra_data.append({"name": "Other", "count": total_hits})
        
        terra_data = sorted(terra_data, key=lambda x: x['count'], reverse=True)
        results = []
        for idx, item in enumerate(terra_data):
            pct = round((item['count'] / total_hits * 100), 1) if total_hits > 0 else 0
            flag = flags.get(item['name'], "🌐") 
            results.append({"rank": idx + 1, "name": item['name'], "flag": flag, "count": item['count'], "percent": pct})
            
        conn.close()
        return JSONResponse(content={
            "today_total": today_total, 
            "terra_mode": True, "period_label": period_label, "data": results
        })

    # ---------------------------------------------------------
    # 🔗 3.5 Supra - Routes
    # ---------------------------------------------------------
    elif mode == 'supra' and sub_mode == 'routes':
        if time_unit == 'month':
            target_base = base_kst
            first_day_this_month = target_base.replace(day=1)
            last_day = calendar.monthrange(target_base.year, target_base.month)[1]
            start_str = first_day_this_month.strftime('%Y-%m-01 00:00:00')
            end_str = f"{target_base.year}-{target_base.month:02d}-{last_day:02d} 23:59:59"
            period_label = target_base.strftime('%y %b')
        elif time_unit == 'week':
            target_base = base_kst
            start_of_week = target_base - timedelta(days=(target_base.weekday() + 1) % 7) 
            end_of_week = start_of_week + timedelta(days=6)
            start_str = start_of_week.strftime('%Y-%m-%d 00:00:00')
            end_str = end_of_week.strftime('%Y-%m-%d 23:59:59')
            period_label = f"{start_of_week.strftime('%y.%m.%d.')} - {end_of_week.strftime('%y.%m.%d.')}" 
        else: # day
            target_date = base_kst 
            start_str = target_date.strftime('%Y-%m-%d 00:00:00')
            end_str = target_date.strftime('%Y-%m-%d 23:59:59')
            period_label = f"{target_date.strftime('%Y.%m.%d.')} ({get_planet_symbol(target_date.weekday())})"

        total_hits = 0
        routes_dict = {"Direct / Bookmark": 0, "Search Engine": 0, "Social Media": 0, "External Links": 0}

        try:
            cursor.execute("""
                SELECT referrer, COUNT(DISTINCT session_id) as cnt 
                FROM traffic_logs 
                WHERE (timestamp + INTERVAL '9 hours') BETWEEN %s AND %s 
                GROUP BY referrer
            """, (start_str, end_str))
            rows = cursor.fetchall()
            
            for r in rows:
                ref = r['referrer']
                cnt = r['cnt']
                total_hits += cnt
                
                if not ref or ref.strip() == '' or ref == 'direct':
                    routes_dict["Direct / Bookmark"] += cnt
                elif any(s in ref for s in ['google', 'naver', 'daum', 'bing', 'yahoo']):
                    routes_dict["Search Engine"] += cnt
                elif any(s in ref for s in ['t.co', 'twitter', 'facebook', 'instagram', 'reddit']):
                    routes_dict["Social Media"] += cnt
                else:
                    routes_dict["External Links"] += cnt
                    
        except Exception:
            cursor.execute("SELECT COUNT(DISTINCT session_id) as cnt FROM traffic_logs WHERE (timestamp + INTERVAL '9 hours') BETWEEN %s AND %s", (start_str, end_str))
            r = cursor.fetchone()
            if r and r['cnt']:
                total_hits = r['cnt']
                routes_dict["Direct / Bookmark"] = total_hits
                
        routes_data = [{"name": k, "count": v} for k, v in routes_dict.items() if v > 0]
        routes_data = sorted(routes_data, key=lambda x: x['count'], reverse=True)
        
        icons = { "Direct / Bookmark": "🧭", "Search Engine": "🔍", "Social Media": "💬", "External Links": "🔗" }
        
        results = []
        for idx, item in enumerate(routes_data):
            pct = round((item['count'] / total_hits * 100), 1) if total_hits > 0 else 0
            results.append({
                "rank": idx + 1, "name": item['name'], "icon": icons.get(item['name'], "🔗"), 
                "count": item['count'], "percent": pct
            })
            
        conn.close()
        return JSONResponse(content={
            "today_total": today_total,
            "routes_mode": True,
            "period_label": period_label,
            "data": results
        })

    # ---------------------------------------------------------
    # ⬛ 4. Infra - Nigredo
    # ---------------------------------------------------------
    elif mode == 'infra' and sub_mode == 'nigredo':
        if time_unit == 'month':
            target_base = base_kst
            first_day_this_month = target_base.replace(day=1)
            last_day = calendar.monthrange(target_base.year, target_base.month)[1]
            start_str = first_day_this_month.strftime('%Y-%m-01 00:00:00')
            end_str = f"{target_base.year}-{target_base.month:02d}-{last_day:02d} 23:59:59"
            period_label = target_base.strftime('%y %b')
        elif time_unit == 'week':
            target_base = base_kst
            start_of_week = target_base - timedelta(days=(target_base.weekday() + 1) % 7) 
            end_of_week = start_of_week + timedelta(days=6)
            start_str = start_of_week.strftime('%Y-%m-%d 00:00:00')
            end_str = end_of_week.strftime('%Y-%m-%d 23:59:59')
            period_label = f"{start_of_week.strftime('%y.%m.%d.')} - {end_of_week.strftime('%y.%m.%d.')}" 
        else: # day
            target_date = base_kst 
            start_str = target_date.strftime('%Y-%m-%d 00:00:00')
            end_str = target_date.strftime('%Y-%m-%d 23:59:59')
            period_label = f"{target_date.strftime('%Y.%m.%d.')} ({get_planet_symbol(target_date.weekday())})" 

        nigredo_modules = [
            {"id": "n1", "name": "N1 PRIMA MATERIA", "path_keyword": "n1"},
            {"id": "n2", "name": "N2 PRINCIPIA", "path_keyword": "n2"},
            {"id": "n3", "name": "N3 DOMUS", "path_keyword": "n3"},
            {"id": "n4", "name": "N4 ARCANA", "path_keyword": "n4"},
            {"id": "n5", "name": "N5 SCHEMA", "path_keyword": "n5"},
            {"id": "n6", "name": "N6 DIVISIO", "path_keyword": "n6"},
            {"id": "n7", "name": "N7 HYPOSTASIS", "path_keyword": "n7"},
            {"id": "n8", "name": "N8 CODEX TENEBRIS", "path_keyword": "n8"},
            {"id": "n9", "name": "N9 CHRONOMANTIA", "path_keyword": "n9"}
        ]
        
        table_rows = []
        try:
            for mod in nigredo_modules:
                cursor.execute("""
                    SELECT COUNT(DISTINCT session_id) as numero, SUM(duration) as chronos
                    FROM traffic_logs 
                    WHERE (timestamp + INTERVAL '9 hours') BETWEEN %s AND %s 
                    AND UPPER(module) = UPPER(%s)
                """, (start_str, end_str, mod['path_keyword']))
                res = cursor.fetchone()
                
                numero = res['numero'] or 0
                chronos = format_chronos(res['chronos'] or 0)
                
                table_rows.append({"module": mod['name'], "numero": numero, "chronos": chronos})
        except Exception:
            for mod in nigredo_modules:
                table_rows.append({"module": mod['name'], "numero": 0, "chronos": "0s"})

        conn.close()
        return JSONResponse(content={
            "today_total": today_total,
            "update_time": now_kst.strftime('%H:%M'), 
            "infra_table_mode": True, 
            "period_label": period_label,
            "table": table_rows
        })

    # ---------------------------------------------------------
    # ⚪ 5. Infra - Albedo 
    # ---------------------------------------------------------
    elif mode == 'infra' and sub_mode == 'albedo':
        if time_unit == 'month':
            target_base = base_kst
            first_day_this_month = target_base.replace(day=1)
            last_day = calendar.monthrange(target_base.year, target_base.month)[1]
            start_str = first_day_this_month.strftime('%Y-%m-01 00:00:00')
            end_str = f"{target_base.year}-{target_base.month:02d}-{last_day:02d} 23:59:59"
            period_label = target_base.strftime('%y %b')
        elif time_unit == 'week':
            target_base = base_kst
            start_of_week = target_base - timedelta(days=(target_base.weekday() + 1) % 7) 
            end_of_week = start_of_week + timedelta(days=6)
            start_str = start_of_week.strftime('%Y-%m-%d 00:00:00')
            end_str = end_of_week.strftime('%Y-%m-%d 23:59:59')
            period_label = f"{start_of_week.strftime('%y.%m.%d.')} - {end_of_week.strftime('%y.%m.%d.')}" 
        else: # day
            target_date = base_kst
            start_str = target_date.strftime('%Y-%m-%d 00:00:00')
            end_str = target_date.strftime('%Y-%m-%d 23:59:59')
            period_label = f"{target_date.strftime('%Y.%m.%d.')} ({get_planet_symbol(target_date.weekday())})"

        albedo_modules = [
            {"id": "a1", "name": "A1 CONIUNCTIO", "path_keyword": "a1"},
            {"id": "a2", "name": "A2 COAGULATIO", "path_keyword": "a2"},
            {"id": "a3", "name": "A3 ORDINATIO", "path_keyword": "a3"},
            {"id": "a4", "name": "A4 FIGURA", "path_keyword": "a4"},
            {"id": "a5", "name": "A5 ASPECTUS", "path_keyword": "a5"},
            {"id": "a6", "name": "A6 MULTIPLICATIO", "path_keyword": "a6"},
            {"id": "a7", "name": "A7 EVOCATIONES", "path_keyword": "a7"},
            {"id": "a8", "name": "A8 CODEX LUCIS", "path_keyword": "a8"},
            {"id": "a9", "name": "A9 SYNCHRONICUM", "path_keyword": "a9"},
            {"id": "a10", "name": "A10 RESONANTIA", "path_keyword": "a10"}
        ]
        
        table_rows = []
        try:
            for mod in albedo_modules:
                cursor.execute("""
                    SELECT COUNT(DISTINCT session_id) as numero, SUM(duration) as chronos
                    FROM traffic_logs 
                    WHERE (timestamp + INTERVAL '9 hours') BETWEEN %s AND %s 
                    AND UPPER(module) = UPPER(%s)
                """, (start_str, end_str, mod['path_keyword']))
                res = cursor.fetchone()
                
                v_numero = res['numero'] or 0
                v_chronos = format_chronos(res['chronos'] or 0)
                
                table_rows.append({
                    "module": mod['name'],
                    "numero": v_numero,
                    "chronos": v_chronos
                })
        except Exception:
            for mod in albedo_modules:
                table_rows.append({"module": mod['name'], "numero": 0, "chronos": "0s"})

        conn.close()
        return JSONResponse(content={
            "today_total": today_total,
            "update_time": now_kst.strftime('%H:%M'),
            "infra_table_mode": True, 
            "period_label": period_label,
            "table": table_rows
        })

    # ---------------------------------------------------------
    # 🟡 6. Infra - Citrinitas
    # ---------------------------------------------------------
    elif mode == 'infra' and sub_mode == 'citrinitas':
        if time_unit == 'month':
            target_base = base_kst
            first_day_this_month = target_base.replace(day=1)
            last_day = calendar.monthrange(target_base.year, target_base.month)[1]
            start_str = first_day_this_month.strftime('%Y-%m-01 00:00:00')
            end_str = f"{target_base.year}-{target_base.month:02d}-{last_day:02d} 23:59:59"
            period_label = target_base.strftime('%y %b') 
        elif time_unit == 'week':
            target_base = base_kst
            start_of_week = target_base - timedelta(days=(target_base.weekday() + 1) % 7) 
            end_of_week = start_of_week + timedelta(days=6)
            start_str = start_of_week.strftime('%Y-%m-%d 00:00:00')
            end_str = end_of_week.strftime('%Y-%m-%d 23:59:59')
            period_label = f"{start_of_week.strftime('%y.%m.%d.')} - {end_of_week.strftime('%y.%m.%d.')}" 
        else: # day
            target_date = base_kst 
            start_str = target_date.strftime('%Y-%m-%d 00:00:00')
            end_str = target_date.strftime('%Y-%m-%d 23:59:59')
            period_label = f"{target_date.strftime('%Y.%m.%d.')} ({get_planet_symbol(target_date.weekday())})" 

        citrinitas_modules = [
            {"id": "c1", "name": "C1 TABULA", "path_keyword": "C1"},
            {"id": "c2", "name": "C2 HORA OCCULTA", "path_keyword": "C2"},
            {"id": "c2_aleph", "name": "&nbsp;&nbsp;&nbsp;✦ ALEPH", "path_keyword": "C2_ALEPH"},
            {"id": "c2_mem", "name": "&nbsp;&nbsp;&nbsp;✦ MEM", "path_keyword": "C2_MEM"},
            {"id": "c2_shin", "name": "&nbsp;&nbsp;&nbsp;✦ SHIN", "path_keyword": "C2_SHIN"},
            {"id": "c3", "name": "C3 ILLUMINATIO", "path_keyword": "C3"},
            {"id": "c3_nefesh", "name": "&nbsp;&nbsp;&nbsp;✦ NEFESH", "path_keyword": "C3_NEFESH"},
            {"id": "c3_ruach", "name": "&nbsp;&nbsp;&nbsp;✦ RUACH", "path_keyword": "C3_RUACH"},
            {"id": "c3_neshamah", "name": "&nbsp;&nbsp;&nbsp;✦ NESHAMAH", "path_keyword": "C3_NESHAMAH"},
            {"id": "c3_chayah", "name": "&nbsp;&nbsp;&nbsp;✦ CHAYAH", "path_keyword": "C3_CHAYAH"},
            {"id": "c3_yechidah", "name": "&nbsp;&nbsp;&nbsp;✦ YECHIDAH", "path_keyword": "C3_YECHIDAH"}
        ]
        
        table_rows = []
        try:
            for mod in citrinitas_modules:
                cursor.execute("""
                    SELECT COUNT(DISTINCT session_id) as numero, SUM(duration) as chronos
                    FROM traffic_logs 
                    WHERE (timestamp + INTERVAL '9 hours') BETWEEN %s AND %s 
                    AND UPPER(module) = UPPER(%s)
                """, (start_str, end_str, mod['path_keyword']))
                res = cursor.fetchone()
                
                v_numero = res['numero'] or 0
                v_chronos = format_chronos(res['chronos'] or 0)
                
                table_rows.append({
                    "module": mod['name'],
                    "numero": v_numero,
                    "chronos": v_chronos
                })
        except Exception:
            for mod in citrinitas_modules:
                table_rows.append({"module": mod['name'], "numero": 0, "chronos": "0s"})

        conn.close()
        return JSONResponse(content={
            "today_total": today_total,
            "update_time": now_kst.strftime('%H:%M'),
            "infra_table_mode": True, 
            "period_label": period_label,
            "table": table_rows
        })

    # ---------------------------------------------------------
    # 🔴 7. Infra - Rubedo
    # ---------------------------------------------------------
    elif mode == 'infra' and sub_mode == 'rubedo':
        view_mode = request.query_params.get('view_mode', 'module')
        
        if time_unit == 'month':
            target_base = base_kst
            first_day_this_month = target_base.replace(day=1)
            last_day = calendar.monthrange(target_base.year, target_base.month)[1]
            start_str = first_day_this_month.strftime('%Y-%m-01 00:00:00')
            end_str = f"{target_base.year}-{target_base.month:02d}-{last_day:02d} 23:59:59"
            period_label = target_base.strftime('%y %b') 
        elif time_unit == 'week':
            target_base = base_kst
            start_of_week = target_base - timedelta(days=(target_base.weekday() + 1) % 7) 
            end_of_week = start_of_week + timedelta(days=6)
            start_str = start_of_week.strftime('%Y-%m-%d 00:00:00')
            end_str = end_of_week.strftime('%Y-%m-%d 23:59:59')
            period_label = f"{start_of_week.strftime('%y.%m.%d.')} - {end_of_week.strftime('%y.%m.%d.')}" 
        else: # day
            target_date = base_kst 
            start_str = target_date.strftime('%Y-%m-%d 00:00:00')
            end_str = target_date.strftime('%Y-%m-%d 23:59:59')
            period_label = f"{target_date.strftime('%Y.%m.%d.')} ({get_planet_symbol(target_date.weekday())})" 

        table_rows = []
        
        if view_mode == 'module':
            cursor.execute("SELECT COUNT(DISTINCT session_id) as n, SUM(duration) as c FROM traffic_logs WHERE (timestamp + INTERVAL '9 hours') BETWEEN %s AND %s AND module = 'R1'", (start_str, end_str))
            r1_main = cursor.fetchone()
            
            import re
            # 🚀 [수복 3]: LIKE 구문 내의 % 기호는 psycopg2 환경에서 반드시 %%로 이스케이프해야 합니다!
            cursor.execute("""
                SELECT module, COUNT(DISTINCT session_id) as n, SUM(duration) as c 
                FROM traffic_logs 
                WHERE (timestamp + INTERVAL '9 hours') BETWEEN %s AND %s AND (module LIKE 'R1_%%' OR module LIKE 'r1_%%')
                GROUP BY module ORDER BY n DESC
            """, (start_str, end_str))
            
            r1_details = []
            for r in cursor.fetchall():
                clean_id = re.sub(r'^[rR]1_', '', r['module'])
                r1_details.append({
                    "id": clean_id, 
                    "numero": r['n'], 
                    "chronos": format_chronos(r['c'])
                })

            if len(r1_details) == 0:
                r1_details.append({"id": "Waiting for traffic...", "numero": 0, "chronos": "0s"})
            
            cursor.execute("SELECT COUNT(DISTINCT session_id) as n, SUM(duration) as c FROM traffic_logs WHERE (timestamp + INTERVAL '9 hours') BETWEEN %s AND %s AND module = 'R2'", (start_str, end_str))
            r2_main = cursor.fetchone()
            
            table_rows = [
                {"module": "R1 CORPUS HERMETICUM", "numero": r1_main['n'] or 0, "chronos": format_chronos(r1_main['c'] or 0), "details": r1_details, "has_detail": True},
                {"module": "R2 SABIAN SYMBOL", "numero": r2_main['n'] or 0, "chronos": format_chronos(r2_main['c'] or 0), "has_detail": False}
            ]
        else: # grimoire 모드
            # 🚀 [수복 3]: 여기도 마찬가지로 RUBEDO_%% 로 수정!
            cursor.execute("""
                SELECT REPLACE(compiler_id, 'RUBEDO_', '') as module, COUNT(*) as n 
                FROM grimoire_logs 
                WHERE (timestamp + INTERVAL '9 hours') BETWEEN %s AND %s AND compiler_id LIKE 'RUBEDO_%%'
                GROUP BY compiler_id ORDER BY n DESC, compiler_id ASC
            """, (start_str, end_str))
            table_rows = [{"module": r['module'], "numero": r['n']} for r in cursor.fetchall()]

        conn.close()
        return JSONResponse(content={
            "today_total": today_total,
            "update_time": now_kst.strftime('%H:%M'),
            "rubedo_mode": True,
            "view_mode": view_mode,
            "period_label": period_label,
            "table": table_rows
        })

    # ---------------------------------------------------------
    # 🔮 8. Infra - Ritual
    # ---------------------------------------------------------
    elif mode == 'infra' and sub_mode == 'ritual':
        if time_unit == 'month':
            target_base = base_kst
            first_day_this_month = target_base.replace(day=1)
            last_day = calendar.monthrange(target_base.year, target_base.month)[1]
            start_str = first_day_this_month.strftime('%Y-%m-01 00:00:00')
            end_str = f"{target_base.year}-{target_base.month:02d}-{last_day:02d} 23:59:59"
            period_label = target_base.strftime('%y %b') 
        elif time_unit == 'week':
            target_base = base_kst
            start_of_week = target_base - timedelta(days=(target_base.weekday() + 1) % 7) 
            end_of_week = start_of_week + timedelta(days=6)
            start_str = start_of_week.strftime('%Y-%m-%d 00:00:00')
            end_str = end_of_week.strftime('%Y-%m-%d 23:59:59')
            period_label = f"{start_of_week.strftime('%y.%m.%d.')} - {end_of_week.strftime('%y.%m.%d.')}" 
        else: # day
            target_date = base_kst 
            start_str = target_date.strftime('%Y-%m-%d 00:00:00')
            end_str = target_date.strftime('%Y-%m-%d 23:59:59')
            period_label = f"{target_date.strftime('%Y.%m.%d.')} ({get_planet_symbol(target_date.weekday())})" 

        try:
            cursor.execute("""
                SELECT UPPER(module) as mod_name, COUNT(*) as numero
                FROM traffic_logs 
                WHERE (timestamp + INTERVAL '9 hours') BETWEEN %s AND %s 
                GROUP BY UPPER(module)
            """, (start_str, end_str))
            
            counts = {row['mod_name']: row['numero'] for row in cursor.fetchall()}
            
            prima_val = counts.get('PRIMA_MATERIA', 0)
            me_val = counts.get('RITUAL_ME_SEED', 0)
            
            normal_val = counts.get('ANAMNESIS_NORMAL', 0)
            hidden_val = counts.get('ANAMNESIS_HIDDEN', 0)
            anamnesis_total = normal_val + hidden_val
            
            reincarnation_val = counts.get('REINCARNATION', 0)
            ritual_val = counts.get('RITUAL_BYPASS', 0)
            
            table_rows = [
                {"module": "PRIMA MATERIA", "numero": prima_val},
                {"module": "&nbsp;&nbsp;&nbsp;✦ [me]", "numero": me_val},
                {"module": "ANAMNESIS", "numero": anamnesis_total},
                {"module": "&nbsp;&nbsp;&nbsp;✦ ANAMNESIS", "numero": normal_val},
                {"module": "&nbsp;&nbsp;&nbsp;✦ HIDDEN", "numero": hidden_val},
                {"module": "REINCARNATION", "numero": reincarnation_val},
                {"module": "RITUAL", "numero": ritual_val}
            ]
        except Exception:
            table_rows = [
                {"module": "PRIMA MATERIA", "numero": 0},
                {"module": "&nbsp;&nbsp;&nbsp;✦ [me]", "numero": 0},
                {"module": "ANAMNESIS", "numero": 0},
                {"module": "&nbsp;&nbsp;&nbsp;✦ ANAMNESIS", "numero": 0},
                {"module": "&nbsp;&nbsp;&nbsp;✦ HIDDEN", "numero": 0},
                {"module": "REINCARNATION", "numero": 0},
                {"module": "RITUAL", "numero": 0}
            ]

        conn.close()
        return JSONResponse(content={
            "today_total": today_total,
            "update_time": now_kst.strftime('%H:%M'),
            "infra_table_mode": True, 
            "hide_chronos": True,
            "period_label": period_label,
            "table": table_rows
        })

    # =========================================================
    # 📖 9. Infra - Grimoire 
    # =========================================================
    elif mode == 'infra' and sub_mode == 'grimoire':
        if time_unit == 'month':
            target_base = base_kst
            first_day_this_month = target_base.replace(day=1)
            last_day = calendar.monthrange(target_base.year, target_base.month)[1]
            start_str = first_day_this_month.strftime('%Y-%m-01 00:00:00')
            end_str = f"{target_base.year}-{target_base.month:02d}-{last_day:02d} 23:59:59"
            period_label = target_base.strftime('%y %b') 
        elif time_unit == 'week':
            target_base = base_kst
            start_of_week = target_base - timedelta(days=(target_base.weekday() + 1) % 7) 
            end_of_week = start_of_week + timedelta(days=6)
            start_str = start_of_week.strftime('%Y-%m-%d 00:00:00')
            end_str = end_of_week.strftime('%Y-%m-%d 23:59:59')
            period_label = f"{start_of_week.strftime('%y.%m.%d.')} - {end_of_week.strftime('%y.%m.%d.')}" 
        else: # day
            target_date = base_kst 
            start_str = target_date.strftime('%Y-%m-%d 00:00:00')
            end_str = target_date.strftime('%Y-%m-%d 23:59:59')
            period_label = f"{target_date.strftime('%Y.%m.%d.')} ({get_planet_symbol(target_date.weekday())})" 

        try:
            # 🚀 [수복 3]: 여기도 마찬가지로 RUBEDO_%% 로 수정!
            cursor.execute("""
                SELECT compiler_id as module, COUNT(*) as numero
                FROM grimoire_logs 
                WHERE (timestamp + INTERVAL '9 hours') BETWEEN %s AND %s 
                AND compiler_id NOT LIKE 'RUBEDO_%%'
                GROUP BY compiler_id
                ORDER BY numero DESC, compiler_id ASC
            """, (start_str, end_str))
            
            table_rows = [{"module": row['module'], "numero": row['numero']} for row in cursor.fetchall()]

        except Exception:
            table_rows = []

        conn.close()
        return JSONResponse(content={
            "today_total": today_total,
            "update_time": now_kst.strftime('%H:%M'),
            "infra_table_mode": True, 
            "hide_chronos": True,
            "period_label": period_label,
            "table": table_rows
        })

    conn.close()
    return JSONResponse(content={"error": "Not implemented"})

# ---------------------------------------------------------
# ✍️ [Lv3: Creation] - DB 기반 영구 저장 시스템 구축 완료
# ---------------------------------------------------------

# 🔑 경로 설정 (이미지 업로드 등 물리적 파일 저장을 위해 복구 및 유지)
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
APP_DIR = os.path.dirname(CURRENT_DIR)

@router.get("/api/godmode/tree")
async def get_god_mode_tree():
    conn = get_db()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    cursor.execute("SELECT * FROM theory_scrolls")
    rows = cursor.fetchall()
    cursor.close()
    conn.close()

    tree = {
        "r1": {"hermeticum": [], "archivum": []},
        "r2": {
            "sign": [], 
            "symbol": {s: [] for s in ['aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo', 'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces']}
        }
    }

    for row in rows:
        mod = row['module']
        sub = row['subpath']
        
        # 프론트엔드가 요구하는 JSON 메타데이터 규격으로 조립
        meta = {
            "id": row['entry_id'],
            "title_en": row['title_en'] or "",
            "title_ko": row['title_ko'] or "",
            "status": row['status'],
            "pinned": row['pinned'],
            "pin_order": row['pin_order']
        }
        # 트리에 렌더링할 대표 제목 (한글 우선, 없으면 영어, 없으면 ID)
        meta['title'] = meta['title_ko'] if meta['title_ko'] else (meta['title_en'] if meta['title_en'] else meta['id'])

        if mod == 'r1' and sub in tree['r1']:
            tree['r1'][sub].append(meta)
        elif mod == 'r2':
            if sub == 'sign':
                tree['r2']['sign'].append(meta)
            elif sub in tree['r2']['symbol']:
                tree['r2']['symbol'][sub].append(meta)

    # 🚀 자연스러운 정렬(Natural Sort) 적용
    def natural_sort_key(x):
        return [int(c) if c.isdigit() else c.lower() for c in re.split(r'(\d+)', x['id'])]

    for sub in tree['r1']: tree['r1'][sub].sort(key=natural_sort_key)
    tree['r2']['sign'].sort(key=natural_sort_key)
    for sign in tree['r2']['symbol']: tree['r2']['symbol'][sign].sort(key=natural_sort_key)

    return tree

@router.post("/api/godmode/update_pins")
async def update_pins(request: Request, subpath: str = Form(...), pins: str = Form(...)):
    if not request.cookies.get("god_token"): return {"status": "error"}
    
    try:
        pinned_ids = json.loads(pins)
        conn = get_db()
        cursor = conn.cursor()
        
        # 1. 해당 subpath의 모든 핀 초기화
        cursor.execute("UPDATE theory_scrolls SET pinned = FALSE, pin_order = NULL WHERE subpath = %s", (subpath,))
        
        # 2. 넘어온 배열 순서대로 핀 부여
        for idx, entry_id in enumerate(pinned_ids):
            cursor.execute("UPDATE theory_scrolls SET pinned = TRUE, pin_order = %s WHERE subpath = %s AND entry_id = %s", (idx, subpath, entry_id))
            
        conn.commit()
        cursor.close()
        conn.close()
        return {"status": "success"}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@router.post("/api/godmode/create")
async def create_scroll(request: Request, subpath: str = Form(...), entry_id: str = Form(...)):
    current_user = request.cookies.get("session_user_id")
    god_token = request.cookies.get("god_token")
    if current_user != "admin@tetramegistus.com" or not god_token:
        return {"status": "error", "message": "Unauthorized soul."}
    
    module = "r1" # 생성은 기본적으로 R1에서 일어남
    
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM theory_scrolls WHERE module=%s AND subpath=%s AND entry_id=%s", (module, subpath, entry_id))
    if cursor.fetchone():
        cursor.close(); conn.close()
        return {"status": "error", "message": "The scroll already exists in the void."}
        
    try:
        cursor.execute("""
            INSERT INTO theory_scrolls (module, subpath, entry_id, status) 
            VALUES (%s, %s, %s, 'draft')
        """, (module, subpath, entry_id))
        conn.commit()
        cursor.close()
        conn.close()
        return {"status": "success", "message": f"New scroll '{entry_id}' manifested."}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@router.post("/api/godmode/delete")
async def delete_scroll(request: Request, target_path: str = Form(...), otp_code: str = Form(...)):
    current_user = request.cookies.get("session_user_id")
    god_token = request.cookies.get("god_token")
    if current_user != "admin@tetramegistus.com" or not god_token:
        return {"status": "error", "message": "Unauthorized soul."}
        
    if not verify_google_otp(otp_code): return {"status": "error", "message": "The Void rejects your code."}

    try:
        parts = target_path.split("/")
        if len(parts) != 3 or parts[0] != "r1":
            return {"status": "error", "message": "Invalid target. R2 is eternal."}
            
        module, subpath, entry_id = parts
        
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM theory_scrolls WHERE module=%s AND subpath=%s AND entry_id=%s", (module, subpath, entry_id))
        deleted_count = cursor.rowcount
        conn.commit()
        cursor.close()
        conn.close()
        
        if deleted_count == 0:
            return {"status": "error", "message": "Scroll not found in the void."}
        return {"status": "success", "message": "The scroll has been eradicated."}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@router.get("/api/godmode/load")
async def load_scroll(request: Request, module: str, path: str, lang: str):
    if not request.cookies.get("god_token"): return {"status": "error"}

    # path 파싱 로직
    parts = path.split('/')
    if module == 'r1':
        subpath, entry_id = parts
    else:
        if parts[0] == 'sign': subpath = 'sign'; entry_id = parts[1]
        else: subpath = parts[0]; entry_id = parts[1]

    conn = get_db()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    cursor.execute("SELECT * FROM theory_scrolls WHERE module=%s AND subpath=%s AND entry_id=%s", (module, subpath, entry_id))
    row = cursor.fetchone()
    cursor.close()
    conn.close()

    if not row:
        return {"status": "success", "title": "", "content": ""}

    title = row.get(f"title_{lang}") or ""
    content = row.get(f"content_{lang}") or ""
    return {"status": "success", "title": title, "content": content}

@router.post("/api/godmode/save")
async def save_scroll(request: Request, module: str = Form(...), path: str = Form(...), lang: str = Form(...), title: str = Form(...), content: str = Form(...), is_post: str = Form("false")):
    if not request.cookies.get("god_token"): return {"status": "error"}

    is_published = is_post.lower() == "true"
    new_status = "published" if is_published else "draft"

    parts = path.split('/')
    if module == 'r1':
        subpath, entry_id = parts
    else:
        if parts[0] == 'sign': subpath = 'sign'; entry_id = parts[1]
        else: subpath = parts[0]; entry_id = parts[1]

    conn = get_db()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    cursor.execute("SELECT id FROM theory_scrolls WHERE module=%s AND subpath=%s AND entry_id=%s", (module, subpath, entry_id))
    existing = cursor.fetchone()
    
    title_col = f"title_{lang}"
    content_col = f"content_{lang}"
    
    try:
        if existing:
            query = f"UPDATE theory_scrolls SET {title_col} = %s, {content_col} = %s, status = %s WHERE id = %s"
            cursor.execute(query, (title, content, new_status, existing['id']))
        else:
            query = f"INSERT INTO theory_scrolls (module, subpath, entry_id, {title_col}, {content_col}, status) VALUES (%s, %s, %s, %s, %s, %s)"
            cursor.execute(query, (module, subpath, entry_id, title, content, new_status))
            
        conn.commit()
        cursor.close()
        conn.close()
        return {"status": "success", "message": "The scroll has been preserved in the DB."}
    except Exception as e:
        return {"status": "error", "message": f"Ritual failed: {str(e)}"}

@router.post("/api/godmode/upload")
async def upload_asset(
    request: Request,
    module: str = Form(...),
    path: str = Form(...),
    file: UploadFile = File(...)
):
    god_token = request.cookies.get("god_token")
    if not god_token:
        return {"status": "error", "message": "Unauthorized."}

    # 파일이 저장될 절대 경로 설정 (예: app/static/uploads/r1/hermeticum/문서이름/)
    subpath, entry_id = path.split('/')
    upload_dir = os.path.join(APP_DIR, "static", "uploads", module, subpath, entry_id)
    
    # 폴더가 없으면 생성
    os.makedirs(upload_dir, exist_ok=True)
    
    # 디스크에 물리적 저장
    file_path = os.path.join(upload_dir, file.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    # 에디터가 읽을 수 있는 URL 반환
    file_url = f"/static/uploads/{module}/{subpath}/{entry_id}/{file.filename}"
    
    return {"status": "success", "url": file_url, "name": file.filename}

from fastapi.responses import JSONResponse

# --- 🚀 God Token 수명 연장 API ---
@router.post("/api/godmode/extend_token")
async def extend_god_token(request: Request):
    current_user = request.cookies.get("session_user_id")
    god_token = request.cookies.get("god_token")
    
    if current_user != "admin@tetramegistus.com" or not god_token:
        print(f"[💀 GOD MODE REJECTED]: Unauthorized extension attempt by {current_user}")
        return JSONResponse(status_code=401, content={"status": "error", "message": "Unauthorized soul."})
        
    content = {"status": "success", "message": "God Token extended."}
    res = JSONResponse(content=content)
    
    # 기존 토큰 수명을 7200초로 갱신
    res.set_cookie(
        key="god_token",
        value=god_token,
        httponly=True,
        max_age=7200,
        path="/",
        samesite="lax",
        secure=False
    )
    
    # 🚀 CMD 터미널 출력용 시스템 로그
    print(f"✨ [GOD MODE RITUAL]: The void acknowledges {current_user}. God Token extended (7200s).")
    
    return res