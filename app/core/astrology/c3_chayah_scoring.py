# app/core/astrology/c3_chayah_scoring.py

"""
[ חיה ] CHAYAH : THE ORACLE OF STARS - SCORING LOGIC
이 파일은 Chayah 모듈의 선택지에 따른 점수(Graha, Fixed Star, Royal/Spica Bypass, Bad End)를 매핑합니다.
"""

CHAYAH_SCORING = {
    # ==========================================
    # 1. ALDEBARAN CLUSTER (Moon / Rohini Theme)
    # ==========================================
    "q_hamal_ketu": {
        "opt1": {"stars": {"hamal": 3}, "grahas": {"ketu": 2}},
        "opt2": {"stars": {}, "grahas": {"venus": 1.5, "sun": 1.5}},
        "opt3": {"stars": {}, "grahas": {"mars": 1.5, "rahu": 1.5}},
        "opt4": {"stars": {}, "grahas": {"moon": 2}, "royal_flag": "aldebaran", "flag_pts": 1},
        "opt5": {"stars": {"hamal": -1, "sheratan": -1, "pleiades": -1, "aldebaran": -1, "bellatrix": -1}, "grahas": {}, "bad_end_stack": 1}
    },
    "q_sheratan_venus": {
        "opt1": {"stars": {"sheratan": 3}, "grahas": {"venus": 2}},
        "opt2": {"stars": {}, "grahas": {"ketu": 1.5, "sun": 1.5}},
        "opt3": {"stars": {}, "grahas": {"mars": 1.5, "rahu": 1.5}},
        "opt4": {"stars": {}, "grahas": {"moon": 2}, "royal_flag": "aldebaran", "flag_pts": 1},
        "opt5": {"stars": {"hamal": -1, "sheratan": -1, "pleiades": -1, "aldebaran": -1, "bellatrix": -1}, "grahas": {}, "bad_end_stack": 1}
    },
    "q_pleiades_sun": {
        "opt1": {"stars": {"pleiades": 3}, "grahas": {"sun": 2}},
        "opt2": {"stars": {}, "grahas": {"ketu": 1.5, "venus": 1.5}},
        "opt3": {"stars": {}, "grahas": {"mars": 1.5, "rahu": 1.5}},
        "opt4": {"stars": {}, "grahas": {"moon": 2}, "royal_flag": "aldebaran", "flag_pts": 1},
        "opt5": {"stars": {"hamal": -1, "sheratan": -1, "pleiades": -1, "aldebaran": -1, "bellatrix": -1}, "grahas": {}, "bad_end_stack": 1}
    },
    "q_bellatrix_mars": {
        "opt1": {"stars": {"bellatrix": 3}, "grahas": {"mars": 2}},
        "opt2": {"stars": {}, "grahas": {"ketu": 1.5, "venus": 1.5, "sun": 1.5}},
        "opt3": {"stars": {}, "grahas": {"rahu": 1.5}},
        "opt4": {"stars": {}, "grahas": {"moon": 2}, "royal_flag": "aldebaran", "flag_pts": 1},
        "opt5": {"stars": {"hamal": -1, "sheratan": -1, "pleiades": -1, "aldebaran": -1, "bellatrix": -1}, "grahas": {}, "bad_end_stack": 1}
    },
    "q_betelgeuse_rahu": {
        "opt1": {"stars": {"betelgeuse": 3}, "grahas": {"rahu": 2}},
        "opt2": {"stars": {}, "grahas": {"ketu": 1.5, "venus": 1.5, "sun": 1.5}},
        "opt3": {"stars": {}, "grahas": {"mars": 1.5}},
        "opt4": {"stars": {}, "grahas": {"moon": 2}, "royal_flag": "aldebaran", "flag_pts": 1},
        "opt5": {"stars": {"hamal": -1, "sheratan": -1, "pleiades": -1, "aldebaran": -1, "bellatrix": -1}, "grahas": {}, "bad_end_stack": 1}
    },

    # ==========================================
    # 2. REGULUS CLUSTER (Ketu / Magha Theme)
    # ==========================================
    "q_pollux_jupiter": {
        "opt1": {"stars": {"pollux": 3}, "grahas": {"jupiter": 2}},
        "opt2": {"stars": {}, "grahas": {"saturn": 1.5, "mercury": 1.5}},
        "opt3": {"stars": {}, "grahas": {"venus": 1.5}},
        "opt4": {"stars": {}, "grahas": {"ketu": 2}, "royal_flag": "regulus", "flag_pts": 1},
        "opt5": {"stars": {"pollux": -1, "praesepe": -1, "alphard": -1, "regulus": -1, "zosma": -1}, "grahas": {}, "bad_end_stack": 1}
    },
    "q_praesepe_saturn": {
        "opt1": {"stars": {"praesepe": 3}, "grahas": {"saturn": 2}},
        "opt2": {"stars": {}, "grahas": {"jupiter": 1.5, "mercury": 1.5}},
        "opt3": {"stars": {}, "grahas": {"venus": 1.5}},
        "opt4": {"stars": {}, "grahas": {"ketu": 2}, "royal_flag": "regulus", "flag_pts": 1},
        "opt5": {"stars": {"pollux": -1, "praesepe": -1, "alphard": -1, "regulus": -1, "zosma": -1}, "grahas": {}, "bad_end_stack": 1}
    },
    "q_alphard_mercury": {
        "opt1": {"stars": {"alphard": 3}, "grahas": {"mercury": 2}},
        "opt2": {"stars": {}, "grahas": {"jupiter": 1.5, "saturn": 1.5}},
        "opt3": {"stars": {}, "grahas": {"venus": 1.5}},
        "opt4": {"stars": {}, "grahas": {"ketu": 2}, "royal_flag": "regulus", "flag_pts": 1},
        "opt5": {"stars": {"pollux": -1, "praesepe": -1, "alphard": -1, "regulus": -1, "zosma": -1}, "grahas": {}, "bad_end_stack": 1}
    },
    "q_zosma_venus": {
        "opt1": {"stars": {"zosma": 3}, "grahas": {"venus": 2}},
        "opt2": {"stars": {}, "grahas": {"jupiter": 1.5, "saturn": 1.5, "mercury": 1.5}},
        "opt3": {"stars": {}, "grahas": {"ketu": 2}, "royal_flag": "regulus", "flag_pts": 1},
        "opt4": {"stars": {"pollux": -1, "praesepe": -1, "alphard": -1, "regulus": -1, "zosma": -1}, "grahas": {}, "bad_end_stack": 1}
    },

    # ==========================================
    # 3. SPICA CLUSTER (Mars / Chitra Theme)
    # ==========================================
    "q_denebola_sun": {
        "opt1": {"stars": {"denebola": 3}, "grahas": {"sun": 2}},
        "opt2": {"stars": {}, "grahas": {"moon": 1.5, "rahu": 1.5}},
        "opt3": {"stars": {}, "grahas": {"jupiter": 1.5}},
        "opt4": {"stars": {}, "grahas": {"mars": 2}, "spica_flag": "spica", "flag_pts": 1},
        "opt5": {"stars": {"denebola": -1, "algorab": -1, "spica": -1, "arcturus": -1, "zuben_elgenubi": -1}, "grahas": {}, "bad_end_stack": 1}
    },
    "q_algorab_moon": {
        "opt1": {"stars": {"algorab": 3}, "grahas": {"moon": 2}},
        "opt2": {"stars": {}, "grahas": {"sun": 1.5}},
        "opt3": {"stars": {}, "grahas": {"rahu": 1.5}},
        "opt4": {"stars": {}, "grahas": {"jupiter": 1.5}},
        "opt5": {"stars": {}, "grahas": {"mars": 2}, "spica_flag": "spica", "flag_pts": 1}
    },
    "q_arcturus_rahu": {
        "opt1": {"stars": {"arcturus": 3}, "grahas": {"rahu": 2}},
        "opt2": {"stars": {}, "grahas": {"sun": 1.5}},
        "opt3": {"stars": {}, "grahas": {"moon": 1.5}},
        "opt4": {"stars": {}, "grahas": {"jupiter": 1.5}},
        "opt5": {"stars": {}, "grahas": {"mars": 2}, "spica_flag": "spica", "flag_pts": 1}
    },
    "q_zuben_elgenubi_jupiter": {
        "opt1": {"stars": {"zuben_elgenubi": 3}, "grahas": {"jupiter": 2}},
        "opt2": {"stars": {}, "grahas": {"sun": 1.5}},
        "opt3": {"stars": {}, "grahas": {"moon": 1.5, "rahu": 1.5}},
        "opt4": {"stars": {}, "grahas": {"mars": 2}, "spica_flag": "spica", "flag_pts": 1},
        "opt5": {"stars": {"denebola": -1, "algorab": -1, "spica": -1, "arcturus": -1, "zuben_elgenubi": -1}, "grahas": {}, "bad_end_stack": 1}
    },

    # ==========================================
    # 4. ANTARES CLUSTER (Mercury / Jyeshtha Theme)
    # ==========================================
    "q_dschubba_saturn": {
        "opt1": {"stars": {"dschubba": 3}, "grahas": {"saturn": 2}},
        "opt2": {"stars": {}, "grahas": {"ketu": 1.5, "venus": 1.5, "sun": 1.5}},
        "opt3": {"stars": {}, "grahas": {"moon": 1.5}},
        "opt4": {"stars": {}, "grahas": {"mercury": 2}, "royal_flag": "antares", "flag_pts": 1},
        "opt5": {"stars": {"dschubba": -1, "antares": -1, "galactic_center": -1, "nunki": -1, "vega": -1, "altair": -1}, "grahas": {}, "bad_end_stack": 1}
    },
    "q_galactic_center_ketu": {
        "opt1": {"stars": {"galactic_center": 3}, "grahas": {"ketu": 2}},
        "opt2": {"stars": {}, "grahas": {"saturn": 1.5}},
        "opt3": {"stars": {}, "grahas": {"venus": 1.5, "sun": 1.5}},
        "opt4": {"stars": {}, "grahas": {"moon": 1.5}},
        "opt5": {"stars": {}, "grahas": {"mercury": 2}, "royal_flag": "antares", "flag_pts": 1}
    },
    "q_nunki_venus": {
        "opt1": {"stars": {"nunki": 3}, "grahas": {"venus": 2}},
        "opt2": {"stars": {}, "grahas": {"saturn": 1.5}},
        "opt3": {"stars": {}, "grahas": {"ketu": 1.5, "sun": 1.5}},
        "opt4": {"stars": {}, "grahas": {"moon": 1.5}},
        "opt5": {"stars": {}, "grahas": {"mercury": 2}, "royal_flag": "antares", "flag_pts": 1}
    },
    "q_vega_sun": {
        "opt1": {"stars": {"vega": 3}, "grahas": {"sun": 2}},
        "opt2": {"stars": {}, "grahas": {"saturn": 1.5}},
        "opt3": {"stars": {}, "grahas": {"ketu": 1.5, "venus": 1.5}},
        "opt4": {"stars": {}, "grahas": {"moon": 1.5}},
        "opt5": {"stars": {}, "grahas": {"mercury": 2}, "royal_flag": "antares", "flag_pts": 1}
    },
    "q_altair_moon": {
        "opt1": {"stars": {"altair": 3}, "grahas": {"moon": 2}},
        "opt2": {"stars": {}, "grahas": {"saturn": 1.5}},
        "opt3": {"stars": {}, "grahas": {"ketu": 1.5, "venus": 1.5, "sun": 1.5}},
        "opt4": {"stars": {}, "grahas": {"mercury": 2}, "royal_flag": "antares", "flag_pts": 1},
        "opt5": {"stars": {"dschubba": -1, "antares": -1, "galactic_center": -1, "nunki": -1, "vega": -1, "altair": -1}, "grahas": {}, "bad_end_stack": 1}
    },

    # ==========================================
    # 5. FOMALHAUT CLUSTER (Rahu / Shatabhisha Theme)
    # ==========================================
    "q_deneb_algedi_mars": {
        "opt1": {"stars": {"deneb_algedi": 3}, "grahas": {"mars": 2}},
        "opt2": {"stars": {}, "grahas": {"jupiter": 1.5, "saturn": 1.5, "mercury": 1.5}},
        "opt3": {"stars": {}, "grahas": {"rahu": 2}, "royal_flag": "fomalhaut", "flag_pts": 1},
        "opt4": {"stars": {"deneb_algedi": -1, "fomalhaut": -1, "markab": -1, "alpheratz": -1, "alrischa": -1}, "grahas": {}, "bad_end_stack": 1}
    },
    "q_markab_jupiter": {
        "opt1": {"stars": {"markab": 3}, "grahas": {"jupiter": 2}},
        "opt2": {"stars": {}, "grahas": {"mars": 1.5}},
        "opt3": {"stars": {}, "grahas": {"saturn": 1.5, "mercury": 1.5}},
        "opt4": {"stars": {}, "grahas": {"rahu": 2}, "royal_flag": "fomalhaut", "flag_pts": 1},
        "opt5": {"stars": {"deneb_algedi": -1, "fomalhaut": -1, "markab": -1, "alpheratz": -1, "alrischa": -1}, "grahas": {}, "bad_end_stack": 1}
    },
    "q_alpheratz_saturn": {
        "opt1": {"stars": {"alpheratz": 3}, "grahas": {"saturn": 2}},
        "opt2": {"stars": {}, "grahas": {"mars": 1.5}},
        "opt3": {"stars": {}, "grahas": {"jupiter": 1.5, "mercury": 1.5}},
        "opt4": {"stars": {}, "grahas": {"rahu": 2}, "royal_flag": "fomalhaut", "flag_pts": 1},
        "opt5": {"stars": {"deneb_algedi": -1, "fomalhaut": -1, "markab": -1, "alpheratz": -1, "alrischa": -1}, "grahas": {}, "bad_end_stack": 1}
    },
    "q_alrischa_mercury": {
        "opt1": {"stars": {"alrischa": 3}, "grahas": {"mercury": 2}},
        "opt2": {"stars": {}, "grahas": {"mars": 1.5}},
        "opt3": {"stars": {}, "grahas": {"jupiter": 1.5, "saturn": 1.5, "mercury": 1.5}},
        "opt4": {"stars": {}, "grahas": {"rahu": 2}, "royal_flag": "fomalhaut", "flag_pts": 1}
    }
}

