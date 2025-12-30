"""
Professional Madrasah Student ID Card Generator
Matches the exact sample design with:
- Front: Green curved header, circular photo, student details, signature area, red footer
- Back: Warning text, logo, madrasah info, validity dates
Uses PIL for proper Bengali text rendering with HarfBuzz-style shaping.
"""

import logging
import tempfile
import os
import base64
from io import BytesIO
from pathlib import Path
from datetime import datetime, timedelta
from reportlab.lib.units import inch, mm
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas as pdf_canvas
from reportlab.lib import colors
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.graphics.shapes import Drawing, Polygon
import qrcode
import requests as http_requests
from PIL import Image, ImageDraw, ImageFont

# Card dimensions (standard ID card size: 3.375" x 2.125")
CARD_WIDTH = 3.375 * inch
CARD_HEIGHT = 2.125 * inch

# Colors
GREEN_HEADER = colors.HexColor("#006400")
LIGHT_GREEN = colors.HexColor("#228B22")
LIGHT_BLUE = colors.HexColor("#87CEEB")
DARK_BLUE = colors.HexColor("#1E3A5F")
RED_FOOTER = colors.HexColor("#8B0000")
MAROON = colors.HexColor("#800000")


def register_fonts():
    """Register Bengali fonts - Noto Sans Bengali for proper Unicode rendering"""
    font_dir = Path(__file__).parent / "fonts"
    bengali_regular = font_dir / "NotoSansBengali-Regular.ttf"
    bengali_bold = font_dir / "NotoSansBengali-Bold.ttf"
    
    logging.info(f"Font registration - font_dir: {font_dir}, exists: {font_dir.exists()}")
    logging.info(f"Regular font: {bengali_regular}, exists: {bengali_regular.exists()}")
    
    try:
        if bengali_regular.exists() and "NotoSansBengali" not in pdfmetrics.getRegisteredFontNames():
            pdfmetrics.registerFont(TTFont("NotoSansBengali", str(bengali_regular)))
            logging.info("Registered NotoSansBengali font")
        if bengali_bold.exists() and "NotoSansBengali-Bold" not in pdfmetrics.getRegisteredFontNames():
            pdfmetrics.registerFont(TTFont("NotoSansBengali-Bold", str(bengali_bold)))
            logging.info("Registered NotoSansBengali-Bold font")
        logging.info(f"Registered fonts: {pdfmetrics.getRegisteredFontNames()}")
        return True
    except Exception as e:
        logging.warning(f"Could not register Bengali fonts: {e}")
        import traceback
        logging.warning(traceback.format_exc())
        return False


def use_font(c, size, bold=False):
    """Set font with fallback: NotoSansBengali > Helvetica"""
    font_name = "NotoSansBengali-Bold" if bold else "NotoSansBengali"
    if font_name in pdfmetrics.getRegisteredFontNames():
        c.setFont(font_name, size)
    else:
        c.setFont("Helvetica-Bold" if bold else "Helvetica", size)


def get_pil_font(size, bold=False):
    """Get PIL font for Bengali text rendering"""
    font_dir = Path(__file__).parent / "fonts"
    font_file = "NotoSansBengali-Bold.ttf" if bold else "NotoSansBengali-Regular.ttf"
    font_path = font_dir / font_file
    try:
        if font_path.exists():
            return ImageFont.truetype(str(font_path), size)
    except Exception as e:
        logging.warning(f"Could not load PIL font: {e}")
    return ImageFont.load_default()


