from PIL import Image, ImageDraw, ImageFont
import os

OUT = '/home/claude/veckomeny/public'
os.makedirs(OUT, exist_ok=True)

BG = (253, 250, 243)      # #fdfaf3
ACCENT = (194, 65, 12)    # #c2410c
INK = (42, 37, 32)        # #2a2520

def find_serif_font(size):
    candidates = [
        '/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf',
        '/usr/share/fonts/truetype/liberation/LiberationSerif-Bold.ttf',
    ]
    for p in candidates:
        if os.path.exists(p):
            return ImageFont.truetype(p, size)
    return ImageFont.load_default()

def draw_icon(size, maskable=False):
    # For maskable icons we need a safe zone – content should stay within the center 80%
    img = Image.new('RGBA', (size, size), BG)
    draw = ImageDraw.Draw(img)

    # Background circle in accent color
    if maskable:
        # Full-bleed accent background so it looks good when masked to any shape
        draw.rectangle([(0, 0), (size, size)], fill=ACCENT)
        # White inner circle for contrast
        margin = int(size * 0.18)
        draw.ellipse([(margin, margin), (size - margin, size - margin)], fill=BG)
        # Letter "V" in accent
        font = find_serif_font(int(size * 0.52))
        text = 'V'
        bbox = draw.textbbox((0, 0), text, font=font)
        w = bbox[2] - bbox[0]
        h = bbox[3] - bbox[1]
        x = (size - w) / 2 - bbox[0]
        y = (size - h) / 2 - bbox[1] - int(size * 0.02)
        draw.text((x, y), text, font=font, fill=ACCENT)
    else:
        # Rounded background rectangle (iOS/Android will apply their own mask)
        radius = int(size * 0.22)
        draw.rounded_rectangle([(0, 0), (size, size)], radius=radius, fill=ACCENT)
        # Letter "V" in cream
        font = find_serif_font(int(size * 0.60))
        text = 'V'
        bbox = draw.textbbox((0, 0), text, font=font)
        w = bbox[2] - bbox[0]
        h = bbox[3] - bbox[1]
        x = (size - w) / 2 - bbox[0]
        y = (size - h) / 2 - bbox[1] - int(size * 0.03)
        draw.text((x, y), text, font=font, fill=BG)

    return img

# 192x192
draw_icon(192).save(f'{OUT}/icon-192.png')
# 512x512
draw_icon(512).save(f'{OUT}/icon-512.png')
# 512x512 maskable
draw_icon(512, maskable=True).save(f'{OUT}/icon-maskable.png')
# Apple touch icon 180x180
draw_icon(180).save(f'{OUT}/apple-touch-icon.png')

# Simple SVG favicon
svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect width="100" height="100" rx="22" fill="#c2410c"/>
  <text x="50" y="72" font-family="Georgia, serif" font-size="70" font-weight="700" fill="#fdfaf3" text-anchor="middle">V</text>
</svg>'''
with open(f'{OUT}/favicon.svg', 'w') as f:
    f.write(svg)

print('Icons generated:', os.listdir(OUT))
