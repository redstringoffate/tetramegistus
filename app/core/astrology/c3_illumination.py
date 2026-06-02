# app/core/astrology/c3_illumination.py
import os
import json
import secrets
from .c3_mystic_tools import MotherDice, GoldenCoin, RuneDice, TarotDeck, AstrologyDice, WitchsRunes

# =========================================================
# [ C3 : RUACH ] SYSTEM DATA & ENGINE
# =========================================================

# 🚀 24 Elder Futhark 룬 완벽 매핑 (모음문자, 행성, 수비학 넘버)
RUNE_SYSTEM = {
    # --- Shin (8) ---
    "Fehu":     {"mother": "Shin", "planet": "Mars",    "num": 1},
    "Uruz":     {"mother": "Shin", "planet": "Venus",   "num": 2},
    "Thurisaz": {"mother": "Shin", "planet": "Venus",   "num": 3},
    "Ansuz":    {"mother": "Shin", "planet": "Mercury", "num": 4},
    "Raidho":   {"mother": "Shin", "planet": "Mercury", "num": 5},
    "Kenaz":    {"mother": "Shin", "planet": "Mercury", "num": 6},
    "Gebo":     {"mother": "Shin", "planet": "Moon",    "num": 7},
    "Wunjo":    {"mother": "Shin", "planet": "Moon",    "num": 8},

    # --- Mem (8) ---
    "Hagalaz":  {"mother": "Mem",  "planet": "Sun",     "num": 9},
    "Nied":     {"mother": "Mem",  "planet": "Mercury", "num": 1},
    "Isaz":     {"mother": "Mem",  "planet": "Mercury", "num": 2},
    "Jera":     {"mother": "Mem",  "planet": "Venus",   "num": 3},
    "Eihwaz":   {"mother": "Mem",  "planet": "Venus",   "num": 4},
    "Peroth":   {"mother": "Mem",  "planet": "Venus",   "num": 5},
    "Algiz":    {"mother": "Mem",  "planet": "Pluto",   "num": 6},
    "Sowilo":   {"mother": "Mem",  "planet": "Pluto",   "num": 7},

    # --- Aleph (8) ---
    "Tiwaz":    {"mother": "Aleph", "planet": "Jupiter", "num": 8},
    "Berkano":  {"mother": "Aleph", "planet": "Saturn",  "num": 9},
    "Ehwaz":    {"mother": "Aleph", "planet": "Saturn",  "num": 1},
    "Mannaz":   {"mother": "Aleph", "planet": "Uranus",  "num": 2},
    "Laguz":    {"mother": "Aleph", "planet": "Uranus",  "num": 3},
    "Ingwaz":   {"mother": "Aleph", "planet": "Uranus",  "num": 4},
    "Dagaz":    {"mother": "Aleph", "planet": "Neptune", "num": 5},
    "Othala":   {"mother": "Aleph", "planet": "Neptune", "num": 6}
}

def calculate_ruach(payload):
    """
    [ C3 : RUACH ] 하이브리드 다이스 + 무의식 가중치 연산 엔진
    """
    
    # ---------------------------------------------------------
    # Phase 1: Mother Letter 판별
    # ---------------------------------------------------------
    # 프론트엔드가 보낸 3개 문항의 딕셔너리 (예: {"q1": "Mem", "q2": "Shin", "q3": "ROLL_DICE"})
    phase1_answers = payload.get("phase1_answers", {})
    mother_scores = {"Aleph": 0.0, "Mem": 0.0, "Shin": 0.0}
    
    # Q1 (Fake RNG): 유저의 답은 무시하고 백엔드가 은밀하게 주사위를 굴림
    fake_q_result = MotherDice.roll()
    mother_scores[fake_q_result] += 1.0 
    
    # Q2 (Core Weight): 유저의 진짜 무의식 선택에 1.5pt 가중치 부여
    user_q2 = phase1_answers.get("q_mother_2") # 🚀 [치명적 버그 수정]: q2 -> q_mother_2
    if user_q2 in mother_scores:
        mother_scores[user_q2] += 1.5
        
    # Q3 (Explicit Dice): 대놓고 굴리는 주사위
    dice_q_result = MotherDice.roll()
    mother_scores[dice_q_result] += 1.0
    
    # 가장 높은 점수를 받은 Mother Letter 선정 (동점은 수학적으로 발생하지 않음)
    winning_mother = max(mother_scores, key=mother_scores.get)
    
    # ---------------------------------------------------------
    # Phase 2: Planet 판별 (동적 랜덤 가중치 시스템)
    # ---------------------------------------------------------
    # 프론트엔드가 보낸 3개 행성 답변 리스트 (예: ["Mars", "Venus", "Moon"])
    user_answers_phase2 = payload.get("phase2_answers", [])
    
    valid_planets = []
    if winning_mother == "Aleph": valid_planets = ["Jupiter", "Saturn", "Uranus", "Neptune"]
    elif winning_mother == "Mem": valid_planets = ["Sun", "Mercury", "Venus", "Pluto"]
    elif winning_mother == "Shin": valid_planets = ["Mars", "Venus", "Mercury", "Moon"]
    
    planet_scores = {p: 0.0 for p in valid_planets}
    
    if len(user_answers_phase2) == 3:
        # 🚀 [핵심]: 3개의 문항 중 이번 의식에서 '진짜'로 작용할 문항을 매번 무작위로 뽑음
        real_q_index = secrets.choice([0, 1, 2])
        
        for idx, user_choice in enumerate(user_answers_phase2):
            if idx == real_q_index:
                # 🎯 당첨! 이 문항이 유저의 무의식을 반영함
                if user_choice in planet_scores:
                    planet_scores[user_choice] += 1.5
            else:
                # 🎲 꽝! 유저의 선택을 무시하고 운명(랜덤)에 맡김
                rand_planet = secrets.choice(valid_planets)
                planet_scores[rand_planet] += 1.0
                
    # 가장 높은 점수의 Planet 선정
    winning_planet = max(planet_scores, key=planet_scores.get)
    
    # ---------------------------------------------------------
    # Phase 3: Final Rune 추출 및 Tie-breaker
    # ---------------------------------------------------------
    candidate_runes = [
        rune for rune, data in RUNE_SYSTEM.items() 
        if data["mother"] == winning_mother and data["planet"] == winning_planet
    ]
    
    final_rune = None
    tie_breaker_tool_used = "None"
    
    if len(candidate_runes) == 1:
        # 단일 룬이면 타이브레이커 없이 바로 확정 (예: Fehu, Hagalaz 등)
        final_rune = candidate_runes[0]
        
    elif len(candidate_runes) == 2:
        # 2개가 겹치면 금화(Golden Coin) 던지기
        final_rune, result_face = GoldenCoin.flip(candidate_runes)
        tie_breaker_tool_used = f"Golden Coin ({result_face})"
        
    elif len(candidate_runes) >= 3:
        # 3개 이상 겹치면 룬 다이스(Rune Dice) 굴리기
        final_rune, result_face = RuneDice.roll(candidate_runes)
        tie_breaker_tool_used = f"Rune Dice ({result_face})"
        
    # ---------------------------------------------------------
    # JSON 반환
    # ---------------------------------------------------------
    return {
        "status": "success",
        "winning_mother": winning_mother,
        "winning_planet": winning_planet,
        "final_rune": final_rune,
        "numerology": RUNE_SYSTEM[final_rune]["num"], # 프론트엔드 조립용 번호 반환
        "tie_breaker_log": tie_breaker_tool_used,
        "debug_scores": {
            "mother_scores": mother_scores,
            "planet_scores": planet_scores
        }
    }

