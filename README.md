# GEO-дашборд ОН КЛИНИК — сборка

UI: AISOV Research UI Kit (src/ui-kit — не менять), надстройка — src/dashboard.css, логика — src/app.js.

## Обновить под новый замер
1. Положить выгрузки в `input/` с теми же именами:
   `ai_models.xlsx` (AI-модели), `google_aio.xlsx` (Google AI Overview),
   `yandex_alice.xlsx` (Алиса), `metrika.xlsx` (Метрика).
2. Поменять дату `MEASURE_DATE` в `config.py`.
3. `python3 build.py` (нужен только openpyxl).

Результат в `dist/`:
- `onclinic-geo-dashboard.html` — версия для публикации в Artifact;
- `onclinic-geo-dashboard.standalone.html` — открывается с диска двойным кликом;
- `data.json` — все посчитанные срезы.

## Что настраивается в config.py
Направления и FAQ-группы (значение колонки «Ниша»), целевые сайты, конкуренты по направлениям,
словари упоминаний брендов и домены, служебные ссылки, порог «н/д» для цитирования (10%), размер ТОП.

## GitHub Pages
Сайт лежит в `docs/index.html` (Pages → Deploy from branch → `main` / `docs`).
После `python3 build.py` закоммитьте обновлённый `docs/index.html` — страница обновится через минуту.
Выгрузки (`input/*.xlsx`) в репозиторий не попадают: они в `.gitignore`.

Первый деплой одной командой (нужен GitHub CLI, `gh auth login`):
    ./deploy.sh