def draw_bengali_text(c, x, y, text, font_size, color=(0, 0, 0), bold=False, centered=False, width=None):
    """Render Bengali text using PIL for proper complex script shaping, then embed as image in PDF"""
    if not text or not text.strip():
        return
    
    try:
        # Create PIL image for text with higher DPI for quality
        dpi_scale = 4  # Higher resolution for crisp text
        pil_font_size = int(font_size * dpi_scale)
        font = get_pil_font(pil_font_size, bold)
        
        # Calculate text size
        bbox = font.getbbox(text)
        text_width = bbox[2] - bbox[0]
        text_height = bbox[3] - bbox[1]
        
        # Create image with transparent background
        padding = 4 * dpi_scale
        img_width = int(text_width + padding * 2)
        img_height = int(text_height + padding * 2)
        img = Image.new('RGBA', (img_width, img_height), (255, 255, 255, 0))
        draw = ImageDraw.Draw(img)
        
        # Draw text
        draw.text((padding - bbox[0], padding - bbox[1]), text, font=font, fill=color + (255,))
        
        # Scale down for PDF embedding
        final_width = img_width / dpi_scale
        final_height = img_height / dpi_scale
        
        # Save to temp file
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".png")
        img.save(temp_file.name, 'PNG')
        temp_file.close()
        
        # Calculate x position for centering
        if centered and width:
            x = x + (width - final_width) / 2
        
        # Draw on canvas
        c.drawImage(temp_file.name, x, y - final_height + font_size * 0.3, 
                    final_width, final_height, mask='auto')
        
        # Cleanup
        os.unlink(temp_file.name)
        return final_width
        
    except Exception as e:
        logging.warning(f"PIL Bengali text render failed: {e}, falling back to direct text")
        # Fallback to direct text
        use_font(c, font_size, bold)
        if isinstance(color, tuple) and len(color) >= 3:
            c.setFillColor(colors.Color(color[0]/255, color[1]/255, color[2]/255))
        if centered and width:
            c.drawCentredString(x + width/2, y, text)
        else:
            c.drawString(x, y, text)
        return font_size * len(text) * 0.6


def draw_curved_header(c, width, height, header_height):
    """Draw green curved header background"""
    c.setFillColor(GREEN_HEADER)
    
    # Draw curved header using path
    p = c.beginPath()
    p.moveTo(0, height)
    p.lineTo(width, height)
    p.lineTo(width, height - header_height + 0.15*inch)
    
    # Curve at bottom of header
    p.curveTo(
        width * 0.75, height - header_height - 0.1*inch,
        width * 0.25, height - header_height + 0.25*inch,
        0, height - header_height + 0.1*inch
    )
    p.lineTo(0, height)
    p.close()
    c.drawPath(p, fill=True, stroke=False)


def draw_photo_frame(c, x, y, size, photo_url=None):
    """Draw circular photo frame with light blue border and circular clipping"""
    border_width = 3
    center_x = x + size/2
    center_y = y + size/2
    
    # Light blue circle border
    c.setFillColor(LIGHT_BLUE)
    c.circle(center_x, center_y, size/2 + border_width, fill=True, stroke=False)
    
    # White inner circle
    c.setFillColor(colors.white)
    c.circle(center_x, center_y, size/2, fill=True, stroke=False)
    
    # Try to add photo with circular clipping
    if photo_url:
        try:
            temp_file = None
            image_path = None
            
            if photo_url.startswith("data:image"):
                header_data, encoded = photo_url.split(",", 1)
                photo_data = base64.b64decode(encoded)
                temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".png")
                temp_file.write(photo_data)
                temp_file.close()
                image_path = temp_file.name
            elif photo_url.startswith("http"):
                response = http_requests.get(photo_url, timeout=5)
                if response.status_code == 200:
                    temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".png")
                    temp_file.write(response.content)
                    temp_file.close()
                    image_path = temp_file.name
            elif photo_url.startswith("/uploads"):
                local_path = Path(__file__).parent.parent / photo_url.lstrip("/")
                if not local_path.exists():
                    local_path = Path(__file__).parent / photo_url.lstrip("/")
                if local_path.exists():
                    image_path = str(local_path)
            
            if image_path:
                # Apply circular clipping mask using arc
                c.saveState()
                p = c.beginPath()
                # Draw arc for circular clipping (x1, y1, x2, y2 are bounding box, angles in degrees)
                radius = size/2 - 1
                p.arc(center_x - radius, center_y - radius, center_x + radius, center_y + radius, 0, 360)
                p.close()
                c.clipPath(p, stroke=0, fill=0)
                c.drawImage(image_path, x, y, size, size, preserveAspectRatio=True, mask='auto')
                c.restoreState()
            
            if temp_file and os.path.exists(temp_file.name):
                os.unlink(temp_file.name)
            return
                
        except Exception as e:
            logging.warning(f"Could not add photo: {e}")
    
    # Draw placeholder if no photo
    c.setFillColor(colors.lightgrey)
    c.circle(center_x, center_y, size/2 - 2, fill=True, stroke=False)


