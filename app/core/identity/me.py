# core/identity/me.py

from core.storage.local import load_me


def me_exists() -> bool:
    """
    [me]의 존재 여부만 판별한다.
    [me]는 분해 불가능한 원자적 존재이므로
    부분 상태나 임시 상태는 허용되지 않는다.
    """
    me = load_me()
    return me is not None
