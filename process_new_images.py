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
    "S006": "uma_owlman.png"
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
