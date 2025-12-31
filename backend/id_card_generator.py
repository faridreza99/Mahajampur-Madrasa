"""
Professional Madrasah Student ID Card Generator
PORTRAIT orientation: 54mm x 86mm (standard PVC card)
Uses ReportLab native TTF rendering for proper Bengali text (no PIL required)
"""

import logging
import tempfile
import os
import base64
from io import BytesIO
from pathlib import Path
from datetime import datetime, timedelta
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas as pdf_canvas
from reportlab.lib import colors
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
import qrcode
import requests as http_requests
from PIL import Image

# Card dimensions - PORTRAIT orientation (standard ID card: 54mm x 86mm)
CARD_WIDTH = 54 * mm   # ~2.125 inches
CARD_HEIGHT = 86 * mm  # ~3.375 inches

# Colors
GREEN_HEADER = colors.HexColor("#006400")
LIGHT_GREEN = colors.HexColor("#228B22")
RED_FOOTER = colors.HexColor("#8B0000")
MAROON = colors.HexColor("#800000")
WHITE = colors.white
BLACK = colors.black


def register_fonts():
    """Register Bengali fonts - Noto Sans Bengali for proper Unicode rendering"""
    font_dir = Path(__file__).parent / "fonts"
    bengali_regular = font_dir / "NotoSansBengali-Regular.ttf"
    bengali_bold = font_dir / "NotoSansBengali-Bold.ttf"
    
    try:
        if bengali_regular.exists() and "NotoSansBengali" not in pdfmetrics.getRegisteredFontNames():
            pdfmetrics.registerFont(TTFont("NotoSansBengali", str(bengali_regular)))
            logging.info("Registered NotoSansBengali font")
        if bengali_bold.exists() and "NotoSansBengali-Bold" not in pdfmetrics.getRegisteredFontNames():
            pdfmetrics.registerFont(TTFont("NotoSansBengali-Bold", str(bengali_bold)))
            logging.info("Registered NotoSansBengali-Bold font")
        return True
    except Exception as e:
        logging.warning(f"Could not register Bengali fonts: {e}")
        return False


def use_font(c, size, bold=False):
    """Set Bengali font with fallback"""
    font_name = "NotoSansBengali-Bold" if bold else "NotoSansBengali"
    if font_name in pdfmetrics.getRegisteredFontNames():
        c.setFont(font_name, size)
    else:
        c.setFont("Helvetica-Bold" if bold else "Helvetica", size)


def draw_text(c, x, y, text, size, bold=False, color=BLACK, centered=False, width=None, max_chars=None):
    """Draw text with proper Bengali support using ReportLab native rendering"""
    if not text:
        return
    
    text = str(text).strip()
    
    # Truncate if needed
    if max_chars and len(text) > max_chars:
        text = text[:max_chars-1] + "…"
    
    use_font(c, size, bold)
    c.setFillColor(color)
    
    if centered and width:
        text_width = c.stringWidth(text, c._fontname, size)
        x = x + (width - text_width) / 2
    
    c.drawString(x, y, text)


def draw_centered_text(c, y, text, size, bold=False, color=BLACK, max_chars=None):
    """Draw horizontally centered text"""
    if not text:
        return
    
    text = str(text).strip()
    if max_chars and len(text) > max_chars:
        text = text[:max_chars-1] + "…"
    
    use_font(c, size, bold)
    c.setFillColor(color)
    text_width = c.stringWidth(text, c._fontname, size)
    x = (CARD_WIDTH - text_width) / 2
    c.drawString(x, y, text)


def get_institution_name(institution, lang="bn"):
    """Get institution name dynamically from settings"""
    if not institution:
        return ""
    
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
            logo_path = temp_file.name
        elif logo_url.startswith(("http://", "https://")):
            response = http_requests.get(logo_url, timeout=5)
            if response.status_code == 200:
                temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".png")
                temp_file.write(response.content)
                temp_file.close()
                logo_path = temp_file.name
            else:
                return False
        else:
            logo_path = logo_url
            
        c.drawImage(logo_path, x, y, size, size, mask='auto', preserveAspectRatio=True)
        
        if temp_file:
            os.unlink(temp_file.name)
        return True
    except Exception as e:
        logging.warning(f"Could not draw logo: {e}")
        return False


