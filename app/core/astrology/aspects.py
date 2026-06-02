# app/core/astrology/aspects.py
import math
import sys

# 1. Aspect Definitions
ASPECT_DEFINITIONS = {
    "Major": {
        "Conjunction": {"angle": 0, "orb": 8.0, "code": "CNJ"},
        "Opposition": {"angle": 180, "orb": 8.0, "code": "OPP"},
        "Trine": {"angle": 120, "orb": 6.0, "code": "TRI"},
        "Square": {"angle": 90, "orb": 6.0, "code": "SQR"},
        "Sextile": {"angle": 60, "orb": 4.0, "code": "SEX"},
    },
    "Minor": {
        "Quincunx": {"angle": 150, "orb": 2.0, "code": "QBX"},
        "Sesquiquadrate": {"angle": 135, "orb": 1.0, "code": "SQQ"},
        "Quintile": {"angle": 72, "orb": 1.0, "code": "QNT"},
        "Septile": {"angle": 51.43, "orb": 0.5, "code": "SPT"}, 
        "Octile": {"angle": 45, "orb": 1.0, "code": "OCT"}, 
        "Novile": {"angle": 40, "orb": 0.5, "code": "NOV"},
        "Decile": {"angle": 36, "orb": 1.0, "code": "DEC"},
        "Undecile": {"angle": 32.73, "orb": 0.5, "code": "UND"},
        "Semi-sextile": {"angle": 30, "orb": 1.0, "code": "SSX"},
    }
}

def get_angular_distance(p1, p2):
    """두 경도 간의 최단 각거리 계산"""
    diff = abs(p1 - p2)
    return diff if diff <= 180 else 360 - diff

def check_aspect(distance, orb_tightness=1.0):
    """주어진 거리가 특정 어스펙트 범위에 있는지 확인"""
    for category, aspects in ASPECT_DEFINITIONS.items():
        for name, data in aspects.items():
            target = data["angle"]
            allowed_orb = data["orb"] * orb_tightness
            actual_orb = abs(distance - target)
            
            if actual_orb <= allowed_orb:
                return {
                    "name": name,
                    "type": category,
                    "orb": actual_orb
                }
    return None

def calculate_all_aspects(bodies_data, orb_tightness=1.0, mode='unus'):
    """
    [v19.5.1 Patch]: 모든 천체 간의 어스펙트를 연산.
    Intersectus 모드 시 시스템 간(_1 vs _2) 관계 식별 논리 포함.
    """
    print(f"[DEBUG-ASPECTS] Calculating for {len(bodies_data)} bodies in {mode} mode...")
    sys.stdout.flush()
    
    aspects_list = []
    keys = list(bodies_data.keys())
    
    count = 0
    try:
        for i in range(len(keys)):
            for j in range(i + 1, len(keys)):
                k1, k2 = keys[i], keys[j]
                
                # 1. 🔑 Intersectus 모드에서의 시스템 식별
                # k1, k2가 각각 어떤 시스템(_1, _2) 소속인지 확인
                # (필요 시 특정 시스템 간의 관계만 필터링하거나 가중치를 두는 로직 확장 가능)
                
                # Safety Check
                v1, v2 = bodies_data[k1], bodies_data[k2]
                if v1 is None or v2 is None: continue
                
                try:
                    lon1 = float(v1)
                    lon2 = float(v2)
                except:
                    continue

                dist = get_angular_distance(lon1, lon2)
                res = check_aspect(dist, orb_tightness)
                
                if res:
                    aspects_list.append({
                        "p1": k1,
                        "p2": k2,
                        "aspect": res["name"],
                        "type": res["type"],
                        "orb": round(res["orb"], 4),
                        "angle": round(dist, 4)
                    })
                count += 1
                
        print(f"[DEBUG-ASPECTS] Finished. Comparisons: {count}, Aspects found: {len(aspects_list)}")
        sys.stdout.flush()
        
    except Exception as e:
        print(f"[ERROR-ASPECTS] {str(e)}")
        sys.stdout.flush()
        
    return aspects_list