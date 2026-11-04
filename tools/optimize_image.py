"""表紙画像をWeb用に縮小する。
使い方: python tools/optimize_image.py <元画像> <出力名(拡張子なし)>
→ assets/img/covers/<出力名>.jpg (幅600px) を作成
"""
import sys
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent

def cover(src, name, width=600):
    im = Image.open(src).convert("RGB")
    h = round(im.height * width / im.width)
    im = im.resize((width, h), Image.LANCZOS)
    out = ROOT / "assets/img/covers" / f"{name}.jpg"
    im.save(out, "JPEG", quality=84, optimize=True, progressive=True)
    print(out, im.size)

if __name__ == "__main__":
    cover(sys.argv[1], sys.argv[2])
