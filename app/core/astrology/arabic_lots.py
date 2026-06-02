# app/core/astrology/arabic_lots.py

def calculate_arabic_lots(points, house_cusps, rulers, lord_of_hour, p_new_moon, p_full_moon, fortune_lon, spirit_lon):
    """
    :param points: { 'Ascendant': lon, 'Sun': lon, ... }
    :param house_cusps: { 1: lon, ... 12: lon }
    :param rulers: { 1: 'Mars', 10: 'Jupiter', ... } (정수 인덱스 사용)
    :param p_new_moon: float (Prenatal New Moon 경도)
    :param p_full_moon: float (Prenatal Full Moon 경도)
    :param fortune_lon: float (Lot of Fortune)
    :param spirit_lon: float (Lot of Spirit)
    """
    lots = {}

    def get_lon(name):
        # Descendant, Midheaven 등 풀네임 대응
        return points.get(name, 0.0)

    def get_cusp(h_num):
        return house_cusps.get(h_num, 0.0)

    def get_ruler_lon(h_num):
        # rulers[1] -> 'Mars' -> points['Mars'] 순차 조회
        ruler_name = rulers.get(h_num)
        return points.get(ruler_name, 0.0)

    # 🚀 [사용자 공식 수복 완료]
    
    # 1. 일반 행성 조합
    lots['Advancement'] = (get_lon('Ascendant') + get_lon('Sun') - get_lon('Saturn')) % 360
    lots['Authority'] = (get_lon('Ascendant') + get_lon('Sun') - get_lon('Mars')) % 360
    lots['Compulsion'] = (get_lon('Ascendant') + get_lon('Mercury') - spirit_lon) % 360
    lots['Delusion'] = (get_lon('Ascendant') + get_lon('Neptune') - get_lon('Moon')) % 360
    lots['Death Point (Emerson)'] = (get_lon('Mars') + get_lon('Saturn') - get_lon('Midheaven')) % 360
    lots['Destiny'] = (get_lon('Midheaven') + get_lon('Sun') - get_lon('Moon')) % 360
    lots['Fame and Reputation'] = (get_lon('Ascendant') + get_lon('Midheaven') - get_lon('Sun')) % 360
    lots['Fatality (Hourglass)'] = (get_lon('Ascendant') + get_lon('Saturn') - get_lon('Sun')) % 360
    lots['Increase (Pomegranate)'] = (get_lon('Ascendant') + get_lon('Jupiter') - get_lon('Sun')) % 360
    lots['Madness'] = (get_lon('Ascendant') + get_lon('Neptune') - get_lon('Sun')) % 360
    lots['Miracles'] = (get_lon('Ascendant') + get_lon('Sun') - get_lon('Pluto')) % 360
    lots['Misunderstanding'] = (get_lon('Ascendant') + get_lon('Neptune') - get_lon('Mars')) % 360
    lots['Need & Desire'] = (get_lon('Mercury') + get_lon('Mars') - get_lon('Saturn')) % 360
    lots['Office & King'] = (get_lon('Ascendant') + get_lon('Midheaven') - get_lon('Jupiter')) % 360
    lots['Prejudice'] = (get_lon('Ascendant') + get_lon('Mercury') - get_lon('Moon')) % 360
    lots['Prosperity'] = (get_lon('Ascendant') + get_lon('Descendant') - get_lon('Sun')) % 360
    lots['Repression'] = (get_lon('Ascendant') + get_lon('Saturn') - get_lon('Pluto')) % 360
    lots['Revelation'] = (get_lon('Ascendant') + get_lon('Moon') - get_lon('Neptune')) % 360
    lots['Stability'] = (get_lon('Ascendant') + get_lon('Saturn') - get_lon('Mercury')) % 360
    lots['Sudden Parting'] = (get_lon('Ascendant') + get_lon('Saturn') - get_lon('Uranus')) % 360
    lots['Temperament'] = (get_lon('Ascendant') + get_lon('Sun') - get_lon('Mercury')) % 360
    lots['Those Suddenly Elevated'] = (get_lon('Ascendant') + fortune_lon - get_lon('Saturn')) % 360
    lots['Vanity'] = (get_lon('Ascendant') + get_lon('Venus') - get_lon('Neptune')) % 360
    lots['War (al-Tabari)'] = (get_lon('Ascendant') + get_lon('Moon') - get_lon('Mars')) % 360
    lots['Work of Truth'] = (get_lon('Ascendant') + get_lon('Mars') - get_lon('Mercury')) % 360

    # 2. Cusp & Ruler 복합 로직
    lots['Enemies (Hermes)'] = (get_lon('Ascendant') + get_cusp(12) - get_ruler_lon(12)) % 360
    lots['If an Event will Come About'] = (get_cusp(10) + get_lon('Ascendant') - get_ruler_lon(7)) % 360
    lots['Mind and Captivity'] = (get_lon('Ascendant') + get_cusp(3) - get_lon('Mercury')) % 360
    lots['Transformation (Point of Sonia)'] = (get_lon('Jupiter') + get_ruler_lon(4) - get_lon('Descendant')) % 360
    lots['Business Partnerships'] = (get_lon('Ascendant') + get_lon('Descendant') - get_ruler_lon(10)) % 360
    lots['Courage, Violence & Combat'] = (get_lon('Ascendant') + get_lon('Moon') - get_ruler_lon(1)) % 360
    lots['Death (al-Tabari 1)'] = (get_cusp(8) + get_ruler_lon(1) - get_ruler_lon(8)) % 360

    # 3. 특수 Signifier (Lord of Hour, Prenatal Moons)
    lots['If an Outcome Will be Useful'] = (get_lon('Ascendant') + lord_of_hour - get_ruler_lon(1)) % 360
    lots['Rumors'] = (get_lon('Ascendant') + get_ruler_lon(1) - lord_of_hour) % 360
    lots['Life (Female)'] = (get_lon('Ascendant') + get_lon('Moon') - p_new_moon) % 360
    lots['Life (Male)'] = (get_lon('Ascendant') + get_lon('Moon') - p_full_moon) % 360

    # 4. Enemies 시리즈 (Olympiodorus 등)
    lots['Enemies (Olympiodorus A)'] = (get_lon('Ascendant') + get_lon('Mars') - get_lon('Saturn')) % 360
    lots['Enemies (Firmicus)'] = (get_lon('Ascendant') + get_lon('Mercury') - get_lon('Mars')) % 360
    lots['Enemies (Laurentianus)'] = (get_lon('Ascendant') + get_lon('Mercury') - get_lon('Saturn')) % 360
    lots['Enemies (Olympiodorus B)'] = (get_lon('Ascendant') + get_lon('Mars') - get_lon('Sun')) % 360
    lots['Enemies (Olympiodorus C)'] = (get_lon('Ascendant') + get_lon('Mercury') - get_lon('Venus')) % 360

    return lots