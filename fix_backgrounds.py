import os
import glob
import math
from PIL import Image

ASSETS_DIR = "assets"

def get_target_images():
    # Process all uma_*.png files
    return glob.glob(os.path.join(ASSETS_DIR, "uma_*.png"))

def is_similar(c1, c2, threshold=30):
    # Euclidean distance in RGB space
    # c1, c2 are (r,g,b) or (r,g,b,a)
    r1, g1, b1 = c1[:3]
    r2, g2, b2 = c2[:3]
    dist = math.sqrt((r1-r2)**2 + (g1-g2)**2 + (b1-b2)**2)
    return dist < threshold

def remove_background(img_path):
    print(f"Processing {img_path}...")
    try:
        if not os.path.exists(img_path):
            print(f"  Not found: {img_path}")
            return

        img = Image.open(img_path).convert("RGBA")
        width, height = img.size
        pixels = img.load()

        # 1. Identify Background Candidates using Edge Sampling
        # Sample deeper into the image (5 px border) to catch checkerboard variations
        samples = []
        border = 5
        for x in range(width):
            for y in range(border):
                samples.append(pixels[x, y]) # Top
                samples.append(pixels[x, height-1-y]) # Bottom
        for y in range(height):
            for x in range(border):
                samples.append(pixels[x, y]) # Left
                samples.append(pixels[width-1-x, y]) # Right

        from collections import Counter
        counts = Counter(samples)
        total_samples = len(samples)
        
        candidates = counts.most_common(10)
        # print(f"  Top edge colors: {candidates}")

        bg_target_colors = set()
        
        # Heuristic: Add colors that appear frequently (>1%) on edges
        for color, count in candidates:
             if count > total_samples * 0.01:
                 bg_target_colors.add(color)

        # Heuristic: Explicitly add "Common Checkerboard" colors if they are present in candidates
        # White, Light Gray, Dark Gray
        checker_colors = [
            (255, 255, 255), # White
            (204, 204, 204), # Standard Checkerboard Gray
            (238, 238, 238), # Lighter Gray
            (128, 128, 128)  # Mid Gray
        ]
        
        # Check if any candidate resembles a checkerboard color
        for cand in candidates:
            c = cand[0]
            for cc in checker_colors:
                if is_similar(c, cc, threshold=20):
                     bg_target_colors.add(c)

        # print(f"  Target Removal Colors (Exact): {bg_target_colors}")

        if not bg_target_colors:
            print("  No clear background detected.")
            return

        # 2. Flood Fill with Fuzzy Matching
        visited = set()
        queue = []
        
        # Initialize queue with all edge pixels that match target colors (fuzzy)
        # We assume the background touches the edges.
        
        # Helper to check if a pixel should be removed
        def is_bg(color):
            if color[3] == 0: return True # Already transparent
            for target in bg_target_colors:
                if is_similar(color, target, threshold=25): # Increased threshold for compression artifacts
                    return True
            return False

        # Scan edges for seeds
        for x in range(width):
            if is_bg(pixels[x, 0]): queue.append((x, 0)); visited.add((x, 0))
            if is_bg(pixels[x, height-1]): queue.append((x, height-1)); visited.add((x, height-1))
        for y in range(1, height-1):
            if is_bg(pixels[0, y]): queue.append((0, y)); visited.add((0, y))
            if is_bg(pixels[width-1, y]): queue.append((width-1, y)); visited.add((width-1, y))

        print(f"  Starting fill with {len(queue)} seeds...")
        
        count_removed = 0
        while queue:
            x, y = queue.pop(0)
            
            # Wipe
            if pixels[x, y][3] != 0:
                pixels[x, y] = (0, 0, 0, 0)
                count_removed += 1
            
            # Neighbors
            for dx, dy in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
                nx, ny = x + dx, y + dy
                if 0 <= nx < width and 0 <= ny < height:
                    if (nx, ny) not in visited:
                        # Check if neighbor is also background
                        if is_bg(pixels[nx, ny]):
                            visited.add((nx, ny))
                            queue.append((nx, ny))
                            
        print(f"  Removed {count_removed} pixels.")
        if count_removed > 0:
            img.save(img_path)
            # print(f"  Saved {img_path}")
        else:
            print("  No changes made.")

    except Exception as e:
        print(f"  Error processing {img_path}: {e}")

if __name__ == "__main__":
    targets = get_target_images()
    print(f"Found {len(targets)} images to process.")
    for p in targets:
        remove_background(p)
