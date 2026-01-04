# bengali_text_helper.py
# ---------------------------------------------
# Bangla-safe PDF text rendering helper
# Works with ReportLab (Unicode + conjunct safe)
# Uses PIL for proper Bengali text shaping
# ---------------------------------------------

import os
from PIL import Image, ImageDraw, ImageFont
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import Paragraph
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER

# ------------------------------------------------
# FONT REGISTRATION
# ------------------------------------------------

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FONT_DIR = os.path.join(BASE_DIR, "fonts")

REGULAR_FONT_PATH = os.path.join(FONT_DIR, "NotoSansBengali-Regular.ttf")
BOLD_FONT_PATH = os.path.join(FONT_DIR, "NotoSansBengali-Bold.ttf")

_FONTS_REGISTERED = False


def register_bengali_fonts():
    """
    Register Bangla Unicode fonts for ReportLab.
    Must be called BEFORE drawing any Bangla text.
    """
    global _FONTS_REGISTERED

    if _FONTS_REGISTERED:
        return

    if not os.path.exists(REGULAR_FONT_PATH):
        raise FileNotFoundError(f"Bangla font not found: {REGULAR_FONT_PATH}")

    if not os.path.exists(BOLD_FONT_PATH):
        raise FileNotFoundError(f"Bangla font not found: {BOLD_FONT_PATH}")

    pdfmetrics.registerFont(TTFont("BN", REGULAR_FONT_PATH))
    pdfmetrics.registerFont(TTFont("BN-Bold", BOLD_FONT_PATH))

    _FONTS_REGISTERED = True


# ------------------------------------------------
# INTERNAL STYLE FACTORY
# ------------------------------------------------


def _get_bn_style(font_size=9, bold=False, align="left"):
    alignment = TA_LEFT if align == "left" else TA_CENTER

    return ParagraphStyle(name="BanglaStyle",
                          fontName="BN-Bold" if bold else "BN",
                          fontSize=font_size,
                          leading=font_size + 2,
                          alignment=alignment,
                          wordWrap="LTR",
                          splitLongWords=False,
                          spaceBefore=0,
                          spaceAfter=0)


# ------------------------------------------------
# MAIN TEXT DRAW FUNCTION (USE THIS EVERYWHERE)
# ------------------------------------------------


def draw_bn_text(canvas,
                 text,
                 x,
                 y,
                 width=200,
                 font_size=9,
                 bold=False,
                 align="left"):
    """
    Draw Bangla text safely on ReportLab canvas.

    Args:
        canvas      : ReportLab canvas
        text        : Bangla text (string)
        x, y        : Position (bottom-left)
        width       : Max width (points)
        font_size   : Font size
        bold        : Boolean
        align       : "left" or "center"
    """

    if not text:
        return

    register_bengali_fonts()

    style = _get_bn_style(font_size=font_size, bold=bold, align=align)

    # Convert to string safely
    text = str(text)

    paragraph = Paragraph(text, style)
    paragraph.wrapOn(canvas, width, 100)
    paragraph.drawOn(canvas, x, y)


# ------------------------------------------------
# MULTI-LINE BANGLA BLOCK (RULES / NOTES)
# ------------------------------------------------


def draw_bn_multiline(canvas,
                      text,
                      x,
                      y,
                      width=200,
                      font_size=8,
                      align="left"):
    """
    Draw multi-line Bangla paragraph safely.
    Use ONLY when wrapping is required.
    """

    if not text:
        return

    register_bengali_fonts()

    style = ParagraphStyle(name="BanglaMultiline",
                           fontName="BN",
                           fontSize=font_size,
                           leading=font_size + 3,
                           alignment=TA_LEFT if align == "left" else TA_CENTER,
                           wordWrap="LTR")

    paragraph = Paragraph(text, style)
    w, h = paragraph.wrap(width, 500)
    paragraph.drawOn(canvas, x, y - h)


# ------------------------------------------------
# SAFE TRUNCATION (OPTIONAL)
# ------------------------------------------------


def truncate_text(text, max_length=30):
    """
    Truncate text safely (no Bangla break).
    """
    if not text:
        return ""

    text = str(text)
    return text if len(text) <= max_length else text[:max_length] + "…"


