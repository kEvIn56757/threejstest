"""Render a replaceable gauge face. The pointer is intentionally absent."""
import math
import sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

maximum = float(sys.argv[1]) if len(sys.argv) > 1 else 1.6
folder = Path(__file__).resolve().parent.parent / 'assets/imported-models/d6b7bee9-ca9b-4f34-8335-d72ed3cc755d/textures'
folder.mkdir(parents=True, exist_ok=True)
size = 2048
image = Image.new('RGB', (size, size), '#f6f4eb')
draw = ImageDraw.Draw(image)
center = size / 2
radius = size / 2
ink = '#20272d'
font = ImageFont.truetype('C:/Windows/Fonts/arial.ttf', 113)
unit_font = ImageFont.truetype('C:/Windows/Fonts/arialbd.ttf', 119)
small_font = ImageFont.truetype('C:/Windows/Fonts/arial.ttf', 58)

def point(angle, fraction):
    a = math.radians(angle)
    return (center + radius * fraction * math.cos(a), center - radius * fraction * math.sin(a))

draw.ellipse((30, 30, size - 30, size - 30), outline='#9ba0a0', width=5)
for tick in range(41):
    angle = 225 - tick / 40 * 270
    major = tick % 5 == 0
    draw.line([point(angle, .93), point(angle, .80 if major else .86)], fill=ink, width=12 if major else 5)
    if major:
        value = maximum * tick / 40
        text = f'{value:.2f}'.rstrip('0').rstrip('.') if value else '0'
        draw.text(point(angle, .66), text, font=font, fill=ink, anchor='mm')
draw.text((center, center - 245), 'PRESSURE', font=small_font, fill='#59616a', anchor='mm')
draw.text((center, center + 275), 'MPa', font=unit_font, fill=ink, anchor='mm')
image.save(folder / 'pressure-dial.png', optimize=True)
print(f'{folder / "pressure-dial.png"} (0–{maximum:g} MPa, no printed pointer)')
