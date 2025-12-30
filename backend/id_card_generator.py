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

# Card dimensions - PORTRAIT orientation (standard ID card: 54mm x 86mm)
# Portrait: Width < Height (vertical card)
CARD_WIDTH = 54 * mm   # ~2.125 inches
CARD_HEIGHT = 86 * mm  # ~3.375 inches

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
    """Draw green curved header background - optimized for portrait layout"""
    c.setFillColor(GREEN_HEADER)
    
    # Draw curved header using path
    p = c.beginPath()
    p.moveTo(0, height)
    p.lineTo(width, height)
    p.lineTo(width, height - header_height + 3*mm)
    
    # Gentle curve at bottom of header for portrait
    p.curveTo(
        width * 0.75, height - header_height - 2*mm,
        width * 0.25, height - header_height + 4*mm,
        0, height - header_height + 2*mm
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
    """Generate front side of ID card - PORTRAIT orientation (54mm x 86mm)"""
    margin = 2 * mm
    header_height = 24 * mm  # Taller header for logo + text
    
    # White background
    c.setFillColor(colors.white)
    c.rect(0, 0, CARD_WIDTH, CARD_HEIGHT, fill=True, stroke=False)
    
    # Draw curved green header at top
    draw_curved_header(c, CARD_WIDTH, CARD_HEIGHT, header_height)
    
    # Institution logo centered at top of header
    logo_size = 10 * mm
    logo_x = (CARD_WIDTH - logo_size) / 2
    logo_y = CARD_HEIGHT - 11 * mm
    
    inst_logo = get_logo_url(institution)
    draw_logo(c, logo_x, logo_y, logo_size, inst_logo)
    
    # Get institution names from School Branding
    inst_name = get_institution_name(institution, "bn")
    inst_name_ar = get_institution_name(institution, "ar") 
    inst_name_en = get_institution_name(institution, "en")
    
    # Institution name INSIDE header (YELLOW for visibility on green)
    # Position at y = CARD_HEIGHT - 20mm which is above header bottom (CARD_HEIGHT - 24mm)
    text_y = CARD_HEIGHT - 20 * mm
    if inst_name:
        draw_bengali_text(c, 0, text_y, inst_name, 6, color=(255, 255, 0), bold=True, 
                          centered=True, width=CARD_WIDTH)
    elif inst_name_en:
        c.setFillColor(colors.yellow)
        c.setFont("Helvetica-Bold", 6)
        c.drawCentredString(CARD_WIDTH / 2, text_y, inst_name_en)
    
    # Student photo (circular with blue border) - centered
    photo_size = 18 * mm
    photo_x = (CARD_WIDTH - photo_size) / 2
    photo_y = CARD_HEIGHT - header_height - photo_size - 2 * mm
    
    photo_url = student.get("photo", "") or student.get("photo_url", "")
    draw_photo_frame(c, photo_x, photo_y, photo_size, photo_url)
    
    # Student details below photo
    details_x = margin + 1 * mm
    details_y = photo_y - 3 * mm
    line_height = 3.5 * mm
    
    # Student name (centered, bold)
    student_name = student.get("name", "")
    draw_bengali_text(c, 0, details_y, student_name, 7, color=(0, 0, 0), bold=True,
                      centered=True, width=CARD_WIDTH)
    details_y -= line_height + 1 * mm
    
    # Father's name
    father_name = student.get("father_name", "") or student.get("guardian_name", "")
    draw_bengali_text(c, details_x, details_y, f"পিতা: {father_name}", 5, color=(0, 0, 0))
    details_y -= line_height
    
    # Class/Division
    draw_bengali_text(c, details_x, details_y, f"শ্রেণি: {class_name}", 5, color=(0, 0, 0))
    details_y -= line_height
    
    # ID No
    admission_no = student.get("admission_no", "") or student.get("roll_no", "")
    draw_bengali_text(c, details_x, details_y, f"আইডি: {admission_no}", 5, color=(0, 0, 0), bold=True)
    
    # Signature area above footer
    sig_y = 10 * mm
    sig_width = 20 * mm
    sig_x = (CARD_WIDTH - sig_width) / 2
    c.setStrokeColor(colors.black)
    c.setLineWidth(0.5)
    c.line(sig_x, sig_y, sig_x + sig_width, sig_y)
    draw_bengali_text(c, 0, sig_y - 3 * mm, "মুহতামিমের স্বাক্ষর", 4, color=(0, 0, 0), 
                      centered=True, width=CARD_WIDTH)
    
    # Red footer
    footer_height = 5 * mm
    c.setFillColor(MAROON)
    c.rect(0, 0, CARD_WIDTH, footer_height, fill=True, stroke=False)
    
    c.setFillColor(colors.white)
    c.setFont("Helvetica-Bold", 6)
    c.drawCentredString(CARD_WIDTH / 2, footer_height / 2 - 1 * mm, "STUDENT CARD")


def generate_back_side(c, student, institution):
    """Generate back side of ID card - PORTRAIT orientation with PIL Bengali rendering"""
    margin = 2 * mm
    
    # White background
    c.setFillColor(colors.white)
    c.rect(0, 0, CARD_WIDTH, CARD_HEIGHT, fill=True, stroke=False)
    
    # Warning text at top - split into lines that fit
    warning_line1 = "এই কার্ডটি ব্যবহারকারী ব্যতিত"
    warning_line2 = "অন্য কেউ পেলে মাদরাসার ঠিকানায়"
    warning_line3 = "পৌঁছে দেওয়ার অনুরোধ রইল।"
    
    y_pos = CARD_HEIGHT - 4 * mm
    draw_bengali_text(c, 0, y_pos, warning_line1, 5, color=(0, 0, 0), centered=True, width=CARD_WIDTH)
    y_pos -= 3.5 * mm
    draw_bengali_text(c, 0, y_pos, warning_line2, 5, color=(0, 0, 0), centered=True, width=CARD_WIDTH)
    y_pos -= 3.5 * mm
    draw_bengali_text(c, 0, y_pos, warning_line3, 5, color=(0, 0, 0), centered=True, width=CARD_WIDTH)
    
    # Logo in center
    logo_size = 15 * mm
    logo_x = (CARD_WIDTH - logo_size) / 2
    logo_y = CARD_HEIGHT / 2 + 2 * mm
    
    inst_logo = get_logo_url(institution)
    draw_logo(c, logo_x, logo_y, logo_size, inst_logo)
    
    # Institution name below logo
    inst_name = get_institution_name(institution, "bn")
    inst_address = institution.get("address", "") if institution else ""
    inst_mobile = ""
    if institution:
        inst_mobile = institution.get("phone", "") or institution.get("mobile", "") or institution.get("contact_phone", "")
    
    draw_bengali_text(c, 0, logo_y - 3 * mm, inst_name, 6, color=(0, 0, 0), bold=True, 
                      centered=True, width=CARD_WIDTH)
    
    # Address with mobile
    if inst_address or inst_mobile:
        address_line = ""
        if inst_address:
            address_line = inst_address[:20] + "..." if len(inst_address) > 20 else inst_address
        if inst_mobile:
            if address_line:
                address_line = f"{address_line}"
            draw_bengali_text(c, 0, logo_y - 10 * mm, f"মোবা: {inst_mobile}", 5, color=(0, 0, 0), 
                              centered=True, width=CARD_WIDTH)
        if address_line:
            draw_bengali_text(c, 0, logo_y - 7 * mm, address_line, 5, color=(0, 0, 0), 
                              centered=True, width=CARD_WIDTH)
    
    # Terms text in red box
    box_y = 12 * mm
    box_height = 8 * mm
    box_margin = 2 * mm
    
    c.setFillColor(colors.HexColor("#FFE4E1"))  # Light red background
    c.rect(box_margin, box_y, CARD_WIDTH - 2*box_margin, box_height, fill=True, stroke=False)
    
    terms_line1 = "অধ্যয়নকালীন সময়ের জন্য"
    terms_line2 = "প্রযোজ্য।"
    draw_bengali_text(c, box_margin, box_y + 5 * mm, terms_line1, 5, 
                      color=(128, 0, 0), centered=True, width=CARD_WIDTH - 2*box_margin)
    draw_bengali_text(c, box_margin, box_y + 2 * mm, terms_line2, 5, 
                      color=(128, 0, 0), centered=True, width=CARD_WIDTH - 2*box_margin)
    
    # Issue and validity dates at bottom
    issue_date = datetime.now()
    validity_date = issue_date + timedelta(days=730)  # 2 years validity
    
    issue_str = issue_date.strftime("%d/%m/%Y")
    validity_str = validity_date.strftime("%d/%m/%Y")
    
    draw_bengali_text(c, 0, 7 * mm, f"ইস্যু: {issue_str}", 5, color=(0, 0, 0), centered=True, width=CARD_WIDTH)
    draw_bengali_text(c, 0, 3 * mm, f"মেয়াদ: {validity_str}", 5, color=(0, 0, 0), centered=True, width=CARD_WIDTH)


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
