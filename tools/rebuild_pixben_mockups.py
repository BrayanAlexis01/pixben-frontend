"""Rebuild 54 optimized PixBen apparel references from the existing black garment photos.
Clásico: regular length. Boxy: wide and cropped. Oversize: longer, dropped shoulder.
Only changes photographic mockups; design and print layers stay editable in Fabric.
"""
from pathlib import Path
from PIL import Image, ImageFilter
import numpy as np

PALETTE = {
    "negro": (24, 24, 26),
    "blanco": (244, 243, 241),
    "arena": (214, 197, 176),
    "beige-claro": (233, 217, 195),
    "beige-oscuro": (173, 145, 116),
    "gris": (146, 147, 151),
    "marron": (104, 77, 63),
    "celeste-claro": (171, 211, 229),
    "azul-marino": (33, 45, 67),
}
PLACEMENT = {
    "clasico": (29, 75, 451, 541),
    "boxy": (10, 106, 470, 486),
    "oversize": (6, 48, 474, 562),
}
SOURCE_BOTTOM = {
    ("clasico", "frente"): 546,
    ("clasico", "espalda"): 532,
    ("boxy", "frente"): 540,
    ("boxy", "espalda"): 529,
    ("oversize", "frente"): 535,
    ("oversize", "espalda"): 532,
}

def build(directory):
    directory = Path(directory)
    for fit, box in PLACEMENT.items():
        for side in ("frente", "espalda"):
            source = Image.open(directory / f"{fit}-{side}-negro.webp").convert("RGB")
            pixels = np.asarray(source, dtype=np.float32)
            # The existing black shirt is much darker than the near-white backdrop.
            luminance = pixels.mean(axis=2)
            alpha = np.clip((215 - luminance) / 82, 0, 1)
            # Exclude the old artificial floor-shadow rectangle beneath the hem.
            limit = SOURCE_BOTTOM[(fit, side)]
            alpha[limit:] = 0
            for row in range(5):
                if limit - row - 1 >= 0:
                    alpha[limit - row - 1, :] *= (row + 1) / 6
            mask = Image.fromarray(np.uint8(alpha * 255), "L")
            mask = mask.filter(ImageFilter.GaussianBlur(.58))
            ys, xs = np.where(np.asarray(mask) > 80)
            if not xs.size:
                raise RuntimeError(f"Unable to isolate {fit}-{side} apparel")
            bbox = (int(xs.min()), int(ys.min()), int(xs.max() + 1), int(ys.max() + 1))
            crop_mask = mask.crop(bbox)
            cloth = pixels[bbox[1]:bbox[3], bbox[0]:bbox[2], :]
            cloth_mask = np.asarray(crop_mask, dtype=np.float32) / 255
            median = float(np.median(cloth[cloth_mask > .9].mean(1)))
            variation = np.clip((cloth.mean(2) - median) * .68, -22, 20)
            width, height = box[2] - box[0], box[3] - box[1]
            display_mask = crop_mask.resize((width, height), Image.Resampling.LANCZOS)

            for color_name, rgb in PALETTE.items():
                # Medium-grey background gives the white shirt contrast without
                # darkening the garment or obscuring the printable chest area.
                if color_name == "blanco":
                    background = (219, 217, 214)
                elif color_name in ("beige-claro", "arena"):
                    background = (232, 229, 225)
                else:
                    background = (247, 246, 244)
                colored = np.empty_like(cloth)
                for channel, base in enumerate(rgb):
                    colored[:, :, channel] = np.clip(base + variation, 0, 255)
                garment = Image.fromarray(np.uint8(colored), "RGB")
                garment = garment.resize((width, height), Image.Resampling.LANCZOS)
                result = Image.new("RGB", (480, 600), background)
                shadow = Image.new("L", (480, 600))
                shadow.paste(display_mask, (box[0] + 1, box[1] + 5))
                shadow = shadow.filter(ImageFilter.GaussianBlur(9))
                shadow = shadow.point(lambda value: int(value * .07))
                result.paste(Image.new("RGB", (480, 600), (64, 54, 48)),
                             (0, 0), shadow)
                if color_name == "blanco":
                    outline = Image.new("L", (480, 600))
                    outline.paste(display_mask.filter(ImageFilter.MaxFilter(3)),
                                  (box[0], box[1]))
                    outline = outline.point(lambda value: int(value * .21))
                    result.paste(Image.new("RGB", (480, 600), (158, 153, 148)),
                                 (0, 0), outline)
                result.paste(garment, (box[0], box[1]), display_mask)
                result.save(directory / f"{fit}-{side}-{color_name}.webp",
                            quality=80, method=6)
    return len(list(directory.glob("*.webp")))

if __name__ == "__main__":
    result = build(Path("public_html/assets/mockups"))
    if result != 54:
        raise RuntimeError(f"Expected exactly 54 mockups, got {result}")
    print(f"Rebuilt {result} plain-shirt mockups")