# =========================================================
# [ C3 : NEFESH ] SYSTEM DATA & ENGINE
# =========================================================

PURUSHARTHA_MAP = {
    "opt1": "Dharma",
    "opt2": "Artha",
    "opt3": "Kama",
    "opt4": "Moksha"
}

NAKSHATRA_SYSTEM = {
    "ashwini":         {"name": "Ashwini", "purushartha": "Dharma", "num": "opt1"},
    "bharani":         {"name": "Bharani", "purushartha": "Artha",  "num": "opt2"},
    "krittika":        {"name": "Krittika", "purushartha": "Kama",   "num": "opt3"},
    "rohini":          {"name": "Rohini", "purushartha": "Moksha", "num": "opt4"},
    "mrigashira":      {"name": "Mrigashira", "purushartha": "Dharma", "num": "opt5"},
    "ardra":           {"name": "Ardra", "purushartha": "Artha",   "num": "opt6"},
    "punarvasu":       {"name": "Punarvasu", "purushartha": "Kama",  "num": "opt7"},
    "pushya":          {"name": "Pushya", "purushartha": "Moksha", "num": "opt8"},
    "ashlesha":        {"name": "Ashlesha", "purushartha": "Dharma", "num": "opt9"},
    "magha":           {"name": "Magha", "purushartha": "Artha",  "num": "opt1"},
    "purva_phalguni":  {"name": "Purva Phalguni", "purushartha": "Kama", "num": "opt2"},
    "uttara_phalguni": {"name": "Uttara Phalguni", "purushartha": "Moksha", "num": "opt3"},
    "hasta":           {"name": "Hasta", "purushartha": "Dharma", "num": "opt4"},
    "chitra":          {"name": "Chitra", "purushartha": "Artha",  "num": "opt5"},
    "swati":           {"name": "Swati", "purushartha": "Kama",  "num": "opt6"},
    "vishakha":        {"name": "Vishakha", "purushartha": "Moksha", "num": "opt7"},
    "anuradha":        {"name": "Anuradha", "purushartha": "Dharma", "num": "opt8"},
    "jyeshtha":        {"name": "Jyeshtha", "purushartha": "Artha",  "num": "opt9"},
    "mula":            {"name": "Mula", "purushartha": "Kama",   "num": "opt1"},
    "purva_ashadha":   {"name": "Purva Ashadha", "purushartha": "Moksha", "num": "opt2"},
    "uttara_ashadha":  {"name": "Uttara Ashadha", "purushartha": "Dharma", "num": "opt3"},
    "shravana":        {"name": "Shravana", "purushartha": "Artha",   "num": "opt4"},
    "dhanishta":       {"name": "Dhanishta", "purushartha": "Kama",  "num": "opt5"},
    "shatabhisha":     {"name": "Shatabhisha", "purushartha": "Moksha", "num": "opt6"},
    "purva_bhadrapada":{"name": "Purva Bhadrapada", "purushartha": "Dharma", "num": "opt7"}, 
    "uttara_bhadrapada":{"name": "Uttara Bhadrapada", "purushartha": "Artha", "num": "opt8"}, 
    "revati":          {"name": "Revati", "purushartha": "Kama", "num": "opt9"}
}

PADA_PURUSHARTHA = {1: "Dharma", 2: "Artha", 3: "Kama", 4: "Moksha"}
PLANETS = ["Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury"]


def calculate_nefesh_phase1(payload):
    answers = payload.get("answers", {})
    q_keys = ["purushartha_q1", "purushartha_q2", "purushartha_q3"]
    user_choices = [answers.get(q) for q in q_keys if answers.get(q)]
    
    scores = {"Dharma": 0.0, "Artha": 0.0, "Kama": 0.0, "Moksha": 0.0}
    
    if len(user_choices) == 3:
        real_q_index = secrets.choice([0, 1, 2])
        for idx, choice in enumerate(user_choices):
            puru = PURUSHARTHA_MAP.get(choice)
            if not puru: continue
            
            if idx == real_q_index:
                scores[puru] += 1.5
            else:
                rand_puru = secrets.choice(list(scores.keys()))
                scores[rand_puru] += 1.0

    winning_purushartha = max(scores, key=scores.get)

    valid_numerology_keys = list(set([
        data["num"] for data in NAKSHATRA_SYSTEM.values() 
        if data["purushartha"] == winning_purushartha
    ]))

    return {
        "status": "success",
        "winning_purushartha": winning_purushartha,
        "valid_numerology_keys": valid_numerology_keys,
        "debug_scores": scores  
    }

