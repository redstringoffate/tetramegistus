from core.grimoire.styler import apply_grimoire_styles

def _format_seed_string(seed):
    """
    단일 시드 데이터를 텍스트(YYYY-MM-DD, HH:MM:SS; Location)로 변환합니다.
    """
    if not seed: 
        return "Unknown Seed"
    
    date_str = str(seed.get('birth_date', '2000-01-01')).split('T')[0]
    
    is_unk = bool(seed.get('is_time_unknown', 0))
    if is_unk:
        time_str = "Time Unknown"
    else:
        time_str = str(seed.get('birth_time', '12:00:00'))
        
    city = seed.get('city')
    country = seed.get('country')
    lat = seed.get('lat', 0.0)
    lng = seed.get('lng', 0.0)
    
    if city and country:
        loc_str = f"{city}, {country}"
    elif city:
        loc_str = city
    else:
        loc_str = f"{lat}, {lng}"
        
    return f"{date_str}, {time_str}; {loc_str}"

def apply_natal_stamp(ws, seed_data, method="single", cells=None):
    """
    엑셀 워크시트에 네이탈 정보를 스탬핑합니다.
    
    [Parameters]
    - ws: 엑셀 워크시트 객체
    - seed_data: Astral Station에서 가져온 현재 시드 데이터
    - method: "single" (단일) 또는 "composite" (A/B 분리)
    - cells: 스탬프를 찍을 셀 위치 리스트 (예: ["A2"], ["A2", "A3"])
    """
    if cells is None:
        cells = ["A2", "A3"] # 컴파일러가 값을 안 주면 기본값으로 작동
        
    if method == "composite":
        s1 = seed_data.get('seed1', {})
        s2 = seed_data.get('seed2', {})
        
        str_a = f"A: {_format_seed_string(s1)}"
        str_b = f"B: {_format_seed_string(s2)}"
        
        # 리스트로 받은 좌표에 맞춰 입력
        c1 = cells[0] if len(cells) > 0 else "A2"
        c2 = cells[1] if len(cells) > 1 else "A3"
        
        ws[c1] = str_a
        ws[c2] = str_b
        
        apply_grimoire_styles(ws[c1], str_a, skip_color=True)
        apply_grimoire_styles(ws[c2], str_b, skip_color=True)
        
    else:
        info_str = _format_seed_string(seed_data)
        
        # 리스트의 첫 번째 좌표에 입력
        c1 = cells[0] if len(cells) > 0 else "A2"
        
        ws[c1] = info_str
        apply_grimoire_styles(ws[c1], info_str, skip_color=True)