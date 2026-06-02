import json
from pathlib import Path

_ME_FILE = Path(".me.json")


def load_me():
    if not _ME_FILE.exists():
        return None
    try:
        with _ME_FILE.open("r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return None


def save_me(me: dict):
    with _ME_FILE.open("w", encoding="utf-8") as f:
        json.dump(me, f)


def delete_me():
    if _ME_FILE.exists():
        _ME_FILE.unlink()
