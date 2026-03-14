import json
import re

# Read the existing enemies.js file
with open('/Users/matsukawatakamasa/Vibe Coding/math-quest/enemies.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Extract the JSON part (window.enemyData = [...])
match = re.search(r'window\.enemyData\s*=\s*(\[[\s\S]*?\]);?', content)
if not match:
    print("Could not find enemyData")
    exit(1)

json_str = match.group(1)
# Fix loose syntax if any (comments are already stripped in standard JSON but JS objects might have comments or trailing commas)
# Simple approach: evaluate it as JS if possible, or use a loose parser. 
# Since I can't easily eval JS, I'll attempt to parse it as JSON after cleaning.
# However, the file clearly has comments // and unquoted keys in some places potentially? 
# Looking at the file content from view_file, keys are quoted "id": "C000". good.
# It has // comments. I need to remove them.

json_clean = re.sub(r'//.*', '', json_str)
# Remove trailing commas
json_clean = re.sub(r',\s*\]', ']', json_clean)
json_clean = re.sub(r',\s*\}', '}', json_clean)

try:
    enemies = json.loads(json_clean)
except json.JSONDecodeError as e:
    print(f"JSON Parse Error: {e}")
    # Fallback: manual processing or request user to fix. 
    # Actually, let's try to just process it as text to preserve formatting and comments if possible?
    # No, rewriting is safer for structure, but I lose comments.
    # The file has comments like // Removed.
    # I will stick to the plan of reading, processing, and writing back a clean JSON structure.
    exit(1)

# Categorization Logic
def get_encounter_type(enemy):
    eid = enemy.get('id', '')
    name = enemy.get('name', '')
    habitat = enemy.get('habitat', '')
    type_ = enemy.get('type', '')
    image = enemy.get('image', '')

    # 1. Explicit Mappings based on User Request
    # ① Forest/Beast (Heavy)
    beast_ids = ['F001', 'F003', 'M001', 'F005', 'C002', 'C007', 'C020', 'C005'] # derived from names
    if any(x in image for x in ['bigfoot', 'skunk_ape', 'yeti', 'orang_pendek', 'monkey_man', 'fouke_monster', 'dogman', 'lizardman']):
         return 'beast'
    
    # ② Water (Gentle)
    if any(x in image for x in ['nessie', 'kraken', 'ningen']):
        return 'water'
    
    # ③ Sky (Wind)
    if any(x in image for x in ['thunderbird', 'owlman', 'flying_humanoid']):
        return 'sky'

    # ④ Shadow/Humanoid (Eerie)
    if any(x in image for x in ['slenderman', 'shadow_people', 'gray', 'mothman', 'rake', 'humanoid']):
        return 'shadow'

    # 2. General Rules
    if habitat in ['海', '湖/川']:
        return 'water'
    
    if habitat == '空':
        return 'sky'
    
    if type_ in ['宇宙人', '幽霊', '小人', '怪異'] or '怪異' in type_:
        # Check if it's beast-like怪異
        if '獣' in type_: 
            return 'beast'
        return 'shadow'
    
    if type_ in ['獣', '獣人', '動物', '恐竜', '海の怪物', '湖の怪物']: # Wait, Sea/Lake monster processed by habitat?
        if habitat in ['海', '湖/川']: return 'water'
        return 'beast'
    
    return 'beast' # Fallback

for enemy in enemies:
    enemy['encounterType'] = get_encounter_type(enemy)

# Generate output string
output_json = json.dumps(enemies, indent=4, ensure_ascii=False)
final_content = f"window.enemyData = {output_json};"

with open('/Users/matsukawatakamasa/Vibe Coding/math-quest/enemies.js', 'w', encoding='utf-8') as f:
    f.write(final_content)

print("Successfully updated enemies.js")
