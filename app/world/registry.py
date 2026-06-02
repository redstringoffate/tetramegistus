# app/world/registry.py

# 각 스테이지가 어떤 모듈들을 포함하고 있는지 순서대로 나열합니다.
STAGE_MAP = {
    "nigredo": ["n1", "n2", "n3", "n4", "n5"],
    "albedo": ["a1", "a2", "a3", "a4", "a5"],
    "citrinitas": ["c1"],
    "rubedo": ["r1"]
}

# app/world/registry.py

STAGE_MAP = {
    "nigredo": [
        {"id": "n1", "title": "PRIMA MATERIA"},
        {"id": "n2", "title": "PRINCIPIA"},
        {"id": "n3", "title": "DOMUS"}, # House cusps, Realms 
        {"id": "n4", "title": "ARCANA"}, # Hermetic Lots
        {"id": "n5", "title": "SCHEMA"}, # Aspects and Shapes
        {"id": "n6", "title": "DIVISIO"}, # Harmonics and Varga
        {"id": "n7", "title": "HYPOSTASES"}, # Nine Personas
        {"id": "n8", "title": "CODEX TENEBRIS"}, # Natal Map
        {"id": "n9", "title": "CHRONOMANTIA"} # Fortune Map
    ],
    "albedo": [
        {"id": "a1", "title": "CONIUNCTIO"},
        {"id": "a2", "title": "COAGULATIO"},
        {"id": "a3", "title": "ORDINATIO"},
        {"id": "a4", "title": "FIGURA"},
        {"id": "a5", "title": "ASPECTUS"},
        {"id": "a6", "title": "MULTIPLICATIO"},
        {"id": "a7", "title": "EVOCATIONES"},
        {"id": "a8", "title": "CODEX LUCIS"},
        {"id": "a9", "title": "SYNCHRONICUM"},
        {"id": "a10", "title": "RESONANTIA"}
    ],
    "citrinitas": [
        {"id": "c1", "title": "TABULA"},
        {"id": "c2", "title": "HORA OCCULTA"},
        {"id": "c3", "title": "ILLUMINATIO"},
        # ... 나머지도 같은 형식
    ],
    "rubedo": [
        {"id": "r1", "title": "CORPUS HERMETICUM"},
        {"id": "r2", "title": "SABIAN SYMBOLS"},
        # ... 나머지도 같은 형식
    ]

}