def get_logo_url(institution):
    """Get logo URL from institution data, checking multiple field names"""
    if not institution:
        return None
    return institution.get("logo") or institution.get("logo_url") or institution.get("institution_logo") or None


def get_institution_name(institution, lang="bn"):
    """Get institution name dynamically from settings - checks all common field names"""
    if not institution:
        logging.warning("ID Card: No institution data provided")
        return ""
    
    # Log available fields for debugging
    logging.info(f"ID Card institution fields: {list(institution.keys())}")
    
    if lang == "bn":
        result = (institution.get("name_bn") or institution.get("name") or 
                institution.get("institution_name") or institution.get("school_name") or "")
        logging.info(f"ID Card Bengali name: {result}")
        return result
    elif lang == "en":
        name = (institution.get("name_en") or institution.get("english_name") or 
                institution.get("institution_name_en") or institution.get("school_name") or 
                institution.get("name") or "")
        return name.upper() if name else ""
    elif lang == "ar":
        return (institution.get("name_ar") or institution.get("arabic_name") or 
                institution.get("institution_name_ar") or "")
    return institution.get("name", "") or institution.get("school_name", "")


def draw_logo(c, x, y, size, logo_url=None):
    """Draw institution logo"""
    if not logo_url:
        return False
    
    try:
        temp_file = None
        if logo_url.startswith("data:image"):
            header_data, encoded = logo_url.split(",", 1)
            logo_data = base64.b64decode(encoded)
            temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".png")
            temp_file.write(logo_data)
            temp_file.close()
            c.drawImage(temp_file.name, x, y, size, size, preserveAspectRatio=True, mask='auto')
        elif logo_url.startswith("http"):
            response = http_requests.get(logo_url, timeout=5)
            if response.status_code == 200:
                temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".png")
                temp_file.write(response.content)
                temp_file.close()
                c.drawImage(temp_file.name, x, y, size, size, preserveAspectRatio=True, mask='auto')
        elif logo_url.startswith("/uploads"):
            local_path = Path(__file__).parent.parent / logo_url.lstrip("/")
            if not local_path.exists():
                local_path = Path(__file__).parent / logo_url.lstrip("/")
            if local_path.exists():
                c.drawImage(str(local_path), x, y, size, size, preserveAspectRatio=True, mask='auto')
        
        if temp_file and os.path.exists(temp_file.name):
            os.unlink(temp_file.name)
        return True
    except Exception as e:
        logging.warning(f"Could not add logo: {e}")
        return False


