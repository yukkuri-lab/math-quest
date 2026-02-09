from PIL import Image
import os

images = [
    "assets/uma_dogman.png",
    "assets/uma_dover_demon.png",
    "assets/uma_flatwoods_monster.png",
    "assets/uma_gray.png",
    "assets/uma_lizardman.png",
    "assets/uma_mothman.png",
    "assets/uma_night_crawler.png"
]

for img_path in images:
    try:
        if not os.path.exists(img_path):
            print(f"{img_path}: Not found")
            continue
            
        img = Image.open(img_path)
        # Check corners for checkerboard-like colors (white/grey)
        # and lack of alpha channel or full opacity
        
        has_alpha = img.mode == 'RGBA'
        extrema = img.getextrema()
        if has_alpha:
            alpha_extrema = extrema[3]
            if alpha_extrema[0] < 255:
                # Has some transparency
                print(f"{img_path}: Has transparency (Alpha min: {alpha_extrema[0]})")
                # Even if it has transparency, it might still have checkerboard if the user screenshot it
                # But usually fake transparency means no alpha
            else:
                print(f"{img_path}: RGBA but full opaque")
        else:
             print(f"{img_path}: No Alpha Channel ({img.mode})")

        # Check a few distinct pixels to guess checkerboard
        # Top-left (0,0)
        p0 = img.getpixel((0,0))
        # 10px right (10, 0)
        p1 = img.getpixel((10,0))
        
        print(f"  Sample pixels: (0,0)={p0}, (10,0)={p1}")

    except Exception as e:
        print(f"{img_path}: Error {e}")