def draw_photo(c, x, y, width, height, photo_url, circular=True):
    """Draw student photo with optional circular mask"""
    temp_file = None
    
    try:
        if not photo_url:
            # Draw placeholder circle
            c.setStrokeColor(colors.gray)
            c.setFillColor(colors.HexColor("#E0E0E0"))
            if circular:
                c.circle(x + width/2, y + height/2, width/2, fill=1, stroke=1)
            else:
                c.rect(x, y, width, height, fill=1, stroke=1)
            return
        
        # Load photo
        if photo_url.startswith("data:image"):
            header_data, encoded = photo_url.split(",", 1)
            photo_data = base64.b64decode(encoded)
            temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".png")
            temp_file.write(photo_data)
            temp_file.close()
            photo_path = temp_file.name
        elif photo_url.startswith(("http://", "https://")):
            response = http_requests.get(photo_url, timeout=5)
            if response.status_code == 200:
                temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".png")
                temp_file.write(response.content)
                temp_file.close()
                photo_path = temp_file.name
            else:
                draw_photo(c, x, y, width, height, None, circular)
                return
        else:
            photo_path = photo_url
        
        if circular:
            # Create circular mask
            img = Image.open(photo_path)
            img = img.convert("RGBA")
            size = min(img.size)
            mask = Image.new("L", (size, size), 0)
            from PIL import ImageDraw
            draw = ImageDraw.Draw(mask)
            draw.ellipse((0, 0, size, size), fill=255)
            
            # Center crop to square
            left = (img.width - size) // 2
            top = (img.height - size) // 2
            img = img.crop((left, top, left + size, top + size))
            
            # Apply circular mask
            output = Image.new("RGBA", (size, size), (255, 255, 255, 0))
            output.paste(img, (0, 0), mask)
            
            # Save processed image
            processed_file = tempfile.NamedTemporaryFile(delete=False, suffix=".png")
            output.save(processed_file.name, "PNG")
            processed_file.close()
            
            c.drawImage(processed_file.name, x, y, width, height, mask='auto')
            os.unlink(processed_file.name)
        else:
            c.drawImage(photo_path, x, y, width, height, preserveAspectRatio=True)
        
        if temp_file:
            os.unlink(temp_file.name)
            
    except Exception as e:
        logging.warning(f"Could not draw photo: {e}")
        draw_photo(c, x, y, width, height, None, circular)