def load_nefesh_sabian(group_key):
    import pathlib
    import json
    
    try:
        # 🚀 1. pathlib를 이용한 절대 경로 완벽 추적 (os.path의 맹점 해결)
        # __file__은 c3_illumination.py 위치. parents[2]는 app/ 폴더를 정확히 가리킴
        current_file = pathlib.Path(__file__).resolve()
        app_dir = current_file.parents[2] 
        file_path = app_dir / "data" / "render" / "c3_nefesh.json"
        
        if not file_path.exists():
            return "경로 에러", f"파일이 여기에 없습니다: {file_path}", "File not found"
            
        # 🚀 2. 윈도우 UTF-8 BOM 텍스트 충돌 완벽 방지 (utf-8-sig)
        with open(file_path, "r", encoding="utf-8-sig") as f:
            data = json.load(f)
            
        # 선생님께서 구성하신 완벽한 JSON 트리 구조를 탐색
        sabian_group = data.get("interpretations", {}).get("sabian", {}).get(group_key, {})
        
        if sabian_group:
            # 해당 파다(예: pushya_3)에 들어있는 도수들 중 하나를 랜덤 픽
            chosen_key = secrets.choice(list(sabian_group.keys()))
            text_en = sabian_group[chosen_key].get("en", "")
            text_ko = sabian_group[chosen_key].get("ko", "")
            return chosen_key, text_ko, text_en
        else:
            return "매핑 에러", f"JSON 내에 '{group_key}' 데이터가 없습니다.", "Data missing"
            
    except json.JSONDecodeError as je:
        # 🚀 JSON 쉼표나 따옴표 누락 시, 화면에 몇 번째 줄인지 띄워버림
        return "문법 에러", f"JSON 문법 오류: {str(je)}", f"JSON Syntax Error: {str(je)}"
    except Exception as e:
        return "알 수 없는 에러", f"에러 내용: {str(e)}", str(e)
    
def calculate_nefesh_reveal(payload):
    answers = payload.get("answers", {})
    
    # 🚀 [핵심 픽스]: 주사위를 두 번 굴리지 않고 프론트엔드가 건네준 확정값을 그대로 사용!
    winning_puru = payload.get("winning_purushartha")
    valid_keys = payload.get("valid_numerology_keys", [])
    
    # 만약 프론트엔드에서 값이 안 넘어왔을 때만 최후의 수단으로 재계산
    if not winning_puru or not valid_keys:
        phase1_result = calculate_nefesh_phase1(payload)
        winning_puru = phase1_result["winning_purushartha"]
        valid_keys = phase1_result["valid_numerology_keys"]

    q_num_keys = ["numerology_q4", "numerology_q5", "numerology_q6"]
    num_choices = [answers.get(q) for q in q_num_keys if answers.get(q)]
    
    num_scores = {f"opt{i}": 0.0 for i in range(1, 10)}
    if len(num_choices) == 3:
        real_q_index = secrets.choice([0, 1, 2])
        for idx, choice in enumerate(num_choices):
            if not choice in num_scores: continue
            if idx == real_q_index:
                num_scores[choice] += 1.5
            else:
                valid_pool = valid_keys
                rand_num = secrets.choice(valid_pool) if valid_pool else choice
                num_scores[rand_num] += 1.0

    valid_scores = {k: v for k, v in num_scores.items() if k in valid_keys}
    winning_num = max(valid_scores, key=valid_scores.get) if valid_scores else "opt1"
    
    numerology_number = winning_num.replace("opt", "") 

    final_nakshatra_key = None
    for key, data in NAKSHATRA_SYSTEM.items():
        if data["purushartha"] == winning_puru and data["num"] == winning_num:
            final_nakshatra_key = key
            break
    
    if not final_nakshatra_key:
        final_nakshatra_key = "rohini"

    nakshatra_name = NAKSHATRA_SYSTEM[final_nakshatra_key]["name"]

    pada_num = secrets.choice([1, 2, 3, 4])
    pada_puru = PADA_PURUSHARTHA[pada_num]
    pada_planet = secrets.choice(PLANETS)

    sabian_group_key = f"{final_nakshatra_key}_{pada_num}"
    
    sabian_key, sabian_ko, sabian_en = load_nefesh_sabian(sabian_group_key)
    
    return {
        "status": "success",
        "nakshatra_key": final_nakshatra_key,
        "nakshatra": nakshatra_name,
        "main_purushartha": winning_puru,
        "numerology_key": winning_num,
        "numerology_number": numerology_number, 
        "pada_num": pada_num,
        "pada_purushartha": pada_puru,
        "pada_planet": pada_planet,
        "sabian_group_key": sabian_group_key,
        "sabian_key": sabian_key,
        "sabian_text_ko": sabian_ko,
        "sabian_text_en": sabian_en,
        "debug_scores": {
            "purushartha_scores": "Already Fixed in Phase 1", # 중복 계산 방지
            "numerology_scores": num_scores
        }
    }

# =========================================================
# [ C3 : CHAYAH ] SYSTEM DATA & ENGINE
# =========================================================

from .c3_chayah_scoring import CHAYAH_SCORING, VOID_ROYAL_MAP, VOID_GRAHA_MAP, VOID_STARS_MAP

# 🌌 별이 속한 Graha 매핑 (Tie-breaker 및 최종 계산용)
STAR_TO_GRAHA = {
    "hamal": "ketu", "galactic_center": "ketu",
    "sheratan": "venus", "zosma": "venus", "nunki": "venus",
    "pleiades": "sun", "denebola": "sun", "vega": "sun",
    "algorab": "moon", "altair": "moon",
    "bellatrix": "mars", "deneb_algedi": "mars",
    "betelgeuse": "rahu", "arcturus": "rahu",
    "pollux": "jupiter", "zuben_elgenubi": "jupiter", "markab": "jupiter",
    "praesepe": "saturn", "dschubba": "saturn", "alpheratz": "saturn",
    "alphard": "mercury", "alrischa": "mercury"
}

