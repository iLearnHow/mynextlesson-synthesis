import argparse
import os
from PIL import Image


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--src", required=True)
    parser.add_argument("--dst", required=True)
    parser.add_argument("--width", type=int, default=1920)
    parser.add_argument("--height", type=int, default=1080)
    parser.add_argument("--fit", type=float, default=0.8, help="Fraction of canvas height occupied by image")
    args = parser.parse_args()

    os.makedirs(os.path.dirname(args.dst), exist_ok=True)

    canvas = Image.new("RGB", (args.width, args.height), color=(255, 255, 255))
    img = Image.open(args.src).convert("RGBA")

    # scale to fit desired fraction of height
    target_h = int(args.height * args.fit)
    scale = target_h / img.height
    target_w = int(img.width * scale)
    img = img.resize((target_w, target_h), Image.LANCZOS)

    # center horizontally, align to bottom with small margin
    x = (args.width - target_w) // 2
    y = args.height - target_h - int(0.05 * args.height)
    canvas.paste(img, (x, y), mask=img)

    canvas.save(args.dst)
    print(args.dst)


if __name__ == "__main__":
    main()