# ==========================================
# 동점자 판별 (Tie-Breaker) 매핑
# ==========================================

VOID_ROYAL_MAP = {
    "opt1": "aldebaran",
    "opt2": "regulus",
    "opt3": "antares",
    "opt4": "fomalhaut"
}

VOID_GRAHA_MAP = {
    "opt1": "ketu",
    "opt2": "venus",
    "opt3": "sun",
    "opt4": "moon",
    "opt5": "mars",
    "opt6": "rahu",
    "opt7": "jupiter",
    "opt8": "saturn",
    "opt9": "mercury"
}

VOID_STARS_MAP = {
    "ketu_1": "hamal",
    "ketu_2": "galactic_center",
    "venus_1": "sheratan",
    "venus_2": "zosma",
    "venus_3": "nunki",
    "sun_1": "pleiades",
    "sun_2": "denebola",
    "sun_3": "vega",
    "moon_1": "algorab",
    "moon_2": "altair",
    "mars_1": "bellatrix",
    "mars_2": "deneb_algedi",
    "rahu_1": "betelgeuse",
    "rahu_2": "arcturus",
    "jupiter_1": "pollux",
    "jupiter_2": "zuben_elgenubi",
    "jupiter_3": "markab",
    "saturn_1": "praesepe",
    "saturn_2": "dschubba",
    "saturn_3": "alpheratz",
    "mercury_1": "alphard",
    "mercury_2": "alrischa"
}