def generate_front_side(c, student, institution, class_name=""):
    """Generate front side of ID card matching sample exactly"""
    header_height = 0.65 * inch
    
    # White background
    c.setFillColor(colors.white)
    c.rect(0, 0, CARD_WIDTH, CARD_HEIGHT, fill=True, stroke=False)
    
    # Draw curved green header
    draw_curved_header(c, CARD_WIDTH, CARD_HEIGHT, header_height)
    
    # Institution logo in header (left side)
    logo_size = 0.45 * inch
    logo_x = 0.08 * inch
    logo_y = CARD_HEIGHT - header_height + 0.1 * inch
    
    inst_logo = get_logo_url(institution)
    draw_logo(c, logo_x, logo_y, logo_size, inst_logo)
    
    # Header text using helper functions for proper fallbacks
    inst_name = get_institution_name(institution, "bn")
    inst_name_ar = get_institution_name(institution, "ar")
    inst_name_en = get_institution_name(institution, "en")
    inst_address = institution.get("address", "") if institution else ""
    
    text_start_x = logo_x + logo_size + 0.1 * inch
    header_text_width = CARD_WIDTH - text_start_x - 0.08 * inch
    
    # Arabic text at top (using PIL for proper rendering)
    draw_bengali_text(c, text_start_x, CARD_HEIGHT - 0.15 * inch, inst_name_ar, 
                      7, color=(255, 255, 255), bold=True, centered=True, width=header_text_width)
    
    # Bengali name (using PIL for proper rendering)
    draw_bengali_text(c, text_start_x, CARD_HEIGHT - 0.28 * inch, inst_name,
                      8, color=(144, 238, 144), bold=True, centered=True, width=header_text_width)
    
    # English name
    c.setFillColor(colors.white)
    c.setFont("Helvetica-Bold", 5)
    c.drawCentredString(text_start_x + header_text_width / 2, CARD_HEIGHT - 0.40 * inch, inst_name_en)
    
    # Address (using PIL for proper Bengali rendering)
    draw_bengali_text(c, text_start_x, CARD_HEIGHT - 0.52 * inch, inst_address,
                      5, color=(255, 255, 255), centered=True, width=header_text_width)
    
    # Student photo (circular with blue border)
    photo_size = 0.7 * inch
    photo_x = 0.15 * inch
    photo_y = CARD_HEIGHT - header_height - photo_size - 0.25 * inch
    
    photo_url = student.get("photo", "") or student.get("photo_url", "")
    draw_photo_frame(c, photo_x, photo_y, photo_size, photo_url)
    
    # Student details (right side of photo) using PIL for proper Bengali
    details_x = photo_x + photo_size + 0.15 * inch
    details_y = CARD_HEIGHT - header_height - 0.25 * inch
    line_height = 0.14 * inch
    
    # Student name
    student_name = student.get("name", "")
    draw_bengali_text(c, details_x, details_y, f"মুহাঃ {student_name}", 8, color=(0, 0, 0), bold=True)
    details_y -= line_height
    
    # Father's name
    father_name = student.get("father_name", "") or student.get("guardian_name", "")
    draw_bengali_text(c, details_x, details_y, f"পিতার নাম : {father_name}", 6, color=(0, 0, 0))
    details_y -= line_height
    
    # Class/Division
    draw_bengali_text(c, details_x, details_y, f"শ্রেণি/বিভাগ : {class_name}", 6, color=(0, 0, 0))
    details_y -= line_height
    
    # Address
    student_address = student.get("address", "")
    if len(student_address) > 30:
        student_address = student_address[:27] + "..."
    draw_bengali_text(c, details_x, details_y, f"ঠিকানা : {student_address}", 6, color=(0, 0, 0))
    details_y -= line_height
    
    # Mobile
    mobile = student.get("mobile", "") or student.get("guardian_phone", "")
    draw_bengali_text(c, details_x, details_y, f"মোবাইল : {mobile}", 6, color=(0, 0, 0))
    details_y -= line_height
    
    # ID No
    admission_no = student.get("admission_no", "") or student.get("roll_no", "")
    draw_bengali_text(c, details_x, details_y, f"আইডি নং: {admission_no}", 6, color=(0, 0, 0), bold=True)
    
    # Signature area (bottom left)
    sig_y = 0.35 * inch
    c.setStrokeColor(colors.black)
    c.setLineWidth(0.5)
    c.line(photo_x, sig_y, photo_x + 1.0 * inch, sig_y)
    draw_bengali_text(c, photo_x, sig_y - 0.1 * inch, "মুহতামিমের স্বাক্ষর", 5, color=(0, 0, 0), 
                      centered=True, width=1.0 * inch)
    
    # Red footer
    footer_height = 0.22 * inch
    c.setFillColor(MAROON)
    c.rect(0, 0, CARD_WIDTH, footer_height, fill=True, stroke=False)
    
    c.setFillColor(colors.white)
    c.setFont("Helvetica-Bold", 10)
    c.drawCentredString(CARD_WIDTH / 2, footer_height / 2 - 0.03 * inch, "S T U D E N T   C A R D")