# 👑 왕별 & 스피카 전용 Graha 매핑 (Bypass 시 사용)
ROYAL_STAR_GRAHA_MAP = {
    "aldebaran": "moon",
    "regulus": "ketu",
    "spica": "mars",
    "antares": "mercury",
    "fomalhaut": "rahu"
}

# 🔄 역방향 매핑 (프론트엔드에 렌더링할 후보군 Option Key 제공용)
REV_VOID_ROYAL = {v: k for k, v in VOID_ROYAL_MAP.items()}
REV_VOID_GRAHA = {v: k for k, v in VOID_GRAHA_MAP.items()}
REV_VOID_STARS = {v: k for k, v in VOID_STARS_MAP.items()}

def calculate_chayah_reveal(payload):
    """
    [ חיה ] Chayah 엔진:
    실시간 점수 산출(Tally), Bypass 판정, 그리고 Tie-breaker 렌더링 로직을 수행.
    """
    answers = payload.get("answers", {})

    # 1. 초기 점수 세팅
    # 마이너스 점수로 인한 시스템 오류를 방지하기 위해 모든 별의 기본 점수(Base Score)를 20점으로 설정합니다.
    star_scores = {star: 20.0 for star in STAR_TO_GRAHA.keys()}
    graha_scores = {graha: 0.0 for graha in set(STAR_TO_GRAHA.values())}
    flag_scores = {"spica": 0, "aldebaran": 0, "regulus": 0, "antares": 0, "fomalhaut": 0}
    bad_end_stack = 0

    # 2. 문항별 점수 계산 (Tally)
    for q_key, selected_opt in answers.items():
        if q_key in CHAYAH_SCORING:
            opt_data = CHAYAH_SCORING[q_key].get(selected_opt, {})

            # 마이너스(Bad End) 스택 확인
            if "bad_end_stack" in opt_data:
                bad_end_stack += opt_data["bad_end_stack"]

            # 개별 별 점수 합산
            for star, pts in opt_data.get("stars", {}).items():
                if star in star_scores:
                    star_scores[star] += pts

            # Graha (팀) 점수 합산
            for graha, pts in opt_data.get("grahas", {}).items():
                if graha in graha_scores:
                    graha_scores[graha] += pts

            # 왕별 및 스피카 플래그 합산
            if "royal_flag" in opt_data:
                flag_scores[opt_data["royal_flag"]] += opt_data.get("flag_pts", 1)
            if "spica_flag" in opt_data:
                flag_scores[opt_data["spica_flag"]] += opt_data.get("flag_pts", 1)

    # 3. Bad End 판정 (마이너스 문항 10회 이상)
    if bad_end_stack >= 10:
        return {"status": "bad_end"}

    # 4. [ 최우선 Bypass ] Spica 플래그 활성화 (3점 이상)
    if flag_scores["spica"] >= 3:
        return {
            "status": "success", 
            "final_star": "spica", 
            "final_graha": ROYAL_STAR_GRAHA_MAP["spica"], 
            "debug_reason": "spica_bypass"
        }

    # 5. [ 차순위 Bypass ] Royal 플래그 활성화
    activated_royals = [r for r in ["aldebaran", "regulus", "antares", "fomalhaut"] if flag_scores[r] >= 3]
    if len(activated_royals) > 0:
        if "void_royal" in answers:
            chosen_royal = VOID_ROYAL_MAP.get(answers["void_royal"])
            if chosen_royal in activated_royals:
                return {
                    "status": "success", 
                    "final_star": chosen_royal, 
                    "final_graha": ROYAL_STAR_GRAHA_MAP[chosen_royal], 
                    "debug_reason": "royal_tiebreaker"
                }
        
        if len(activated_royals) == 1:
            chosen_royal = activated_royals[0]
            return {
                "status": "success", 
                "final_star": chosen_royal, 
                "final_graha": ROYAL_STAR_GRAHA_MAP[chosen_royal], 
                "debug_reason": "royal_bypass"
            }
        else:
            candidates = [{"key": REV_VOID_ROYAL[r], "value": r} for r in activated_royals if r in REV_VOID_ROYAL]
            return {"status": "needs_tiebreaker", "type": "void_royal", "candidates": candidates}

    # 6. [ 일반 판정 ] Normal Tally 로직
    # 6-1. 가장 점수가 높은 Graha 찾기
    max_graha_score = max(graha_scores.values())
    top_grahas = [g for g, s in graha_scores.items() if s == max_graha_score]

    winning_graha = None
    if len(top_grahas) == 1:
        winning_graha = top_grahas[0]
    else:
        # Graha 1위가 공동일 경우 void_graha 확인
        if "void_graha" in answers:
            chosen_graha = VOID_GRAHA_MAP.get(answers["void_graha"])
            if chosen_graha in top_grahas:
                winning_graha = chosen_graha
        
        if not winning_graha:
            candidates = [{"key": REV_VOID_GRAHA[g], "value": g} for g in top_grahas if g in REV_VOID_GRAHA]
            return {"status": "needs_tiebreaker", "type": "void_graha", "candidates": candidates}

    # 6-2. 확정된 Winning Graha 내에서 가장 점수가 높은 Star 찾기
    # 최종 Star 점수 = 해당 별 자체의 점수(star_scores) + 별이 속한 Graha의 팀 점수(graha_scores)
    stars_in_graha = [s for s, g in STAR_TO_GRAHA.items() if g == winning_graha]
    star_final_scores = {s: star_scores[s] + graha_scores[winning_graha] for s in stars_in_graha}
    
    max_star_score = max(star_final_scores.values())
    top_stars = [s for s, score in star_final_scores.items() if score == max_star_score]

    winning_star = None
    if len(top_stars) == 1:
        winning_star = top_stars[0]
    else:
        # Star 1위가 공동일 경우 void_stars 확인
        if "void_stars" in answers:
            chosen_star = VOID_STARS_MAP.get(answers["void_stars"])
            if chosen_star in top_stars:
                winning_star = chosen_star
        
        if not winning_star:
            candidates = [{"key": REV_VOID_STARS[s], "value": s} for s in top_stars if s in REV_VOID_STARS]
            return {"status": "needs_tiebreaker", "type": "void_stars", "candidates": candidates}

    # 모든 관문을 무사히 통과하고 최종 Star 산출 완료
    return {
        "status": "success",
        "final_star": winning_star,
        "final_graha": winning_graha,
        "debug": {
            "star_scores": star_scores,
            "graha_scores": graha_scores,
            "flag_scores": flag_scores,
            "bad_end_stack": bad_end_stack
        }
    }

