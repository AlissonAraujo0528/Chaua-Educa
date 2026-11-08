"""
Generate high-fidelity, clay-style snow trees for Chaua Educa.
Preserves exact geometry, anchors, splice points, and content bounding boxes.
Produces:
- Chaua-Educa-main/assets/v10/trees-lower-snow.webp (1024x1024)
- Chaua-Educa-main/assets/v10/trees-upper-snow.webp (1024x1024)
- Chaua-Educa-main/assets/v10/tree-variants-snow.webp (512x512)
"""
from pathlib import Path
from PIL import Image, ImageFilter, ImageDraw, ImageEnhance
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
ASSETS_DIR = ROOT / 'Chaua-Educa-main' / 'assets'
V7_DIR = ASSETS_DIR / 'v7'
V9_DIR = ASSETS_DIR / 'v9'
V10_DIR = ASSETS_DIR / 'v10'
V10_DIR.mkdir(parents=True, exist_ok=True)

def process_lower_cell(cell_img, cell_idx):
    """Processes a 512x512 cell of trees-lower."""
    arr = np.array(cell_img).astype(np.float32)
    h, w, _ = arr.shape
    alpha = arr[:, :, 3]
    has_wood = alpha > 40

    # 1. Cool winter palette shift on bark
    rgb = arr[:, :, :3]
    lum = 0.299 * rgb[:, :, 0] + 0.587 * rgb[:, :, 1] + 0.114 * rgb[:, :, 2]
    cool_wood = np.zeros_like(rgb)
    cool_wood[:, :, 0] = rgb[:, :, 0] * 0.88 + lum * 0.08
    cool_wood[:, :, 1] = rgb[:, :, 1] * 0.92 + lum * 0.06
    cool_wood[:, :, 2] = rgb[:, :, 2] * 0.95 + lum * 0.16
    rgb = np.clip(cool_wood, 0, 255)

    # 2. Frost crystals in bark vertical furrows
    # Detect edges in vertical luminance
    dy = np.abs(np.diff(lum, axis=0, append=lum[-1:, :]))
    dx = np.abs(np.diff(lum, axis=1, append=lum[:, -1:]))
    bark_crevices = (dx > 20) & has_wood
    # Add frosty dusting along bark crevices
    frost_amt = np.where(bark_crevices, 0.28, 0.0)[:, :, None]
    rgb = rgb * (1.0 - frost_amt) + np.array([235, 245, 255]) * frost_amt

    base_result = Image.fromarray(np.dstack([rgb, alpha]).astype(np.uint8))

    # 3. Sculpted Clay Snow Blanket on cut top rim & branches
    snow_canvas = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    snow_draw = ImageDraw.Draw(snow_canvas)

    # Find the top contour of the wood
    top_y = np.full(w, h, dtype=int)
    for col in range(w):
        rows = np.where(has_wood[:, col])[0]
        if len(rows) > 0:
            top_y[col] = rows[0]

    # For cell 3, perch branch is on the left (col 20 to 120, y around 80-120)
    # Detect both primary top rim and perch branch
    for col in range(w):
        if top_y[col] < 140:
            ty = top_y[col]
            # Height of pillowy snow cap (12 to 22 pixels)
            cap_h = 16 + int(np.sin(col * 0.18) * 4 + np.cos(col * 0.05) * 3)
            # Round out the edges
            left_dist = max(0, col - np.where(top_y < 140)[0].min())
            right_dist = max(0, np.where(top_y < 140)[0].max() - col)
            edge_t = min(1.0, min(left_dist, right_dist) / 14.0)
            cap_h = int(cap_h * edge_t)

            if cap_h > 2:
                # Upward snow mound
                for dy in range(-cap_h // 2, cap_h):
                    py = ty + dy
                    if 0 <= py < h:
                        norm = (dy + cap_h // 2) / (cap_h * 1.5)
                        if norm < 0.25:
                            # Highlight on top of snow
                            snow_canvas.putpixel((col, py), (255, 255, 255, 255))
                        elif norm < 0.70:
                            # Soft snowy body (clay white)
                            snow_canvas.putpixel((col, py), (242, 248, 255, 250))
                        elif norm < 0.90:
                            # Blue-gray shadow in snow folds
                            snow_canvas.putpixel((col, py), (210, 226, 244, 235))
                        else:
                            # Soft contact shadow at wood junction
                            snow_canvas.putpixel((col, py), (145, 168, 195, 200))

    # Also for cell 3: branch top edge detection (secondary shelf)
    if cell_idx == 3:
        for col in range(25, 110):
            # Check for the branch upper edge around y=70..100
            branch_rows = np.where(has_wood[60:110, col])[0] + 60
            if len(branch_rows) > 0:
                by = branch_rows[0]
                snow_h = 8 + int(np.sin(col * 0.2) * 2)
                for dy in range(-snow_h // 2, snow_h):
                    py = by + dy
                    if 0 <= py < h:
                        snow_canvas.putpixel((col, py), (245, 250, 255, 240))

    # Smooth the snow layer slightly to achieve the sculpted clay look
    snow_smooth = snow_canvas.filter(ImageFilter.GaussianBlur(radius=0.9))

    # Mask snow to wood silhouette plus slight natural overhang
    snow_arr = np.array(snow_smooth)
    # Allow snow to extend 4px above top_y, but keep sides clean
    wood_mask = alpha > 10
    wood_dilated = Image.fromarray(wood_mask).filter(ImageFilter.MaxFilter(7))
    dilated_mask = np.array(wood_dilated)
    snow_arr[:, :, 3] = np.where(dilated_mask, snow_arr[:, :, 3], 0)

    final_cell = base_result.copy()
    final_cell.alpha_composite(Image.fromarray(snow_arr))
    return final_cell


def process_upper_cell(cell_img, cell_idx):
    """Processes a 512x512 cell of trees-upper."""
    arr = np.array(cell_img).astype(np.float32)
    h, w, _ = arr.shape
    alpha = arr[:, :, 3]
    has_wood = alpha > 40

    # 1. Cool winter palette shift
    rgb = arr[:, :, :3]
    lum = 0.299 * rgb[:, :, 0] + 0.587 * rgb[:, :, 1] + 0.114 * rgb[:, :, 2]
    cool_wood = np.zeros_like(rgb)
    cool_wood[:, :, 0] = rgb[:, :, 0] * 0.88 + lum * 0.08
    cool_wood[:, :, 1] = rgb[:, :, 1] * 0.92 + lum * 0.06
    cool_wood[:, :, 2] = rgb[:, :, 2] * 0.95 + lum * 0.16
    rgb = np.clip(cool_wood, 0, 255)

    # Frost dusting in crevices
    dx = np.abs(np.diff(lum, axis=1, append=lum[:, -1:]))
    bark_crevices = (dx > 20) & has_wood
    frost_amt = np.where(bark_crevices, 0.26, 0.0)[:, :, None]
    rgb = rgb * (1.0 - frost_amt) + np.array([235, 245, 255]) * frost_amt

    base_result = Image.fromarray(np.dstack([rgb, alpha]).astype(np.uint8))

    # 2. Upper canopy snow base (top y=20..50) and bottom hanging icicles
    snow_canvas = Image.new('RGBA', (w, h), (0, 0, 0, 0))

    # Snow settling at canopy junction (top 35 pixels)
    for col in range(w):
        rows = np.where(has_wood[:, col])[0]
        if len(rows) > 0 and rows[0] < 35:
            # Canopy snow dusting
            for y in range(rows[0], min(h, rows[0] + 20)):
                if has_wood[y, col]:
                    norm = (y - rows[0]) / 20.0
                    alpha_snow = int((1.0 - norm) * 230)
                    snow_canvas.putpixel((col, y), (245, 250, 255, alpha_snow))

    # Bottom hanging icicles
    bot_y = np.full(w, -1, dtype=int)
    for col in range(w):
        rows = np.where(has_wood[:, col])[0]
        if len(rows) > 0:
            bot_y[col] = rows[-1]

    # Hang icicles every ~10-14 pixels along the bottom cut tips
    for col in range(15, w - 15):
        if bot_y[col] > 280 and (col % 12 == (cell_idx * 3) % 12):
            by = bot_y[col]
            icicle_len = 12 + int((np.sin(col * 1.7) * 0.5 + 0.5) * 18)
            for iy in range(icicle_len):
                cy = by + iy
                if cy < h:
                    width_rad = max(0, int((1.0 - iy / icicle_len) * 2.8))
                    a = int((1.0 - (iy / icicle_len) * 0.45) * 230)
                    for wx in range(-width_rad, width_rad + 1):
                        cx = col + wx
                        if 0 <= cx < w:
                            # Icicle color: ice blue with bright core
                            if wx == 0 and iy < icicle_len * 0.7:
                                color = (255, 255, 255, a)
                            else:
                                color = (215, 235, 255, int(a * 0.85))
                            snow_canvas.putpixel((cx, cy), color)

    snow_smooth = snow_canvas.filter(ImageFilter.GaussianBlur(radius=0.7))
    final_cell = base_result.copy()
    final_cell.alpha_composite(snow_smooth)
    return final_cell


def process_variant_cell(cell_img, idx):
    """Processes a 256x256 cell of tree-variants (rot, hollow, moss, vine)."""
    arr = np.array(cell_img).astype(np.float32)
    h, w, _ = arr.shape
    alpha = arr[:, :, 3]
    has_wood = alpha > 40

    # 1. Cool winter palette shift
    rgb = arr[:, :, :3]
    lum = 0.299 * rgb[:, :, 0] + 0.587 * rgb[:, :, 1] + 0.114 * rgb[:, :, 2]
    cool_wood = np.zeros_like(rgb)
    cool_wood[:, :, 0] = rgb[:, :, 0] * 0.88 + lum * 0.08
    cool_wood[:, :, 1] = rgb[:, :, 1] * 0.92 + lum * 0.06
    cool_wood[:, :, 2] = rgb[:, :, 2] * 0.95 + lum * 0.16
    rgb = np.clip(cool_wood, 0, 255)

    base_result = Image.fromarray(np.dstack([rgb, alpha]).astype(np.uint8))
    snow_canvas = Image.new('RGBA', (w, h), (0, 0, 0, 0))

    # Find top edge of cap (around y=8)
    top_y = np.full(w, h, dtype=int)
    for col in range(w):
        rows = np.where(has_wood[:, col])[0]
        if len(rows) > 0:
            top_y[col] = rows[0]

    # Snow cap on top rim
    for col in range(w):
        if top_y[col] < 40:
            ty = top_y[col]
            cap_h = 10 + int(np.sin(col * 0.25) * 3)
            left_d = max(0, col - np.where(top_y < 40)[0].min())
            right_d = max(0, np.where(top_y < 40)[0].max() - col)
            edge_t = min(1.0, min(left_d, right_d) / 8.0)
            cap_h = int(cap_h * edge_t)

            for dy in range(-cap_h // 2, cap_h):
                py = ty + dy
                if 0 <= py < h:
                    norm = (dy + cap_h // 2) / max(1, cap_h * 1.5)
                    if norm < 0.3:
                        snow_canvas.putpixel((col, py), (255, 255, 255, 255))
                    elif norm < 0.75:
                        snow_canvas.putpixel((col, py), (242, 248, 255, 245))
                    else:
                        snow_canvas.putpixel((col, py), (170, 195, 225, 210))

    # Variant-specific details:
    # 0 = rot: snow dusting in fractured fissures
    # 1 = hollow: snow crest on hollow opening rim (y around 60..90)
    # 2 = moss: moss mounds coated in snow crust
    # 3 = vine: snow lines following twisting vines
    if idx == 1: # hollow
        for col in range(95, 160):
            # snow ledge on hollow upper lip
            lip_y = 62 + int(np.sin((col - 95) / 65 * np.pi) * 6)
            for dy in range(-3, 5):
                snow_canvas.putpixel((col, lip_y + dy), (245, 250, 255, 230))
            if col % 10 == 0:
                # mini icicles inside hollow mouth
                for iy in range(7):
                    snow_canvas.putpixel((col, lip_y + 4 + iy), (220, 240, 255, 200 - iy * 20))
    elif idx == 2: # moss
        # moss clusters coated with thick snow cushions
        for col in range(70, 185):
            for y in range(40, 140, 18):
                if has_wood[y, col] and (col + y) % 17 < 9:
                    snow_canvas.putpixel((col, y), (240, 248, 255, 220))
                    snow_canvas.putpixel((col, y + 1), (210, 230, 250, 190))
    elif idx == 3: # vine
        # snow resting on vine loops
        for col in range(65, 190):
            loop_y = int(50 + np.sin(col * 0.12) * 25 + (col % 30))
            if 0 <= loop_y < h and has_wood[loop_y, col]:
                snow_canvas.putpixel((col, loop_y), (250, 252, 255, 240))
                snow_canvas.putpixel((col, loop_y - 1), (255, 255, 255, 220))

    snow_smooth = snow_canvas.filter(ImageFilter.GaussianBlur(radius=0.7))
    final_cell = base_result.copy()
    final_cell.alpha_composite(snow_smooth)
    return final_cell


def main():
    print("Generating snow tree spritesheets...")

    # 1. trees-lower-snow.webp (1024x1024)
    lower_src = Image.open(V7_DIR / 'trees-lower.webp')
    lower_out = Image.new('RGBA', (1024, 1024))
    for idx, (ox, oy) in enumerate([(0,0), (512,0), (0,512), (512,512)]):
        cell = lower_src.crop((ox, oy, ox + 512, oy + 512))
        processed = process_lower_cell(cell, idx)
        lower_out.paste(processed, (ox, oy))
    lower_path = V10_DIR / 'trees-lower-snow.webp'
    lower_out.save(lower_path, lossless=True, method=6)
    print(f"Generated {lower_path} ({lower_path.stat().st_size} bytes)")

    # 2. trees-upper-snow.webp (1024x1024)
    upper_src = Image.open(V7_DIR / 'trees-upper.webp')
    upper_out = Image.new('RGBA', (1024, 1024))
    for idx, (ox, oy) in enumerate([(0,0), (512,0), (0,512), (512,512)]):
        cell = upper_src.crop((ox, oy, ox + 512, oy + 512))
        processed = process_upper_cell(cell, idx)
        upper_out.paste(processed, (ox, oy))
    upper_path = V10_DIR / 'trees-upper-snow.webp'
    upper_out.save(upper_path, lossless=True, method=6)
    print(f"Generated {upper_path} ({upper_path.stat().st_size} bytes)")

    # 3. tree-variants-snow.webp (512x512)
    variant_src = Image.open(V9_DIR / 'tree-variants.webp')
    variant_out = Image.new('RGBA', (512, 512))
    for idx, (ox, oy) in enumerate([(0,0), (256,0), (0,256), (256,256)]):
        cell = variant_src.crop((ox, oy, ox + 256, oy + 256))
        processed = process_variant_cell(cell, idx)
        variant_out.paste(processed, (ox, oy))
    variant_path = V10_DIR / 'tree-variants-snow.webp'
    variant_out.save(variant_path, lossless=True, method=6)
    print(f"Generated {variant_path} ({variant_path.stat().st_size} bytes)")

    print("All snow spritesheets created successfully!")

if __name__ == '__main__':
    main()
