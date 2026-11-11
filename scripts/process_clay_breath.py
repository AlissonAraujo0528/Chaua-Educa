"""Extract 4-frame clay breath vapor spritesheet."""
from PIL import Image, ImageFilter
import numpy as np

src = Image.open('C:/Users/aliss/.gemini/antigravity/brain/ed57b9d7-6392-4a2f-9a94-60455156b763/clay_breath_spritesheet_1794262106039.jpg').convert('RGBA')
arr = np.array(src)
h, w, _ = arr.shape

# 1. Connected background detection from corners
rgb = arr[:, :, :3].astype(np.float32)
# Distance from pure white
white_dist = np.sqrt(np.sum((255.0 - rgb) ** 2, axis=2))

# Outside mask: flood fill or threshold
is_bg = white_dist < 12.0
# For pixels near the edge, compute smooth alpha:
# At white_dist <= 3 -> alpha = 0
# At white_dist >= 25 -> alpha = 255
alpha = np.clip((white_dist - 3.0) / 22.0 * 255.0, 0, 255).astype(np.uint8)

# Re-colorize foreground so white matte fringe is removed
# Un-blend from white background: C_true = (C - 255 * (1 - a)) / a
a_norm = np.maximum(0.01, alpha.astype(np.float32) / 255.0)[:, :, None]
unpremul_rgb = np.clip((rgb - 255.0 * (1.0 - a_norm)) / a_norm, 0, 255).astype(np.uint8)

clean_img = Image.fromarray(np.dstack([unpremul_rgb, alpha]))

# Four frame bounding boxes
frames_x = [(65, 260), (305, 610), (645, 1000), (1040, 1335)]
frame_imgs = []
cell_size = 128
atlas = Image.new('RGBA', (cell_size * 4, cell_size), (0, 0, 0, 0))

for i, (x0, x1) in enumerate(frames_x):
    crop = clean_img.crop((x0, 200, x1, 560))
    # Find active bounding box
    bbox = crop.getbbox()
    if bbox:
        cropped = crop.crop(bbox)
        # Scale into cell_size with padding
        max_dim = max(cropped.width, cropped.height)
        scale = (cell_size - 16) / max_dim
        new_w, new_h = int(cropped.width * scale), int(cropped.height * scale)
        resized = cropped.resize((new_w, new_h), Image.Resampling.LANCZOS)
        ox = i * cell_size + (cell_size - new_w) // 2
        oy = (cell_size - new_h) // 2
        atlas.paste(resized, (ox, oy), resized)

out_path = 'Chaua-Educa-main/assets/v10/clay-breath.webp'
atlas.save(out_path, lossless=True, method=6)
atlas.save('C:/Users/aliss/.gemini/antigravity/brain/ed57b9d7-6392-4a2f-9a94-60455156b763/clay-breath-preview.png')
print(f'Saved {out_path} ({atlas.size})')