def generate_student_id_card_pdf(student, institution, class_name=""):
    """Generate professional Madrasah student ID card PDF (front + back)"""
    register_fonts()
    
    buffer = BytesIO()
    c = pdf_canvas.Canvas(buffer, pagesize=(CARD_WIDTH, CARD_HEIGHT))
    
    # Get institution info
    inst_name = get_institution_name(institution, "bn")
    inst_name_en = get_institution_name(institution, "en")
    logo_url = institution.get("logo_url") if institution else None
    inst_address = institution.get("address_bn") or institution.get("address", "") if institution else ""
    inst_phone = institution.get("phone", "") if institution else ""
    
    # Calculate layout positions
    header_height = 28 * mm
    photo_size = 22 * mm
    margin = 3 * mm
    
    # ===== FRONT SIDE =====
    
    # Green header background
    c.setFillColor(GREEN_HEADER)
    c.rect(0, CARD_HEIGHT - header_height, CARD_WIDTH, header_height, fill=1, stroke=0)
    
    # Logo in header (centered, small)
    logo_size = 12 * mm
    logo_x = (CARD_WIDTH - logo_size) / 2
    logo_y = CARD_HEIGHT - 15 * mm
    draw_logo(c, logo_x, logo_y, logo_size, logo_url)
    
    # Institution name in header (Bengali)
    draw_centered_text(c, CARD_HEIGHT - 26 * mm, inst_name, 5, bold=True, color=WHITE, max_chars=45)
    
    # White body background
    body_top = CARD_HEIGHT - header_height
    body_height = CARD_HEIGHT - header_height - 12 * mm
    c.setFillColor(WHITE)
    c.rect(0, 12 * mm, CARD_WIDTH, body_height, fill=1, stroke=0)
    
    # Photo (circular, centered)
    photo_y = body_top - photo_size - 5 * mm
    photo_x = (CARD_WIDTH - photo_size) / 2
    
    # Photo border circle
    c.setStrokeColor(GREEN_HEADER)
    c.setLineWidth(1)
    c.circle(photo_x + photo_size/2, photo_y + photo_size/2, photo_size/2 + 1, fill=0, stroke=1)
    
    draw_photo(c, photo_x, photo_y, photo_size, photo_size, student.get("photo", ""), circular=True)
    
    # Student name (bold, centered)
    name_y = photo_y - 6 * mm
    student_name = student.get("name", "")
    draw_centered_text(c, name_y, student_name, 7, bold=True, color=BLACK, max_chars=30)
    
    # Student details
    details_y = name_y - 5 * mm
    line_height = 4 * mm
    detail_font_size = 5
    
    # Father's name
    father_name = student.get("father_name", "")
    if father_name:
        draw_text(c, margin, details_y, f"পিতা: {father_name}", detail_font_size, max_chars=35)
        details_y -= line_height
    
    # Class
    if class_name:
        draw_text(c, margin, details_y, f"শ্রেণি: {class_name}", detail_font_size, max_chars=35)
        details_y -= line_height
    
    # Roll/ID
    admission_no = student.get("admission_no", "") or student.get("roll_number", "")
    if admission_no:
        draw_text(c, margin, details_y, f"আইডি: {admission_no}", detail_font_size, max_chars=35)
        details_y -= line_height
    
    # Phone
    phone = student.get("guardian_phone", "") or student.get("mobile", "")
    if phone:
        draw_text(c, margin, details_y, f"মোবাইল: {phone}", detail_font_size, max_chars=35)
        details_y -= line_height
    
    # Signature line
    sig_y = 18 * mm
    c.setStrokeColor(BLACK)
    c.setLineWidth(0.5)
    sig_width = 25 * mm
    sig_x = (CARD_WIDTH - sig_width) / 2
    c.line(sig_x, sig_y, sig_x + sig_width, sig_y)
    draw_centered_text(c, sig_y - 3 * mm, "মুহতামিমের স্বাক্ষর", 4, color=BLACK)
    
    # Red footer
    footer_height = 8 * mm
    c.setFillColor(RED_FOOTER)
    c.rect(0, 0, CARD_WIDTH, footer_height, fill=1, stroke=0)
    draw_centered_text(c, 2.5 * mm, "STUDENT CARD", 6, bold=True, color=WHITE)
    
    # ===== BACK SIDE =====
    c.showPage()
    
    # Light background
    c.setFillColor(colors.HexColor("#FFF8F0"))
    c.rect(0, 0, CARD_WIDTH, CARD_HEIGHT, fill=1, stroke=0)
    
    # Warning/Usage text at top
    warning_y = CARD_HEIGHT - 8 * mm
    warning_texts = [
        "এই কার্ডটি ব্যবহারকারী ব্যতিত",
        "অন্য কেউ পেলে মাদ্রাসায় ঠিকানায়",
        "পৌঁছে দেওয়ার অনুরোধ রইল।"
    ]
    
    for i, text in enumerate(warning_texts):
        draw_centered_text(c, warning_y - (i * 4 * mm), text, 5, color=BLACK)
    
    # Logo (watermark style, centered)
    watermark_size = 18 * mm
    watermark_x = (CARD_WIDTH - watermark_size) / 2
    watermark_y = CARD_HEIGHT / 2 - 2 * mm
    draw_logo(c, watermark_x, watermark_y, watermark_size, logo_url)
    
    # Institution name
    inst_y = watermark_y - 5 * mm
    draw_centered_text(c, inst_y, inst_name, 5, bold=True, color=BLACK, max_chars=45)
    
    # Address
    if inst_address:
        draw_centered_text(c, inst_y - 4 * mm, inst_address, 4, color=BLACK, max_chars=50)
    
    # Phone
    if inst_phone:
        draw_centered_text(c, inst_y - 8 * mm, f"মোবা: {inst_phone}", 5, color=BLACK)
    
    # Emergency contact box
    emergency_y = 18 * mm
    box_width = CARD_WIDTH - 6 * mm
    box_height = 10 * mm
    box_x = 3 * mm
    
    c.setFillColor(colors.HexColor("#FFCCCC"))
    c.roundRect(box_x, emergency_y, box_width, box_height, 2 * mm, fill=1, stroke=0)
    
    draw_centered_text(c, emergency_y + 5 * mm, "জরুরি প্রয়োজনে যোগাযোগ করুন", 4, color=BLACK)
    draw_centered_text(c, emergency_y + 1.5 * mm, inst_phone or "প্রতিষ্ঠান", 4, bold=True, color=BLACK)
    
    # Dates at bottom
    issue_date = datetime.now().strftime("%d/%m/%Y")
    expiry_date = (datetime.now() + timedelta(days=730)).strftime("%d/%m/%Y")
    
    draw_text(c, margin, 10 * mm, f"ইস্যু: {issue_date}", 4, color=BLACK)
    draw_text(c, margin, 6 * mm, f"মেয়াদ: {expiry_date}", 4, color=BLACK)
    
    c.save()
    buffer.seek(0)
    return buffer


