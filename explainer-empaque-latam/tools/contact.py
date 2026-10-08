import sys, glob, os
from PIL import Image, ImageDraw, ImageFont
src, out, tw = sys.argv[1], sys.argv[2], int(sys.argv[3])
files = sorted(glob.glob(src + '/*.png'))
im0 = Image.open(files[0]); th = round(tw * im0.height / im0.width)
cols = int(sys.argv[4]) if len(sys.argv) > 4 else 4
rows = (len(files) + cols - 1) // cols
sheet = Image.new('RGB', (cols * tw + (cols + 1) * 12, rows * (th + 30) + 12), '#E6E0D6')
f = ImageFont.truetype('/usr/share/fonts/opentype/inter/InterDisplay-Medium.otf', 18)
d = ImageDraw.Draw(sheet)
for i, fn in enumerate(files):
    im = Image.open(fn).convert('RGB').resize((tw, th), Image.LANCZOS)
    x = 12 + (i % cols) * (tw + 12); y = 12 + (i // cols) * (th + 30)
    sheet.paste(im, (x, y)); d.text((x, y + th + 4), os.path.basename(fn), fill='#1E1A16', font=f)
sheet.save(out)
