"""Build master handcrafted clay snow trees for Chaua Educa."""
from pathlib import Path
from PIL import Image, ImageFilter
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
BRAIN = Path("C:/Users/aliss/.gemini/antigravity/brain/ed57b9d7-6392-4a2f-9a94-60455156b763")
OUT_V10 = ROOT / "Chaua-Educa-main/assets/v10"
OUT_V10.mkdir(parents=True, exist_ok=True)

def remove_pure_white_bg(img, thresh=15.0, feather=16.0):
    """Cleanly extracts alpha from white background and de-mats foreground colors."""
    arr = np.array(img.convert('RGB')).astype(np.float32)
    dist = np.sqrt(np.sum((255.0 - arr) ** 2, axis=2))
    alpha = np.clip((dist - thresh) / feather * 255.0, 0, 255).astype(np.uint8)
    a_norm = np.maximum(0.01, alpha.astype(np.float32) / 255.0)[:, :, None]
    unpremul = np.clip((arr - 255.0 * (1.0 - a_norm)) / a_norm, 0, 255).astype(np.uint8)
    return Image.fromarray(np.dstack([unpremul, alpha]))

def extract_snow_layer(ai_crop, max_y_ratio=0.55):
    """Extracts genuine 3D clay snow (caps, drips, icicles) with ambient contact shadow."""
    arr = np.array(ai_crop)
    h, w, _ = arr.shape
    rgb = arr[:, :, :3].astype(np.float32)
    alpha = arr[:, :, 3]

    brightness = rgb.mean(axis=2)
    saturation = rgb.max(axis=2) - rgb.min(axis=2)

    # Snow is bright white/light-blue-gray with low saturation
    # Contact shadow under snow drips is brown/dark-gray
    y_coords = np.arange(h)[:, None]
    in_upper_region = y_coords < int(h * max_y_ratio)

    # Core snow: high brightness, low saturation
    is_snow_core = (alpha > 40) & (brightness > 165) & (saturation < 42) & in_upper_region
    # Ambient shadow under snow: adjacent to snow core with moderate brightness
    mask = Image.fromarray(is_snow_core.astype(np.uint8) * 255)
    dilated = mask.filter(ImageFilter.MaxFilter(7))
    dil_arr = np.array(dilated) > 0

    is_snow_layer = (alpha > 40) & (is_snow_core | (dil_arr & in_upper_region & (brightness > 90) & (saturation < 85)))

    # Smooth alpha mask
    final_mask = Image.fromarray(is_snow_layer.astype(np.uint8) * 255).filter(ImageFilter.GaussianBlur(radius=1.2))
    m_arr = np.array(final_mask)

    out = np.zeros_like(arr)
    out[:, :, :3] = arr[:, :, :3]
    out[:, :, 3] = np.clip(m_arr.astype(np.float32) / 255.0 * alpha.astype(np.float32), 0, 255).astype(np.uint8)
    return Image.fromarray(out)