# =========================================================
# [ C5 : NESHAMAH ] DIVINATION ENGINE & LAYER RESOLVER
# =========================================================

class TarotLayerResolver:
    """
    세페르 예치라(Sefer Yetzirah) 체계에 기반한 
    Neshamah 타로 레이어 분해 엔진
    """
    
    # 이중문자 순환 배열 (1/8/15 -> dalet, 2/9/16 -> resh ...)
    DOUBLE_LETTERS = ["dalet", "resh", "gimel", "pe", "bet", "kaf", "tav"]
    
    # 마이너 아르카나 수트별 매핑 규칙
    MINOR_RULES = {
        "Wands":  {"low": "he",    "high": "tet",   "court_letter": "samekh"},
        "Coins":  {"low": "vav",   "high": "yod",   "court_letter": "ayin"},
        "Swords": {"low": "zayin", "high": "lamed", "court_letter": "tzadi"},
        "Cups":   {"low": "chet",  "high": "nun",   "court_letter": "qoph"}
    }

    @classmethod
    def _get_numerology_root(cls, n: int) -> int:
        """수비학적 디지털 루트 환원 (단, 10번 운명의 수레바퀴는 10 유지)"""
        if n == 10:
            return 10
        while n > 9:
            n = sum(int(digit) for digit in str(n))
        return n

    @classmethod
    def resolve(cls, card_raw_name: str) -> dict:
        """
        raw_name을 입력받아 프론트엔드가 JSON에서 대사를 즉시 매칭할 수 있는 키셋으로 변환
        + 🚀 [추가됨]: 프론트엔드 렌더링을 위한 CSS 힌트(render_manifest) 조합까지 백엔드에서 전담
        """
        # 0번 바보 예외 처리
        if card_raw_name.startswith("0_"):
            return {
                "card_id": card_raw_name,
                "arcana_type": "major_fool",
                "layers": {"special_key": "the_fool"},
                "render_manifest": [
                    {"label": "0 : The Fool", "category": "the_fool", "key": "the_fool", "css_suffix": "layer-fool"}
                ]
            }

        parts = card_raw_name.split("_")
        
        # 1. 마이너 아르카나 분해
        if len(parts) == 2 and parts[1] in cls.MINOR_RULES:
            rank, suit = parts[0], parts[1]
            suit_rule = cls.MINOR_RULES[suit]
            
            # 코트 카드
            if rank in ["Page", "Knight", "Queen", "King"]:
                c_letter = suit_rule["court_letter"]
                c_rank = rank.lower()
                return {
                    "card_id": card_raw_name,
                    "arcana_type": "minor_court",
                    "layers": {
                        "simple_letter": c_letter,
                        "court_rank": c_rank
                    },
                    "render_manifest": [
                        {"label": f"Element : {c_letter.upper()}", "category": "simple_letter", "key": c_letter, "css_suffix": "layer-simple"},
                        {"label": f"Court : {c_rank.upper()}", "category": "court", "key": c_rank, "css_suffix": "layer-numerology"}
                    ]
                }
            else: 
                # 숫자 카드
                val = 1 if rank == "Ace" else int(rank)
                s_letter = suit_rule["low"] if val <= 5 else suit_rule["high"]
                return {
                    "card_id": card_raw_name,
                    "arcana_type": "minor_numeric",
                    "layers": {
                        "simple_letter": s_letter,
                        "numerology": str(val)
                    },
                    "render_manifest": [
                        {"label": f"Element : {s_letter.upper()}", "category": "simple_letter", "key": s_letter, "css_suffix": "layer-simple"},
                        {"label": f"Value : {val}", "category": "numerology", "key": f"n{val}", "css_suffix": "layer-numerology"}
                    ]
                }

        # 2. 메이저 아르카나 분해
        if len(parts) >= 2:
            try:
                num_part = int(parts[0])
                
                # Mother Letter 결정
                if 1 <= num_part <= 7: mother = "shin"
                elif 8 <= num_part <= 14: mother = "mem"
                else: mother = "aleph"
                
                # Double Letter 및 수비학 환원
                double = cls.DOUBLE_LETTERS[(num_part - 1) % 7]
                numerology = cls._get_numerology_root(num_part)
                
                return {
                    "card_id": card_raw_name,
                    "arcana_type": "major",
                    "layers": {
                        "mother_letter": mother,
                        "double_letter": double,
                        "numerology": str(numerology)
                    },
                    "render_manifest": [
                        {"label": f"Mother : {mother.upper()}", "category": "mother_letter", "key": mother, "css_suffix": "layer-mother"},
                        {"label": f"Double : {double.upper()}", "category": "double_letter", "key": double, "css_suffix": "layer-double"},
                        {"label": f"Numerology : {numerology}", "category": "numerology", "key": f"n{numerology}", "css_suffix": "layer-numerology"}
                    ]
                }
            except ValueError:
                pass

        return {"card_id": card_raw_name, "arcana_type": "unknown", "layers": {}, "render_manifest": []}

