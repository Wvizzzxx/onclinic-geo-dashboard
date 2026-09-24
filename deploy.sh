#!/usr/bin/env bash
# Создаёт публичный репозиторий, пушит и включает GitHub Pages из папки docs/
set -euo pipefail
REPO="${1:-onclinic-geo-dashboard}"
OWNER="$(gh api user -q .login)"
gh repo create "$OWNER/$REPO" --public --source=. --remote=origin --push
gh api -X POST "repos/$OWNER/$REPO/pages" -f "source[branch]=main" -f "source[path]=/docs" >/dev/null
echo "Готово: https://$OWNER.github.io/$REPO/ (первая сборка Pages ~1 минута)"