def build_lower_trees():
    print("Building master trees-lower-snow...")
    orig_atlas = Image.open(ROOT / "Chaua-Educa-main/assets/v7/trees-lower.webp")
    ai_raw = Image.open(BRAIN / "clay_winter_tree_trunks_2x2_1794261878459.jpg")
    ai_clean = remove_pure_white_bg(ai_raw)

    out_atlas = Image.new('RGBA', (1024, 1024), (0, 0, 0, 0))
    quads = [(0, 0), (512, 0), (0, 512), (512, 512)]

    # Target top rim widths for the 4 lower cells:
    # Cell 0: ~241px, Cell 1: ~241px, Cell 2: ~231px, Cell 3: ~240px + branch
    for i, (qx, qy) in enumerate(quads):
        orig_cell = orig_atlas.crop((qx, qy, qx + 512, qy + 512))
        ai_cell = ai_clean.crop((qx, qy, qx + 512, qy + 512))

        # 1. Subtle winter cool tone on original bark
        o_arr = np.array(orig_cell).astype(np.float32)
        alpha = o_arr[:, :, 3]
        rgb = o_arr[:, :, :3]
        lum = 0.299 * rgb[:, :, 0] + 0.587 * rgb[:, :, 1] + 0.114 * rgb[:, :, 2]

        cool_rgb = np.zeros_like(rgb)
        cool_rgb[:, :, 0] = rgb[:, :, 0] * 0.90 + lum * 0.08
        cool_rgb[:, :, 1] = rgb[:, :, 1] * 0.93 + lum * 0.06
        cool_rgb[:, :, 2] = rgb[:, :, 2] * 0.96 + lum * 0.14
        winter_base = Image.fromarray(np.dstack([np.clip(cool_rgb, 0, 255), alpha]).astype(np.uint8))

        # 2. Extract genuine 3D clay snow cap from AI cell
        # For cell 3 (perch branch), include more vertical height so perch snow is extracted
        max_y = 0.65 if i == 3 else 0.48
        snow_layer = extract_snow_layer(ai_cell, max_y_ratio=max_y)

        # Bounding box of snow cap
        bbox = snow_layer.getbbox()
        if bbox:
            crop_snow = snow_layer.crop(bbox)
            # Desired width is ~250px centered on the trunk
            target_w = 265 if i != 3 else 360
            scale = target_w / crop_snow.width
            new_w = round(crop_snow.width * scale)
            new_h = round(crop_snow.height * scale)
            scaled_snow = crop_snow.resize((new_w, new_h), Image.Resampling.LANCZOS)

            dest_x = round(256 - new_w / 2) if i != 3 else round(200 - new_w / 2)
            dest_y = 12 # rest gently atop y=22 rim

            winter_base.alpha_composite(scaled_snow, (dest_x, dest_y))

        out_atlas.paste(winter_base, (qx, qy))

    out_atlas.save(OUT_V10 / "trees-lower-snow.webp", lossless=True, method=6)
    out_atlas.save(BRAIN / "master_trees_lower_snow.png")
    print("Master trees-lower-snow saved successfully!")

