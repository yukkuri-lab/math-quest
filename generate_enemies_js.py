
import json
import os

# 1. Run the parser logic again (or import it, but easier to copy-paste logic for self-contained)
# Actually, I can just read the previous output if I saved it? No I printed it.
# I will re-implement the reading logic briefly or invoke the existing script?
# The existing script `parse_enemies.py` prints to stdout. I can modify it to write to file or just read `raw_enemies.txt` again.

# Let's just read existing `parse_enemies.py`? 
# Better: I will create a new script `generate_enemies_js.py` that does everything.

raw_file = "raw_enemies.txt"
output_js = "enemies.js"

# Legacy Data to Preserve
legacy_data = {
    "C000": {
        "id": "C000", "name": "ヒューマノイド型UMA", "emoji": "👽", 
        "image": "assets/uma_humanoid_final_03.jpg", 
        "hp": 16, "exp": 3, "level": 1
    },
    "C001": {
        "id": "C001", "name": "モスマン", "emoji": "🦋",
        "image": "assets/uma_mothman.png",
        "hp": 15, "exp": 5
    }
}

# Load the parsed data
# I will import the parse logic I wrote earlier?
# Or just copy the logic here.

import re

raw_file_path = "/Users/matsukawatakamasa/Vibe Coding/math-quest/raw_enemies.txt"
enemies = []

# Valid Emoji Map
type_emoji_map = {
    "獣人": "🦍", "怪異": "👻", "宇宙人": "👽", "小人": "🧚",
    "動物": "🐾", "鳥": "🦅", "竜": "🐉", "翼竜": "🦖",
    "虫": "🐛", "海の怪物": "🦑", "湖の怪物": "🦕",
    "魚": "🐟", "ヘビ": "🐍", "コウモリ": "🦇", "吸血": "🧛",
    "ロボ": "🤖", "幽霊": "👻", "精霊": "✨", "獣": "🐺"
}

def get_emoji(name, type_str):
    if "ネコ" in name or "キャット" in name: return "🐱"
    if "イヌ" in name or "ドッグ" in name or "狼" in name or "ウルフ" in name: return "🐺"
    if "バット" in name or "コウモリ" in name: return "🦇"
    if "バード" in name or "鳥" in name: return "🦅"
    if "フィッシュ" in name or "魚" in name: return "🐟"
    if "ワーム" in name: return "🐛"
    if "ドラゴン" in name: return "🐉"
    if "スネーク" in name or "サーペント" in name: return "🐍"
    if "フット" in name: return "🦶"
    
    for k, v in type_emoji_map.items():
        if k in type_str: return v
    return "👾"

with open(raw_file_path, 'r', encoding='utf-8') as f:
    for line in f:
        line = line.strip()
        if not line: continue
        parts = re.split(r'\t+', line)
        if len(parts) < 2: continue
        
        # Clean parts
        parts = [p.strip() for p in parts]
        def get_p(idx): return parts[idx] if idx < len(parts) else ""
        
        id_val = get_p(0)
        name_val = get_p(1)
        
        # Merge with legacy if exists
        if id_val == "C001":
            # For C001, we use the name/emoji/stats from file but KEEP image from legacy
            # Actually, let's use the file data but inject image
            pass
            
        habitat_val = get_p(2)
        type_val = get_p(3)
        region_val = get_p(4)
        size_val = get_p(5)
        desc_val = get_p(6)
        
        # Stats Logic
        hp = 15; exp = 5
        prefix = id_val[0]
        if prefix == 'C': hp=15; exp=5
        elif prefix == 'F': hp=25; exp=8
        elif prefix == 'G': hp=20; exp=7
        elif prefix == 'M': hp=30; exp=10
        elif prefix == 'S': hp=25; exp=9
        elif prefix == 'O': hp=40; exp=12
        elif prefix == 'L': hp=35; exp=11
        elif prefix == 'R': hp=50; exp=15
        
        emoji = get_emoji(name_val, type_val)
        
        entry = {
            "id": id_val, "name": name_val, "emoji": emoji,
            "hp": hp, "maxHp": hp, "exp": exp,
            "habitat": habitat_val, "type": type_val,
            "region": region_val, "size": size_val,
            "description": desc_val
        }
        
        # Legacy Injection
        if id_val in legacy_data:
            legacy = legacy_data[id_val]
            if "image" in legacy: entry["image"] = legacy["image"]
            # Prefer parsing script stats or legacy? 
            # Parse stats are generic. Legacy C001 was HP 15. Correct.
            
        enemies.append(entry)

# Prepend C000 if not in list (raw file starts at C001)
# Note: Raw file does NOT contain C000 based on user input.
found_c000 = any(e['id'] == 'C000' for e in enemies)
if not found_c000:
    enemies.insert(0, legacy_data["C000"])

# Write to JS
js_content = "window.enemyData = " + json.dumps(enemies, ensure_ascii=False, indent=4) + ";"

with open("/Users/matsukawatakamasa/Vibe Coding/math-quest/enemies.js", "w", encoding='utf-8') as f:
    f.write(js_content)
    
print(f"Generated enemies.js with {len(enemies)} enemies.")
