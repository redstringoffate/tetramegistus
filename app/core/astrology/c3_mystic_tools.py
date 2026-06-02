# app/core/astrology/c3_mystic_tools.py
import secrets

# =========================================================
# [ C3 : RUACH ]
# =========================================================

class MotherDice:
    """ 6-sided dice for Mother Letters (Shin, Mem, Aleph) """
    @staticmethod
    def roll():
        result = secrets.choice([1, 2, 3, 4, 5, 6])
        if result in [1, 4]:
            return "Shin"
        elif result in [2, 5]:
            return "Mem"
        else: # 3, 6
            return "Aleph"

class GoldenCoin:
    """ Coin with Heads/Tails for 2-Rune Tie-breakers """
    HEADS_RUNES = ["Uruz", "Gebo", "Nied", "Algiz", "Berkano", "Dagaz"]
    TAILS_RUNES = ["Thurisaz", "Wunjo", "Isaz", "Sowilo", "Ehwaz", "Othala"]

    @staticmethod
    def flip(rune_options):
        result = secrets.choice(["Heads", "Tails"])
        for rune in rune_options:
            if result == "Heads" and rune in GoldenCoin.HEADS_RUNES:
                return rune, result
            elif result == "Tails" and rune in GoldenCoin.TAILS_RUNES:
                return rune, result
        return rune_options[0], result # Fallback

class RuneDice:
    """ 6-sided dice for 3-Rune Tie-breakers """
    ALEPH_RUNES = ["Ansuz", "Jera", "Mannaz"]
    MEM_RUNES = ["Raidho", "Eihwaz", "Laguz"]
    SHIN_RUNES = ["Kenaz", "Peroth", "Ingwaz"]

    @staticmethod
    def roll(rune_options):
        result = secrets.choice([1, 2, 3, 4, 5, 6])
        target_list = []
        if result in [1, 4]: target_list = RuneDice.ALEPH_RUNES
        elif result in [2, 5]: target_list = RuneDice.MEM_RUNES
        else: target_list = RuneDice.SHIN_RUNES
        
        for rune in rune_options:
            if rune in target_list:
                return rune, result
        return rune_options[0], result # Fallback
    
# =========================================================
# [ C3 : NESHAMAH ]
# =========================================================

class TarotDeck:
    """ 78-card Tarot Deck: 22 Major Arcana + 56 Minor Arcana """
    
    MAJOR_ARCANA = [
        "0_Fool", "1_Magician", "2_High_Priestess", "3_Empress", "4_Emperor",
        "5_Hierophant", "6_Lovers", "7_Chariot", "8_Strength", "9_Hermit",
        "10_Wheel_of_Fortune", "11_Justice", "12_Hanged_Man", "13_Death",
        "14_Temperance", "15_Devil", "16_Tower", "17_Star", "18_Moon",
        "19_Sun", "20_Judgement", "21_World"
    ]
    
    SUITS = ["Wands", "Cups", "Swords", "Coins"]
    RANKS = ["Ace", "2", "3", "4", "5", "6", "7", "8", "9", "10", "Page", "Knight", "Queen", "King"]

    @classmethod
    def get_full_deck(cls):
        minor = [f"{rank}_{suit}" for suit in cls.SUITS for rank in cls.RANKS]
        return cls.MAJOR_ARCANA + minor

    @classmethod
    def draw(cls, count=1, exclude=None):
        """ 🚀 메이저/마이너 전체 덱에서 진짜 난수로 한 장씩 드로우 """
        full_deck = cls.get_full_deck()
        exclude_list = exclude or []
        available_deck = [card for card in full_deck if card not in exclude_list]
        
        if len(available_deck) < count:
            raise ValueError(f"덱에 남은 카드가 부족합니다. (가용: {len(available_deck)}장, 요청: {count}장)")
            
        drawn_cards = []
        for _ in range(count):
            card = secrets.choice(available_deck)
            drawn_cards.append(card)
            available_deck.remove(card) # 뽑힌 카드는 즉시 덱에서 배제
            
        return drawn_cards

    @classmethod
    def draw_major(cls, count=1, exclude=None):
        """ 🚀 메이저 덱에서만 진짜 난수로 한 장씩 드로우 """
        exclude_list = exclude or []
        available_deck = [card for card in cls.MAJOR_ARCANA if card not in exclude_list]
        
        if len(available_deck) < count:
            raise ValueError(f"남은 메이저 카드가 부족합니다. (가용: {len(available_deck)}장, 요청: {count}장)")
            
        drawn_cards = []
        for _ in range(count):
            card = secrets.choice(available_deck)
            drawn_cards.append(card)
            available_deck.remove(card)
            
        return drawn_cards

class AstrologyDice:
    """ 3 D12 Dice: Planets, Signs, Houses """
    PLANETS = ["Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune", "Pluto", "Rahu", "Ketu"]
    SIGNS = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"]
    HOUSES = [str(i) for i in range(1, 13)]

    @classmethod
    def roll(cls):
        return {
            "Planet": secrets.choice(cls.PLANETS),
            "Sign": secrets.choice(cls.SIGNS),
            "House": secrets.choice(cls.HOUSES)
        }

class WitchsRunes:
    """ 13 Witch's Runes """
    RUNES = ["Sun", "Moon", "Flight", "Rings", "Triquetra", "Woman", "Man", "Harvest", "Crossroads", "Star", "Waves", "Scythe", "Eye"]

    @classmethod
    def cast(cls, count=1):
        safe_count = min(count, len(cls.RUNES))
        available_runes = list(cls.RUNES)
        drawn_runes = []
        for _ in range(safe_count):
            rune = secrets.choice(available_runes)
            drawn_runes.append(rune)
            available_runes.remove(rune)
        return drawn_runes

class FateCoin:
    """ Coin with Heads/Tails """
    @staticmethod
    def flip():
        return secrets.choice(["Heads", "Tails"])