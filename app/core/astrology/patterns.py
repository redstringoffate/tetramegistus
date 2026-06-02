# app/core/astrology/patterns.py
from collections import defaultdict
import itertools
import sys

# 1. 🚫 Natural Axis & Exclusions (v19 Strictness)
NATURAL_PAIRS = [
    {'Asc.', 'Dsc.'}, {'M.C.', 'I.C.'}, {'Rahu', 'Ketu'}, 
    {'North Node', 'South Node'}, {'Asc.', 'Dsc.'}, {'M.C.', 'I.C.'}
]

EXCLUDED_BODIES = {
    'Fortune', 'Spirit', 'Necessity', 'Eros (H)', 'Courage', 'Victory', 
    'Nemesis', 'Vertex', 'Anti-Vertex', 'Syzygy',
    'Asc.', 'Dsc.', 'M.C.', 'I.C.', 'Asc', 'Dsc', 'MC', 'IC'
}

def is_natural_pair_same_system(p1, p2):
    if '_' in p1: name1, suff1 = p1.rsplit('_', 1)
    else: name1, suff1 = p1, ''
    if '_' in p2: name2, suff2 = p2.rsplit('_', 1)
    else: name2, suff2 = p2, ''
    
    if suff1 == suff2:
        pair_set = {name1, name2}
        for np in NATURAL_PAIRS:
            if np == pair_set: return True
    return False

def is_excluded(name, mode='unus'):
    # 1. 🔑 [수복]: 정밀한 이름 정규화
    # 'Eros (v)_1' -> 'Eros' | 'Fortune_2' -> 'Fortune'
    base = name.split('_')[0] # 시스템 접미사 제거
    pure_name = base.replace(' (v)', '').strip() # 가상점 표식 (v) 제거
    
    # 2. 🔑 Intersectus 모드: 모든 가상점 강제 배제
    if mode == 'intersectus':
        # (v)가 붙어있거나, 가상점 리스트(EXCLUDED_BODIES)에 포함되면 무조건 제외
        if '(v)' in base or pure_name in EXCLUDED_BODIES:
            return True
            
    # 3. Unus 모드 및 공통 제외 (Angles 등)
    return pure_name in EXCLUDED_BODIES

def find_patterns(aspects_list, mode='unus'):
    # 🔑 [수복]: Filter 단계에서 mode 인자를 is_excluded에 반드시 전달
    aspects_list = [
        a for a in aspects_list 
        if not is_excluded(a['p1'], mode=mode) and not is_excluded(a['p2'], mode=mode)
    ]
     
    # 기초 그래프 구축
    graph = defaultdict(lambda: defaultdict(set))
    for entry in aspects_list:
        p1, p2, asp = entry['p1'], entry['p2'], entry['aspect']
        graph[p1][asp].add(p2)
        graph[p2][asp].add(p1)

    patterns = []
    processed_sets = set()
    nodes = list(graph.keys())
    
    def has(x, y, asp): return y in graph[x][asp]
    def has_opp(x, y): return has(x, y, 'Opposition') and not is_natural_pair_same_system(x, y)

    def add_pattern(name, planets):
        p_set = frozenset(planets)
        if (name, p_set) not in processed_sets:
            processed_sets.add((name, p_set))
            slots = list(planets) + ['-'] * (6 - len(planets))
            patterns.append({"shape": name, **{f"p{i+1}": slots[i] for i in range(6)}})

    # -------------------------------------------------
    # STEP 1: 3-Planet Base Patterns (Foundations)
    # -------------------------------------------------
    grand_trines = []
    t_squares = []
    yods = []

    for comb in itertools.combinations(nodes, 3):
        a, b, c = comb
        # Grand Trine
        if has(a, b, 'Trine') and has(b, c, 'Trine') and has(c, a, 'Trine'):
            grand_trines.append(frozenset(comb))
            add_pattern("Grand Trine", comb)
        
        # T-Square
        for p1, p2, p3 in [(a, b, c), (b, a, c), (c, a, b)]:
            if has_opp(p2, p3) and has(p1, p2, 'Square') and has(p1, p3, 'Square'):
                t_squares.append(frozenset([p1, p2, p3]))
                add_pattern("T-Square", [p1, p2, p3])
        
        # Yod
        for p1, p2, p3 in [(a, b, c), (b, a, c), (c, a, b)]:
            if has(p2, p3, 'Sextile') and has(p1, p2, 'Quincunx') and has(p1, p3, 'Quincunx'):
                yods.append(frozenset([p1, p2, p3]))
                add_pattern("Yod", [p1, p2, p3])

    # -------------------------------------------------
    # STEP 2: Hierarchical Expansion (Using Bases)
    # -------------------------------------------------
    
    # A. Kite (Grand Trine + 1 Opposition Point)
    for gt in grand_trines:
        gt_list = list(gt)
        for i in range(3):
            apex = gt_list[i]
            others = [gt_list[(i+1)%3], gt_list[(i+2)%3]]
            for cand in nodes:
                if cand in gt: continue
                if has_opp(apex, cand) and has(cand, others[0], 'Sextile') and has(cand, others[1], 'Sextile'):
                    add_pattern("Kite", list(gt) + [cand])

    # B. Star of David (Grand Trine + Grand Trine)
    if len(grand_trines) >= 2:
        for gt1, gt2 in itertools.combinations(grand_trines, 2):
            combined = gt1 | gt2
            if len(combined) == 6:
                # 모든 점이 서로 Sextile Ring을 형성하는지 확인
                if all(any(has(p, other, 'Sextile') for other in combined if other != p) for p in combined):
                    add_pattern("Star of David", list(combined))

    # C. Grand Cross (T-Square + 1 Point)
    for ts in t_squares:
        # T-Square의 Apex(p1)와 대립하는 점을 찾아 사각형 완성
        apex = None
        opp_pair = []
        ts_l = list(ts)
        if has_opp(ts_l[0], ts_l[1]): apex, opp_pair = ts_l[2], [ts_l[0], ts_l[1]]
        elif has_opp(ts_l[0], ts_l[2]): apex, opp_pair = ts_l[1], [ts_l[0], ts_l[2]]
        else: apex, opp_pair = ts_l[0], [ts_l[1], ts_l[2]]
        
        for cand in nodes:
            if cand in ts: continue
            if has_opp(apex, cand) and has(cand, opp_pair[0], 'Square') and has(cand, opp_pair[1], 'Square'):
                add_pattern("Grand Cross", list(ts) + [cand])

    # D. Mystic Rectangle (Opposition + Opposition)
    opps = [(a, b) for a, b in itertools.combinations(nodes, 2) if has_opp(a, b)]
    for o1, o2 in itertools.combinations(opps, 2):
        comb = {o1[0], o1[1], o2[0], o2[1]}
        if len(comb) == 4:
            l = list(comb)
            if sum(1 for x, y in itertools.combinations(l, 2) if has(x, y, 'Trine')) >= 2 and \
               sum(1 for x, y in itertools.combinations(l, 2) if has(x, y, 'Sextile')) >= 2:
                add_pattern("Mystic Rectangle", l)

    return patterns