def extract_icicle_crop(cell_arr, min_y=320):
    rgb = cell_arr[:, :, :3]
    brightness = rgb.mean(axis=2)
    saturation = rgb.max(axis=2) - rgb.min(axis=2)
    is_bg = (brightness > 248) & (saturation < 10)
    is_not_wood = (rgb[:, :, 2] >= rgb[:, :, 0] - 18)
    in_zone = np.arange(512)[:, None] > min_y
    is_icicle = (~is_bg) & is_not_wood & (brightness > 135) & in_zone

    mask = Image.fromarray((is_icicle * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(radius=0.8))
    m_arr = np.array(mask).astype(np.float32) / 255.0

    out = np.zeros((512, 512, 4), dtype=np.uint8)
    out[:, :, :3] = np.clip(rgb, 0, 255).astype(np.uint8)
    out[:, :, 3] = np.clip(m_arr * 255.0, 0, 255).astype(np.uint8)
    img = Image.fromarray(out)
    bbox = img.getbbox()
    return img.crop(bbox) if bbox else None

def build_upper_trees():
    print("Building master trees-upper-snow...")
    orig_atlas = Image.open(ROOT / "Chaua-Educa-main/assets/v7/trees-upper.webp")
    ai_raw = Image.open(BRAIN / "winter_hanging_trunks_2x2_1794261930911.jpg")
    arr = np.array(ai_raw).astype(np.float32)

    # Extract icicles from cell 0, 2, and 3
    ic0 = extract_icicle_crop(arr[:512, :512], min_y=330)
    ic2 = extract_icicle_crop(arr[512:, :512], min_y=350)
    ic3 = extract_icicle_crop(arr[512:, 512:], min_y=350)
    ic1 = ic0.transpose(Image.Transpose.FLIP_LEFT_RIGHT)

    icicles = [ic0, ic1, ic2, ic3]
    targets = [
        (230, 370), # cell 0: bot_y 476, rim at 375
        (240, 360), # cell 1: bot_y 464, rim at 365
        (230, 370), # cell 2: bot_y 479, rim at 375
        (220, 290)  # cell 3: bot_y 383, rim at 295
    ]

    out_atlas = Image.new('RGBA', (1024, 1024), (0, 0, 0, 0))
    quads = [(0, 0), (512, 0), (0, 512), (512, 512)]

    for i, (qx, qy) in enumerate(quads):
        orig_cell = orig_atlas.crop((qx, qy, qx + 512, qy + 512))

        # Winter cool tone on bark
        o_arr = np.array(orig_cell).astype(np.float32)
        alpha = o_arr[:, :, 3]
        rgb = o_arr[:, :, :3]
        lum = 0.299 * rgb[:, :, 0] + 0.587 * rgb[:, :, 1] + 0.114 * rgb[:, :, 2]
        cool_rgb = np.zeros_like(rgb)
        cool_rgb[:, :, 0] = rgb[:, :, 0] * 0.90 + lum * 0.08
        cool_rgb[:, :, 1] = rgb[:, :, 1] * 0.93 + lum * 0.06
        cool_rgb[:, :, 2] = rgb[:, :, 2] * 0.96 + lum * 0.14
        winter_base = Image.fromarray(np.dstack([np.clip(cool_rgb, 0, 255), alpha]).astype(np.uint8))

        ic_crop = icicles[i]
        tw, dy = targets[i]
        scale = tw / ic_crop.width
        scaled = ic_crop.resize((round(ic_crop.width * scale), round(ic_crop.height * scale)), Image.Resampling.LANCZOS)
        dest_x = round(256 - scaled.width / 2)
        winter_base.alpha_composite(scaled, (dest_x, dy))

        out_atlas.paste(winter_base, (qx, qy))

    out_atlas.save(OUT_V10 / "trees-upper-snow.webp", lossless=True, method=6)
    out_atlas.save(BRAIN / "master_trees_upper_snow.png")
    print("Master trees-upper-snow saved successfully!")

def build_variant_trees():
    print("Building master tree-variants-snow...")
    orig_atlas = Image.open(ROOT / "Chaua-Educa-main/assets/v9/tree-variants.webp")
    ai_raw = Image.open(BRAIN / "winter_tree_trunk_obstacles_2x2_1794261987881.jpg")
    ai_clean = remove_pure_white_bg(ai_raw)

    out_atlas = Image.new('RGBA', (512, 512), (0, 0, 0, 0))
    quads = [(0, 0), (256, 0), (0, 256), (256, 256)]
    ai_quads = [(0, 0), (512, 0), (0, 512), (512, 512)]

    for i, ((qx, qy), (aqx, aqy)) in enumerate(zip(quads, ai_quads)):
        orig_cell = orig_atlas.crop((qx, qy, qx + 256, qy + 256))
        ai_cell = ai_clean.crop((aqx, aqy, aqx + 512, aqy + 512))

        # Winter tone on bark
        o_arr = np.array(orig_cell).astype(np.float32)
        alpha = o_arr[:, :, 3]
        rgb = o_arr[:, :, :3]
        lum = 0.299 * rgb[:, :, 0] + 0.587 * rgb[:, :, 1] + 0.114 * rgb[:, :, 2]
        cool_rgb = np.zeros_like(rgb)
        cool_rgb[:, :, 0] = rgb[:, :, 0] * 0.90 + lum * 0.08
        cool_rgb[:, :, 1] = rgb[:, :, 1] * 0.93 + lum * 0.06
        cool_rgb[:, :, 2] = rgb[:, :, 2] * 0.96 + lum * 0.14
        winter_base = Image.fromarray(np.dstack([np.clip(cool_rgb, 0, 255), alpha]).astype(np.uint8))

        # Extract snow from AI variant (upper 45%)
        snow_layer = extract_snow_layer(ai_cell, max_y_ratio=0.50)
        sbox = snow_layer.getbbox()
        if sbox:
            crop_snow = snow_layer.crop(sbox)
            target_w = 145
            scale = target_w / crop_snow.width
            new_w = round(crop_snow.width * scale)
            new_h = round(crop_snow.height * scale)
            scaled_snow = crop_snow.resize((new_w, new_h), Image.Resampling.LANCZOS)

            dest_x = round(128 - new_w / 2)
            dest_y = 4 # TREE_CAP_Y is 8, rest gently atop

            winter_base.alpha_composite(scaled_snow, (dest_x, dest_y))

        out_atlas.paste(winter_base, (qx, qy))

    out_atlas.save(OUT_V10 / "tree-variants-snow.webp", lossless=True, method=6)
    out_atlas.save(BRAIN / "master_tree_variants_snow.png")
    print("Master tree-variants-snow saved successfully!")

if __name__ == '__main__':
    build_lower_trees()
    build_upper_trees()
    build_variant_trees()
    print("All master snow assets built successfully!")