class AstroDiceLayerResolver:
    """ 행성-별자리 조합에 따른 Dignity (룰러십/엑절테이션/데트리먼트/폴/페러그린) 계산 및 레이어 분해 """
    
    # 각 행성별 Dignity 매핑 (현대 점성술 외행성 및 노드 일부 반영)
    DIGNITY_MAP = {
        "Sun": {"do": ["Leo"], "ex": ["Aries"], "de": ["Aquarius"], "fa": ["Libra"]},
        "Moon": {"do": ["Cancer"], "ex": ["Taurus"], "de": ["Capricorn"], "fa": ["Scorpio"]},
        "Mercury": {"do": ["Gemini", "Virgo"], "ex": ["Virgo"], "de": ["Sagittarius", "Pisces"], "fa": ["Pisces"]},
        "Venus": {"do": ["Taurus", "Libra"], "ex": ["Pisces"], "de": ["Scorpio", "Aries"], "fa": ["Virgo"]},
        "Mars": {"do": ["Aries", "Scorpio"], "ex": ["Capricorn"], "de": ["Libra", "Taurus"], "fa": ["Cancer"]},
        "Jupiter": {"do": ["Sagittarius", "Pisces"], "ex": ["Cancer"], "de": ["Gemini", "Virgo"], "fa": ["Capricorn"]},
        "Saturn": {"do": ["Capricorn", "Aquarius"], "ex": ["Libra"], "de": ["Cancer", "Leo"], "fa": ["Aries"]},
        "Uranus": {"do": ["Aquarius"], "ex": ["Scorpio"], "de": ["Leo"], "fa": ["Taurus"]},
        "Neptune": {"do": ["Pisces"], "ex": ["Cancer"], "de": ["Virgo"], "fa": ["Capricorn"]},
        "Pluto": {"do": ["Scorpio"], "ex": ["Aries", "Pisces"], "de": ["Taurus"], "fa": ["Libra"]},
        "North Node": {"do": [], "ex": ["Gemini", "Virgo"], "de": [], "fa": ["Sagittarius", "Pisces"]},
        "South Node": {"do": [], "ex": ["Sagittarius", "Pisces"], "de": [], "fa": ["Gemini", "Virgo"]}
    }
    
    # 조디악 4원소 매핑 (프론트엔드 CSS 클래스 전달용)
    ELEMENT_MAP = {
        "Fire": ["Aries", "Leo", "Sagittarius"],
        "Earth": ["Taurus", "Virgo", "Capricorn"],
        "Air": ["Gemini", "Libra", "Aquarius"],
        "Water": ["Cancer", "Scorpio", "Pisces"]
    }

    @classmethod
    def get_element(cls, sign: str) -> str:
        for element, signs in cls.ELEMENT_MAP.items():
            if sign in signs: return element.lower()
        return "fire"

    @classmethod
    def get_dignity(cls, planet: str, sign: str) -> str:
        rules = cls.DIGNITY_MAP.get(planet, {})
        if sign in rules.get("do", []): return "do"  # Domicile
        if sign in rules.get("ex", []): return "ex"  # Exaltation
        if sign in rules.get("de", []): return "de"  # Detriment
        if sign in rules.get("fa", []): return "fa"  # Fall
        return "p"  # Peregrine (무지향성)

    @classmethod
    def resolve(cls, dice_result: dict) -> dict:
        planet = dice_result.get("Planet", "Sun")
        sign = dice_result.get("Sign", "Aries")
        house = str(dice_result.get("House", "1"))
        
        dignity = cls.get_dignity(planet, sign)
        element = cls.get_element(sign)
        
        planet_key = planet.lower().replace(" ", "_")
        house_key = f"h{house}"
        zodiac_key = f"{sign.lower()}_{dignity}" # 예: aries_p, leo_do
        
        return {
            "card_id": f"dice_{planet_key}_{sign.lower()}_{house}",
            "card_type": "astrodice",
            "layers": {
                "planet": planet_key,
                "house": house_key,
                "zodiac": zodiac_key
            },
            "raw": {"planet": planet, "house": house, "sign": sign}, # 프론트엔드 아이콘 렌더링용
            "render_manifest": [
                {"label": f"Planet : {planet}", "category": "planet", "key": planet_key, "css_suffix": f"layer-planet-{planet_key}"},
                {"label": f"House : {house}th", "category": "house", "key": house_key, "css_suffix": "layer-house"},
                {"label": f"Zodiac : {sign} ({dignity.upper()})", "category": "zodiac", "key": zodiac_key, "css_suffix": f"layer-element-{element}"}
            ]
        }

class WitchsRuneLayerResolver:
    """ 마녀의 룬 레이어 분해 """
    @classmethod
    def resolve(cls, rune_name: str) -> dict:
        rune_key = rune_name.lower().replace(" ", "_")
        return {
            "card_id": f"rune_{rune_key}",
            "card_type": "witchs_rune",
            "layers": {"rune": rune_key},
            "raw": {"name": rune_name},
            "render_manifest": [
                {"label": f"Rune : {rune_name.upper()}", "category": "rune", "key": rune_key, "css_suffix": "layer-rune"}
            ]
        }

