import os
import shutil
from PIL import Image

# Import background removal logic
try:
    from fix_backgrounds import remove_background
except ImportError:
    # If import fails (e.g. running standalone), duplicate simple logic or warn
    print("Warning: fix_backgrounds module not found. Background removal might be skipped if not integrated.")
    def remove_background(path):
        print(f"Mock background removal for {path}")

ASSETS_DIR = "assets"

# Mapping ID -> Target Filename
ID_MAP = {
    "F001": "uma_bigfoot.png",
    "F003": "uma_skunk_ape.png",
    "F005": "uma_orang_pendek.png",
    "F006": "uma_bearwolf.png",
    "G001": "uma_chupacabra.png",
    "L001": "uma_nessie.png",
    "L006": "uma_frogman.png",
    "M001": "uma_yeti.png",
    "M002": "uma_yowie.png",
    "M004": "uma_tatzelwurm.png",
    "O001": "uma_kraken.png",
    "S003": "uma_thunderbird.png",
    "S006": "uma_owlman.png",
    # New Mappings
    "C002": "uma_monkey_man.png",
    "C004": "uma_kistem_dwarf.png",
    "C007": "uma_fouke_monster.png",
    "C008": "uma_gnome.png",
    "C010": "uma_beast_of_gevaudan.png",
    "C011": "uma_bauokoji.png",
    "C012": "uma_shadow_people.png",
    "C013": "uma_slenderman.png",
    "C015": "uma_bigman.png",
    # "C016": "uma_manananggal.png", # Removed by user request
    "F002": "uma_mapinguari.png",
    # "F004": "uma_bukit_timah_monkey_man.png", # Removed by user request
    # "F007": "uma_orang_dalam.png", # Removed by user request
    "F008": "uma_mogollon_monster.png",
    # "F009": "uma_humanoid_input.png", # Removed by user request
    "G002": "uma_serpopard.png",
    "G003": "uma_skvader.png",
    "G004": "uma_carbuncle.png",
    # Second Batch
    "C017": "uma_rake.png",
    "C018": "uma_troll.png",
    "C019": "uma_pombero.png",
    "C021": "uma_bosnian_monster.png",
    "C022": "uma_winged_cat.png",
    "O003": "uma_ningen.png",
    "S011": "uma_flying_humanoid.png",
    "S014": "uma_light_being.png"
}

def process_images():
    print("Starting image processing...")
    
    # List all files in assets
    files = os.listdir(ASSETS_DIR)
    
    for filename in files:
        # Check if file starts with one of our IDs
        found_id = None
        for icon_id in ID_MAP.keys():
            if filename.startswith(icon_id) and (filename.endswith(".png") or filename.endswith(".jpg") or filename.endswith(".jpeg")):
                found_id = icon_id
                break
        
        if found_id:
            target_name = ID_MAP[found_id]
            source_path = os.path.join(ASSETS_DIR, filename)
            target_path = os.path.join(ASSETS_DIR, target_name)
            
            print(f"Found {found_id}: {filename} -> {target_name}")
            
            # Rename (Move)
            shutil.move(source_path, target_path)
            
            # Process Background
            print(f"  Removing background for {target_name}...")
            remove_background(target_path)
            
        else:
            # Check if it IS the target name already (re-run case)
            if filename in ID_MAP.values():
                print(f"File already renamed: {filename}. Processing background just in case.")
                target_path = os.path.join(ASSETS_DIR, filename)
                remove_background(target_path)

if __name__ == "__main__":
    process_images()
