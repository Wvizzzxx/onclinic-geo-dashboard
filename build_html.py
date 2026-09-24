# -*- coding: utf-8 -*-
"""dist/data.json + src/* -> dist/onclinic-geo-dashboard.html (фрагмент для Artifact)
и dist/onclinic-geo-dashboard.standalone.html (полноценный HTML для открытия с диска)."""
import base64, json, os
K = "src/ui-kit"

def rd(p): return open(p, encoding="utf-8").read()
def b64(p, mime): return f"data:{mime};base64," + base64.b64encode(open(p, "rb").read()).decode()

data = json.load(open("dist/data.json", encoding="utf-8"))
icons = {c["icon"]: b64(f"{K}/assets/ai/{c['icon']}", "image/svg+xml") for c in data["channels"].values()}
html = rd("src/template.html")
html = (html.replace("/*__UIKIT__*/", rd(f"{K}/ui-kit.css"))
            .replace("/*__ICONS__*/", rd(f"{K}/aisov-icons.css"))
            .replace("/*__DASH__*/", rd("src/dashboard.css"))
            .replace("__LOGO__", b64(f"{K}/logo-mark.png", "image/png"))
            .replace("__HERO__", b64("src/assets/hero-onclinic.webp", "image/webp"))
            .replace("__DATA__", json.dumps(data, ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/"))
            .replace("__AI_ICONS__", json.dumps(icons))
            .replace("/*__APP__*/", rd("src/app.js")))
open("dist/onclinic-geo-dashboard.html", "w", encoding="utf-8").write(html)
title_end = html.index("</title>") + len("</title>")
head, body = html[:title_end], html[title_end:]
style_end = body.index("</style>") + len("</style>")
standalone = ('<!doctype html>\n<html lang="ru">\n<head>\n<meta charset="utf-8">\n'
              '<meta name="viewport" content="width=device-width,initial-scale=1">\n'
              + head + body[:style_end] + "\n</head>\n<body>\n" + body[style_end:] + "\n</body>\n</html>\n")
open("dist/onclinic-geo-dashboard.standalone.html", "w", encoding="utf-8").write(standalone)
os.makedirs("docs", exist_ok=True)
open("docs/index.html", "w", encoding="utf-8").write(standalone)  # сайт для GitHub Pages
print("ok", len(html) // 1024, "KB")