class NeshamahDivinationEngine:
    """
    Aleph ~ Mars 트리의 모든 종착점에서 요구하는 
    특수 스프레드 및 복합 점술 도구를 통합 연산합니다.
    """
    
    # 테크트리에 명시된 모든 타로 스프레드 규격 (수정 완료)
    TAROT_SPREAD_RULES = {
        "1_card": {"count": 1, "major_only": False},
        "1_card_m": {"count": 1, "major_only": True},
        "duad": {"count": 2, "major_only": False},        # Rahu/Ketu 등 2극성
        "triadic": {"count": 3, "major_only": False},     # 3배열
        "horseshoe": {"count": 7, "major_only": False},   # 7장 말굽 배열
        "chaldean": {"count": 7, "major_only": False},    # 칼데안 오더 (7행성)
        "celtic_cross": {"count": 10, "major_only": False},
        "tree_of_life": {"count": 11, "major_only": False}, # Daat 포함
        "graha": {"count": 9, "major_only": False}
    }

    @classmethod
    def draw(cls, tool: str, spread_type: str = None, count: int = 1) -> dict:
        """
        tool 지원 목록: tarot, rune, dice, graha, flip_coin
        """
        response = {
            "status": "success",
            "tool_used": tool,
            "spread_type": spread_type,
            "total_items": 0,
            "drawn_results": []
        }

        if tool == "tarot":
            rule = cls.TAROT_SPREAD_RULES.get(spread_type, {"count": 1, "major_only": False})
            required_count = rule["count"]
            
            # 🚀 1. 일단 필요한 장수만큼 카드를 뽑아옵니다.
            if spread_type == "1_card_m" or rule["major_only"]:
                raw_cards = TarotDeck.draw_major(required_count) 
            else:
                raw_cards = TarotDeck.draw(required_count)
            
            # 🚀 2. [치명적 버그 수정]: 뽑아온 카드를 암호학적 난수로 7번 엎고 섞기(Washing)
            # TarotDeck 내부에서 제대로 안 섞였다면, 여기서 강제로라도 군집(Clumping) 현상을 파괴합니다.
            import random
            sys_random = random.SystemRandom()
            
            for _ in range(7):
                sys_random.shuffle(raw_cards)
            
            # 🚀 3. 완전히 섞인 카드를 JSON 매칭용 구조체로 변환
            resolved_results = [TarotLayerResolver.resolve(card) for card in raw_cards]
            
            response["total_items"] = required_count
            response["drawn_results"] = resolved_results

        # 기존 로직에서 rune과 dice 부분을 아래처럼 교체합니다.
        elif tool == "rune":
            raw_runes = WitchsRunes.cast(count)
            # raw_runes가 ["Sun", "Flight"] 등 이름 리스트라고 가정
            response["total_items"] = count
            response["drawn_results"] = [WitchsRuneLayerResolver.resolve(r) for r in raw_runes]

        elif tool == "dice":
            roll_result = AstrologyDice.roll()
            response["total_items"] = 1 # 다이스 3개가 1세트이므로 1개로 취급
            response["drawn_results"] = [AstroDiceLayerResolver.resolve(roll_result)]

        elif tool == "graha":
            # 행성 단위만 필요할 때
            roll_result = AstrologyDice.roll()
            response["total_items"] = 1
            response["drawn_results"] = [{"type": "Planet", "value": roll_result["Planet"]}]

        elif tool == "flip_coin":
            # 코인/주식/투자 단기 흐름용 동전 던지기 (기본 x6)
            flips = [secrets.choice(["Heads", "Tails"]) for _ in range(6)]
            response["total_items"] = 6
            response["drawn_results"] = flips

        else:
            return {"status": "error", "message": f"Unknown tool requested: {tool}"}

        return response
    
# =========================================================
# [ C3 : YECHIDAH ] SYSTEM DATA & ENGINE
# =========================================================

# 🌌 세피라 고유 속성 데이터 프로필 (행성 조합 & 기둥 매핑)
YECHIDAH_SEPHIROT = {
    "kether":   {"planets": ["sun"], "pillar": "center"},
    "chokmah":  {"planets": ["jupiter"], "pillar": "benevolence"},
    "binah":    {"planets": ["saturn"], "pillar": "severity"},
    "chesed":   {"planets": ["jupiter", "mars"], "pillar": "benevolence"},
    "geburah":  {"planets": ["saturn", "mars"], "pillar": "severity"},
    "tiferet":  {"planets": ["venus"], "pillar": "center"},
    "netzach":  {"planets": ["jupiter", "mercury"], "pillar": "benevolence"},
    "hod":      {"planets": ["saturn", "mercury"], "pillar": "severity"},
    "yesod":    {"planets": ["mercury"], "pillar": "center"},
    "malkuth":  {"planets": ["moon"], "pillar": "center"}
}

# 🔗 세피로트의 나무 22개 경로(Paths) 정석 토폴로지 연결망
YECHIDAH_PATHS = {
    "path_11": ("kether", "chokmah"), "path_12": ("kether", "binah"),
    "path_13": ("netzach", "hod"),     "path_14": ("geburah", "chesed"),
    "path_15": ("binah", "chokmah"),   "path_16": ("tiferet", "netzach"),
    "path_17": ("tiferet", "hod"),     "path_18": ("hod", "yesod"),
    "path_19": ("tiferet", "kether"),  "path_20": ("tiferet", "chokmah"),
    "path_21": ("tiferet", "binah"),   "path_22": ("tiferet", "chesed"),
    "path_23": ("tiferet", "geburah"), "path_24": ("tiferet", "yesod"),
    "path_25": ("malkuth", "netzach"), "path_26": ("malkuth", "hod"),
    "path_27": ("yesod", "netzach"),   "path_28": ("yesod", "malkuth"),
    "path_29": ("chokmah", "chesed"),  "path_30": ("binah", "geburah"),
    "path_31": ("chesed", "netzach"),  "path_32": ("geburah", "hod")
}

# 🔺 유저 데이터 스키마(c3_yechidah.json) 구조를 그대로 추종하는 삼각형 맵 
YECHIDAH_TRIANGLES = {
    "triangle_01": ("kether", "chokmah", "binah"),
    "triangle_02": ("kether", "binah", "tiferet"),
    "triangle_03": ("kether", "chokmah", "tiferet"),
    "triangle_04": ("chokmah", "binah", "tiferet"),
    "triangle_05": ("binah", "geburah", "tiferet"),
    "triangle_06": ("chokmah", "chesed", "tiferet"),
    "triangle_07": ("geburah", "chesed", "tiferet"),
    "triangle_08": ("geburah", "tiferet", "hod"),
    "triangle_09": ("chesed", "tiferet", "netzach"),
    "triangle_10": ("tiferet", "hod", "netzach"),
    "triangle_11": ("tiferet", "hod", "yesod"),
    "triangle_12": ("tiferet", "netzach", "yesod"),
    "triangle_13": ("hod", "netzach", "yesod"),
    "triangle_14": ("kether", "chokmah", "binah"), # JSON 구조 무결성 유지용 가상 노드 매핑 
    "triangle_15": ("kether", "chokmah", "binah")  # JSON 구조 무결성 유지용 가상 노드 매핑 
}