def generate_back_side(c, student, institution):
    """Generate back side of ID card matching sample exactly with PIL Bengali rendering"""
    # White background
    c.setFillColor(colors.white)
    c.rect(0, 0, CARD_WIDTH, CARD_HEIGHT, fill=True, stroke=False)
    
    # Warning text at top - split into two lines
    warning_line1 = "এই কার্ডটি ব্যবহারকারী ব্যতিত অন্য কেউ পেলে"
    warning_line2 = "মাদরাসার ঠিকানায় পৌঁছে দেওয়ার জন্য অনুরোধ করা গেল।"
    
    y_pos = CARD_HEIGHT - 0.15 * inch
    draw_bengali_text(c, 0, y_pos, warning_line1, 6, color=(0, 0, 0), centered=True, width=CARD_WIDTH)
    y_pos -= 0.12 * inch
    draw_bengali_text(c, 0, y_pos, warning_line2, 6, color=(0, 0, 0), centered=True, width=CARD_WIDTH)
    
    # Logo in center
    logo_size = 0.6 * inch
    logo_x = (CARD_WIDTH - logo_size) / 2
    logo_y = CARD_HEIGHT / 2 - 0.1 * inch
    
    inst_logo = get_logo_url(institution)
    draw_logo(c, logo_x, logo_y, logo_size, inst_logo)
    
    # Institution name below logo using helper functions
    inst_name = get_institution_name(institution, "bn")
    inst_address = institution.get("address", "") if institution else ""
    inst_mobile = ""
    if institution:
        inst_mobile = institution.get("phone", "") or institution.get("mobile", "") or institution.get("contact_phone", "")
    
    draw_bengali_text(c, 0, logo_y - 0.1 * inch, inst_name, 7, color=(0, 0, 0), bold=True, 
                      centered=True, width=CARD_WIDTH)
    
    address_line = f"{inst_address}। মোবা: {inst_mobile}" if inst_mobile else inst_address
    draw_bengali_text(c, 0, logo_y - 0.22 * inch, address_line, 5, color=(0, 0, 0), 
                      centered=True, width=CARD_WIDTH)
    
    # Red box with terms
    box_y = 0.5 * inch
    box_height = 0.25 * inch
    box_margin = 0.1 * inch
    
    c.setFillColor(colors.HexColor("#FFE4E1"))  # Light red background
    c.rect(box_margin, box_y, CARD_WIDTH - 2*box_margin, box_height, fill=True, stroke=False)
    
    terms_text = "রাষ্ট্রদ্রোহী কাজে জড়িত না থাকার শর্তে অধ্যয়নকালীন সময়ের জন্য প্রযোজ্য।"
    draw_bengali_text(c, box_margin, box_y + box_height/2 - 0.02*inch, terms_text, 5, 
                      color=(128, 0, 0), centered=True, width=CARD_WIDTH - 2*box_margin)
    
    # Signature line (left)
    sig_x = 0.15 * inch
    sig_y = 0.25 * inch
    c.setStrokeColor(colors.black)
    c.setLineWidth(0.5)
    c.line(sig_x, sig_y, sig_x + 0.8 * inch, sig_y)
    
    # Issue and validity dates (right)
    dates_x = CARD_WIDTH / 2 + 0.2 * inch
    
    # Calculate dates
    issue_date = datetime.now()
    validity_date = issue_date + timedelta(days=730)  # 2 years validity
    
    issue_str = issue_date.strftime("%d/%m/%Y")
    validity_str = validity_date.strftime("%d/%m/%Y")
    
    draw_bengali_text(c, dates_x, sig_y + 0.12 * inch, f"ইস্যু তারিখ: {issue_str} ইং", 5, color=(0, 0, 0))
    draw_bengali_text(c, dates_x, sig_y, f"মেয়াদ কালঃ {validity_str} ইং", 5, color=(0, 0, 0))


def generate_student_id_card_pdf(student: dict, institution: dict, class_name: str = "") -> BytesIO:
    """Generate complete ID card PDF with front and back"""
    register_fonts()
    
    buffer = BytesIO()
    c = pdf_canvas.Canvas(buffer, pagesize=(CARD_WIDTH, CARD_HEIGHT))
    
    # Front side
    generate_front_side(c, student, institution, class_name)
    c.showPage()
    
    # Back side
    generate_back_side(c, student, institution)
    c.showPage()
    
    c.save()
    buffer.seek(0)
    return buffer
