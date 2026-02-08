
import os

# 1. Update index.html
index_path = "/Users/matsukawatakamasa/Vibe Coding/index.html"
with open(index_path, 'r', encoding='utf-8') as f:
    html_content = f.read()

# Replace script tag
target_script = '<script src="game.js?v=7"></script>'
new_script = '<script src="enemies.js"></script>\n    <script src="game.js?v=8"></script>'

if target_script in html_content:
    html_content = html_content.replace(target_script, new_script)
    with open(index_path, 'w', encoding='utf-8') as f:
        f.write(html_content)
    print("Updated index.html")
else:
    print("Target script not found in index.html, skipping or already updated.")

# 2. Update game.js
game_path = "/Users/matsukawatakamasa/Vibe Coding/math-quest/game.js"
with open(game_path, 'r', encoding='utf-8') as f:
    game_lines = f.readlines()

# Find the start and end of enemies array
start_idx = -1
end_idx = -1

for i, line in enumerate(game_lines):
    if "const enemies = [" in line:
        start_idx = i
    if start_idx != -1 and "];" in line and i > start_idx:
        # Check indentation to be sure it's the closing bracket of enemies
        # The content has 8 spaces indent for items, array likely 8 spaces closing?
        # Original file: line 349 is "        ];" (8 spaces)
        if line.strip() == "];":
            end_idx = i
            break

if start_idx != -1 and end_idx != -1:
    # Construct new content
    new_lines = game_lines[:start_idx]
    new_lines.append("        const enemies = window.enemyData || [];\n")
    new_lines.extend(game_lines[end_idx+1:])
    
    with open(game_path, 'w', encoding='utf-8') as f:
        f.writelines(new_lines)
    print(f"Updated game.js (Replaced lines {start_idx+1} to {end_idx+1})")
else:
    print(f"Could not find enemies block in game.js. Start: {start_idx}, End: {end_idx}")