def calculate_yechidah_reveal(payload):
    """
    [ יחידה ] Yechidah 연쇄 하강 그래프 연산 엔진
    """
    answers = payload.get("answers", {})
    
    # 1. 차원 벡터 초기화
    user_planets = {p: 0.0 for p in ["saturn", "jupiter", "mars", "sun", "venus", "mercury", "moon"]}
    user_pillars = {"severity": 0.0, "center": 0.0, "benevolence": 0.0}
    
    # 2. 영혼 층위별 차등 가중치(Weight) 분배 계산
    planet_weights = {
        "q_kether": 1.5,
        "q_tiferet": 1.3,
        "q_yesod": 1.1,
        "q_malkuth": 0.9
    }
    
    for q_key, weight in planet_weights.items():
        user_choice = answers.get(q_key)
        if user_choice:
            choice_clean = user_choice.lower()
            if choice_clean in user_planets:
                user_planets[choice_clean] += weight
                
    # 3. 기둥(Alignment) 질문 점수 합산
    pillar_questions = ["q_alignment_1", "q_alignment_2", "q_alignment_3"]
    for q_key in pillar_questions:
        user_choice = answers.get(q_key)
        if user_choice:
            choice_clean = user_choice.lower()
            if choice_clean in user_pillars:
                user_pillars[choice_clean] += 1.0
                
    # 3.5 기둥(Pillar) 시너지 텐션 매핑 함수 (내부 선언)
    def get_pillar_score(pillar, p_vec):
        cnt = p_vec[pillar]
        
        # Rule 1: 3개 몰빵이면 압도적 지배력 (3.0점)
        if cnt == 3: 
            return 3.0
            
        # Rule 2: 1개만 고른 기둥은 행성의 뼈대를 뒤집을 힘을 갖지 못함 (0.0점)
        if cnt == 1: 
            return 0.0  
            
        # Rule 3: 2개를 골랐을 때의 텐션 연산
        if cnt == 2:
            if pillar == "center":
                return 1.5
            else:
                opp = "benevolence" if pillar == "severity" else "severity"
                # 반대 기둥이 1개라도 섞여있다면 텐션(갈등)이 발생하여 기둥의 지배력이 상쇄됨
                if p_vec[opp] == 1:
                    return 0.0
                # 반대 기둥이 없다면(0개) 확실한 성향이므로 보너스 부여
                return 1.5
                
        return 0.0

    # 4. 10대 세피라 내적(Dot Product) 스코어링
    sephirot_scores = {}
    for seph_name, profile in YECHIDAH_SEPHIROT.items():
        # [행성 평균 정규화]: 다중 행성 세피라 점수 뻥튀기 방지
        planet_sum = sum(user_planets[p] for p in profile["planets"])
        planet_score = planet_sum / len(profile["planets"])
        
        # [비선형 텐션 필터 적용]
        pillar_score = get_pillar_score(profile["pillar"], user_pillars)
        
        sephirot_scores[seph_name] = planet_score + pillar_score

    # 5. 최종 우승 세피라 확정 (동점 시 오컬트 동기성 타이브레이커)
    max_seph_score = max(sephirot_scores.values())
    top_sephiroth = [k for k, v in sephirot_scores.items() if v == max_seph_score]
    winning_seph = secrets.choice(top_sephiroth) if len(top_sephiroth) > 1 else top_sephiroth[0]
    
    # 6. 토폴로지 연쇄 하강: 우승 세피라에 연결된 Path 필터링 및 결정
    candidate_paths = {}
    for path_id, nodes in YECHIDAH_PATHS.items():
        if winning_seph in nodes:
            # 연결망의 반대편 파트너 세피라 추적
            partner_node = nodes[0] if nodes[1] == winning_seph else nodes[1]
            # 파트너 노드의 가중치 점수를 그대로 상속
            candidate_paths[path_id] = (sephirot_scores[partner_node], partner_node)
            
    max_path_score = max(p_info[0] for p_info in candidate_paths.values())
    top_paths = [k for k, v in candidate_paths.items() if v[0] == max_path_score]
    winning_path = secrets.choice(top_paths) if len(top_paths) > 1 else top_paths[0]
    
    path_partner_seph = candidate_paths[winning_path][1]
    
    # 7. 기하학적 연쇄 하강: 결정된 두 세피라를 공유하는 삼각형(Triangle) 추출
    candidate_triangles = {}
    for tri_id, nodes in YECHIDAH_TRIANGLES.items():
        if winning_seph in nodes and path_partner_seph in nodes:
            # 삼각형을 완성하는 마지막 세 번째 예비 세피라 추출
            third_node_list = [n for n in nodes if n != winning_seph and n != path_partner_seph]
            if third_node_list:
                third_node = third_node_list[0]
                candidate_triangles[tri_id] = sephirot_scores.get(third_node, 0.0)
            else:
                # 스키마 예외 구조 방어용 제로 벡터
                candidate_triangles[tri_id] = 0.0
                
    if candidate_triangles:
        max_tri_score = max(candidate_triangles.values())
        top_triangles = [k for k, v in candidate_triangles.items() if v == max_tri_score]
        winning_triangle = secrets.choice(top_triangles) if len(top_triangles) > 1 else top_triangles[0]
    else:
        winning_triangle = "triangle_01" # 연결 실패 시 최상단 주권의 삼각형 백업 프로토콜
        
    # 8. Da'at (다아트) 심연의 문 임계값 트리거 판정
    # 🚀 [FIX 2]: 몰빵(3.0)이 아닌 혼합된 기둥을 가졌으며, 동시에 천상계(Kether, Chokmah, Binah)에 도달했을 때만 개방
    daat_triggered = (
        max(user_pillars.values()) < 3.0 and 
        winning_seph in ["kether", "chokmah", "binah"]
    )
    
    return {
        "status": "success",
        "final_sephiroth": winning_seph,
        "final_path": winning_path,
        "final_triangle": winning_triangle,
        "daat_triggered": daat_triggered,
        "debug_scores": {
            "sephirot_scores": sephirot_scores,
            "planet_vector": user_planets,
            "pillar_vector": user_pillars
        }
    }