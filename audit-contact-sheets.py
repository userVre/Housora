import json
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

root = Path(__file__).parent / "website-screenshots-complete"
out = Path("/tmp/housora-audit-sheets")
out.mkdir(parents=True, exist_ok=True)
report = json.loads((root / "coverage.json").read_text())
font = ImageFont.load_default(size=16)

def make_sheet(items, target, mode):
    cell_w, label_h, gap = 360, 40, 12
    cell_h = 690 if mode == "fold" else 620
    cols = 4
    rows = (len(items) + cols - 1) // cols
    sheet = Image.new("RGB", (cols * (cell_w + gap) + gap, rows * (cell_h + label_h + gap) + gap), "#d8d8d5")
    draw = ImageDraw.Draw(sheet)
    for idx, item in enumerate(items):
        image = Image.open(root / item["file"]).convert("RGB")
        if mode == "fold":
            source_h = min(image.height, round(image.width * cell_h / cell_w))
            image = image.crop((0, 0, image.width, source_h))
            image.thumbnail((cell_w, cell_h), Image.Resampling.LANCZOS)
        else:
            image.thumbnail((cell_w, cell_h), Image.Resampling.LANCZOS)
        x = gap + (idx % cols) * (cell_w + gap)
        y = gap + (idx // cols) * (cell_h + label_h + gap)
        sheet.paste(image, (x, y + label_h))
        draw.rectangle((x, y, x + cell_w, y + label_h), fill="white")
        label = item.get("route") or item.get("slug")
        draw.text((x + 8, y + 10), label[:46], fill="black", font=font)
    sheet.save(target, quality=90)

for viewport in ("desktop", "tablet", "mobile"):
    pages = [p for p in report["pages"] if p["viewport"] == viewport]
    for group in sorted(set(p["group"] for p in pages)):
        selected = [p for p in pages if p["group"] == group]
        make_sheet(selected, out / f"{viewport}-{group}-fold.jpg", "fold")
        make_sheet(selected, out / f"{viewport}-{group}-full.jpg", "full")
    states = [p for p in report["states"] if p["viewport"] == viewport]
    make_sheet(states, out / f"{viewport}-flows.jpg", "fold")

print(out)
