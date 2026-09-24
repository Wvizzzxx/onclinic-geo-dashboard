# -*- coding: utf-8 -*-
"""Настройки дашборда. Меняйте здесь — build_data.py и build_html.py подхватят.

Для нового замера: положить новые выгрузки в input/ с теми же именами и запустить
    python3 build.py
"""

MEASURE_DATE = "22 сентября 2026"
CLIENT = "ОН КЛИНИК"
CLIENT_SITE = "onclinic.ru"

INPUT = {
    "models": "input/ai_models.xlsx",        # выгрузка AI-моделей
    "google": "input/google_aio.xlsx",       # Google AI Overview
    "alice":  "input/yandex_alice.xlsx",     # Яндекс Алиса (ИИ-выдача)
    "metrika": "input/metrika.xlsx",         # Метрика: трафик из AI
}

# Каналы: key -> (название, тип, иконка)
CHANNELS = {
    "chatgpt":  ("ChatGPT", "models", "chatgpt.svg"),
    "deepseek": ("DeepSeek", "models", "deepseek.svg"),
    "gemini":   ("Gemini", "models", "gemini.svg"),
    "gigachat": ("GigaChat", "models", "gigachat.svg"),
    "yandexgpt": ("YandexGPT", "models", "yandexgpt.svg"),
    "google_aio": ("Google AI Overview", "search", "google-ai-overview.svg"),
    "alice":    ("Алиса AI на поиске", "search", "alice-search.svg"),
}
# Сопоставление названий из выгрузок -> key канала
CHANNEL_ALIASES = {
    "chatgpt": "chatgpt", "deepseek": "deepseek", "gemini": "gemini", "gigachat": "gigachat",
    "yandexgpt": "yandexgpt", "google_ai_overview": "google_aio", "google ai overview": "google_aio",
    "яндекс алиса": "alice", "алиса": "alice",
}
# Метрика: берём только сервисы, которые есть в замере (остальные строки выгрузки игнорируются).
# ключ — название строки в выгрузке Метрики (без учёта регистра), значение — подпись на дашборде
METRIKA_MODELS = {
    "алиса": "Алиса",
    "chatgpt": "ChatGPT",
    "gemini": "Gemini",
    "gigachat": "GigaChat",
    "deepseek": "DeepSeek",
    "yandexgpt": "YandexGPT",
}

# Канал участвует в цитировании, если ссылки есть минимум в этой доле ответов
CITATION_MIN_SHARE = 0.10

# Направления. niche — значение колонки «Ниша» в выгрузке.
# target — целевой сайт ОН КЛИНИК для направления (host без www; поддомены plastica.* считаются отдельно)
# hub — посадочная раздела (host, path-prefix), считается отдельной строкой, если задана
DIRECTIONS = [
    {"key": "plastic", "title": "Пластическая хирургия", "niche": "Пластическая хирургия",
     "competitors": "plastic", "target": ("plastica.onclinic.ru", "/"), "target_label": "plastica.onclinic.ru"},
    {"key": "gyn", "title": "Гинекология", "niche": "Гинекология",
     "competitors": "general", "target": ("onclinic.ru", "/"), "target_label": "onclinic.ru", "hub": ("onclinic.ru", "/ginekologiya/")},
    {"key": "trauma", "title": "Травматология и ортопедия", "niche": "Травматология и ортопедия",
     "competitors": "general", "target": ("onclinic.ru", "/"), "target_label": "onclinic.ru"},
    {"key": "uro", "title": "Урология и проктология", "niche": "Урология и проктология",
     "competitors": "general", "target": ("onclinic.ru", "/"), "target_label": "onclinic.ru"},
]
FAQ_GROUPS = [
    {"key": "faq_gyn", "title": "Гинекология", "niche": "FAQ - Гинекология",
     "competitors": "general", "target": ("onclinic.ru", "/"), "target_label": "onclinic.ru"},
    {"key": "faq_plastic", "title": "Пластическая хирургия", "niche": "FAQ - Пластическая хирургия",
     "competitors": "plastic", "target": ("plastica.onclinic.ru", "/"), "target_label": "plastica.onclinic.ru"},
    {"key": "faq_procto", "title": "Проктология", "niche": "FAQ - Проктология",
     "competitors": "general", "target": ("onclinic.ru", "/"), "target_label": "onclinic.ru"},
    {"key": "faq_uro", "title": "Урология и андрология", "niche": "FAQ - Урология и андрология",
     "competitors": "general", "target": ("onclinic.ru", "/"), "target_label": "onclinic.ru"},
]

# Бренды: словарь упоминаний (regex, без учёта регистра, если не указано cs) и домены
# (домен засчитывает также все поддомены).
BRANDS = {
    "onclinic": {"name": "ОН КЛИНИК", "client": True,
                 "patterns": [r"(?<![а-яёa-z])он[\s\-]?клиник(?:а|и|е|у|ой)?(?![а-яё])", r"onclinic", r"(?<![a-z])on[\s\-]clinic"],
                 "domains": ["onclinic.ru"]},
    "frau": {"name": "Фрау Клиник", "patterns": [r"фрау[\s\-]?клиник", r"frau[\s\-]?klinik"], "domains": ["frauklinik.ru"]},
    "smplastica": {"name": "СМ-Пластика", "patterns": [r"(?<![а-яёa-z])см[\s\-–]?пластик", r"sm[\s\-]?plastica"], "domains": ["sm-plastica.ru"]},
    "medsi": {"name": "Медси", "patterns": [r"(?<![а-яё])медси(?![а-яё])", r"medsi"], "domains": ["medsi.ru"]},
    "doctorplastic": {"name": "Доктор Пластик", "patterns": [r"доктор[\s\-]?пластик(?:а|е|у|ом)?(?![а-яё])", r"doctor[\s\-]?plastic"], "domains": ["doctorplastic.ru"]},
    "fmba": {"name": "ФНКЦ ФМБА", "patterns": [r"фнкц", r"(?<![а-яё])фмба(?![а-яё])", r"fnkc"], "domains": ["fnkc-fmba.ru"]},
    "smclinic": {"name": "СМ-Клиника", "patterns": [r"(?<![а-яёa-z])см[\s\-–]?клиник", r"smclinic", r"sm[\s\-]clinic"], "domains": ["smclinic.ru"]},
    "fdoctor": {"name": "Семейный доктор", "patterns": [r"Семейн(?:ый|ого|ом|ому)\s+[Дд]октор", r"«семейн(?:ый|ого|ом|ому)\s+доктор"], "cs": True, "domains": ["fdoctor.ru"]},
    "chudo": {"name": "Чудо Доктор", "patterns": [r"чудо[\s\-]?доктор"], "domains": ["chudodoctor.ru"]},
}
COMPETITOR_SETS = {
    "plastic": ["onclinic", "frau", "smplastica", "medsi", "doctorplastic", "fmba"],
    "general": ["onclinic", "smclinic", "fmba", "fdoctor", "chudo", "medsi"],
}

# Служебные ссылки, которые не являются источниками (поисковые/рекламные редиректы)
SERVICE_URL_PATTERNS = [
    r"^https?://(www\.)?google\.[a-z.]+/(searchviewer|search|url)",
    r"^https?://(www\.)?ya\.ru/search",
    r"^https?://(www\.)?yandex\.ru/search",
    r"^https?://yabs\.yandex\.ru/",
]
TOP_DOMAINS_N = 10
GAP_PROMPTS_N = 8
