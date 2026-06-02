# core/astrology/domus.py — v9.5 Dignity Pass-through

from core.astrology.engine import format_dms_pretty, TROPICAL_SIGNS, SYMBOL_MAP
from core.astrology.divisions.decan import get_decan
from core.astrology.divisions.duad import get_duad
from core.astrology.divisions.dodecatemoria import get_dodecatemoria
from core.astrology.divisions.egyptian_bounds import get_egyptian_bounds
from core.astrology.divisions.sabian_engine import get_sabian_index

# 0:Aries ... 7:Scorpio ... 10:Aquarius, 11:Pisces
DOMUS_RULERS = [
    ["Mars"],             # Aries
    ["Venus"],            # Taurus
    ["Mercury"],          # Gemini
    ["Moon"],             # Cancer
    ["Sun"],              # Leo
    ["Mercury"],          # Virgo
    ["Venus"],            # Libra
    ["Mars", "Pluto"],    # Scorpio (Dual)
    ["Jupiter"],          # Sagittarius
    ["Saturn"],           # Capricorn
    ["Saturn", "Uranus"], # Aquarius (Dual)
    ["Jupiter", "Neptune"]# Pisces (Dual)
]

def analyze_house_ranges(cusps_input):
    domus_list = []
    raw_cusps = {}
    for k, v in cusps_input.items():
        if isinstance(v, dict): raw_cusps[k] = float(v.get('longitude', 0.0))
        else: raw_cusps[k] = float(v)
    
    for i in range(1, 13):
        curr = raw_cusps[i]
        next_c = raw_cusps[i+1] if i < 12 else raw_cusps[1]
        size = (next_c - curr) % 360
        if size == 0: size = 360
        
        if int(curr/30) == int(next_c/30) and size < 30:
            range_str = f"{round(size)} ({round(size)})"
        else:
            rem = 30 - (curr % 30)
            enter = next_c % 30
            middle_span = size - (rem + enter)
            if middle_span > 1.0: 
                intercept_count = int(round(middle_span / 30))
                intercept_str = "/".join(["30"] * intercept_count)
                range_str = f"{round(size)} ({round(rem)}/{intercept_str}/{round(enter)})"
            else:
                range_str = f"{round(size)} ({round(rem)}/{round(enter)})"

        sign_id = int(curr / 30) % 12
        sign_name = TROPICAL_SIGNS[sign_id] 
        
        # Returns List (e.g. ["Mars", "Pluto"])
        rulers_list = DOMUS_RULERS[sign_id]
        
        deg_in_sign = curr % 30
        
        label = f"{i}h cusp"
        if i == 1: label = "Asc."
        elif i == 4: label = "I.C."
        elif i == 7: label = "Dsc."
        elif i == 10: label = "M.C."

        domus_list.append({
            "house_num": i,
            "label": label,
            "lon": curr,
            "dms": format_dms_pretty(curr),
            "range_str": range_str,
            "ruler": rulers_list,
            
            # 🔥 [Anaretic Injection]: 여기서 커스프의 29도 여부를 계산해서 프론트로 넘깁니다!
            "is_anaretic": deg_in_sign >= 29.0,
            
            "duad": SYMBOL_MAP.get(get_duad(sign_name, deg_in_sign), "-"),
            "dodeca": SYMBOL_MAP.get(get_dodecatemoria(deg_in_sign), "-"),
            "decan": SYMBOL_MAP.get(get_decan(sign_name, deg_in_sign), "-"),
            "bound": SYMBOL_MAP.get(get_egyptian_bounds(sign_name, deg_in_sign), "-"),
            "sabian_index": get_sabian_index(curr)
        })
    return domus_list

def assign_houses_to_planets(planets, cusps_input):
    c_lons = {}
    for k, v in cusps_input.items():
        if isinstance(v, dict): c_lons[k] = float(v.get('longitude', 0.0))
        else: c_lons[k] = float(v)
    
    for p_name, p_data in planets.items():
        if 'longitude' not in p_data: continue
        p_lon = p_data['longitude']
        found_house = 12
        for i in range(1, 13):
            curr = c_lons[i]
            nxt = c_lons[i+1] if i < 12 else c_lons[1]
            if curr < nxt:
                if curr <= p_lon < nxt: found_house = i; break
            else:
                if curr <= p_lon < 360 or 0 <= p_lon < nxt: found_house = i; break
        p_data['house'] = found_house
    return planets

def sort_contents_by_house(planets, lots, vertex, syzygy, cusps_simple=None):
    HERMETIC_TARGETS = [
        "Fortune", "Spirit", "Eros", "Necessity", "Courage", "Victory", "Nemesis",
        "Syzygy", "Vertex", "Anti-Vertex"
    ]
    CATS = {
        "planets": ["Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune", "Pluto", "Mean Lilith", "True Lilith", "North Node (t)", "South Node (t)", "Rahu", "Ketu"],
        "asteroids": ["Chiron", "Ceres", "Juno", "Pallas", "Vesta", "Eros", "Psyche", "Asteroid Lilith", "Moira", "Klotho", "Lachesis", "Atropos"]
    }

    pool = {**planets}
    if lots: pool.update(lots)
    if vertex: pool.update(vertex)
    if syzygy: pool['Syzygy'] = syzygy

    contents = {i: {"planets": [], "asteroids": [], "hermetic": []} for i in range(1, 13)}

    for name, obj in pool.items():
        if not obj: continue
        
        h_idx = obj.get('house', 1)
        raw_lon = obj.get('longitude')
        if raw_lon is None: raw_lon = obj.get('value', 0.0)
        try: sort_lon = float(raw_lon)
        except: sort_lon = 0.0

        target_cat = None
        display_name = name

        if name.startswith("Lot of") or name in ["Syzygy", "Vertex", "Anti-Vertex"]:
            target_cat = "hermetic"
            display_name = name.replace("Lot of ", "")

        if not target_cat:
            for p in CATS['planets']:
                if p.lower() == name.lower() or (name.lower().startswith(p.lower()) and "Node" in name):
                    target_cat = "planets"; break
        
        if not target_cat:
            for a in CATS['asteroids']:
                if a.lower() == name.lower(): target_cat = "asteroids"; break

        if target_cat:
            contents[h_idx][target_cat].append({
                "name": display_name,
                "dms": obj.get('dms', '-'),
                "is_retro": obj.get('is_retrograde', False),
                "lon": sort_lon,
                "dignity": obj.get('dignity') # 🚀 [New]: Dignity 전달
            })

    # 🚀 [수정 완료]: 커스프 기준 상대 각도 정렬
    for h_idx in contents:
        # 라우터에서 cusps_simple을 넘겨준 경우
        if cusps_simple and h_idx in cusps_simple:
            cusp_lon = cusps_simple[h_idx]
            for cat in contents[h_idx]:
                # 천체 경도에서 커스프 경도를 빼고 360으로 나눈 나머지로 정렬 (하우스 안에서의 실제 순서)
                contents[h_idx][cat].sort(key=lambda x: (x['lon'] - cusp_lon) % 360)
        else:
            # Fallback (안전장치): cusps_simple이 없으면 기존처럼 절대 경도 정렬
            for cat in contents[h_idx]:
                contents[h_idx][cat].sort(key=lambda x: x['lon'])

    return contents