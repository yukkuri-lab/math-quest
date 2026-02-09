import os
from PIL import Image, ImageDraw

TARGET_IMAGES = [
    "assets/uma_dogman.png",
    "assets/uma_dover_demon.png",
    "assets/uma_flatwoods_monster.png",
    "assets/uma_gray.png",
    "assets/uma_lizardman.png",
    "assets/uma_mothman.png",
    "assets/uma_night_crawler.png"
]

def remove_background(img_path):
    print(f"Processing {img_path}...")
    try:
        if not os.path.exists(img_path):
            print(f"  Not found: {img_path}")
            return

        img = Image.open(img_path).convert("RGBA")
        width, height = img.size
        pixels = img.load()

        # Identify potential background colors by sampling the edges
        bg_colors = set()
        samples = []
        
        # Sample full perimeter
        for x in range(width):
            samples.append(pixels[x, 0])
            samples.append(pixels[x, height-1])
        for y in range(height):
            samples.append(pixels[0, y])
            samples.append(pixels[width-1, y])
            
        # Also sample a bit of the checkerboard pattern explicitly (0,0) and (10,0) logic
        # Assuming checkerboard squares are smaller than 20px
        for x in range(0, 50, 5):
            if x < width:
                samples.append(pixels[x, 0])
                samples.append(pixels[x, min(10, height-1)])

        # Count frequencies
        from collections import Counter
        counts = Counter(samples)
        
        # Take colors that appear significantly on the edge
        # Heuristic: If it's a checkerboard, 2 colors will dominate the edge.
        # If it's solid, 1 color.
        total_samples = len(samples)
        
        candidates = counts.most_common(5)
        print(f"  Dominant edge colors: {candidates}")
        
        # Any color with > 5% presence on edge is treated as background candidate
        # We also treat White (255,255,255) and Transparent-grid Grey approx (204,204,204) as targets if present
        
        final_bg_colors = set()
        for color, count in candidates:
             if count > total_samples * 0.05:
                 final_bg_colors.add(color)
        
        # Add common checkerboard colors if they are close to candidates 'cause jpeg artifacts or similar? 
        # PNG is lossless so exact match is likely.
        
        print(f"  Target Removal Colors: {final_bg_colors}")

        # Flood fill from edges
        # Queue-based flood fill
        visited = set()
        queue = []
        
        # Init queue with all edge pixels that match bg colors
        for x in range(width):
            if pixels[x, 0] in final_bg_colors:
                queue.append((x, 0))
                visited.add((x, 0))
            if pixels[x, height-1] in final_bg_colors:
                queue.append((x, height-1))
                visited.add((x, height-1))
                
        for y in range(1, height-1): # Skip top/bottom as they are covered above
            if pixels[0, y] in final_bg_colors:
                queue.append((0, y))
                visited.add((0, y))
            if pixels[width-1, y] in final_bg_colors:
                queue.append((width-1, y))
                visited.add((width-1, y))

        print(f"  Starting Flood Fill with {len(queue)} seeds...")
        
        count_removed = 0
        while queue:
            x, y = queue.pop(0)
            
            # Make transparent
            pixels[x, y] = (0, 0, 0, 0)
            count_removed += 1
            
            # Check neighbors
            for dx, dy in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
                nx, ny = x + dx, y + dy
                if 0 <= nx < width and 0 <= ny < height:
                    if (nx, ny) not in visited:
                        if pixels[nx, ny] in final_bg_colors:
                            visited.add((nx, ny))
                            queue.append((nx, ny))
                            
        print(f"  Removed {count_removed} pixels.")
        img.save(img_path)
        print(f"  Saved {img_path}")

    except Exception as e:
        print(f"  Error processing {img_path}: {e}")

if __name__ == "__main__":
    for p in TARGET_IMAGES:
        remove_background(p)
