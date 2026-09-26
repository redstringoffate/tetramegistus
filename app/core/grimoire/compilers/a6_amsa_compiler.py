import json
import os
from copy import copy
from openpyxl import load_workbook
from openpyxl.styles import Font, Alignment
from openpyxl.styles.colors import Color

from core.grimoire.styler import apply_grimoire_styles
from core.grimoire.stamper import apply_natal_stamp
from core.astrology.engine import calculate_divisio, _ensure_float_tz
from core.astrology.davison import calculate_davison_midpoint

BASE_DIR = os.path.dirname(__file__)

MAPPING_FILE = os.path.abspath(os.path.join(BASE_DIR, '../mappings/a6_amsa_mapping.json'))
# 🚀 템플릿 이름은 a6_amsa.xlsx 로 가정합니다.
TEMPLATE_FILE = os.path.abspath(os.path.join(BASE_DIR, '../../../templates_excel/albedo/a6_amsa.xlsx'))

def get_safe_float(val, default=0.0):
    try: return float(val) if val is not None else default
    except (ValueError, TypeError): return default

def sanitize_unicode(text):
    if isinstance(text, str):
        return text.replace("\ufe0e", "").replace("\ufe0f", "")
    return text

def compile_a6_amsa_grimoire(chart_data, seed_data=None):
    if not os.path.exists(TEMPLATE_FILE):
        raise FileNotFoundError(f"Template missing: {TEMPLATE_FILE}")

    wb = load_workbook(TEMPLATE_FILE)
    base_name = "a6_amsa"
    ws = wb[base_name] if base_name in wb.sheetnames else wb.active
    ws.title = base_name

    for s in list(wb.sheetnames):
        if s != base_name: del wb[s]
    wb.active = wb._sheets.index(ws)

    if not seed_data or 'seed1' not in seed_data or 'seed2' not in seed_data:
        raise ValueError("Grimoire requires Albedo seed data.")

    s1_raw = seed_data['seed1'].copy()
    s2_raw = seed_data['seed2'].copy()
    dav_hydrated = calculate_davison_midpoint(s1_raw, s2_raw)

    d_lat = get_safe_float(dav_hydrated.get("lat"), None)
    d_lng = get_safe_float(dav_hydrated.get("lng"), None)
    
    if d_lat is not None and d_lng is not None:
        coord_str = f"{abs(d_lat):.2f}°{'N' if d_lat>=0 else 'S'}, {abs(d_lng):.2f}°{'E' if d_lng>=0 else 'W'}"
    else:
        coord_str = "Unknown Location"
        
    dav_hydrated["city"] = coord_str
    dav_hydrated["location"] = coord_str
    dav_hydrated["city_name"] = coord_str
    dav_hydrated["location_name"] = coord_str

    # 🚀 A2 Stamper 방식 유지
    apply_natal_stamp(ws, dav_hydrated, method="single", cells=["A2"])

    meta = chart_data.get("metadata", {})
    ayanamsa = meta.get("ayanamsa", "lahiri")
    target_amsa = meta.get("amsa_id", "D1")        # e.g., "D1"
    amsa_name = meta.get("amsa_name", "Rasi")      # e.g., "Rasi"

    date_str = str(dav_hydrated.get('birth_date', '2000-01-01')).split('T')[0]
    time_str = str(dav_hydrated.get('birth_time', '12:00:00'))
    lat = get_safe_float(dav_hydrated.get("lat"), 37.5665)
    lng = get_safe_float(dav_hydrated.get("lng"), 126.9780)
    tz_val = dav_hydrated.get('tz') if dav_hydrated.get('tz') is not None else dav_hydrated.get('timezone', 9.0)
    tz = _ensure_float_tz(tz_val, date_str)

    divisio_res = calculate_divisio(
        date_str=date_str, time_str=time_str, lat=lat, lng=lng, timezone=tz, ayanamsa=ayanamsa
    )
    varga_data = divisio_res.get("varga", {})

    with open(MAPPING_FILE, 'r', encoding='utf-8') as f: mapping = json.load(f)

    layout = mapping.get("layout", {})
    cols = layout.get("cols", {})
    rows = layout.get("rows", {})
    
    col_info = cols.get("info", "B")
    col_nak = cols.get("nakshatra", "C")

    # 🚀 1. Amsa 기준으로 각 행성(Body)의 데이터 매핑
    for body_key, r_idx in rows.items():
        # body_key = "Sun", "Ascendant" 등
        b_data = varga_data.get(body_key, {}).get(target_amsa, {})
        
        info_val = str(b_data.get("formatted", "-"))
        nak_val = str(b_data.get("nakshatra", "-"))
        
        c_info = ws[f"{col_info}{r_idx}"]
        c_nak = ws[f"{col_nak}{r_idx}"]
        
        # Info (Sign colored)
        c_info.value = info_val
        c_info.data_type = 's'
        apply_grimoire_styles(c_info, sanitize_unicode(info_val), is_info_col=True, skip_color=False)
        c_info.alignment = Alignment(horizontal='left', vertical='center')
        
        # Nakshatra (Base colored)
        base_nak = nak_val.split('-')[0] if "-" in nak_val else nak_val
        c_nak.value = base_nak
        c_nak.data_type = 's'
        apply_grimoire_styles(c_nak, sanitize_unicode(base_nak), is_info_col=False, skip_color=False)
        c_nak.value = nak_val 
        c_nak.alignment = Alignment(horizontal='left', vertical='center')

    # 🚀 2. Ayanamsa (B4)
    ayan_ref = mapping.get("metadata", {}).get("ayanamsa")
    if ayan_ref:
        a_cell = ws[ayan_ref]
        a_val = str(ayanamsa).upper()
        a_cell.value = a_val
        a_cell.data_type = 's'
        apply_grimoire_styles(a_cell, a_val, skip_color=True)
        color_to_use = copy(a_cell.font.color) if a_cell.font and a_cell.font.color else "000000"
        a_cell.font = Font(name="Consolas", size=a_cell.font.size, bold=False, color=color_to_use)
        a_cell.alignment = Alignment(horizontal='right', vertical='center')

    # 🚀 3. Amsa Division (B5) - 우측 정렬
    amsa_ref = mapping.get("metadata", {}).get("amsa")
    if amsa_ref:
        am_cell = ws[amsa_ref]
        am_val = str(target_amsa).upper()
        am_cell.value = am_val
        am_cell.data_type = 's'
        apply_grimoire_styles(am_cell, am_val, skip_color=True)
        color_to_use = copy(am_cell.font.color) if am_cell.font and am_cell.font.color else "000000"
        am_cell.font = Font(name="Consolas", size=am_cell.font.size, bold=True, color=color_to_use)
        am_cell.alignment = Alignment(horizontal='right', vertical='center')

    # 🚀 4. Amsa Name (C5) - 좌측 정렬
    name_ref = mapping.get("metadata", {}).get("amsa_name")
    if name_ref:
        n_cell = ws[name_ref]
        n_val = str(amsa_name)
        n_cell.value = n_val
        n_cell.data_type = 's'
        apply_grimoire_styles(n_cell, n_val, skip_color=True)
        color_to_use = copy(n_cell.font.color) if n_cell.font and n_cell.font.color else "000000"
        n_cell.font = Font(name="Consolas", size=n_cell.font.size, bold=False, color=color_to_use)
        n_cell.alignment = Alignment(horizontal='right', vertical='center')

    # Shrink Logic (4.5px 공백 처리)
    for r_idx in range(1, ws.max_row + 1):
        cell_val = ws[f"A{r_idx}"].value
        if str(cell_val).strip() == ".":
            ws.row_dimensions[r_idx].height = 4.5
            for col_char in ["A", "B", "C"]:
                ws[f"{col_char}{r_idx}"].value = ""
        elif r_idx >= 7:
            if ws.row_dimensions[r_idx].height != 4.5:
                ws.row_dimensions[r_idx].height = 16.5

    # 폰트 강제 고정
    for row in ws.iter_rows():
        for cell in row:
            if cell.value is not None:
                cell.data_type = 's'
            if cell.font:
                c = cell.font.color
                safe_color = None
                if c:
                    if c.type == 'rgb': safe_color = Color(rgb=c.rgb)
                    elif c.type == 'indexed': safe_color = Color(indexed=c.indexed)
                cell.font = Font(name="Consolas", size=cell.font.size, bold=cell.font.bold, italic=cell.font.italic, color=safe_color)
            else:
                cell.font = Font(name="Consolas")

    # 강제 너비 고정 (Amsa 모드는 3열이므로 넉넉하게)
    forced_widths = { "A": 22.0, "B": 25.0, "C": 25.0 }
    for col_char, target_width in forced_widths.items():
        ws.column_dimensions[col_char].width = target_width

    # A1 병합 해제 방어 코드
    from openpyxl.utils import get_column_letter
    merge_to_remove = None
    for m_range in list(ws.merged_cells.ranges):
        if "A1" in m_range.coord:
            merge_to_remove = m_range
            break
            
    if merge_to_remove:
        max_col_letter = get_column_letter(merge_to_remove.max_col)
        ws.unmerge_cells(merge_to_remove.coord)
        ws['B1'].value = ws['A1'].value
        ws['A1'].value = None
        if ws['A1'].has_style:
            ws['B1'].font = copy(ws['A1'].font)
            ws['B1'].border = copy(ws['A1'].border)
            ws['B1'].fill = copy(ws['A1'].fill)
            ws['B1'].alignment = copy(ws['A1'].alignment)
        ws.merge_cells(f"B1:{max_col_letter}1")

    return wb