# ------------------------------------------------
# PIL-BASED BENGALI TEXT RENDERING (FOR PDF HEADERS)
# ------------------------------------------------


def render_bengali_text_to_image(text, font_size=16, color=(0, 0, 0), bold=False):
    """
    Render Bengali text to a PIL Image using proper text shaping.
    This ensures proper conjunct rendering that ReportLab can't handle.

    Args:
        text      : Bengali text string
        font_size : Font size in pixels
        color     : RGB tuple for text color (e.g., (0, 0, 0) for black)
        bold      : Use bold font variant

    Returns:
        PIL Image object with transparent background
    """
    if not text:
        text = ""

    text = str(text)

    # Select font
    font_path = BOLD_FONT_PATH if bold else REGULAR_FONT_PATH

    if not os.path.exists(font_path):
        font_path = REGULAR_FONT_PATH
        if not os.path.exists(font_path):
            raise FileNotFoundError(f"Bengali font not found: {font_path}")

    try:
        font = ImageFont.truetype(font_path, font_size)
    except Exception as e:
        raise RuntimeError(f"Failed to load font: {e}")

    # Calculate text size
    dummy_img = Image.new("RGBA", (1, 1), (255, 255, 255, 0))
    dummy_draw = ImageDraw.Draw(dummy_img)

    bbox = dummy_draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]

    # Add padding
    padding_x = 10
    padding_y = 5
    img_width = text_width + 2 * padding_x
    img_height = text_height + 2 * padding_y

    # Ensure minimum size and convert to int
    img_width = int(max(img_width, 10))
    img_height = int(max(img_height, 10))

    # Create transparent image
    img = Image.new("RGBA", (img_width, img_height), (255, 255, 255, 0))
    draw = ImageDraw.Draw(img)

    # Draw text with proper color
    if isinstance(color, tuple) and len(color) == 3:
        color = color + (255,)  # Add alpha

    # Adjust position to account for bbox offset
    x_offset = padding_x - bbox[0]
    y_offset = padding_y - bbox[1]

    draw.text((x_offset, y_offset), text, font=font, fill=color)

    return img


def render_bengali_paragraph_to_image(text, font_size=12, color=(0, 0, 0), max_width=400, bold=False):
    """
    Render multi-line Bengali text to a PIL Image with word wrapping.

    Args:
        text       : Bengali text string
        font_size  : Font size in pixels
        color      : RGB tuple for text color
        max_width  : Maximum width in pixels before wrapping
        bold       : Use bold font variant

    Returns:
        PIL Image object with transparent background
    """
    if not text:
        text = ""

    text = str(text)

    # Select font
    font_path = BOLD_FONT_PATH if bold else REGULAR_FONT_PATH

    if not os.path.exists(font_path):
        raise FileNotFoundError(f"Bengali font not found: {font_path}")

    try:
        font = ImageFont.truetype(font_path, font_size)
    except Exception as e:
        raise RuntimeError(f"Failed to load font: {e}")

    # Word wrap
    words = text.split(' ')
    lines = []
    current_line = ""

    dummy_img = Image.new("RGBA", (1, 1), (255, 255, 255, 0))
    dummy_draw = ImageDraw.Draw(dummy_img)

    for word in words:
        test_line = current_line + " " + word if current_line else word
        bbox = dummy_draw.textbbox((0, 0), test_line, font=font)
        test_width = bbox[2] - bbox[0]

        if test_width <= max_width:
            current_line = test_line
        else:
            if current_line:
                lines.append(current_line)
            current_line = word

    if current_line:
        lines.append(current_line)

    if not lines:
        lines = [""]

    # Calculate dimensions
    line_height = font_size + 4
    total_height = len(lines) * line_height
    
    padding_x = 10
    padding_y = 5
    img_width = max_width + 2 * padding_x
    img_height = total_height + 2 * padding_y

    # Create image
    img = Image.new("RGBA", (img_width, img_height), (255, 255, 255, 0))
    draw = ImageDraw.Draw(img)

    if isinstance(color, tuple) and len(color) == 3:
        color = color + (255,)

    y = padding_y
    for line in lines:
        draw.text((padding_x, y), line, font=font, fill=color)
        y += line_height

    return img
