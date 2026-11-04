"""Rebuild forgeville-playable.html by inlining style.css and game.js into index.html.

Run from the repo root:  python3 tools/build_single_file.py
"""
from pathlib import Path

root = Path(__file__).resolve().parent.parent
html = (root / 'index.html').read_text()
css = (root / 'style.css').read_text().strip()
js = (root / 'game.js').read_text().strip()

link = '<link rel="stylesheet" href="style.css">'
script = '<script src="game.js"></script>'
assert link in html and script in html, 'index.html no longer references style.css/game.js'
html = html.replace(link, f'<style>\n{css}\n</style>').replace(script, f'<script>\n{js}\n</script>')
(root / 'forgeville-playable.html').write_text(html)
print('wrote forgeville-playable.html')
