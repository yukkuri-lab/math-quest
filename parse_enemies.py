
import json
import re

raw_file = "/Users/matsukawatakamasa/Vibe Coding/math-quest/raw_enemies.txt"
output_file = "/Users/matsukawatakamasa/Vibe Coding/math-quest/enemy_data.json"

# Existing Emojis Validation (from game.js)
# I will define them here to ensure consistency
existing_metada = {
    "C000": {"emoji": "👽", "hp": 16, "exp": 3},
    "C001": {"emoji": "🦋", "hp": 15, "exp": 5},
    "C002": {"emoji": "🦍", "hp": 18, "exp": 6},
    "C003": {"emoji": "👽", "hp": 12, "exp": 5},
    "C004": {"emoji": "👶", "hp": 12, "exp": 4},
    "C005": {"emoji": "🦎", "hp": 20, "exp": 7},
    "C006": {"emoji": "👽", "hp": 14, "exp": 5},
    "C007": {"emoji": "👹", "hp": 22, "exp": 8},
    "C008": {"emoji": "🧙", "hp": 12, "exp": 4},
    "C009": {"emoji": "👖", "hp": 12, "exp": 5},
    "C010": {"emoji": "🐺", "hp": 25, "exp": 9},
    "C011": {"emoji": "🦇", "hp": 15, "exp": 6},
    "C012": {"emoji": "👥", "hp": 18, "exp": 7},
    "C013": {"emoji": "🕴️", "hp": 20, "exp": 8},
    "C014": {"emoji": "👾", "hp": 25, "exp": 9},
    "C015": {"emoji": "🐷", "hp": 22, "exp": 8},
    "C016": {"emoji": "🧛", "hp": 18, "exp": 7},
    "C017": {"emoji": "🧟", "hp": 18, "exp": 7},
    "C018": {"emoji": "🧌", "hp": 30, "exp": 10},
    "C019": {"emoji": "👺", "hp": 15, "exp": 6},
    "C020": {"emoji": "🐕", "hp": 20, "exp": 8},
    "C021": {"emoji": "🐸", "hp": 14, "exp": 5},
    "C022": {"emoji": "🐱", "hp": 12, "exp": 5},
    # F series onwards - guessing default if not in list
    "F001": {"emoji": "🦶"},
    "F009": {"emoji": "👽"}, 
}

# Default mappings for new ones based on keywords in name or type
type_emoji_map = {
    "獣人": "🦍",
    "怪異": "👻",
    "宇宙人": "👽",
    "小人": "🧚",
    "動物": "🐾",
    "鳥": "🦅",
    "竜": "🐉",
    "翼竜": "🦖",
    "虫": "🐛",
    "海の怪物": "🦑",
    "湖の怪物": "🦕",
    "魚": "🐟",
    "ヘビ": "🐍",
    "コウモリ": "🦇",
    "吸血": "🧛",
    "ロボ": "🤖",
    "幽霊": "👻",
    "精霊": "✨"
}

def get_emoji(name, type_str, id_str):
    if id_str in existing_metada:
        return existing_metada[id_str]["emoji"]
    
    # Keyword search in Name
    if "ネコ" in name or "キャット" in name: return "🐱"
    if "イヌ" in name or "ドッグ" in name or "狼" in name or "ウルフ" in name: return "🐺"
    if "バット" in name or "コウモリ" in name: return "🦇"
    if "バード" in name or "鳥" in name: return "🦅"
    if "フィッシュ" in name or "魚" in name: return "🐟"
    if "ワーム" in name: return "🐛"
    if "ドラゴン" in name: return "🐉"
    if "スネーク" in name or "サーペント" in name: return "🐍"
    if "フット" in name: return "🦶"
    
    # Type search
    for k, v in type_emoji_map.items():
        if k in type_str:
            return v
    
    return "👾" # Default

enemies = []

with open(raw_file, 'r', encoding='utf-8') as f:
    for line in f:
        line = line.strip()
        if not line: continue
        
        # Split by tab or multiple spaces
        parts = re.split(r'\t+', line)
        
        if len(parts) < 2:
            continue
            
        # Basic fields
        id_str = parts[0].strip()
        name = parts[1].strip()
        habitat = parts[2].strip() if len(parts) > 2 else ""
        type_str = parts[3].strip() if len(parts) > 3 else ""
        
        # Region, Size, Description are tricky as some might be empty
        # Logic: If 4th part is existing, it is type.
        # Parts after type can be: Region, Size, Description
        # We need to heuristics.
        
        # Re-parsing strategy:
        # The copy paste might have preserved tabs.
        # Let's assume the columns are: ID, Name, Habitat, Type, Region, Size, Description
        # But looking at C001: C001, モスマン, まち, 怪異/ひと型, (Empty), (Empty), 目が赤い...
        # So we should try to map by index if consistent, OR fill backwards?
        # The user's text seems to have TABs.
        
        # Let's trust the 'parts' from split('\t+') if clean copy-paste.
        # However, multiple tabs might be collapsed by split if we use regex '\t+'.
        # `split('\t')` preserves empty strings.
        
        raw_parts = line.split('\t')
        clean_parts = [p.strip() for p in raw_parts]
        
        # Safe indexing
        def get_p(idx):
             return clean_parts[idx] if idx < len(clean_parts) else ""
             
        id_val = get_p(0)
        name_val = get_p(1)
        habitat_val = get_p(2)
        type_val = get_p(3)
        region_val = get_p(4)
        size_val = get_p(5)
        desc_val = get_p(6)
        
        # Calculate Stats based on ID prefix or "dangerousness"
        # Base HP/EXP
        hp = 15
        exp = 5
        
        # Heuristic for HP/EXP based on ID group
        prefix = id_val[0]
        if prefix == 'C': # City?
            hp = 15
            exp = 5
        elif prefix == 'F': # Forest?
            hp = 25
            exp = 8
        elif prefix == 'G': # Grassland
            hp = 20
            exp = 7
        elif prefix == 'M': # Mountain
            hp = 30
            exp = 10
        elif prefix == 'S': # Sky
            hp = 25
            exp = 9
        elif prefix == 'O': # Ocean
            hp = 40
            exp = 12
        elif prefix == 'L': # Lake
            hp = 35
            exp = 11
        elif prefix == 'R': # Ranking / Bosses?
            hp = 50
            exp = 15
            
        # Adjust existing stats if known
        if id_val in existing_metada:
            if "hp" in existing_metada[id_val]: hp = existing_metada[id_val]["hp"]
            if "exp" in existing_metada[id_val]: exp = existing_metada[id_val]["exp"]
            
        emoji = get_emoji(name_val, type_val, id_val)
        
        enemy = {
            "id": id_val,
            "name": name_val,
            "emoji": emoji,
            "hp": hp,
            "maxHp": hp, # Set max same as start
            "exp": exp,
            "habitat": habitat_val,
            "type": type_val,
            "region": region_val,
            "size": size_val,
            "description": desc_val
        }
        
        # Clean empty keys
        keys_to_remove = [k for k, v in enemy.items() if v == ""]
        for k in keys_to_remove:
            del enemy[k]
            
        enemies.append(enemy)

print(json.dumps(enemies, ensure_ascii=False, indent=4))