def generate_staff_id_card_pdf(staff, institution, department=""):
    """Generate professional Madrasah staff ID card PDF (front + back)"""
    register_fonts()
    
    buffer = BytesIO()
    c = pdf_canvas.Canvas(buffer, pagesize=(CARD_WIDTH, CARD_HEIGHT))
    
    # Get institution info
    inst_name = get_institution_name(institution, "bn")
    logo_url = institution.get("logo_url") if institution else None
    inst_address = institution.get("address_bn") or institution.get("address", "") if institution else ""
    inst_phone = institution.get("phone", "") if institution else ""
    
    # Layout
    header_height = 28 * mm
    photo_size = 22 * mm
    margin = 3 * mm
    
    # ===== FRONT SIDE =====
    
    # Blue header for staff
    c.setFillColor(colors.HexColor("#1E3A5F"))
    c.rect(0, CARD_HEIGHT - header_height, CARD_WIDTH, header_height, fill=1, stroke=0)
    
    # Logo
    logo_size = 12 * mm
    logo_x = (CARD_WIDTH - logo_size) / 2
    logo_y = CARD_HEIGHT - 15 * mm
    draw_logo(c, logo_x, logo_y, logo_size, logo_url)
    
    # Institution name
    draw_centered_text(c, CARD_HEIGHT - 26 * mm, inst_name, 5, bold=True, color=WHITE, max_chars=45)
    
    # White body
    body_top = CARD_HEIGHT - header_height
    c.setFillColor(WHITE)
    c.rect(0, 12 * mm, CARD_WIDTH, body_top - 12 * mm, fill=1, stroke=0)
    
    # Photo
    photo_y = body_top - photo_size - 5 * mm
    photo_x = (CARD_WIDTH - photo_size) / 2
    
    c.setStrokeColor(colors.HexColor("#1E3A5F"))
    c.setLineWidth(1)
    c.circle(photo_x + photo_size/2, photo_y + photo_size/2, photo_size/2 + 1, fill=0, stroke=1)
    
    draw_photo(c, photo_x, photo_y, photo_size, photo_size, staff.get("photo_url", ""), circular=True)
    
    # Staff name
    name_y = photo_y - 6 * mm
    draw_centered_text(c, name_y, staff.get("name", ""), 7, bold=True, color=BLACK, max_chars=30)
    
    # Details
    details_y = name_y - 5 * mm
    line_height = 4 * mm
    
    designation = staff.get("designation", "")
    if designation:
        draw_text(c, margin, details_y, f"পদবি: {designation}", 5, max_chars=35)
        details_y -= line_height
    
    dept = department or staff.get("department", "")
    if dept:
        draw_text(c, margin, details_y, f"বিভাগ: {dept}", 5, max_chars=35)
        details_y -= line_height
    
    phone = staff.get("phone", "")
    if phone:
        draw_text(c, margin, details_y, f"মোবাইল: {phone}", 5, max_chars=35)
    
    # Signature
    sig_y = 18 * mm
    sig_width = 25 * mm
    sig_x = (CARD_WIDTH - sig_width) / 2
    c.setStrokeColor(BLACK)
    c.setLineWidth(0.5)
    c.line(sig_x, sig_y, sig_x + sig_width, sig_y)
    draw_centered_text(c, sig_y - 3 * mm, "প্রতিষ্ঠান প্রধান", 4, color=BLACK)
    
    # Blue footer
    c.setFillColor(colors.HexColor("#1E3A5F"))
    c.rect(0, 0, CARD_WIDTH, 8 * mm, fill=1, stroke=0)
    draw_centered_text(c, 2.5 * mm, "STAFF CARD", 6, bold=True, color=WHITE)
    
    # ===== BACK SIDE =====
    c.showPage()
    
    c.setFillColor(colors.HexColor("#F0F8FF"))
    c.rect(0, 0, CARD_WIDTH, CARD_HEIGHT, fill=1, stroke=0)
    
    # Warning text
    warning_y = CARD_HEIGHT - 8 * mm
    warning_texts = [
        "এই কার্ডটি কর্মক্ষেত্রে বহন করুন",
        "হারিয়ে গেলে প্রশাসনে জানান",
    ]
    
    for i, text in enumerate(warning_texts):
        draw_centered_text(c, warning_y - (i * 4 * mm), text, 5, color=BLACK)
    
    # Logo
    watermark_size = 18 * mm
    watermark_x = (CARD_WIDTH - watermark_size) / 2
    watermark_y = CARD_HEIGHT / 2 - 2 * mm
    draw_logo(c, watermark_x, watermark_y, watermark_size, logo_url)
    
    # Institution info
    inst_y = watermark_y - 5 * mm
    draw_centered_text(c, inst_y, inst_name, 5, bold=True, color=BLACK, max_chars=45)
    
    if inst_address:
        draw_centered_text(c, inst_y - 4 * mm, inst_address, 4, color=BLACK, max_chars=50)
    
    if inst_phone:
        draw_centered_text(c, inst_y - 8 * mm, f"মোবা: {inst_phone}", 5, color=BLACK)
    
    # Dates
    issue_date = datetime.now().strftime("%d/%m/%Y")
    expiry_date = (datetime.now() + timedelta(days=730)).strftime("%d/%m/%Y")
    
    draw_text(c, margin, 10 * mm, f"ইস্যু: {issue_date}", 4, color=BLACK)
    draw_text(c, margin, 6 * mm, f"মেয়াদ: {expiry_date}", 4, color=BLACK)
    
    c.save()
    buffer.seek(0)
    return buffer


