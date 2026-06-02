# app/api/cities.py

from fastapi import APIRouter

# ─────────────────────────────
# City data (기존 그대로)
# ─────────────────────────────



CITIES = {

    # ─────────────────────────────
    # Afghanistan
    # ─────────────────────────────

    "af_kabul": {
        "city": "Kabul",
        "state": None,
        "country": "Afghanistan",
        "label": "Kabul, Afghanistan",
        "lat": 34.5439,
        "lon": 69.1607,
        "tz": "Asia/Kabul",
    },

    # ─────────────────────────────
    # Albania
    # ─────────────────────────────

    "al_tirana": {
        "city": "Tirana",
        "state": None,
        "country": "Albania",
        "label": "Tirana, Albania",
        "lat": 41.3280,
        "lon": 19.8190,
        "tz": "Europe/Tirane",
    },

    # ─────────────────────────────
    # Algeria
    # ─────────────────────────────

    "dz_algiers": {
        "city": "Algiers",
        "state": None,
        "country": "Algeria",
        "label": "Algiers, Algeria",
        "lat": 36.7372,
        "lon": 3.0865,
        "tz": "Africa/Algiers",
    },

    # ─────────────────────────────
    # Andorra
    # ─────────────────────────────

    "ad_andorra_la_vella": {
        "city": "Andorra la Vella",
        "state": None,
        "country": "Andorra",
        "label": "Andorra la Vella, Andorra",
        "lat": 42.5063,
        "lon": 1.5218,
        "tz": "Europe/Andorra",
    },

    # ─────────────────────────────
    # Angola
    # ─────────────────────────────

    "ao_luanda": {
        "city": "Luanda",
        "state": None,
        "country": "Angola",
        "label": "Luanda, Angola",
        "lat": -8.8383,
        "lon": 13.2344,
        "tz": "Africa/Luanda",
    },

    # ─────────────────────────────
    # Antigua and Barbuda
    # ─────────────────────────────

    "ag_saint_johns": {
        "city": "Saint John's",
        "state": None,
        "country": "Antigua and Barbuda",
        "label": "Saint John's, Antigua and Barbuda",
        "lat": 17.1273,
        "lon": -61.8473,
        "tz": "America/Antigua",
    },

	# ─────────────────────────────
	# Argentina
	# ─────────────────────────────

	"ar_buenos_aires": {
		"city": "Buenos Aires",
		"state": None,
		"country": "Argentina",
		"label": "Buenos Aires, Argentina",
		"lat": -34.6037,
		"lon": -58.3815,
		"tz": "America/Argentina/Buenos_Aires",
	},

	"ar_cordoba": {
		"city": "Córdoba",
		"state": None,
		"country": "Argentina",
		"label": "Córdoba, Argentina",
		"lat": -31.4064,
		"lon": -64.1885,
		"tz": "America/Argentina/Cordoba",
	},

	"ar_rosario": {
		"city": "Rosario",
		"state": None,
		"country": "Argentina",
		"label": "Rosario, Argentina",
		"lat": -32.9468,
		"lon": -60.6393,
		"tz": "America/Argentina/Buenos_Aires",
	},

	# ─────────────────────────────
	# Armenia
	# ─────────────────────────────

	"am_yerevan": {
		"city": "Yerevan",
		"state": None,
		"country": "Armenia",
		"label": "Yerevan, Armenia",
		"lat": 40.1772,
		"lon": 44.5034,
		"tz": "Asia/Yerevan",
	},

	# ─────────────────────────────
	# Australia (state o)
	# ─────────────────────────────

	"au_adelaide": {
		"city": "Adelaide",
		"state": "South Australia",
		"country": "Australia",
		"label": "Adelaide, South Australia, Australia",
		"lat": -34.9286,
		"lon": 138.5986,
		"tz": "Australia/Adelaide",
	},

	"au_brisbane": {
		"city": "Brisbane",
		"state": "Queensland",
		"country": "Australia",
		"label": "Brisbane, Queensland, Australia",
		"lat": -27.4679,
		"lon": 153.0280,
		"tz": "Australia/Brisbane",
	},

	"au_canberra": {
		"city": "Canberra",
		"state": "ACT",
		"country": "Australia",
		"label": "Canberra, ACT, Australia",
		"lat": -35.2820,
		"lon": 149.1290,
		"tz": "Australia/Sydney",
	},

	"au_melbourne": {
		"city": "Melbourne",
		"state": "Victoria",
		"country": "Australia",
		"label": "Melbourne, Victoria, Australia",
		"lat": -37.8140,
		"lon": 144.9633,
		"tz": "Australia/Melbourne",
	},

	"au_perth": {
		"city": "Perth",
		"state": "Western Australia",
		"country": "Australia",
		"label": "Perth, Western Australia, Australia",
		"lat": -31.9522,
		"lon": 115.8614,
		"tz": "Australia/Perth",
	},

	"au_sydney": {
		"city": "Sydney",
		"state": "New South Wales",
		"country": "Australia",
		"label": "Sydney, New South Wales, Australia",
		"lat": -33.8678,
		"lon": 151.2073,
		"tz": "Australia/Sydney",
	},

    # ─────────────────────────────
    # Austria
    # ─────────────────────────────

    "at_vienna": {
        "city": "Vienna",
        "state": None,
        "country": "Austria",
        "label": "Vienna, Austria",
        "lat": 48.2100,
        "lon": 16.3634,
        "tz": "Europe/Vienna",
    },

    # ─────────────────────────────
    # Azerbaijan
    # ─────────────────────────────

    "az_baku": {
        "city": "Baku",
        "state": None,
        "country": "Azerbaijan",
        "label": "Baku, Azerbaijan",
        "lat": 40.4093,
        "lon": 49.8671,
        "tz": "Asia/Baku",
    },

    # ─────────────────────────────
    # Bahamas
    # ─────────────────────────────

    "bs_nassau": {
        "city": "Nassau",
        "state": None,
        "country": "Bahamas",
        "label": "Nassau, Bahamas",
        "lat": 25.0600,
        "lon": -77.3450,
        "tz": "America/Nassau",
    },

    # ─────────────────────────────
    # Bahrain
    # ─────────────────────────────

    "bh_manama": {
        "city": "Manama",
        "state": None,
        "country": "Bahrain",
        "label": "Manama, Bahrain",
        "lat": 26.2235,
        "lon": 50.5869,
        "tz": "Asia/Bahrain",
    },

    # ─────────────────────────────
    # Bangladesh
    # ─────────────────────────────

    "bd_dhaka": {
        "city": "Dhaka",
        "state": None,
        "country": "Bangladesh",
        "label": "Dhaka, Bangladesh",
        "lat": 23.8103,
        "lon": 90.4125,
        "tz": "Asia/Dhaka",
    },

    # ─────────────────────────────
    # Barbados
    # ─────────────────────────────

    "bb_bridgetown": {
        "city": "Bridgetown",
        "state": None,
        "country": "Barbados",
        "label": "Bridgetown, Barbados",
        "lat": 13.1035,
        "lon": -59.6032,
        "tz": "America/Barbados",
    },

    # ─────────────────────────────
    # Belarus
    # ─────────────────────────────

    "by_minsk": {
        "city": "Minsk",
        "state": None,
        "country": "Belarus",
        "label": "Minsk, Belarus",
        "lat": 53.8930,
        "lon": 27.5674,
        "tz": "Europe/Minsk",
    },

    # ─────────────────────────────
    # Belgium
    # ─────────────────────────────

    "be_brussels": {
        "city": "Brussels",
        "state": None,
        "country": "Belgium",
        "label": "Brussels, Belgium",
        "lat": 50.8478,
        "lon": 4.3494,
        "tz": "Europe/Brussels",
    },

    # ─────────────────────────────
    # Belize
    # ─────────────────────────────

    "bz_belmopan": {
        "city": "Belmopan",
        "state": None,
        "country": "Belize",
        "label": "Belmopan, Belize",
        "lat": 17.2520,
        "lon": -88.7670,
        "tz": "America/Belize",
    },

	# ─────────────────────────────
	# Benin
	# ─────────────────────────────

	"bj_portonovo": {
		"city": "Porto-Novo",
		"state": None,
		"country": "Benin",
		"label": "Porto-Novo, Benin",
		"lat": 6.4965,
		"lon": 2.6036,
		"tz": "Africa/Porto-Novo",
	},

	# ─────────────────────────────
	# Bhutan
	# ─────────────────────────────

	"bt_thimphu": {
		"city": "Thimphu",
		"state": None,
		"country": "Bhutan",
		"label": "Thimphu, Bhutan",
		"lat": 27.4661,
		"lon": 89.6419,
		"tz": "Asia/Thimphu",
	},

	# ─────────────────────────────
	# Bolivia
	# ─────────────────────────────

	"bo_la_paz": {
		"city": "La Paz",
		"state": None,
		"country": "Bolivia",
		"label": "La Paz, Bolivia",
		"lat": -16.4897,
		"lon": -68.1193,
		"tz": "America/La_Paz",
	},

	"bo_sucre": {
		"city": "Sucre",
		"state": None,
		"country": "Bolivia",
		"label": "Sucre, Bolivia",
		"lat": -19.0196,
		"lon": -65.2620,
		"tz": "America/La_Paz",
	},

	# ─────────────────────────────
	# Bosnia and Herzegovina
	# ─────────────────────────────

	"ba_sarajevo": {
		"city": "Sarajevo",
		"state": None,
		"country": "Bosnia and Herzegovina",
		"label": "Sarajevo, Bosnia and Herzegovina",
		"lat": 43.8564,
		"lon": 18.4130,
		"tz": "Europe/Sarajevo",
	},

	# ─────────────────────────────
	# Botswana
	# ─────────────────────────────

	"bw_gaborone": {
		"city": "Gaborone",
		"state": None,
		"country": "Botswana",
		"label": "Gaborone, Botswana",
		"lat": -24.6533,
		"lon": 25.9068,
		"tz": "Africa/Gaborone",
	},

	# ─────────────────────────────
	# Brazil (state o)
	# ─────────────────────────────

	"br_belo_horizonte": {
		"city": "Belo Horizonte",
		"state": "Minas Gerais",
		"country": "Brazil",
		"label": "Belo Horizonte, Minas Gerais, Brazil",
		"lat": -19.9208,
		"lon": -43.9377,
		"tz": "America/Sao_Paulo",
	},

	"br_brasilia": {
		"city": "Brasília",
		"state": "DF",
		"country": "Brazil",
		"label": "Brasília, DF, Brazil",
		"lat": -15.7939,
		"lon": -47.8828,
		"tz": "America/Sao_Paulo",
	},

	"br_campinas": {
		"city": "Campinas",
		"state": "São Paulo",
		"country": "Brazil",
		"label": "Campinas, São Paulo, Brazil",
		"lat": -22.9055,
		"lon": -47.0608,
		"tz": "America/Sao_Paulo",
	},

	"br_curitiba": {
		"city": "Curitiba",
		"state": "Paraná",
		"country": "Brazil",
		"label": "Curitiba, Paraná, Brazil",
		"lat": -25.4277,
		"lon": -49.2730,
		"tz": "America/Sao_Paulo",
	},

	"br_fortaleza": {
		"city": "Fortaleza",
		"state": "Ceará",
		"country": "Brazil",
		"label": "Fortaleza, Ceará, Brazil",
		"lat": -3.7172,
		"lon": -38.5430,
		"tz": "America/Fortaleza",
	},

	"br_porto_alegre": {
		"city": "Porto Alegre",
		"state": "Rio Grande do Sul",
		"country": "Brazil",
		"label": "Porto Alegre, Rio Grande do Sul, Brazil",
		"lat": -30.0328,
		"lon": -51.2301,
		"tz": "America/Sao_Paulo",
	},

	"br_recife": {
		"city": "Recife",
		"state": "Pernambuco",
		"country": "Brazil",
		"label": "Recife, Pernambuco, Brazil",
		"lat": -8.0538,
		"lon": -34.8811,
		"tz": "America/Recife",
	},

	"br_rio_de_janeiro": {
		"city": "Rio de Janeiro",
		"state": None,
		"country": "Brazil",
		"label": "Rio de Janeiro, Brazil",
		"lat": -22.9064,
		"lon": -43.1822,
		"tz": "America/Sao_Paulo",
	},

	"br_salvador": {
		"city": "Salvador",
		"state": "Bahia",
		"country": "Brazil",
		"label": "Salvador, Bahia, Brazil",
		"lat": -12.9777,
		"lon": -38.5016,
		"tz": "America/Bahia",
	},

	"br_sao_paulo": {
		"city": "São Paulo",
		"state": "São Paulo",
		"country": "Brazil",
		"label": "São Paulo, São Paulo, Brazil",
		"lat": -23.5475,
		"lon": -46.6361,
		"tz": "America/Sao_Paulo",
	},

	# ─────────────────────────────
	# Brunei Darussalam
	# ─────────────────────────────

	"bn_bander_seri_begawan": {
		"city": "Bandar Seri Begawan",
		"state": None,
		"country": "Brunei Darussalam",
		"label": "Bandar Seri Begawan, Brunei Darussalam",
		"lat": 4.9403,
		"lon": 114.9481,
		"tz": "Asia/Brunei",
	},

	# ─────────────────────────────
	# Bulgaria
	# ─────────────────────────────

	"bg_sofia": {
		"city": "Sofia",
		"state": None,
		"country": "Bulgaria",
		"label": "Sofia, Bulgaria",
		"lat": 42.6983,
		"lon": 23.3199,
		"tz": "Europe/Sofia",
	},

	# ─────────────────────────────
	# Burkina Faso
	# ─────────────────────────────

	"bf_ouagadougou": {
		"city": "Ouagadougou",
		"state": None,
		"country": "Burkina Faso",
		"label": "Ouagadougou, Burkina Faso",
		"lat": 12.3657,
		"lon": -1.5339,
		"tz": "Africa/Ouagadougou",
	},

	# ─────────────────────────────
	# Burundi
	# ─────────────────────────────

	"bi_gitega": {
		"city": "Gitega",
		"state": None,
		"country": "Burundi",
		"label": "Gitega, Burundi",
		"lat": -3.4271,
		"lon": 29.9246,
		"tz": "Africa/Bujumbura",
	},

	# ─────────────────────────────
	# Cambodia
	# ─────────────────────────────

	"kh_phnom_penh": {
		"city": "Phnom Penh",
		"state": None,
		"country": "Cambodia",
		"label": "Phnom Penh, Cambodia",
		"lat": 11.5621,
		"lon": 104.8885,
		"tz": "Asia/Phnom_Penh",
	},

	# ─────────────────────────────
	# Cameroon
	# ─────────────────────────────

	"cm_douala": {
		"city": "Douala",
		"state": None,
		"country": "Cameroon",
		"label": "Douala, Cameroon",
		"lat": 4.0482,
		"lon": 9.7042,
		"tz": "Africa/Douala",
	},

	"cm_yaounde": {
		"city": "Yaoundé",
		"state": None,
		"country": "Cameroon",
		"label": "Yaoundé, Cameroon",
		"lat": 3.8441,
		"lon": 11.5013,
		"tz": "Africa/Douala",
	},

	# ─────────────────────────────
	# Canada (state o)
	# ─────────────────────────────

	"ca_calgary": {
		"city": "Calgary",
		"state": "Alberta",
		"country": "Canada",
		"label": "Calgary, Alberta, Canada",
		"lat": 51.0501,
		"lon": -114.0852,
		"tz": "America/Edmonton",
	},

	"ca_edmonton": {
		"city": "Edmonton",
		"state": "Alberta",
		"country": "Canada",
		"label": "Edmonton, Alberta, Canada",
		"lat": 53.5501,
		"lon": -113.4687,
		"tz": "America/Edmonton",
	},

	"ca_montreal": {
		"city": "Montréal",
		"state": "Quebec",
		"country": "Canada",
		"label": "Montréal, Quebec, Canada",
		"lat": 45.5088,
		"lon": -73.5878,
		"tz": "America/Montreal",
	},

	"ca_ottawa": {
		"city": "Ottawa",
		"state": "Ontario",
		"country": "Canada",
		"label": "Ottawa, Ontario, Canada",
		"lat": 45.4247,
		"lon": -75.6950,
		"tz": "America/Toronto",
	},

	"ca_toronto": {
		"city": "Toronto",
		"state": "Ontario",
		"country": "Canada",
		"label": "Toronto, Ontario, Canada",
		"lat": 43.7064,
		"lon": -79.3986,
		"tz": "America/Toronto",
	},

	"ca_vancouver": {
		"city": "Vancouver",
		"state": "British Columbia",
		"country": "Canada",
		"label": "Vancouver, British Columbia, Canada",
		"lat": 49.2496,
		"lon": -123.1193,
		"tz": "America/Vancouver",
	},

	# ─────────────────────────────
	# Central African Republic
	# ─────────────────────────────

	"cf_bangui": {
		"city": "Bangui",
		"state": None,
		"country": "Central African Republic",
		"label": "Bangui, Central African Republic",
		"lat": 4.3612,
		"lon": 18.5550,
		"tz": "Africa/Bangui",
	},

	# ─────────────────────────────
	# Chad
	# ─────────────────────────────

	"td_ndjamena": {
		"city": "N'Djamena",
		"state": None,
		"country": "Chad",
		"label": "N'Djamena, Chad",
		"lat": 12.1378,
		"lon": 15.0543,
		"tz": "Africa/Ndjamena",
	},

	# ─────────────────────────────
	# Chile
	# ─────────────────────────────

	"cl_santiago": {
		"city": "Santiago",
		"state": None,
		"country": "Chile",
		"label": "Santiago, Chile",
		"lat": -33.4475,
		"lon": -70.6737,
		"tz": "America/Santiago",
	},

	"cl_vina_del_mar": {
		"city": "Viña del Mar",
		"state": None,
		"country": "Chile",
		"label": "Viña del Mar, Chile",
		"lat": -33.0245,
		"lon": -71.5518,
		"tz": "America/Santiago",
	},

	# ─────────────────────────────
	# China
	# ─────────────────────────────

	"cn_beijing": {
		"city": "Beijing",
		"state": None,
		"country": "China",
		"label": "Beijing, China",
		"lat": 39.9167,
		"lon": 116.3833,
		"tz": "Asia/Shanghai",
	},

	"cn_chengdu": {
		"city": "Chengdu",
		"state": None,
		"country": "China",
		"label": "Chengdu, China",
		"lat": 30.6666,
		"lon": 104.0666,
		"tz": "Asia/Shanghai",
	},

	"cn_chongqing": {
		"city": "Chongqing",
		"state": None,
		"country": "China",
		"label": "Chongqing, China",
		"lat": 29.5602,
		"lon": 106.5577,
		"tz": "Asia/Shanghai",
	},

	"cn_guangzhou": {
		"city": "Guangzhou",
		"state": "Guangdong",
		"country": "China",
		"label": "Guangzhou, Guangdong, China",
		"lat": 23.1166,
		"lon": 113.2500,
		"tz": "Asia/Shanghai",
	},

	"cn_hangzhou": {
		"city": "Hangzhou",
		"state": None,
		"country": "China",
		"label": "Hangzhou, China",
		"lat": 30.2936,
		"lon": 120.1614,
		"tz": "Asia/Shanghai",
	},

	"cn_harbin": {
		"city": "Harbin",
		"state": None,
		"country": "China",
		"label": "Harbin, China",
		"lat": 45.7500,
		"lon": 126.6500,
		"tz": "Asia/Shanghai",
	},

	"cn_nanjing": {
		"city": "Nanjing",
		"state": "Jiangsu",
		"country": "China",
		"label": "Nanjing, Jiangsu, China",
		"lat": 32.0616,
		"lon": 118.7777,
		"tz": "Asia/Shanghai",
	},

	"cn_qingdao": {
		"city": "Qingdao",
		"state": None,
		"country": "China",
		"label": "Qingdao, China",
		"lat": 36.0648,
		"lon": 120.3804,
		"tz": "Asia/Shanghai",
	},

	"cn_shanghai": {
		"city": "Shanghai",
		"state": None,
		"country": "China",
		"label": "Shanghai, China",
		"lat": 31.2222,
		"lon": 121.4580,
		"tz": "Asia/Shanghai",
	},

	"cn_shenzhen": {
		"city": "Shenzhen",
		"state": None,
		"country": "China",
		"label": "Shenzhen, China",
		"lat": 22.5431,
		"lon": 114.0579,
		"tz": "Asia/Shanghai",
	},

	"cn_tianjin": {
		"city": "Tianjin",
		"state": None,
		"country": "China",
		"label": "Tianjin, China",
		"lat": 39.1422,
		"lon": 117.1766,
		"tz": "Asia/Shanghai",
	},

	"cn_wenzhou": {
		"city": "Wenzhou",
		"state": None,
		"country": "China",
		"label": "Wenzhou, China",
		"lat": 27.9994,
		"lon": 120.6668,
		"tz": "Asia/Shanghai",
	},

	"cn_wuhan": {
		"city": "Wuhan",
		"state": None,
		"country": "China",
		"label": "Wuhan, China",
		"lat": 30.5833,
		"lon": 114.2666,
		"tz": "Asia/Shanghai",
	},

	"cn_xiamen": {
		"city": "Xiamen",
		"state": None,
		"country": "China",
		"label": "Xiamen, China",
		"lat": 24.4797,
		"lon": 118.0818,
		"tz": "Asia/Shanghai",
	},

	"cn_xian": {
		"city": "Xi'an",
		"state": None,
		"country": "China",
		"label": "Xi'an, China",
		"lat": 34.2583,
		"lon": 108.9286,
		"tz": "Asia/Shanghai",
	},

	"cn_zhengzhou": {
		"city": "Zhengzhou",
		"state": None,
		"country": "China",
		"label": "Zhengzhou, China",
		"lat": 34.7577,
		"lon": 113.6486,
		"tz": "Asia/Shanghai",
	},

	# ─────────────────────────────
	# Colombia
	# ─────────────────────────────

	"co_barranquilla": {
		"city": "Barranquilla",
		"state": None,
		"country": "Colombia",
		"label": "Barranquilla, Colombia",
		"lat": 10.9685,
		"lon": -74.7813,
		"tz": "America/Bogota",
	},

	"co_bogota": {
		"city": "Bogotá",
		"state": None,
		"country": "Colombia",
		"label": "Bogotá, Colombia",
		"lat": 4.6243,
		"lon": -74.0636,
		"tz": "America/Bogota",
	},

	"co_cali": {
		"city": "Cali",
		"state": None,
		"country": "Colombia",
		"label": "Cali, Colombia",
		"lat": 3.4305,
		"lon": -76.5199,
		"tz": "America/Bogota",
	},

	"co_medellin": {
		"city": "Medellin",
		"state": None,
		"country": "Colombia",
		"label": "Medellin, Colombia",
		"lat": 6.2308,
		"lon": -75.5905,
		"tz": "America/Bogota",
	},

	# ─────────────────────────────
	# Comoros
	# ─────────────────────────────

	"km_moroni": {
		"city": "Moroni",
		"state": None,
		"country": "Comoros",
		"label": "Moroni, Comoros",
		"lat": -11.7022,
		"lon": 43.2551,
		"tz": "Indian/Comoro",
	},

	# ─────────────────────────────
	# Congo (Democratic Republic of the Congo)
	# ─────────────────────────────

	"cd_kinshasa": {
		"city": "Kinshasa",
		"state": None,
		"country": "Democratic Republic of the Congo",
		"label": "Kinshasa, Democratic Republic of the Congo",
		"lat": -4.3275,
		"lon": 15.3135,
		"tz": "Africa/Kinshasa",
	},

	"cd_lubumbashi": {
		"city": "Lubumbashi",
		"state": None,
		"country": "Democratic Republic of the Congo",
		"label": "Lubumbashi, Democratic Republic of the Congo",
		"lat": -11.6608,
		"lon": 27.4793,
		"tz": "Africa/Lubumbashi",
	},

	# ─────────────────────────────
	# Congo (Republic of the Congo)
	# ─────────────────────────────

	"cg_brazzaville": {
		"city": "Brazzaville",
		"state": None,
		"country": "Republic of the Congo",
		"label": "Brazzaville, Republic of the Congo",
		"lat": -4.2592,
		"lon": 15.2847,
		"tz": "Africa/Brazzaville",
	},

	# ─────────────────────────────
	# Costa Rica
	# ─────────────────────────────

	"cr_san_jose": {
		"city": "San José",
		"state": None,
		"country": "Costa Rica",
		"label": "San José, Costa Rica",
		"lat": 9.9347,
		"lon": -84.0875,
		"tz": "America/Costa_Rica",
	},

	# ─────────────────────────────
	# Côte d'Ivoire
	# ─────────────────────────────

	"ci_abidjan": {
		"city": "Abidjan",
		"state": None,
		"country": "Côte d'Ivoire",
		"label": "Abidjan, Côte d'Ivoire",
		"lat": 5.3544,
		"lon": -4.0016,
		"tz": "Africa/Abidjan",
	},

	"ci_yamoussoukro": {
		"city": "Yamoussoukro",
		"state": None,
		"country": "Côte d'Ivoire",
		"label": "Yamoussoukro, Côte d'Ivoire",
		"lat": 6.8206,
		"lon": -5.2767,
		"tz": "Africa/Abidjan",
	},

	# ─────────────────────────────
	# Croatia
	# ─────────────────────────────

	"hr_zagreb": {
		"city": "Zagreb",
		"state": None,
		"country": "Croatia",
		"label": "Zagreb, Croatia",
		"lat": 45.8154,
		"lon": 15.9666,
		"tz": "Europe/Zagreb",
	},

	# ─────────────────────────────
	# Cuba
	# ─────────────────────────────

	"cu_havana": {
		"city": "Havana",
		"state": None,
		"country": "Cuba",
		"label": "Havana, Cuba",
		"lat": 23.1136,
		"lon": -82.3666,
		"tz": "America/Havana",
	},

	# ─────────────────────────────
	# Cyprus
	# ─────────────────────────────

	"cy_nicosia": {
		"city": "Nicosia",
		"state": None,
		"country": "Cyprus",
		"label": "Nicosia, Cyprus",
		"lat": 35.1856,
		"lon": 33.3823,
		"tz": "Europe/Nicosia",
	},

	# ─────────────────────────────
	# Czech Republic
	# ─────────────────────────────

	"cz_prague": {
		"city": "Prague",
		"state": None,
		"country": "Czech Republic",
		"label": "Prague, Czech Republic",
		"lat": 50.07366,
		"lon": 14.4185,
		"tz": "Europe/Prague",
	},

	# ─────────────────────────────
	# Denmark
	# ─────────────────────────────

	"dk_copenhagen": {
		"city": "Copenhagen",
		"state": None,
		"country": "Denmark",
		"label": "Copenhagen, Denmark",
		"lat": 55.6761,
		"lon": 12.5683,
		"tz": "Europe/Copenhagen",
	},

	# ─────────────────────────────
	# Djibouti
	# ─────────────────────────────

	"dj_djibouti_city": {
		"city": "Djibouti",
		"state": None,
		"country": "Djibouti",
		"label": "Djibouti City, Djibouti",
		"lat": 11.5721,
		"lon": 43.1456,
		"tz": "Africa/Djibouti",
	},

	# ─────────────────────────────
	# Dominica
	# ─────────────────────────────

	"dm_roseau": {
		"city": "Roseau",
		"state": None,
		"country": "Dominica",
		"label": "Roseau, Dominica",
		"lat": 15.3017,
		"lon": -61.3881,
		"tz": "America/Dominica",
	},

	# ─────────────────────────────
	# Dominican Republic
	# ─────────────────────────────

	"do_santo_domingo": {
		"city": "Santo Domingo",
		"state": None,
		"country": "Dominican Republic",
		"label": "Santo Domingo, Dominican Republic",
		"lat": 18.4834,
		"lon": -69.9296,
		"tz": "America/Santo_Domingo",
	},

	# ─────────────────────────────
	# Ecuador
	# ─────────────────────────────

	"ec_guayaquil": {
		"city": "Guayaquil",
		"state": None,
		"country": "Ecuador",
		"label": "Guayaquil, Ecuador",
		"lat": -2.1961,
		"lon": -79.8862,
		"tz": "America/Guayaquil",
	},

	"ec_quito": {
		"city": "Quito",
		"state": None,
		"country": "Ecuador",
		"label": "Quito, Ecuador",
		"lat": -0.2299,
		"lon": -78.5250,
		"tz": "America/Guayaquil",
	},

	# ─────────────────────────────
	# Egypt
	# ─────────────────────────────

	"eg_alexandria": {
		"city": "Alexandria",
		"state": None,
		"country": "Egypt",
		"label": "Alexandria, Egypt",
		"lat": 31.2017,
		"lon": 29.9158,
		"tz": "Africa/Cairo",
	},

	"eg_cairo": {
		"city": "Cairo",
		"state": None,
		"country": "Egypt",
		"label": "Cairo, Egypt",
		"lat": 30.0626,
		"lon": 31.2497,
		"tz": "Africa/Cairo",
	},

	"eg_giza": {
		"city": "Giza",
		"state": None,
		"country": "Egypt",
		"label": "Giza, Egypt",
		"lat": 30.0094,
		"lon": 31.2086,
		"tz": "Africa/Cairo",
	},

    # ─────────────────────────────
    # El Salvador
    # ─────────────────────────────

    "sv_san_salvador": {
        "city": "San Salvador",
        "state": None,
        "country": "El Salvador",
        "label": "San Salvador, El Salvador",
        "lat": 13.6894,
        "lon": -89.1872,
        "tz": "America/El_Salvador",
    },

    # ─────────────────────────────
    # Equatorial Guinea
    # ─────────────────────────────

    "gq_malabo": {
        "city": "Malabo",
        "state": None,
        "country": "Equatorial Guinea",
        "label": "Malabo, Equatorial Guinea",
        "lat": 3.7558,
        "lon": 8.7817,
        "tz": "Africa/Malabo",
    },

    # ─────────────────────────────
    # Eritrea
    # ─────────────────────────────

    "er_asmara": {
        "city": "Asmara",
        "state": None,
        "country": "Eritrea",
        "label": "Asmara, Eritrea",
        "lat": 15.3381,
        "lon": 38.9318,
        "tz": "Africa/Asmara",
    },

    # ─────────────────────────────
    # Estonia
    # ─────────────────────────────

    "ee_tallinn": {
        "city": "Tallinn",
        "state": None,
        "country": "Estonia",
        "label": "Tallinn, Estonia",
        "lat": 59.4370,
        "lon": 24.7535,
        "tz": "Europe/Tallinn",
    },

    # ─────────────────────────────
    # Eswatini
    # ─────────────────────────────

    "sz_mbabane": {
        "city": "Mbabane",
        "state": None,
        "country": "Eswatini",
        "label": "Mbabane, Eswatini",
        "lat": -26.3167,
        "lon": 31.1333,
        "tz": "Africa/Mbabane",
    },

    # ─────────────────────────────
    # Ethiopia
    # ─────────────────────────────

    "et_addis_ababa": {
        "city": "Addis Ababa",
        "state": None,
        "country": "Ethiopia",
        "label": "Addis Ababa, Ethiopia",
        "lat": 9.0250,
        "lon": 38.7469,
        "tz": "Africa/Addis_Ababa",
    },

    # ─────────────────────────────
    # Fiji
    # ─────────────────────────────

    "fj_suva": {
        "city": "Suva",
        "state": None,
        "country": "Fiji",
        "label": "Suva, Fiji",
        "lat": -18.1368,
        "lon": 178.4253,
        "tz": "Pacific/Fiji",
    },

    # ─────────────────────────────
    # Finland
    # ─────────────────────────────

    "fi_helsinki": {
        "city": "Helsinki",
        "state": None,
        "country": "Finland",
        "label": "Helsinki, Finland",
        "lat": 60.1695,
        "lon": 24.9355,
        "tz": "Europe/Helsinki",
    },

    # ─────────────────────────────
    # France
    # ─────────────────────────────

    "fr_lyon": {
        "city": "Lyon",
        "state": None,
        "country": "France",
        "label": "Lyon, France",
        "lat": 45.7484,
        "lon": 4.8467,
        "tz": "Europe/Paris",
    },

    "fr_paris": {
        "city": "Paris",
        "state": None,
        "country": "France",
        "label": "Paris, France",
        "lat": 48.8534,
        "lon": 2.3488,
        "tz": "Europe/Paris",
    },

    # ─────────────────────────────
    # Gabon
    # ─────────────────────────────

    "ga_libreville": {
        "city": "Libreville",
        "state": None,
        "country": "Gabon",
        "label": "Libreville, Gabon",
        "lat": 0.3924,
        "lon": 9.4536,
        "tz": "Africa/Libreville",
    },

    # ─────────────────────────────
    # Gambia
    # ─────────────────────────────

    "gm_banjul": {
        "city": "Banjul",
        "state": None,
        "country": "Gambia",
        "label": "Banjul, Gambia",
        "lat": 13.4527,
        "lon": -16.5780,
        "tz": "Africa/Banjul",
    },

    # ─────────────────────────────
    # Georgia
    # ─────────────────────────────

    "ge_tbilisi": {
        "city": "Tbilisi",
        "state": None,
        "country": "Georgia",
        "label": "Tbilisi, Georgia",
        "lat": 41.6914,
        "lon": 44.8341,
        "tz": "Asia/Tbilisi",
    },

    # ─────────────────────────────
    # Germany
    # ─────────────────────────────

    "de_berlin": {
        "city": "Berlin",
        "state": None,
        "country": "Germany",
        "label": "Berlin, Germany",
        "lat": 52.5244,
        "lon": 13.4105,
        "tz": "Europe/Berlin",
    },

    "de_cologne": {
        "city": "Cologne",
        "state": None,
        "country": "Germany",
        "label": "Cologne, Germany",
        "lat": 50.9351,
        "lon": 6.9531,
        "tz": "Europe/Berlin",
    },

    "de_dusseldorf": {
        "city": "Düsseldorf",
        "state": None,
        "country": "Germany",
        "label": "Düsseldorf, Germany",
        "lat": 51.2217,
        "lon": 6.7761,
        "tz": "Europe/Berlin",
    },

    "de_frankfurt": {
        "city": "Frankfurt",
        "state": None,
        "country": "Germany",
        "label": "Frankfurt, Germany",
        "lat": 50.1155,
        "lon": 8.6841,
        "tz": "Europe/Berlin",
    },
    "de_hamburg": {
        "city": "Hamburg",
        "state": None,
        "country": "Germany",
        "label": "Hamburg, Germany",
        "lat": 53.5507,
        "lon": 9.9930,
        "tz": "Europe/Berlin",
    },

    "de_munich": {
        "city": "Munich",
        "state": None,
        "country": "Germany",
        "label": "Munich, Germany",
        "lat": 48.1374,
        "lon": 11.5754,
        "tz": "Europe/Berlin",
    },

    # ─────────────────────────────
    # Ghana
    # ─────────────────────────────

    "gh_accra": {
        "city": "Accra",
        "state": None,
        "country": "Ghana",
        "label": "Accra, Ghana",
        "lat": 5.5560,
        "lon": -0.1969,
        "tz": "Africa/Accra",
    },

    # ─────────────────────────────
    # Greece
    # ─────────────────────────────

    "gr_athens": {
        "city": "Athens",
        "state": None,
        "country": "Greece",
        "label": "Athens, Greece",
        "lat": 37.9838,
        "lon": 23.7278,
        "tz": "Europe/Athens",
    },

    # ─────────────────────────────
    # Grenada
    # ─────────────────────────────

    "gd_saint_georges": {
        "city": "Saint George's",
        "state": None,
        "country": "Grenada",
        "label": "Saint George's, Grenada",
        "lat": 12.0529,
        "lon": -61.7523,
        "tz": "America/Grenada",
    },

    # ─────────────────────────────
    # Guatemala
    # ─────────────────────────────

    "gt_guatemala_city": {
        "city": "Guatemala City",
        "state": None,
        "country": "Guatemala",
        "label": "Guatemala City, Guatemala",
        "lat": 14.6407,
        "lon": -90.5133,
        "tz": "America/Guatemala",
    },

	# ─────────────────────────────
	# Guinea
	# ─────────────────────────────

	"gn_conakry": {
		"city": "Conakry",
		"state": None,
		"country": "Guinea",
		"label": "Conakry, Guinea",
		"lat": 9.5380,
		"lon": -13.6773,
		"tz": "Africa/Conakry",
	},

    # ─────────────────────────────
    # Guinea-Bissau
    # ─────────────────────────────

    "gw_bissau": {
        "city": "Bissau",
        "state": None,
        "country": "Guinea-Bissau",
        "label": "Bissau, Guinea-Bissau",
        "lat": 11.8636,
        "lon": -15.5977,
        "tz": "Africa/Bissau",
    },

    # ─────────────────────────────
    # Guyana
    # ─────────────────────────────

    "gy_georgetown": {
        "city": "Georgetown",
        "state": None,
        "country": "Guyana",
        "label": "Georgetown, Guyana",
        "lat": 6.8045,
        "lon": -58.1553,
        "tz": "America/Guyana",
    },

    # ─────────────────────────────
    # Haiti
    # ─────────────────────────────

    "ht_port_au_prince": {
        "city": "Port-au-Prince",
        "state": None,
        "country": "Haiti",
        "label": "Port-au-Prince, Haiti",
        "lat": 18.5435,
        "lon": -72.3388,
        "tz": "America/Port-au-Prince",
    },

    # ─────────────────────────────
    # Honduras
    # ─────────────────────────────

    "hn_tegucigalpa": {
        "city": "Tegucigalpa",
        "state": None,
        "country": "Honduras",
        "label": "Tegucigalpa, Honduras",
        "lat": 14.0818,
        "lon": -87.2068,
        "tz": "America/Tegucigalpa",
    },

    # ─────────────────────────────
    # Hong Kong
    # ─────────────────────────────

    "hk_hong_kong": {
        "city": "Hong Kong",
        "state": None,
        "country": "Hong Kong",
        "label": "Hong Kong, Hong Kong",
        "lat": 22.2262,
        "lon": 113.9715,
        "tz": "Asia/Hong_Kong",
    },

    # ─────────────────────────────
    # Hungary
    # ─────────────────────────────

    "hu_budapest": {
        "city": "Budapest",
        "state": None,
        "country": "Hungary",
        "label": "Budapest, Hungary",
        "lat": 47.4984,
        "lon": 19.0405,
        "tz": "Europe/Budapest",
    },

    # ─────────────────────────────
    # Iceland
    # ─────────────────────────────

    "is_reykjavik": {
        "city": "Reykjavik",
        "state": None,
        "country": "Iceland",
        "label": "Reykjavik, Iceland",
        "lat": 64.1355,
        "lon": -21.8954,
        "tz": "Atlantic/Reykjavik",
    },

    # ─────────────────────────────
    # India (state o)
    # ─────────────────────────────

    "in_agra": {
        "city": "Agra",
        "state": "Uttar Pradesh",
        "country": "India",
        "label": "Agra, Uttar Pradesh, India",
        "lat": 27.2294,
        "lon": 78.0071,
        "tz": "Asia/Kolkata",
    },

    "in_ahmedabad": {
        "city": "Ahmedabad",
        "state": "Gujarat",
        "country": "India",
        "label": "Ahmedabad, Gujarat, India",
        "lat": 23.0257,
        "lon": 72.5872,
        "tz": "Asia/Kolkata",
    },

    "in_allahabad": {
        "city": "Allahabad",
        "state": "Uttar Pradesh",
        "country": "India",
        "label": "Allahabad, Uttar Pradesh, India",
        "lat": 25.4358,
        "lon": 81.8463,
        "tz": "Asia/Kolkata",
    },

    "in_amritsar": {
        "city": "Amritsar",
        "state": "Punjab",
        "country": "India",
        "label": "Amritsar, Punjab, India",
        "lat": 31.6223,
        "lon": 74.8753,
        "tz": "Asia/Kolkata",
    },

    "in_bangalore": {
        "city": "Bangalore",
        "state": "Karnataka",
        "country": "India",
        "label": "Bangalore, Karnataka, India",
        "lat": 12.9715,
        "lon": 77.5945,
        "tz": "Asia/Kolkata",
    },

    "in_bhopal": {
        "city": "Bhopal",
        "state": "Madhya Pradesh",
        "country": "India",
        "label": "Bhopal, Madhya Pradesh, India",
        "lat": 23.2546,
        "lon": 77.4028,
        "tz": "Asia/Kolkata",
    },

	"in_chandigarh": {
		"city": "Chandigarh",
		"state": "Chandigarh",
		"country": "India",
		"label": "Chandigarh, India",
		"lat": 30.7362,
		"lon": 76.7884,
		"tz": "Asia/Kolkata",
	},

    "in_chennai": {
        "city": "Chennai",
        "state": "Tamil Nadu",
        "country": "India",
        "label": "Chennai, Tamil Nadu, India",
        "lat": 13.0878,
        "lon": 80.2784,
        "tz": "Asia/Kolkata",
    },

    "in_coimbatore": {
        "city": "Coimbatore",
        "state": "Tamil Nadu",
        "country": "India",
        "label": "Coimbatore, Tamil Nadu, India",
        "lat": 11.0055,
        "lon": 76.9661,
        "tz": "Asia/Kolkata",
    },

    "in_hyderabad": {
        "city": "Hyderabad",
        "state": "Telangana",
        "country": "India",
        "label": "Hyderabad, Telangana, India",
        "lat": 17.3840,
        "lon": 78.4563,
        "tz": "Asia/Kolkata",
    },

    "in_indore": {
        "city": "Indore",
        "state": "Madhya Pradesh",
        "country": "India",
        "label": "Indore, Madhya Pradesh, India",
        "lat": 22.7179,
        "lon": 75.8333,
        "tz": "Asia/Kolkata",
    },

    "in_jaipur": {
        "city": "Jaipur",
        "state": "Rajasthan",
        "country": "India",
        "label": "Jaipur, Rajasthan, India",
        "lat": 26.9196,
        "lon": 75.7878,
        "tz": "Asia/Kolkata",
    },

    "in_jodhpur": {
        "city": "Jodhpur",
        "state": "Rajasthan",
        "country": "India",
        "label": "Jodhpur, Rajasthan, India",
        "lat": 26.2684,
        "lon": 73.0059,
        "tz": "Asia/Kolkata",
    },

    "in_kanpur": {
        "city": "Kanpur",
        "state": "Uttar Pradesh",
        "country": "India",
        "label": "Kanpur, Uttar Pradesh, India",
        "lat": 26.4652,
        "lon": 80.3497,
        "tz": "Asia/Kolkata",
    },

    "in_kolkata": {
        "city": "Kolkata",
        "state": "West Bengal",
        "country": "India",
        "label": "Kolkata, West Bengal, India",
        "lat": 22.5626,
        "lon": 88.3630,
        "tz": "Asia/Kolkata",
    },

    "in_lucknow": {
        "city": "Lucknow",
        "state": "Uttar Pradesh",
        "country": "India",
        "label": "Lucknow, Uttar Pradesh, India",
        "lat": 26.8392,
        "lon": 80.9231,
        "tz": "Asia/Kolkata",
    },

    "in_mumbai": {
        "city": "Mumbai",
        "state": "Maharashtra",
        "country": "India",
        "label": "Mumbai, Maharashtra, India",
        "lat": 19.0728,
        "lon": 72.8826,
        "tz": "Asia/Kolkata",
    },

    "in_nagpur": {
        "city": "Nagpur",
        "state": "Maharashtra",
        "country": "India",
        "label": "Nagpur, Maharashtra, India",
        "lat": 21.1463,
        "lon": 79.0849,
        "tz": "Asia/Kolkata",
    },

	"in_new_delhi": {
		"city": "New Delhi",
		"state": "Delhi",
		"country": "India",
		"label": "New Delhi, Delhi, India",
		"lat": 28.6214,
		"lon": 77.2148,
		"tz": "Asia/Kolkata",
	},

    "in_patna": {
        "city": "Patna",
        "state": "Bihar",
        "country": "India",
        "label": "Patna, Bihar, India",
        "lat": 25.5940,
        "lon": 85.1356,
        "tz": "Asia/Kolkata",
    },

    "in_pune": {
        "city": "Pune",
        "state": "Maharashtra",
        "country": "India",
        "label": "Pune, Maharashtra, India",
        "lat": 18.5195,
        "lon": 73.8553,
        "tz": "Asia/Kolkata",
    },

    "in_surat": {
        "city": "Surat",
        "state": "Gujarat",
        "country": "India",
        "label": "Surat, Gujarat, India",
        "lat": 21.1959,
        "lon": 72.8302,
        "tz": "Asia/Kolkata",
    },

    "in_vadodara": {
        "city": "Vadodara",
        "state": "Gujarat",
        "country": "India",
        "label": "Vadodara, Gujarat, India",
        "lat": 22.2994,
        "lon": 73.2081,
        "tz": "Asia/Kolkata",
    },

	# ─────────────────────────────
	# Indonesia
	# ─────────────────────────────

	"id_bandung": {
		"city": "Bandung",
		"state": None,
		"country": "Indonesia",
		"label": "Bandung, Indonesia",
		"lat": -6.9222,
		"lon": 107.6069,
		"tz": "Asia/Jakarta",
	},

	"id_bekasi": {
		"city": "Bekasi",
		"state": None,
		"country": "Indonesia",
		"label": "Bekasi, Indonesia",
		"lat": -6.2349,
		"lon": 106.9896,
		"tz": "Asia/Jakarta",
	},

	"id_denpasar": {
		"city": "Denpasar",
		"state": None,
		"country": "Indonesia",
		"label": "Denpasar, Indonesia",
		"lat": -8.6500,
		"lon": 115.2166,
		"tz": "Asia/Makassar",
	},

	"id_jakarta": {
		"city": "Jakarta",
		"state": None,
		"country": "Indonesia",
		"label": "Jakarta, Indonesia",
		"lat": -6.2146,
		"lon": 106.8451,
		"tz": "Asia/Jakarta",
	},

	"id_makassar": {
		"city": "Makassar",
		"state": None,
		"country": "Indonesia",
		"label": "Makassar, Indonesia",
		"lat": -5.1486,
		"lon": 119.4319,
		"tz": "Asia/Makassar",
	},

	"id_medan": {
		"city": "Medan",
		"state": None,
		"country": "Indonesia",
		"label": "Medan, Indonesia",
		"lat": 3.5833,
		"lon": 98.6666,
		"tz": "Asia/Jakarta",
	},

	"id_palembang": {
		"city": "Palembang",
		"state": None,
		"country": "Indonesia",
		"label": "Palembang, Indonesia",
		"lat": -2.9167,
		"lon": 104.7458,
		"tz": "Asia/Jakarta",
	},

	"id_semarang": {
		"city": "Semarang",
		"state": None,
		"country": "Indonesia",
		"label": "Semarang, Indonesia",
		"lat": -6.9930,
		"lon": 110.4208,
		"tz": "Asia/Jakarta",
	},

	"id_surabaya": {
		"city": "Surabaya",
		"state": None,
		"country": "Indonesia",
		"label": "Surabaya, Indonesia",
		"lat": -7.2491,
		"lon": 112.7508,
		"tz": "Asia/Jakarta",
	},

	# ─────────────────────────────
	# Iran
	# ─────────────────────────────

	"ir_tabriz": {
		"city": "Tabriz",
		"state": None,
		"country": "Iran",
		"label": "Tabriz, Iran",
		"lat": 38.0800,
		"lon": 46.2919,
		"tz": "Asia/Tehran",
	},

	"ir_tehran": {
		"city": "Tehran",
		"state": None,
		"country": "Iran",
		"label": "Tehran, Iran",
		"lat": 35.6944,
		"lon": 51.4215,
		"tz": "Asia/Tehran",
	},

    # ─────────────────────────────
    # Iraq
    # ─────────────────────────────

    "iq_baghdad": {
        "city": "Baghdad",
        "state": None,
        "country": "Iraq",
        "label": "Baghdad, Iraq",
        "lat": 33.3406,
        "lon": 44.4009,
        "tz": "Asia/Baghdad",
    },

    "iq_basra": {
        "city": "Basra",
        "state": None,
        "country": "Iraq",
        "label": "Basra, Iraq",
        "lat": 30.5085,
        "lon": 47.7804,
        "tz": "Asia/Baghdad",
    },

    "iq_erbil": {
        "city": "Erbil",
        "state": None,
        "country": "Iraq",
        "label": "Erbil, Iraq",
        "lat": 36.1911,
        "lon": 44.0094,
        "tz": "Asia/Baghdad",
    },

    # ─────────────────────────────
    # Ireland
    # ─────────────────────────────

    "ie_dublin": {
        "city": "Dublin",
        "state": None,
        "country": "Ireland",
        "label": "Dublin, Ireland",
        "lat": 53.3331,
        "lon": -6.2489,
        "tz": "Europe/Dublin",
    },

    # ─────────────────────────────
    # Israel
    # ─────────────────────────────

    "il_jerusalem": {
        "city": "Jerusalem",
        "state": None,
        "country": "Israel",
        "label": "Jerusalem, Israel",
        "lat": 31.7690,
        "lon": 35.2163,
        "tz": "Asia/Jerusalem",
    },

    # ─────────────────────────────
    # Italy
    # ─────────────────────────────

    "it_bologna": {
        "city": "Bologna",
        "state": None,
        "country": "Italy",
        "label": "Bologna, Italy",
        "lat": 44.4938,
        "lon": 11.3387,
        "tz": "Europe/Rome",
    },

    "it_milan": {
        "city": "Milan",
        "state": None,
        "country": "Italy",
        "label": "Milan, Italy",
        "lat": 45.4642,
        "lon": 9.1895,
        "tz": "Europe/Rome",
    },

    "it_naples": {
        "city": "Naples",
        "state": None,
        "country": "Italy",
        "label": "Naples, Italy",
        "lat": 40.8521,
        "lon": 14.2681,
        "tz": "Europe/Rome",
    },    

    "it_rome": {
        "city": "Rome",
        "state": None,
        "country": "Italy",
        "label": "Rome, Italy",
        "lat": 41.8919,
        "lon": 12.5113,
        "tz": "Europe/Rome",
    },

    # ─────────────────────────────
    # Jamaica
    # ─────────────────────────────

    "jm_kingston": {
        "city": "Kingston",
        "state": None,
        "country": "Jamaica",
        "label": "Kingston, Jamaica",
        "lat": 17.9970,
        "lon": -76.7936,
        "tz": "America/Jamaica",
    },

    # ─────────────────────────────
    # Japan
    # ─────────────────────────────

    "jp_fukuoka": {
        "city": "Fukuoka",
        "state": None,
        "country": "Japan",
        "label": "Fukuoka, Japan",
        "lat": 33.6000,
        "lon": 130.4166,
        "tz": "Asia/Tokyo",
    },

    "jp_hiroshima": {
        "city": "Hiroshima",
        "state": None,
        "country": "Japan",
        "label": "Hiroshima, Japan",
        "lat": 34.4000,
        "lon": 132.4500,
        "tz": "Asia/Tokyo",
    },

    "jp_osaka": {
        "city": "Osaka",
        "state": None,
        "country": "Japan",
        "label": "Osaka, Japan",
        "lat": 34.6937,
        "lon": 135.5010,
        "tz": "Asia/Tokyo",
    },

    "jp_tokyo": {
        "city": "Tokyo",
        "state": None,
        "country": "Japan",
        "label": "Tokyo, Japan",
        "lat": 35.6895,
        "lon": 139.6917,
        "tz": "Asia/Tokyo",
    },

    # ─────────────────────────────
    # Jordan
    # ─────────────────────────────

    "jo_amman": {
        "city": "Amman",
        "state": None,
        "country": "Jordan",
        "label": "Amman, Jordan",
        "lat": 31.9552,
        "lon": 35.9450,
        "tz": "Asia/Amman",
    },

    # ─────────────────────────────
    # Kazakhstan
    # ─────────────────────────────

    "kz_astana": {
        "city": "Astana",
        "state": None,
        "country": "Kazakhstan",
        "label": "Astana, Kazakhstan",
        "lat": 51.1801,
        "lon": 71.4460,
        "tz": "Asia/Almaty",
    },

    # ─────────────────────────────
    # Kenya
    # ─────────────────────────────

    "ke_nairobi": {
        "city": "Nairobi",
        "state": None,
        "country": "Kenya",
        "label": "Nairobi, Kenya",
        "lat": -1.2833,
        "lon": 36.8167,
        "tz": "Africa/Nairobi",
    },

	# ─────────────────────────────
	# Kiribati
	# ─────────────────────────────

	"ki_tarawa": {
		"city": "Tarawa",
		"state": None,
		"country": "Kiribati",
		"label": "Tarawa, Kiribati",
		"lat": 1.4518,
		"lon": 173.0330,
		"tz": "Pacific/Tarawa",
	},

    # ─────────────────────────────
    # Korea (N)
    # ─────────────────────────────

    "kp_pyongyang": {
        "city": "Pyongyang",
        "state": None,
        "country": "Korea (N)",
        "label": "Pyongyang, Korea (N)",
        "lat": 39.0339,
        "lon": 125.7543,
        "tz": "Asia/Pyongyang",
    },

    # ─────────────────────────────
    # Korea
    # ─────────────────────────────

    "kr_busan": {
        "city": "Busan",
        "state": None,
        "country": "Korea",
        "label": "Busan, Korea",
        "lat": 35.1016,
        "lon": 129.0300,
        "tz": "Asia/Seoul",
    },

    "kr_daegu": {
        "city": "Daegu",
        "state": None,
        "country": "Korea",
        "label": "Daegu, Korea",
        "lat": 35.8702,
        "lon": 128.5911,
        "tz": "Asia/Seoul",
    },

    "kr_daejeon": {
        "city": "Daejeon",
        "state": None,
        "country": "Korea",
        "label": "Daejeon, Korea",
        "lat": 36.3491,
        "lon": 127.3849,
        "tz": "Asia/Seoul",
    },

    "kr_gwangju": {
        "city": "Gwangju",
        "state": None,
        "country": "Korea",
        "label": "Gwangju, Korea",
        "lat": 35.1547,
        "lon": 126.9155,
        "tz": "Asia/Seoul",
    },

    "kr_gyeongju": {
        "city": "Gyeongju",
        "state": None,
        "country": "Korea",
        "label": "Gyeongju, Korea",
        "lat": 35.8427,
        "lon": 129.2116,
        "tz": "Asia/Seoul",
    },

    "kr_incheon": {
        "city": "Incheon",
        "state": None,
        "country": "Korea",
        "label": "Incheon, Korea",
        "lat": 37.4564,
        "lon": 126.7051,
        "tz": "Asia/Seoul",
    },

    "kr_jeju_city": {
        "city": "Jeju City",
        "state": None,
        "country": "Korea",
        "label": "Jeju City, Korea",
        "lat": 33.5097,
        "lon": 126.5219,
        "tz": "Asia/Seoul",
    },

    "kr_seoul": {
        "city": "Seoul",
        "state": None,
        "country": "Korea",
        "label": "Seoul, Korea",
        "lat": 37.5326,
        "lon": 127.0246,
        "tz": "Asia/Seoul",
    },

    "kr_ulsan": {
        "city": "Ulsan",
        "state": None,
        "country": "Korea",
        "label": "Ulsan, Korea",
        "lat": 35.5372,
        "lon": 129.3166,
        "tz": "Asia/Seoul",
    },

	# ─────────────────────────────
	# Kosovo
	# ─────────────────────────────

	"xk_pristina": {
		"city": "Pristina",
		"state": None,
		"country": "Kosovo",
		"label": "Pristina, Kosovo",
		"lat": 42.6675,
		"lon": 21.1662,
		"tz": "Europe/Pristina",
	},

	# ─────────────────────────────
	# Kuwait
	# ─────────────────────────────

	"kw_kuwait_city": {
		"city": "Kuwait City",
		"state": None,
		"country": "Kuwait",
		"label": "Kuwait City, Kuwait",
		"lat": 29.3759,
		"lon": 47.9774,
		"tz": "Asia/Kuwait",
	},


    # ─────────────────────────────
    # Kyrgyzstan
    # ─────────────────────────────

    "kg_bishkek": {
        "city": "Bishkek",
        "state": None,
        "country": "Kyrgyzstan",
        "label": "Bishkek, Kyrgyzstan",
        "lat": 42.8820,
        "lon": 74.5827,
        "tz": "Asia/Bishkek",
    },

    # ─────────────────────────────
    # Laos
    # ─────────────────────────────

    "la_vientiane": {
        "city": "Vientiane",
        "state": None,
        "country": "Laos",
        "label": "Vientiane, Laos",
        "lat": 17.9749,
        "lon": 102.6309,
        "tz": "Asia/Vientiane",
    },

    # ─────────────────────────────
    # Latvia
    # ─────────────────────────────

    "lv_riga": {
        "city": "Riga",
        "state": None,
        "country": "Latvia",
        "label": "Riga, Latvia",
        "lat": 56.9460,
        "lon": 24.1059,
        "tz": "Europe/Riga",
    },

    # ─────────────────────────────
    # Lebanon
    # ─────────────────────────────

    "lb_beirut": {
        "city": "Beirut",
        "state": None,
        "country": "Lebanon",
        "label": "Beirut, Lebanon",
        "lat": 33.8933,
        "lon": 35.5015,
        "tz": "Asia/Beirut",
    },

    # ─────────────────────────────
    # Lesotho
    # ─────────────────────────────

    "ls_maseru": {
        "city": "Maseru",
        "state": None,
        "country": "Lesotho",
        "label": "Maseru, Lesotho",
        "lat": -29.3166,
        "lon": 27.4833,
        "tz": "Africa/Maseru",
    },

    # ─────────────────────────────
    # Liberia
    # ─────────────────────────────

    "lr_monrovia": {
        "city": "Monrovia",
        "state": None,
        "country": "Liberia",
        "label": "Monrovia, Liberia",
        "lat": 6.3005,
        "lon": -10.7969,
        "tz": "Africa/Monrovia",
    },

    # ─────────────────────────────
    # Libya
    # ─────────────────────────────

    "ly_tripoli": {
        "city": "Tripoli",
        "state": None,
        "country": "Libya",
        "label": "Tripoli, Libya",
        "lat": 32.8874,
        "lon": 13.1873,
        "tz": "Africa/Tripoli",
    },

	# ─────────────────────────────
	# Liechtenstein
	# ─────────────────────────────

	"li_vaduz": {
		"city": "Vaduz",
		"state": None,
		"country": "Liechtenstein",
		"label": "Vaduz, Liechtenstein",
		"lat": 47.1415,
		"lon": 9.5215,
		"tz": "Europe/Zurich",
	},

    # ─────────────────────────────
    # Lithuania
    # ─────────────────────────────

    "lt_vilnius": {
        "city": "Vilnius",
        "state": None,
        "country": "Lithuania",
        "label": "Vilnius, Lithuania",
        "lat": 54.6891,
        "lon": 25.2798,
        "tz": "Europe/Vilnius",
    },

	# ─────────────────────────────
	# Luxembourg
	# ─────────────────────────────

	"lu_luxembourg": {
		"city": "Luxembourg",
		"state": None,
		"country": "Luxembourg",
		"label": "Luxembourg, Luxembourg",
		"lat": 49.6098,
		"lon": 6.1326,
		"tz": "Europe/Luxembourg",
	},

	# ─────────────────────────────
	# Macao
	# ─────────────────────────────

	"mo_macau": {
		"city": "Macau",
		"state": None,
		"country": "Macau",
		"label": "Macau, Macau",
		"lat": 22.2109,
		"lon": 113.5529,
		"tz": "Asia/Macau",
	},

    # ─────────────────────────────
    # Madagascar
    # ─────────────────────────────

    "mg_antananarivo": {
        "city": "Antananarivo",
        "state": None,
        "country": "Madagascar",
        "label": "Antananarivo, Madagascar",
        "lat": -18.9136,
        "lon": 47.5361,
        "tz": "Indian/Antananarivo",
    },

    # ─────────────────────────────
    # Malawi
    # ─────────────────────────────

    "mw_lilongwe": {
        "city": "Lilongwe",
        "state": None,
        "country": "Malawi",
        "label": "Lilongwe, Malawi",
        "lat": -13.9669,
        "lon": 33.7872,
        "tz": "Africa/Blantyre",
    },

    # ─────────────────────────────
    # Malaysia
    # ─────────────────────────────

    "my_kuala_lumpur": {
        "city": "Kuala Lumpur",
        "state": None,
        "country": "Malaysia",
        "label": "Kuala Lumpur, Malaysia",
        "lat": 3.1412,
        "lon": 101.6865,
        "tz": "Asia/Kuala_Lumpur",
    },

    # ─────────────────────────────
    # Maldives
    # ─────────────────────────────

    "mv_male": {
        "city": "Malé",
        "state": None,
        "country": "Maldives",
        "label": "Malé, Maldives",
        "lat": 4.1752,
        "lon": 73.5091,
        "tz": "Indian/Maldives",
    },

    # ─────────────────────────────
    # Mali
    # ─────────────────────────────

    "ml_bamako": {
        "city": "Bamako",
        "state": None,
        "country": "Mali",
        "label": "Bamako, Mali",
        "lat": 12.6091,
        "lon": -7.9752,
        "tz": "Africa/Bamako",
    },

    # ─────────────────────────────
    # Malta
    # ─────────────────────────────

    "mt_valletta": {
        "city": "Valletta",
        "state": None,
        "country": "Malta",
        "label": "Valletta, Malta",
        "lat": 35.8996,
        "lon": 14.5148,
        "tz": "Europe/Malta",
    },

    # ─────────────────────────────
    # Marshall Islands
    # ─────────────────────────────

    "mh_majuro": {
        "city": "Majuro",
        "state": None,
        "country": "Marshall Islands",
        "label": "Majuro, Marshall Islands",
        "lat": 7.0897,
        "lon": 171.3802,
        "tz": "Pacific/Majuro",
    },

    # ─────────────────────────────
    # Mauritania
    # ─────────────────────────────

    "mr_nouakchott": {
        "city": "Nouakchott",
        "state": None,
        "country": "Mauritania",
        "label": "Nouakchott, Mauritania",
        "lat": 18.0790,
        "lon": -15.9656,
        "tz": "Africa/Nouakchott",
    },

    # ─────────────────────────────
    # Mauritius
    # ─────────────────────────────

    "mu_port_louis": {
        "city": "Port Louis",
        "state": None,
        "country": "Mauritius",
        "label": "Port Louis, Mauritius",
        "lat": -20.1619,
        "lon": 57.4988,
        "tz": "Indian/Mauritius",
    },

	# ─────────────────────────────
	# Mexico (state o)
	# ─────────────────────────────

	"mx_guadalajara": {
		"city": "Guadalajara",
		"state": "Jalisco",
		"country": "Mexico",
		"label": "Guadalajara, Jalisco, Mexico",
		"lat": 20.6773,
		"lon": -103.3474,
		"tz": "America/Mexico_City",
	},

	"mx_mexico_city": {
		"city": "Mexico City",
		"state": "Ciudad de México",
		"country": "Mexico",
		"label": "Mexico City, Ciudad de México, Mexico",
		"lat": 19.4284,
		"lon": -99.1276,
		"tz": "America/Mexico_City",
	},

	"mx_monterrey": {
		"city": "Monterrey",
		"state": "Nuevo León",
		"country": "Mexico",
		"label": "Monterrey, Nuevo León, Mexico",
		"lat": 25.6843,
		"lon": -100.3172,
		"tz": "America/Monterrey",
	},

	"mx_tijuana": {
		"city": "Tijuana",
		"state": "Baja California",
		"country": "Mexico",
		"label": "Tijuana, Baja California, Mexico",
		"lat": 32.5027,
		"lon": -117.0037,
		"tz": "America/Tijuana",
	},

    # ─────────────────────────────
    # Micronesia
    # ─────────────────────────────

    "fm_palikir": {
        "city": "Palikir",
        "state": None,
        "country": "Micronesia",
        "label": "Palikir, Micronesia",
        "lat": 6.9247,
        "lon": 158.1610,
        "tz": "Pacific/Pohnpei",
    },

    # ─────────────────────────────
    # Moldova
    # ─────────────────────────────

    "md_chisinau": {
        "city": "Chisinau",
        "state": None,
        "country": "Moldova",
        "label": "Chisinau, Moldova",
        "lat": 47.0090,
        "lon": 28.8593,
        "tz": "Europe/Chisinau",
    },

    # ─────────────────────────────
    # Monaco
    # ─────────────────────────────

    "mc_monaco": {
        "city": "Monaco",
        "state": None,
        "country": "Monaco",
        "label": "Monaco, Monaco",
        "lat": 43.7371,
        "lon": 7.4214,
        "tz": "Europe/Monaco",
    },

    # ─────────────────────────────
    # Mongolia
    # ─────────────────────────────

    "mn_ulaanbaatar": {
        "city": "Ulaanbaatar",
        "state": None,
        "country": "Mongolia",
        "label": "Ulaanbaatar, Mongolia",
        "lat": 47.9212,
        "lon": 106.9185,
        "tz": "Asia/Ulaanbaatar",
    },

    # ─────────────────────────────
    # Montenegro
    # ─────────────────────────────

    "me_podgorica": {
        "city": "Podgorica",
        "state": None,
        "country": "Montenegro",
        "label": "Podgorica, Montenegro",
        "lat": 42.4412,
        "lon": 19.2630,
        "tz": "Europe/Podgorica",
    },

    # ─────────────────────────────
    # Morocco
    # ─────────────────────────────

    "ma_casablanca": {
        "city": "Casablanca",
        "state": None,
        "country": "Morocco",
        "label": "Casablanca, Morocco",
        "lat": 33.5883,
        "lon": -7.6113,
        "tz": "Africa/Casablanca",
    },

    "ma_marrakesh": {
        "city": "Marrakesh",
        "state": None,
        "country": "Morocco",
        "label": "Marrakesh, Morocco",
        "lat": 31.6341,
        "lon": -7.9999,
        "tz": "Africa/Casablanca",
    },

    "ma_rabat": {
        "city": "Rabat",
        "state": None,
        "country": "Morocco",
        "label": "Rabat, Morocco",
        "lat": 34.0132,
        "lon": -6.8325,
        "tz": "Africa/Casablanca",
    },

    # ─────────────────────────────
    # Mozambique
    # ─────────────────────────────

    "mz_maputo": {
        "city": "Maputo",
        "state": None,
        "country": "Mozambique",
        "label": "Maputo, Mozambique",
        "lat": -25.9655,
        "lon": 32.5832,
        "tz": "Africa/Maputo",
    },

	# ─────────────────────────────
	# Myanmar
	# ─────────────────────────────

	"mm_naypyidaw": {
		"city": "Naypyidaw",
		"state": None,
		"country": "Myanmar",
		"label": "Naypyidaw, Myanmar",
		"lat": 19.7450,
		"lon": 96.1297,
		"tz": "Asia/Yangon",
	},

	"mm_yangon": {
		"city": "Yangon",
		"state": None,
		"country": "Myanmar",
		"label": "Yangon, Myanmar",
		"lat": 16.8052,
		"lon": 96.1561,
		"tz": "Asia/Yangon",
	},

    # ─────────────────────────────
    # Namibia
    # ─────────────────────────────

    "na_windhoek": {
        "city": "Windhoek",
        "state": None,
        "country": "Namibia",
        "label": "Windhoek, Namibia",
        "lat": -22.5594,
        "lon": 17.0832,
        "tz": "Africa/Windhoek",
    },

    # ─────────────────────────────
    # Nauru
    # ─────────────────────────────

    "nr_yaren": {
        "city": "Yaren",
        "state": None,
        "country": "Nauru",
        "label": "Yaren, Nauru",
        "lat": -0.5508,
        "lon": 166.9252,
        "tz": "Pacific/Nauru",
    },

    # ─────────────────────────────
    # Nepal
    # ─────────────────────────────

    "np_kathmandu": {
        "city": "Kathmandu",
        "state": None,
        "country": "Nepal",
        "label": "Kathmandu, Nepal",
        "lat": 27.7016,
        "lon": 85.3206,
        "tz": "Asia/Kathmandu",
    },

    # ─────────────────────────────
    # Netherlands
    # ─────────────────────────────

    "nl_amsterdam": {
        "city": "Amsterdam",
        "state": None,
        "country": "Netherlands",
        "label": "Amsterdam, Netherlands",
        "lat": 52.3740,
        "lon": 4.8896,
        "tz": "Europe/Amsterdam",
    },

    "nl_rotterdam": {
        "city": "Rotterdam",
        "state": None,
        "country": "Netherlands",
        "label": "Rotterdam, Netherlands",
        "lat": 51.9225,
        "lon": 4.4791,
        "tz": "Europe/Amsterdam",
    },

    # ─────────────────────────────
    # New Zealand
    # ─────────────────────────────

    "nz_auckland": {
        "city": "Auckland",
        "state": None,
        "country": "New Zealand",
        "label": "Auckland, New Zealand",
        "lat": -36.8485,
        "lon": 174.7634,
        "tz": "Pacific/Auckland",
    },

    "nz_wellington": {
        "city": "Wellington",
        "state": None,
        "country": "New Zealand",
        "label": "Wellington, New Zealand",
        "lat": -41.2866,
        "lon": 174.7755,
        "tz": "Pacific/Auckland",
    },

    # ─────────────────────────────
    # Nicaragua
    # ─────────────────────────────

    "ni_managua": {
        "city": "Managua",
        "state": None,
        "country": "Nicaragua",
        "label": "Managua, Nicaragua",
        "lat": 12.1328,
        "lon": -86.2504,
        "tz": "America/Managua",
    },

    # ─────────────────────────────
    # Niger
    # ─────────────────────────────

    "ne_niamey": {
        "city": "Niamey",
        "state": None,
        "country": "Niger",
        "label": "Niamey, Niger",
        "lat": 13.5136,
        "lon": 2.1098,
        "tz": "Africa/Niamey",
    },

    # ─────────────────────────────
    # Nigeria
    # ─────────────────────────────

    "ng_abuja": {
        "city": "Abuja",
        "state": None,
        "country": "Nigeria",
        "label": "Abuja, Nigeria",
        "lat": 9.0578,
        "lon": 7.4950,
        "tz": "Africa/Lagos",
    },

    "ng_ibadan": {
        "city": "Ibadan",
        "state": None,
        "country": "Nigeria",
        "label": "Ibadan, Nigeria",
        "lat": 7.3775,
        "lon": 3.9059,
        "tz": "Africa/Lagos",
    },

    "ng_kano": {
        "city": "Kano",
        "state": None,
        "country": "Nigeria",
        "label": "Kano, Nigeria",
        "lat": 12.0001,
        "lon": 8.5167,
        "tz": "Africa/Lagos",
    },

    "ng_port_harcourt": {
        "city": "Port Harcourt",
        "state": None,
        "country": "Nigeria",
        "label": "Port Harcourt, Nigeria",
        "lat": 4.7774,
        "lon": 7.0134,
        "tz": "Africa/Lagos",
    },

    "ng_lagos": {
        "city": "Lagos",
        "state": None,
        "country": "Nigeria",
        "label": "Lagos, Nigeria",
        "lat": 6.4540,
        "lon": 3.3946,
        "tz": "Africa/Lagos",
    },

    # ─────────────────────────────
    # North Macedonia
    # ─────────────────────────────

    "mk_skopje": {
        "city": "Skopje",
        "state": None,
        "country": "North Macedonia",
        "label": "Skopje, North Macedonia",
        "lat": 41.9964,
        "lon": 21.4314,
        "tz": "Europe/Skopje",
    },

    # ─────────────────────────────
    # Norway
    # ─────────────────────────────

    "no_oslo": {
        "city": "Oslo",
        "state": None,
        "country": "Norway",
        "label": "Oslo, Norway",
        "lat": 59.9127,
        "lon": 10.7460,
        "tz": "Europe/Oslo",
    },

    # ─────────────────────────────
    # Oman
    # ─────────────────────────────

    "om_muscat": {
        "city": "Muscat",
        "state": None,
        "country": "Oman",
        "label": "Muscat, Oman",
        "lat": 23.5841,
        "lon": 58.4077,
        "tz": "Asia/Muscat",
    },

    # ─────────────────────────────
    # Pakistan
    # ─────────────────────────────

    "pk_faisalabad": {
        "city": "Faisalabad",
        "state": None,
        "country": "Pakistan",
        "label": "Faisalabad, Pakistan",
        "lat": 31.4155,
        "lon": 73.0896,
        "tz": "Asia/Karachi",
    },

    "pk_gujranwala": {
        "city": "Gujranwala",
        "state": None,
        "country": "Pakistan",
        "label": "Gujranwala, Pakistan",
        "lat": 32.1556,
        "lon": 74.1870,
        "tz": "Asia/Karachi",
    },

    "pk_islamabad": {
        "city": "Islamabad",
        "state": None,
        "country": "Pakistan",
        "label": "Islamabad, Pakistan",
        "lat": 33.7214,
        "lon": 73.0432,
        "tz": "Asia/Karachi",
    },

    "pk_karachi": {
        "city": "Karachi",
        "state": None,
        "country": "Pakistan",
        "label": "Karachi, Pakistan",
        "lat": 24.8608,
        "lon": 67.0104,
        "tz": "Asia/Karachi",
    },

    "pk_lahore": {
        "city": "Lahore",
        "state": None,
        "country": "Pakistan",
        "label": "Lahore, Pakistan",
        "lat": 31.5580,
        "lon": 74.3507,
        "tz": "Asia/Karachi",
    },

    "pk_multan": {
        "city": "Multan",
        "state": None,
        "country": "Pakistan",
        "label": "Multan, Pakistan",
        "lat": 30.1967,
        "lon": 71.4782,
        "tz": "Asia/Karachi",
    },

    "pk_peshawar": {
        "city": "Peshawar",
        "state": None,
        "country": "Pakistan",
        "label": "Peshawar, Pakistan",
        "lat": 34.0080,
        "lon": 71.5784,
        "tz": "Asia/Karachi",
    },

    "pk_rawalpindi": {
        "city": "Rawalpindi",
        "state": None,
        "country": "Pakistan",
        "label": "Rawalpindi, Pakistan",
        "lat": 33.5973,
        "lon": 73.0479,
        "tz": "Asia/Karachi",
    },

    # ─────────────────────────────
    # Palau
    # ─────────────────────────────

    "pw_ngerulmud": {
        "city": "Ngerulmud",
        "state": None,
        "country": "Palau",
        "label": "Ngerulmud, Palau",
        "lat": 7.5007,
        "lon": 134.6238,
        "tz": "Pacific/Palau",
    },

    # ─────────────────────────────
    # Palestine
    # ─────────────────────────────

    "ps_bethlehem": {
        "city": "Bethlehem",
        "state": None,
        "country": "Palestine",
        "label": "Bethlehem, Palestine",
        "lat": 31.7057,
        "lon": 35.2006,
        "tz": "Asia/Hebron",
    },

    "ps_gaza": {
        "city": "Gaza",
        "state": None,
        "country": "Palestine",
        "label": "Gaza, Palestine",
        "lat": 31.5016,
        "lon": 34.4667,
        "tz": "Asia/Gaza",
    },

    # ─────────────────────────────
    # Panama
    # ─────────────────────────────

    "pa_panama_city": {
        "city": "Panama City",
        "state": None,
        "country": "Panama",
        "label": "Panama City, Panama",
        "lat": 8.9824,
        "lon": -79.5199,
        "tz": "America/Panama",
    },

    # ─────────────────────────────
    # Papua New Guinea
    # ─────────────────────────────

    "pg_port_moresby": {
        "city": "Port Moresby",
        "state": None,
        "country": "Papua New Guinea",
        "label": "Port Moresby, Papua New Guinea",
        "lat": -9.4772,
        "lon": 147.1508,
        "tz": "Pacific/Port_Moresby",
    },

    # ─────────────────────────────
    # Paraguay
    # ─────────────────────────────

    "py_asuncion": {
        "city": "Asuncion",
        "state": None,
        "country": "Paraguay",
        "label": "Asunción, Paraguay",
        "lat": -25.2864,
        "lon": -57.6470,
        "tz": "America/Asuncion",
    },

    # ─────────────────────────────
    # Peru
    # ─────────────────────────────

    "pe_arequipa": {
        "city": "Arequipa",
        "state": None,
        "country": "Peru",
        "label": "Arequipa, Peru",
        "lat": -16.3989,
        "lon": -71.5374,
        "tz": "America/Lima",
    },

    "pe_lima": {
        "city": "Lima",
        "state": None,
        "country": "Peru",
        "label": "Lima, Peru",
        "lat": -12.0431,
        "lon": -77.0282,
        "tz": "America/Lima",
    },

    # ─────────────────────────────
    # Philippines
    # ─────────────────────────────

    "ph_cebu": {
        "city": "Cebu",
        "state": None,
        "country": "Philippines",
        "label": "Cebu, Philippines",
        "lat": 10.3167,
        "lon": 123.8907,
        "tz": "Asia/Manila",
    },

    "ph_davao": {
        "city": "Davao",
        "state": None,
        "country": "Philippines",
        "label": "Davao, Philippines",
        "lat": 7.0730,
        "lon": 125.6127,
        "tz": "Asia/Manila",
    },

    "ph_manila": {
        "city": "Manila",
        "state": None,
        "country": "Philippines",
        "label": "Manila, Philippines",
        "lat": 14.6042,
        "lon": 120.9822,
        "tz": "Asia/Manila",
    },

    # ─────────────────────────────
    # Poland
    # ─────────────────────────────

    "pl_warsaw": {
        "city": "Warsaw",
        "state": None,
        "country": "Poland",
        "label": "Warsaw, Poland",
        "lat": 52.2370,
        "lon": 21.0175,
        "tz": "Europe/Warsaw",
    },

    # ─────────────────────────────
    # Portugal
    # ─────────────────────────────

    "pt_lisbon": {
        "city": "Lisbon",
        "state": None,
        "country": "Portugal",
        "label": "Lisbon, Portugal",
        "lat": 38.7250,
        "lon": -9.1498,
        "tz": "Europe/Lisbon",
    },

    # ─────────────────────────────
    # Qatar
    # ─────────────────────────────

    "qa_doha": {
        "city": "Doha",
        "state": None,
        "country": "Qatar",
        "label": "Doha, Qatar",
        "lat": 25.2854,
        "lon": 51.5309,
        "tz": "Asia/Qatar",
    },

    # ─────────────────────────────
    # Romania
    # ─────────────────────────────

    "ro_bucharest": {
        "city": "Bucharest",
        "state": None,
        "country": "Romania",
        "label": "Bucharest, Romania",
        "lat": 44.4322,
        "lon": 26.1062,
        "tz": "Europe/Bucharest",
    },

    # ─────────────────────────────
    # Russia
    # ─────────────────────────────

    "ru_kazan": {
        "city": "Kazan",
        "state": None,
        "country": "Russia",
        "label": "Kazan, Russia",
        "lat": 55.7887,
        "lon": 49.1221,
        "tz": "Europe/Moscow",
    },

    "ru_moscow": {
        "city": "Moscow",
        "state": None,
        "country": "Russia",
        "label": "Moscow, Russia",
        "lat": 55.7522,
        "lon": 37.6155,
        "tz": "Europe/Moscow",
    },

    "ru_saint_petersburg": {
        "city": "Saint Petersburg",
        "state": None,
        "country": "Russia",
        "label": "Saint Petersburg, Russia",
        "lat": 59.9386,
        "lon": 30.3141,
        "tz": "Europe/Moscow",
    },

    # ─────────────────────────────
    # Rwanda
    # ─────────────────────────────

    "rw_kigali": {
        "city": "Kigali",
        "state": None,
        "country": "Rwanda",
        "label": "Kigali, Rwanda",
        "lat": -1.9499,
        "lon": 30.0588,
        "tz": "Africa/Kigali",
    },

    # ─────────────────────────────
    # Saint Kitts and Nevis
    # ─────────────────────────────

    "kn_basseterre": {
        "city": "Basseterre",
        "state": None,
        "country": "Saint Kitts and Nevis",
        "label": "Basseterre, Saint Kitts and Nevis",
        "lat": 17.2955,
        "lon": -62.7249,
        "tz": "America/St_Kitts",
    },

    # ─────────────────────────────
    # Saint Lucia
    # ─────────────────────────────

    "lc_castries": {
        "city": "Castries",
        "state": None,
        "country": "Saint Lucia",
        "label": "Castries, Saint Lucia",
        "lat": 13.9957,
        "lon": -61.0061,
        "tz": "America/St_Lucia",
    },

    # ─────────────────────────────
    # Saint Vincent and the Grenadines
    # ─────────────────────────────

    "vc_kingstown": {
        "city": "Kingstown",
        "state": None,
        "country": "Saint Vincent and the Grenadines",
        "label": "Kingstown, Saint Vincent and the Grenadines",
        "lat": 13.1552,
        "lon": -61.2274,
        "tz": "America/St_Vincent",
    },

    # ─────────────────────────────
    # Samoa
    # ─────────────────────────────

    "ws_apia": {
        "city": "Apia",
        "state": None,
        "country": "Samoa",
        "label": "Apia, Samoa",
        "lat": -13.8333,
        "lon": -171.7666,
        "tz": "Pacific/Apia",
    },

    # ─────────────────────────────
    # San Marino
    # ─────────────────────────────

    "sm_san_marino": {
        "city": "San Marino",
        "state": None,
        "country": "San Marino",
        "label": "San Marino, San Marino",
        "lat": 43.9366,
        "lon": 12.4463,
        "tz": "Europe/San_Marino",
    },

    # ─────────────────────────────
    # Sao Tome and Principe
    # ─────────────────────────────

    "st_sao_tome": {
        "city": "Sao Tome",
        "state": None,
        "country": "Sao Tome and Principe",
        "label": "Sao Tome, Sao Tome and Principe",
        "lat": 0.3375,
        "lon": 6.7299,
        "tz": "Africa/Sao_Tome",
    },

    # ─────────────────────────────
    # Saudi Arabia
    # ─────────────────────────────

    "sa_jeddah": {
        "city": "Jeddah",
        "state": None,
        "country": "Saudi Arabia",
        "label": "Jeddah, Saudi Arabia",
        "lat": 21.4901,
        "lon": 39.1862,
        "tz": "Asia/Riyadh",
    },

    "sa_mecca": {
        "city": "Mecca",
        "state": None,
        "country": "Saudi Arabia",
        "label": "Mecca, Saudi Arabia",
        "lat": 21.4225,
        "lon": 39.8261,
        "tz": "Asia/Riyadh",
    },

    "sa_medina": {
        "city": "Medina",
        "state": None,
        "country": "Saudi Arabia",
        "label": "Medina, Saudi Arabia",
        "lat": 24.4709,
        "lon": 39.6122,
        "tz": "Asia/Riyadh",
    },

    "sa_riyadh": {
        "city": "Riyadh",
        "state": None,
        "country": "Saudi Arabia",
        "label": "Riyadh, Saudi Arabia",
        "lat": 24.6877,
        "lon": 46.7218,
        "tz": "Asia/Riyadh",
    },

    # ─────────────────────────────
    # Senegal
    # ─────────────────────────────

    "sn_dakar": {
        "city": "Dakar",
        "state": None,
        "country": "Senegal",
        "label": "Dakar, Senegal",
        "lat": 14.6937,
        "lon": -17.4440,
        "tz": "Africa/Dakar",
    },

    # ─────────────────────────────
    # Serbia
    # ─────────────────────────────

    "rs_belgrade": {
        "city": "Belgrade",
        "state": None,
        "country": "Serbia",
        "label": "Belgrade, Serbia",
        "lat": 44.8040,
        "lon": 20.4651,
        "tz": "Europe/Belgrade",
    },

    # ─────────────────────────────
    # Seychelles
    # ─────────────────────────────

    "sc_victoria": {
        "city": "Victoria",
        "state": None,
        "country": "Seychelles",
        "label": "Victoria, Seychelles",
        "lat": -4.6200,
        "lon": 55.4550,
        "tz": "Indian/Mahe",
    },

    # ─────────────────────────────
    # Sierra Leone
    # ─────────────────────────────

    "sl_freetown": {
        "city": "Freetown",
        "state": None,
        "country": "Sierra Leone",
        "label": "Freetown, Sierra Leone",
        "lat": 8.4871,
        "lon": -13.2356,
        "tz": "Africa/Freetown",
    },

    # ─────────────────────────────
    # Singapore
    # ─────────────────────────────

    "sg_singapore": {
        "city": "Singapore",
        "state": None,
        "country": "Singapore",
        "label": "Singapore, Singapore",
        "lat": 1.3520,
        "lon": 103.8198,
        "tz": "Asia/Singapore",
    },

    # ─────────────────────────────
    # Slovakia
    # ─────────────────────────────

    "sk_bratislava": {
        "city": "Bratislava",
        "state": None,
        "country": "Slovakia",
        "label": "Bratislava, Slovakia",
        "lat": 48.1481,
        "lon": 17.1067,
        "tz": "Europe/Bratislava",
    },

    # ─────────────────────────────
    # Slovenia
    # ─────────────────────────────

    "si_ljubljana": {
        "city": "Ljubljana",
        "state": None,
        "country": "Slovenia",
        "label": "Ljubljana, Slovenia",
        "lat": 46.0510,
        "lon": 14.5051,
        "tz": "Europe/Ljubljana",
    },

    # ─────────────────────────────
    # Solomon Islands
    # ─────────────────────────────

    "sb_honiara": {
        "city": "Honiara",
        "state": None,
        "country": "Solomon Islands",
        "label": "Honiara, Solomon Islands",
        "lat": -9.4333,
        "lon": 159.9500,
        "tz": "Pacific/Guadalcanal",
    },

    # ─────────────────────────────
    # Somalia
    # ─────────────────────────────

    "so_mogadishu": {
        "city": "Mogadishu",
        "state": None,
        "country": "Somalia",
        "label": "Mogadishu, Somalia",
        "lat": 2.0371,
        "lon": 45.3437,
        "tz": "Africa/Mogadishu",
    },

    # ─────────────────────────────
    # South Africa
    # ─────────────────────────────

    "za_cape_town": {
        "city": "Cape Town",
        "state": None,
        "country": "South Africa",
        "label": "Cape Town, South Africa",
        "lat": -33.9258,
        "lon": 18.4232,
        "tz": "Africa/Johannesburg",
    },

    "za_durban": {
        "city": "Durban",
        "state": None,
        "country": "South Africa",
        "label": "Durban, South Africa",
        "lat": -29.8579,
        "lon": 31.0292,
        "tz": "Africa/Johannesburg",
    },

    "za_johannesburg": {
        "city": "Johannesburg",
        "state": None,
        "country": "South Africa",
        "label": "Johannesburg, South Africa",
        "lat": -26.2022,
        "lon": 28.0436,
        "tz": "Africa/Johannesburg",
    },

    "za_pretoria": {
        "city": "Pretoria",
        "state": None,
        "country": "South Africa",
        "label": "Pretoria, South Africa",
        "lat": -25.7448,
        "lon": 28.1878,
        "tz": "Africa/Johannesburg",
    },

    # ─────────────────────────────
    # South Sudan
    # ─────────────────────────────

    "ss_juba": {
        "city": "Juba",
        "state": None,
        "country": "South Sudan",
        "label": "Juba, South Sudan",
        "lat": 4.8516,
        "lon": 31.5824,
        "tz": "Africa/Khartoum",
    },

    # ─────────────────────────────
    # Spain
    # ─────────────────────────────

    "es_barcelona": {
        "city": "Barcelona",
        "state": None,
        "country": "Spain",
        "label": "Barcelona, Spain",
        "lat": 41.3887,
        "lon": 2.1589,
        "tz": "Europe/Madrid",
    },

    "es_madrid": {
        "city": "Madrid",
        "state": None,
        "country": "Spain",
        "label": "Madrid, Spain",
        "lat": 41.3887,
        "lon": 2.1589,
        "tz": "Europe/Madrid",
    },

    # ─────────────────────────────
    # Sri Lanka
    # ─────────────────────────────

    "lk_colombo": {
        "city": "Colombo",
        "state": None,
        "country": "Sri Lanka",
        "label": "Colombo, Sri Lanka",
        "lat": 6.9354,
        "lon": 79.8486,
        "tz": "Asia/Colombo",
    },

    # ─────────────────────────────
    # Sudan
    # ─────────────────────────────

    "sd_khartoum": {
        "city": "Khartoum",
        "state": None,
        "country": "Sudan",
        "label": "Khartoum, Sudan",
        "lat": 15.5517,
        "lon": 32.5324,
        "tz": "Africa/Khartoum",
    },

    # ─────────────────────────────
    # Suriname
    # ─────────────────────────────

    "sr_paramaribo": {
        "city": "Paramaribo",
        "state": None,
        "country": "Suriname",
        "label": "Paramaribo, Suriname",
        "lat": 5.8663,
        "lon": -55.1668,
        "tz": "America/Paramaribo",
    },

    # ─────────────────────────────
    # Sweden
    # ─────────────────────────────

    "se_stockholm": {
        "city": "Stockholm",
        "state": None,
        "country": "Sweden",
        "label": "Stockholm, Sweden",
        "lat": 59.3293,
        "lon": 18.0687,
        "tz": "Europe/Stockholm",
    },

    # ─────────────────────────────
    # Switzerland
    # ─────────────────────────────

    "ch_bern": {
        "city": "Bern",
        "state": None,
        "country": "Switzerland",
        "label": "Bern, Switzerland",
        "lat": 46.9480,
        "lon": 7.4474,
        "tz": "Europe/Zurich",
    },

    "ch_zurich": {
        "city": "Zürich",
        "state": None,
        "country": "Switzerland",
        "label": "Zürich, Switzerland",
        "lat": 47.3768,
        "lon": 8.5416,
        "tz": "Europe/Zurich",
    },

    # ─────────────────────────────
    # Syria
    # ─────────────────────────────

    "sy_damascus": {
        "city": "Damascus",
        "state": None,
        "country": "Syria",
        "label": "Damascus, Syria",
        "lat": 33.5102,
        "lon": 36.2912,
        "tz": "Asia/Damascus",
    },

    # ─────────────────────────────
    # Taiwan
    # ─────────────────────────────

    "tw_taipei": {
        "city": "Taipei",
        "state": None,
        "country": "Taiwan",
        "label": "Taipei, Taiwan",
        "lat": 25.0530,
        "lon": 121.5263,
        "tz": "Asia/Taipei",
    },

    # ─────────────────────────────
    # Tajikistan
    # ─────────────────────────────

    "tj_dushanbe": {
        "city": "Dushanbe",
        "state": None,
        "country": "Tajikistan",
        "label": "Dushanbe, Tajikistan",
        "lat": 38.5357,
        "lon": 68.7790,
        "tz": "Asia/Dushanbe",
    },

    # ─────────────────────────────
    # Tanzania
    # ─────────────────────────────

    "tz_dodoma": {
        "city": "Dodoma",
        "state": None,
        "country": "Tanzania",
        "label": "Dodoma, Tanzania",
        "lat": -6.1722,
        "lon": 35.7394,
        "tz": "Africa/Dar_es_Salaam",
    },

    # ─────────────────────────────
    # Thailand
    # ─────────────────────────────

    "th_bangkok": {
        "city": "Bangkok",
        "state": None,
        "country": "Thailand",
        "label": "Bangkok, Thailand",
        "lat": 13.7539,
        "lon": 100.5014,
        "tz": "Asia/Bangkok",
    },

    "th_chiang_mai": {
        "city": "Chiang Mai",
        "state": None,
        "country": "Thailand",
        "label": "Chiang Mai, Thailand",
        "lat": 18.7903,
        "lon": 98.9846,
        "tz": "Asia/Bangkok",
    },

    # ─────────────────────────────
    # Togo
    # ─────────────────────────────

    "tg_lome": {
        "city": "Lome",
        "state": None,
        "country": "Togo",
        "label": "Lome, Togo",
        "lat": 6.1287,
        "lon": 1.2215,
        "tz": "Africa/Lomé",
    },

    # ─────────────────────────────
    # Tonga
    # ─────────────────────────────

    "to_nukualofa": {
        "city": "Nuku'alofa",
        "state": None,
        "country": "Tonga",
        "label": "Nuku'alofa, Tonga",
        "lat": -21.1368,
        "lon": -175.2011,
        "tz": "Pacific/Tongatapu",
    },

    # ─────────────────────────────
    # Trinidad and Tobago
    # ─────────────────────────────

    "tt_port_of_spain": {
        "city": "Port of Spain",
        "state": None,
        "country": "Trinidad and Tobago",
        "label": "Port of Spain, Trinidad and Tobago",
        "lat": 10.6666,
        "lon": -61.5188,
        "tz": "America/Port_of_Spain",
    },

    # ─────────────────────────────
    # Tunisia
    # ─────────────────────────────

    "tn_tunis": {
        "city": "Tunis",
        "state": None,
        "country": "Tunisia",
        "label": "Tunis, Tunisia",
        "lat": 36.8189,
        "lon": 10.1657,
        "tz": "Africa/Tunis",
    },

    # ─────────────────────────────
    # Türkiye
    # ─────────────────────────────

    "tr_ankara": {
        "city": "Ankara",
        "state": None,
        "country": "Türkiye",
        "label": "Ankara, Türkiye",
        "lat": 39.9198,
        "lon": 32.8542,
        "tz": "Europe/Istanbul",
    },

    "tr_istanbul": {
        "city": "Istanbul",
        "state": None,
        "country": "Türkiye",
        "label": "Istanbul, Türkiye",
        "lat": 41.0138,
        "lon": 28.9496,
        "tz": "Europe/Istanbul",
    },

    "tr_izmir": {
        "city": "Izmir",
        "state": None,
        "country": "Türkiye",
        "label": "Izmir, Türkiye",
        "lat": 38.4237,
        "lon": 27.1428,
        "tz": "Europe/Istanbul",
    },

    # ─────────────────────────────
    # Turkmenistan
    # ─────────────────────────────

    "tm_ashgabat": {
        "city": "Ashgabat",
        "state": None,
        "country": "Turkmenistan",
        "label": "Ashgabat, Turkmenistan",
        "lat": 37.9500,
        "lon": 58.3833,
        "tz": "Asia/Ashgabat",
    },

    # ─────────────────────────────
    # Tuvalu
    # ─────────────────────────────

    "tv_funafuti": {
        "city": "Funafuti",
        "state": None,
        "country": "Tuvalu",
        "label": "Funafuti, Tuvalu",
        "lat": -8.5242,
        "lon": 179.1941,
        "tz": "Pacific/Funafuti",
    },

    # ─────────────────────────────
    # Uganda
    # ─────────────────────────────

    "ug_kampala": {
        "city": "Kampala",
        "state": None,
        "country": "Uganda",
        "label": "Kampala, Uganda",
        "lat": 0.3162,
        "lon": 32.5821,
        "tz": "Africa/Kampala",
    },

    # ─────────────────────────────
    # Ukraine
    # ─────────────────────────────

    "ua_kyiv": {
        "city": "Kyiv",
        "state": None,
        "country": "Ukraine",
        "label": "Kyiv, Ukraine",
        "lat": 50.4546,
        "lon": 30.5238,
        "tz": "Europe/Kyiv",
    },

    # ─────────────────────────────
    # United Arab Emirates
    # ─────────────────────────────

    "ae_abu_dhabi": {
        "city": "Abu Dhabi",
        "state": None,
        "country": "United Arab Emirates",
        "label": "Abu Dhabi, United Arab Emirates",
        "lat": 24.4511,
        "lon": 54.3969,
        "tz": "Asia/Dubai",
    },

    "ae_dubai": {
        "city": "Dubai",
        "state": None,
        "country": "United Arab Emirates",
        "label": "Dubai, United Arab Emirates",
        "lat": 25.0772,
        "lon": 55.3092,
        "tz": "Asia/Dubai",
    },

    # ─────────────────────────────
    # United Kingdom
    # ─────────────────────────────

    "gb_birmingham": {
        "city": "Birmingham",
        "state": None,
        "country": "United Kingdom",
        "label": "Birmingham, United Kingdom",
        "lat": 52.4814,
        "lon": -1.8998,
        "tz": "Europe/London",
    },

    "gb_london": {
        "city": "London",
        "state": None,
        "country": "United Kingdom",
        "label": "London, United Kingdom",
        "lat": 51.5085,
        "lon": -0.1257,
        "tz": "Europe/London",
    },

    "gb_manchester": {
        "city": "Manchester",
        "state": None,
        "country": "United Kingdom",
        "label": "Manchester, United Kingdom",
        "lat": 53.4809,
        "lon": -2.2374,
        "tz": "Europe/London",
    },

    # ─────────────────────────────
    # United States of America (state o)
    # ─────────────────────────────

    "us_atlanta": {
        "city": "Atlanta",
        "state": "Georgia",
        "country": "United States of America",
        "label": "Atlanta, Georgia, United States of America",
        "lat": 33.7491,
        "lon": -84.3879,
        "tz": "America/New_York",
    },

    "us_austin": {
        "city": "Austin",
        "state": "Texas",
        "country": "United States of America",
        "label": "Austin, Texas, United States of America",
        "lat": 30.2671,
        "lon": -97.7430,
        "tz": "America/Chicago",
    },

    "us_baltimore": {
        "city": "Baltimore",
        "state": "Maryland",
        "country": "United States of America",
        "label": "Baltimore, Maryland, United States of America",
        "lat": 39.2903,
        "lon": -76.6121,
        "tz": "America/New_York",
    },

    "us_boston": {
        "city": "Boston",
        "state": "Massachusetts",
        "country": "United States of America",
        "label": "Boston, Massachusetts, United States of America",
        "lat": 42.3584,
        "lon": -71.0597,
        "tz": "America/New_York",
    },

    "us_charlotte": {
        "city": "Charlotte",
        "state": "North Carolina",
        "country": "United States of America",
        "label": "Charlotte, North Carolina, United States of America",
        "lat": 35.2270,
        "lon": -80.8431,
        "tz": "America/New_York",
    },

    "us_chicago": {
        "city": "Chicago",
        "state": "Illinois",
        "country": "United States of America",
        "label": "Chicago, Illinois, United States of America",
        "lat": 41.8500,
        "lon": -87.6500,
        "tz": "America/Chicago",
    },

    "us_cincinnati": {
        "city": "Cincinnati",
        "state": "Ohio",
        "country": "United States of America",
        "label": "Cincinnati, Ohio, United States of America",
        "lat": 39.1271,
        "lon": -84.5143,
        "tz": "America/New_York",
    },

    "us_cleveland": {
        "city": "Cleveland",
        "state": "Ohio",
        "country": "United States of America",
        "label": "Cleveland, Ohio, United States of America",
        "lat": 41.4995,
        "lon": -81.6954,
        "tz": "America/New_York",
    },

    "us_columbus": {
        "city": "Columbus",
        "state": "Ohio",
        "country": "United States of America",
        "label": "Columbus, Ohio, United States of America",
        "lat": 39.9833,
        "lon": -82.9833,
        "tz": "America/New_York",
    },

    "us_dallas": {
        "city": "Dallas",
        "state": "Texas",
        "country": "United States of America",
        "label": "Dallas, Texas, United States of America",
        "lat": 32.7830,
        "lon": -96.8066,
        "tz": "America/Chicago",
    },

    "us_denver": {
        "city": "Denver",
        "state": "Colorado",
        "country": "United States of America",
        "label": "Denver, Colorado, United States of America",
        "lat": 39.7391,
        "lon": -104.9847,
        "tz": "America/Denver",
    },

    "us_detroit": {
        "city": "Detroit",
        "state": "Michigan",
        "country": "United States of America",
        "label": "Detroit, Michigan, United States of America",
        "lat": 42.3314,
        "lon": -83.0457,
        "tz": "America/Detroit",
    },

    "us_fort_worth": {
        "city": "Fort Worth",
        "state": "Texas",
        "country": "United States of America",
        "label": "Fort Worth, Texas, United States of America",
        "lat": 32.7254,
        "lon": -97.3208,
        "tz": "America/Chicago",
    },

    "us_houston": {
        "city": "Houston",
        "state": "Texas",
        "country": "United States of America",
        "label": "Houston, Texas, United States of America",
        "lat": 29.7632,
        "lon": -95.3632,
        "tz": "America/Chicago",
    },

    "us_indianapolis": {
        "city": "Indianapolis",
        "state": "Indiana",
        "country": "United States of America",
        "label": "Indianapolis, Indiana, United States of America",
        "lat": 39.7683,
        "lon": -86.1580,
        "tz": "America/Indianapolis",
    },

    "us_jacksonville": {
        "city": "Jacksonville",
        "state": "Florida",
        "country": "United States of America",
        "label": "Jacksonville, Florida, United States of America",
        "lat": 30.3321,
        "lon": -81.6556,
        "tz": "America/New_York",
    },

    "us_kansas_city": {
        "city": "Kansas City",
        "state": "Missouri",
        "country": "United States of America",
        "label": "Kansas City, Missouri, United States of America",
        "lat": 39.0997,
        "lon": -94.5785,
        "tz": "America/Chicago",
    },

    "us_las_vegas": {
        "city": "Las Vegas",
        "state": "Nevada",
        "country": "United States of America",
        "label": "Las Vegas, Nevada, United States of America",
        "lat": 36.1749,
        "lon": -115.1372,
        "tz": "America/Los_Angeles",
    },

    "us_los_angeles": {
        "city": "Los Angeles",
        "state": "California",
        "country": "United States of America",
        "label": "Los Angeles, California, United States of America",
        "lat": 34.0522,
        "lon": -118.2436,
        "tz": "America/Los_Angeles",
    },

    "us_miami": {
        "city": "Miami",
        "state": "Florida",
        "country": "United States of America",
        "label": "Miami, Florida, United States of America",
        "lat": 25.7742,
        "lon": -80.1936,
        "tz": "America/New_York",
    },

    "us_milwaukee": {
        "city": "Milwaukee",
        "state": "Wisconsin",
        "country": "United States of America",
        "label": "Milwaukee, Wisconsin, United States of America",
        "lat": 43.0389,
        "lon": -87.9064,
        "tz": "America/Chicago",
    },

    "us_minneapolis": {
        "city": "Minneapolis",
        "state": "Minnesota",
        "country": "United States of America",
        "label": "Minneapolis, Minnesota, United States of America",
        "lat": 44.9799,
        "lon": -93.2638,
        "tz": "America/Chicago",
    },

    "us_nashville": {
        "city": "Nashville",
        "state": "Tennessee",
        "country": "United States of America",
        "label": "Nashville, Tennessee, United States of America",
        "lat": 36.1658,
        "lon": -86.7844,
        "tz": "America/Chicago",
    },

    "us_new_york": {
        "city": "New York City",
        "state": "New York",
        "country": "United States of America",
        "label": "New York City, New York, United States of America",
        "lat": 40.7142,
        "lon": -74.0059,
        "tz": "America/New_York",
    },

    "us_orlando": {
        "city": "Orlando",
        "state": "Florida",
        "country": "United States of America",
        "label": "Orlando, Florida, United States of America",
        "lat": 28.5383,
        "lon": -81.3792,
        "tz": "America/New_York",
    },

    "us_philadelphia": {
        "city": "Philadelphia",
        "state": "Pennsylvania",
        "country": "United States of America",
        "label": "Philadelphia, Pennsylvania, United States of America",
        "lat": 39.9523,
        "lon": -75.1636,
        "tz": "America/New_York",
    },

    "us_phoenix": {
        "city": "Phoenix",
        "state": "Arizona",
        "country": "United States of America",
        "label": "Phoenix, Arizona, United States of America",
        "lat": 33.4483,
        "lon": -112.0740,
        "tz": "America/Phoenix",
    },

    "us_pittsburgh": {
        "city": "Pittsburgh",
        "state": "Pennsylvania",
        "country": "United States of America",
        "label": "Pittsburgh, Pennsylvania, United States of America",
        "lat": 40.4406,
        "lon": -79.9958,
        "tz": "America/New_York",
    },

    "us_portland": {
        "city": "Portland",
        "state": "Oregon",
        "country": "United States of America",
        "label": "Portland, Oregon, United States of America",
        "lat": 45.5234,
        "lon": -122.6762,
        "tz": "America/Los_Angeles",
    },

    "us_san_antonio": {
        "city": "San Antonio",
        "state": "Texas",
        "country": "United States of America",
        "label": "San Antonio, Texas, United States of America",
        "lat": 29.4241,
        "lon": -98.4936,
        "tz": "America/Chicago",
    },

    "us_san_diego": {
        "city": "San Diego",
        "state": "California",
        "country": "United States of America",
        "label": "San Diego, California, United States of America",
        "lat": 32.7157,
        "lon": -117.1647,
        "tz": "America/Los_Angeles",
    },

    "us_san_francisco": {
        "city": "San Francisco",
        "state": "California",
        "country": "United States of America",
        "label": "San Francisco, California, United States of America",
        "lat": 37.7749,
        "lon": -122.4194,
        "tz": "America/Los_Angeles",
    },

    "us_san_jose": {
        "city": "San Jose",
        "state": "California",
        "country": "United States of America",
        "label": "San Jose, California, United States of America",
        "lat": 37.3393,
        "lon": -121.8949,
        "tz": "America/Los_Angeles",
    },

    "us_seattle": {
        "city": "Seattle",
        "state": "Washington",
        "country": "United States of America",
        "label": "Seattle, Washington, United States of America",
        "lat": 47.6062,
        "lon": -122.3320,
        "tz": "America/Los_Angeles",
    },

    "us_st_louis": {
        "city": "St. Louis",
        "state": "Missouri",
        "country": "United States of America",
        "label": "St. Louis, Missouri, United States of America",
        "lat": 38.6272,
        "lon": -90.1978,
        "tz": "America/Chicago",
    },

    "us_tampa": {
        "city": "Tampa",
        "state": "Florida",
        "country": "United States of America",
        "label": "Tampa, Florida, United States of America",
        "lat": 27.9475,
        "lon": -82.4584,
        "tz": "America/New_York",
    },

    # ─────────────────────────────
    # Uruguay
    # ─────────────────────────────

    "uy_montevideo": {
        "city": "Montevideo",
        "state": None,
        "country": "Uruguay",
        "label": "Montevideo, Uruguay",
        "lat": -34.9032,
        "lon": -56.1881,
        "tz": "America/Montevideo",
    },

    # ─────────────────────────────
    # Uzbekistan
    # ─────────────────────────────

    "uz_tashkent": {
        "city": "Tashkent",
        "state": None,
        "country": "Uzbekistan",
        "label": "Tashkent, Uzbekistan",
        "lat": 41.2646,
        "lon": 69.2162,
        "tz": "Asia/Tashkent",
    },

    # ─────────────────────────────
    # Vanuatu
    # ─────────────────────────────

    "vu_port_vila": {
        "city": "Port Vila",
        "state": None,
        "country": "Vanuatu",
        "label": "Port Vila, Vanuatu",
        "lat": -17.7348,
        "lon": 168.3220,
        "tz": "Pacific/Efate",
    },

    # ─────────────────────────────
    # Vatican
    # ─────────────────────────────

    "va_vatican_city": {
        "city": "Vatican City",
        "state": None,
        "country": "Vatican City State",
        "label": "Vatican City, Vatican City State",
        "lat": 41.9025,
        "lon": 12.4528,
        "tz": "Europe/Vatican",
    },

    # ─────────────────────────────
    # Venezuela
    # ─────────────────────────────

    "ve_caracas": {
        "city": "Caracas",
        "state": None,
        "country": "Venezuela",
        "label": "Caracas, Venezuela",
        "lat": 10.4880,
        "lon": -66.8791,
        "tz": "America/Caracas",
    },

    "ve_valencia": {
        "city": "Valencia",
        "state": None,
        "country": "Venezuela",
        "label": "Valencia, Venezuela",
        "lat": 10.1615,
        "lon": -68.0004,
        "tz": "America/Caracas",
    },

    # ─────────────────────────────
    # Vietnam
    # ─────────────────────────────

    "vn_hanoi": {
        "city": "Hanoi",
        "state": None,
        "country": "Vietnam",
        "label": "Hanoi, Vietnam",
        "lat": 21.0245,
        "lon": 105.8411,
        "tz": "Asia/Hanoi",
    },

    "vn_ho_chi_minh_city": {
        "city": "Ho Chi Minh City",
        "state": None,
        "country": "Vietnam",
        "label": "Ho Chi Minh City, Vietnam",
        "lat": 10.8230,
        "lon": 106.6296,
        "tz": "Asia/Hanoi",
    },

    # ─────────────────────────────
    # Yemen
    # ─────────────────────────────

    "ye_sanaa": {
        "city": "Sanaa",
        "state": None,
        "country": "Yemen",
        "label": "Sanaa, Yemen",
        "lat": 15.3545,
        "lon": 44.2064,
        "tz": "Asia/Aden",
    },

    # ─────────────────────────────
    # Zambia
    # ─────────────────────────────

    "zm_lusaka": {
        "city": "Lusaka",
        "state": None,
        "country": "Zambia",
        "label": "Lusaka, Zambia",
        "lat": -15.4066,
        "lon": 28.2871,
        "tz": "Africa/Lusaka",
    },

    # ─────────────────────────────
    # Zimbabwe
    # ─────────────────────────────

    "zw_harare": {
        "city": "Harare",
        "state": None,
        "country": "Zimbabwe",
        "label": "Harare, Zimbabwe",
        "lat": -17.8277,
        "lon": 31.0533,
        "tz": "Africa/Harare",
    }
}

# 🔑 [Ingestion Bridge]: 시스템 표준인 'lng' 계보를 잇기 위한 수복 로직
# v14 헌법의 '최소 보수 원칙'에 따라 원천 lon 데이터를 lng로 치환합니다. [cite: 1]
def get_city_payload(city_key: str):
    raw = CITIES.get(city_key) # 제공된 코드에서 변수명이 대문자 CITIES임을 확인 
    if not raw: 
        return None
    
    # 원본의 'lon'을 유지하면서, 시스템 표준 규격인 'lng'를 추가하여 반환합니다.
    return {
        **raw,
        "lng": raw.get("lon") # 🏛️ Absolute Structure v14 규격 동기화 [cite: 1]
    }

# ─────────────────────────────
# API router
# ─────────────────────────────

router = APIRouter()

@router.get("/api/cities")
def get_cities():
    """
    City list for genesis form (JSON)
    """
    return CITIES