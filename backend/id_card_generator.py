"""
Professional Madrasah Student ID Card Generator
Matches the exact sample design with:
- Front: Green curved header, circular photo, student details, signature area, red footer
- Back: Warning text, logo, madrasah info, validity dates
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
    
    try:
        if bengali_regular.exists() and "NotoSansBengali" not in pdfmetrics.getRegisteredFontNames():
            pdfmetrics.registerFont(TTFont("NotoSansBengali", str(bengali_regular)))
        if bengali_bold.exists() and "NotoSansBengali-Bold" not in pdfmetrics.getRegisteredFontNames():
            pdfmetrics.registerFont(TTFont("NotoSansBengali-Bold", str(bengali_bold)))
        return True
    except Exception as e:
        logging.warning(f"Could not register Bengali fonts: {e}")
        return False


def use_font(c, size, bold=False):
    """Set font with fallback: NotoSansBengali > Helvetica"""
    font_name = "NotoSansBengali-Bold" if bold else "NotoSansBengali"
    if font_name in pdfmetrics.getRegisteredFontNames():
        c.setFont(font_name, size)
    else:
        c.setFont("Helvetica-Bold" if bold else "Helvetica", size)


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
    """Get institution name dynamically from settings - NO hardcoded fallbacks"""
    if not institution:
        return ""
    
    if lang == "bn":
        return (institution.get("name_bn") or institution.get("name") or 
                institution.get("institution_name") or institution.get("school_name") or "")
    elif lang == "en":
        name = (institution.get("name_en") or institution.get("english_name") or 
                institution.get("institution_name_en") or "")
        return name.upper() if name else ""
    elif lang == "ar":
        return (institution.get("name_ar") or institution.get("arabic_name") or 
                institution.get("institution_name_ar") or "")
    return institution.get("name", "")


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
    text_center_x = (text_start_x + CARD_WIDTH) / 2
    
    # Arabic text at top
    c.setFillColor(colors.white)
    use_font(c, 7, bold=True)
    c.drawCentredString(text_center_x, CARD_HEIGHT - 0.15 * inch, inst_name_ar)
    
    # Bengali name
    c.setFillColor(colors.HexColor("#90EE90"))  # Light green
    use_font(c, 8, bold=True)
    c.drawCentredString(text_center_x, CARD_HEIGHT - 0.28 * inch, inst_name)
    
    # English name
    c.setFillColor(colors.white)
    c.setFont("Helvetica-Bold", 5)
    c.drawCentredString(text_center_x, CARD_HEIGHT - 0.40 * inch, inst_name_en)
    
    # Address
    use_font(c, 5)
    c.drawCentredString(text_center_x, CARD_HEIGHT - 0.52 * inch, inst_address)
    
    # Student photo (circular with blue border)
    photo_size = 0.7 * inch
    photo_x = 0.15 * inch
    photo_y = CARD_HEIGHT - header_height - photo_size - 0.25 * inch
    
    photo_url = student.get("photo", "") or student.get("photo_url", "")
    draw_photo_frame(c, photo_x, photo_y, photo_size, photo_url)
    
    # Student details (right side of photo)
    details_x = photo_x + photo_size + 0.15 * inch
    details_y = CARD_HEIGHT - header_height - 0.25 * inch
    line_height = 0.14 * inch
    
    c.setFillColor(colors.black)
    
    # Student name
    student_name = student.get("name", "")
    use_font(c, 8, bold=True)
    c.drawString(details_x, details_y, f"মুহাঃ {student_name}")
    details_y -= line_height
    
    # Father's name
    father_name = student.get("father_name", "") or student.get("guardian_name", "")
    use_font(c, 6)
    c.drawString(details_x, details_y, f"পিতার নাম : {father_name}")
    details_y -= line_height
    
    # Class/Division
    use_font(c, 6)
    c.drawString(details_x, details_y, f"শ্রেণি/বিভাগ : {class_name}")
    details_y -= line_height
    
    # Address
    student_address = student.get("address", "")
    use_font(c, 6)
    # Truncate if too long
    if len(student_address) > 30:
        student_address = student_address[:27] + "..."
    c.drawString(details_x, details_y, f"ঠিকানা : {student_address}")
    details_y -= line_height
    
    # Mobile
    mobile = student.get("mobile", "") or student.get("guardian_phone", "")
    use_font(c, 6)
    c.drawString(details_x, details_y, f"মোবাইল : {mobile}")
    details_y -= line_height
    
    # ID No
    admission_no = student.get("admission_no", "") or student.get("roll_no", "")
    use_font(c, 6, bold=True)
    c.drawString(details_x, details_y, f"আইডি নং: {admission_no}")
    
    # Signature area (bottom left)
    sig_y = 0.35 * inch
    c.setStrokeColor(colors.black)
    c.setLineWidth(0.5)
    c.line(photo_x, sig_y, photo_x + 1.0 * inch, sig_y)
    use_font(c, 5)
    c.setFillColor(colors.black)
    c.drawCentredString(photo_x + 0.5 * inch, sig_y - 0.1 * inch, "মুহতামিমের স্বাক্ষর")
    
    # Red footer
    footer_height = 0.22 * inch
    c.setFillColor(MAROON)
    c.rect(0, 0, CARD_WIDTH, footer_height, fill=True, stroke=False)
    
    c.setFillColor(colors.white)
    c.setFont("Helvetica-Bold", 10)
    c.drawCentredString(CARD_WIDTH / 2, footer_height / 2 - 0.03 * inch, "S T U D E N T   C A R D")


def generate_back_side(c, student, institution):
    """Generate back side of ID card matching sample exactly"""
    # White background
    c.setFillColor(colors.white)
    c.rect(0, 0, CARD_WIDTH, CARD_HEIGHT, fill=True, stroke=False)
    
    # Warning text at top
    warning_text = "এই কার্ডটি ব্যবহারকারী ব্যতিত অন্য কেউ পেলে মাদরাসার ঠিকানায় পৌঁছে দেওয়ার জন্য অনুরোধ করা গেল।"
    
    c.setFillColor(colors.black)
    use_font(c, 6)
    
    # Split warning text into lines
    y_pos = CARD_HEIGHT - 0.15 * inch
    words = warning_text.split()
    lines = []
    current_line = ""
    for word in words:
        if len(current_line + " " + word) < 35:
            current_line = (current_line + " " + word).strip()
        else:
            lines.append(current_line)
            current_line = word
    if current_line:
        lines.append(current_line)
    
    for line in lines:
        c.drawCentredString(CARD_WIDTH / 2, y_pos, line)
        y_pos -= 0.12 * inch
    
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
    
    c.setFillColor(colors.black)
    use_font(c, 7, bold=True)
    c.drawCentredString(CARD_WIDTH / 2, logo_y - 0.1 * inch, inst_name)
    
    use_font(c, 5)
    address_line = f"{inst_address}। মোবা: {inst_mobile}" if inst_mobile else inst_address
    c.drawCentredString(CARD_WIDTH / 2, logo_y - 0.22 * inch, address_line)
    
    # Red box with terms
    box_y = 0.5 * inch
    box_height = 0.25 * inch
    box_margin = 0.1 * inch
    
    c.setFillColor(colors.HexColor("#FFE4E1"))  # Light red background
    c.rect(box_margin, box_y, CARD_WIDTH - 2*box_margin, box_height, fill=True, stroke=False)
    
    c.setFillColor(MAROON)
    use_font(c, 5)
    terms_text = "রাষ্ট্রদ্রোহী কাজে জড়িত না থাকার শর্তে অধ্যয়নকালীন সময়ের জন্য প্রযোজ্য।"
    c.drawCentredString(CARD_WIDTH / 2, box_y + box_height/2 - 0.02*inch, terms_text)
    
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
    
    c.setFillColor(colors.black)
    use_font(c, 5)
    c.drawString(dates_x, sig_y + 0.12 * inch, f"ইস্যু তারিখ: {issue_str} ইং")
    c.drawString(dates_x, sig_y, f"মেয়াদ কালঃ {validity_str} ইং")


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