def _draw_student_card_front(c, student, institution, class_name):
    """Draw student card front side on current page"""
    inst_name = get_institution_name(institution, "bn")
    logo_url = institution.get("logo_url") if institution else None
    
    header_height = 28 * mm
    photo_size = 22 * mm
    margin = 3 * mm
    
    # Green header
    c.setFillColor(GREEN_HEADER)
    c.rect(0, CARD_HEIGHT - header_height, CARD_WIDTH, header_height, fill=1, stroke=0)
    
    # Logo
    logo_size = 12 * mm
    logo_x = (CARD_WIDTH - logo_size) / 2
    logo_y = CARD_HEIGHT - 15 * mm
    draw_logo(c, logo_x, logo_y, logo_size, logo_url)
    
    # Institution name
    draw_centered_text(c, CARD_HEIGHT - 26 * mm, inst_name, 5, bold=True, color=WHITE, max_chars=45)
    
    # White body
    body_top = CARD_HEIGHT - header_height
    c.setFillColor(WHITE)
    c.rect(0, 12 * mm, CARD_WIDTH, body_top - 12 * mm, fill=1, stroke=0)
    
    # Photo
    photo_y = body_top - photo_size - 5 * mm
    photo_x = (CARD_WIDTH - photo_size) / 2
    c.setStrokeColor(GREEN_HEADER)
    c.setLineWidth(1)
    c.circle(photo_x + photo_size/2, photo_y + photo_size/2, photo_size/2 + 1, fill=0, stroke=1)
    draw_photo(c, photo_x, photo_y, photo_size, photo_size, student.get("photo", ""), circular=True)
    
    # Name
    name_y = photo_y - 6 * mm
    draw_centered_text(c, name_y, student.get("name", ""), 7, bold=True, color=BLACK, max_chars=30)
    
    # Details
    details_y = name_y - 5 * mm
    line_height = 4 * mm
    
    father_name = student.get("father_name", "")
    if father_name:
        draw_text(c, margin, details_y, f"পিতা: {father_name}", 5, max_chars=35)
        details_y -= line_height
    
    if class_name:
        draw_text(c, margin, details_y, f"শ্রেণি: {class_name}", 5, max_chars=35)
        details_y -= line_height
    
    admission_no = student.get("admission_no", "") or student.get("roll_number", "")
    if admission_no:
        draw_text(c, margin, details_y, f"আইডি: {admission_no}", 5, max_chars=35)
        details_y -= line_height
    
    phone = student.get("guardian_phone", "") or student.get("mobile", "")
    if phone:
        draw_text(c, margin, details_y, f"মোবাইল: {phone}", 5, max_chars=35)
    
    # Signature
    sig_y = 18 * mm
    sig_width = 25 * mm
    sig_x = (CARD_WIDTH - sig_width) / 2
    c.setStrokeColor(BLACK)
    c.setLineWidth(0.5)
    c.line(sig_x, sig_y, sig_x + sig_width, sig_y)
    draw_centered_text(c, sig_y - 3 * mm, "মুহতামিমের স্বাক্ষর", 4, color=BLACK)
    
    # Red footer
    c.setFillColor(RED_FOOTER)
    c.rect(0, 0, CARD_WIDTH, 8 * mm, fill=1, stroke=0)
    draw_centered_text(c, 2.5 * mm, "STUDENT CARD", 6, bold=True, color=WHITE)


def _draw_student_card_back(c, student, institution):
    """Draw student card back side on current page"""
    inst_name = get_institution_name(institution, "bn")
    logo_url = institution.get("logo_url") if institution else None
    inst_address = institution.get("address_bn") or institution.get("address", "") if institution else ""
    inst_phone = institution.get("phone", "") if institution else ""
    margin = 3 * mm
    
    # Light background
    c.setFillColor(colors.HexColor("#FFF8F0"))
    c.rect(0, 0, CARD_WIDTH, CARD_HEIGHT, fill=1, stroke=0)
    
    # Warning text
    warning_y = CARD_HEIGHT - 8 * mm
    for i, text in enumerate(["এই কার্ডটি ব্যবহারকারী ব্যতিত", "অন্য কেউ পেলে মাদ্রাসায় ঠিকানায়", "পৌঁছে দেওয়ার অনুরোধ রইল।"]):
        draw_centered_text(c, warning_y - (i * 4 * mm), text, 5, color=BLACK)
    
    # Logo
    watermark_size = 18 * mm
    watermark_x = (CARD_WIDTH - watermark_size) / 2
    watermark_y = CARD_HEIGHT / 2 - 2 * mm
    draw_logo(c, watermark_x, watermark_y, watermark_size, logo_url)
    
    # Institution info
    inst_y = watermark_y - 5 * mm
    draw_centered_text(c, inst_y, inst_name, 5, bold=True, color=BLACK, max_chars=45)
    if inst_address:
        draw_centered_text(c, inst_y - 4 * mm, inst_address, 4, color=BLACK, max_chars=50)
    if inst_phone:
        draw_centered_text(c, inst_y - 8 * mm, f"মোবা: {inst_phone}", 5, color=BLACK)
    
    # Emergency box
    emergency_y = 18 * mm
    box_width = CARD_WIDTH - 6 * mm
    c.setFillColor(colors.HexColor("#FFCCCC"))
    c.roundRect(3 * mm, emergency_y, box_width, 10 * mm, 2 * mm, fill=1, stroke=0)
    draw_centered_text(c, emergency_y + 5 * mm, "জরুরি প্রয়োজনে যোগাযোগ করুন", 4, color=BLACK)
    draw_centered_text(c, emergency_y + 1.5 * mm, inst_phone or "প্রতিষ্ঠান", 4, bold=True, color=BLACK)
    
    # Dates
    issue_date = datetime.now().strftime("%d/%m/%Y")
    expiry_date = (datetime.now() + timedelta(days=730)).strftime("%d/%m/%Y")
    draw_text(c, margin, 10 * mm, f"ইস্যু: {issue_date}", 4, color=BLACK)
    draw_text(c, margin, 6 * mm, f"মেয়াদ: {expiry_date}", 4, color=BLACK)


def generate_bulk_id_cards_pdf(students, institution, class_name=""):
    """Generate PDF with multiple ID cards for bulk printing (front + back per student)"""
    register_fonts()
    
    buffer = BytesIO()
    c = pdf_canvas.Canvas(buffer, pagesize=(CARD_WIDTH, CARD_HEIGHT))
    
    for i, student in enumerate(students):
        # Front side
        if i > 0:
            c.showPage()
        _draw_student_card_front(c, student, institution, class_name)
        
        # Back side
        c.showPage()
        _draw_student_card_back(c, student, institution)
    
    c.save()
    buffer.seek(0)
    return buffer
