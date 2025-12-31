"""
Professional Madrasah ID Card Generator - Matching Exact Sample Design
Features:
- Tech circuit pattern background
- Front: Logo, institution names, photo with red border, info table, signature, red footer
- Back: Institution seal, message, QR code, contact info
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
import qrcode
import requests as http_requests
from PIL import Image, ImageDraw, ImageFont

CARD_WIDTH = 54 * mm
CARD_HEIGHT = 86 * mm

LIGHT_GRAY_BG = colors.HexColor("#F5F5F5")
DARK_RED = colors.HexColor("#C41E3A")
RED_FOOTER = colors.HexColor("#DC143C")
DARK_TEXT = colors.HexColor("#333333")


def register_fonts():
    """Register Bengali fonts"""
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


def get_pil_font(size, bold=False):
    """Get PIL font for Bengali text rendering"""
    font_dir = Path(__file__).parent / "fonts"
    
    if bold:
        bold_path = font_dir / "NotoSansBengali-Bold.ttf"
        try:
            if bold_path.exists():
                return ImageFont.truetype(str(bold_path), size)
        except:
            pass
    
    regular_path = font_dir / "NotoSansBengali-Regular.ttf"
    try:
        if regular_path.exists():
            return ImageFont.truetype(str(regular_path), size)
    except:
        pass
    
    return ImageFont.load_default()


def draw_bengali_text(c, x, y, text, font_size, color=(0, 0, 0), bold=False, centered=False, width=None):
    """Render Bengali text using PIL then embed as image in PDF"""
    if not text or not text.strip():
        return 0
    
    try:
        dpi_scale = 4
        pil_font_size = int(font_size * dpi_scale)
        font = get_pil_font(pil_font_size, bold)
        
        text_features = {'language': 'bn'}
        
        try:
            bbox = font.getbbox(text, **text_features)
            text_width = bbox[2] - bbox[0]
            text_height = bbox[3] - bbox[1]
            x_offset = bbox[0]
            y_offset = bbox[1]
        except:
            text_width = int(len(text) * pil_font_size * 0.6)
            text_height = int(pil_font_size * 1.5)
            x_offset = 0
            y_offset = 0
        
        text_width = max(text_width, pil_font_size)
        text_height = max(text_height, pil_font_size)
        
        padding = 4 * dpi_scale
        img_width = int(text_width + padding * 2)
        img_height = int(text_height + padding * 2)
        
        img = Image.new('RGBA', (img_width, img_height), (255, 255, 255, 0))
        draw = ImageDraw.Draw(img)
        fill_color = color + (255,) if len(color) == 3 else color
        draw.text((padding - x_offset, padding - y_offset), text, font=font, fill=fill_color, **text_features)
        
        final_width = img_width / dpi_scale
        final_height = img_height / dpi_scale
        
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".png")
        img.save(temp_file.name, 'PNG')
        temp_file.close()
        
        if centered and width:
            x = x + (width - final_width) / 2
        
        c.drawImage(temp_file.name, x, y - final_height + font_size * 0.3, 
                    final_width, final_height, mask='auto')
        
        os.unlink(temp_file.name)
        return final_width
        
    except Exception as e:
        logging.error(f"Bengali text render failed: {e}")
        return 0


def draw_circuit_pattern(c, width, height):
    """Draw tech circuit pattern background"""
    c.setFillColor(LIGHT_GRAY_BG)
    c.rect(0, 0, width, height, fill=True, stroke=False)
    
    c.setStrokeColor(colors.HexColor("#E0E0E0"))
    c.setLineWidth(0.3)
    
    for i in range(0, int(width), int(8*mm)):
        c.line(i, 0, i, height)
    for i in range(0, int(height), int(8*mm)):
        c.line(0, i, width, i)
    
    c.setFillColor(colors.HexColor("#D0D0D0"))
    for i in range(0, int(width), int(16*mm)):
        for j in range(0, int(height), int(16*mm)):
            c.circle(i + 4*mm, j + 4*mm, 1*mm, fill=True, stroke=False)


def draw_photo_with_red_border(c, x, y, size, photo_url=None):
    """Draw rectangular photo with red border"""
    border_width = 2*mm
    
    c.setFillColor(DARK_RED)
    c.rect(x - border_width, y - border_width, size + 2*border_width, size + 2*border_width, fill=True, stroke=False)
    
    c.setFillColor(colors.white)
    c.rect(x, y, size, size, fill=True, stroke=False)
    
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
                c.drawImage(image_path, x, y, size, size, preserveAspectRatio=True, mask='auto')
            
            if temp_file and os.path.exists(temp_file.name):
                os.unlink(temp_file.name)
                
        except Exception as e:
            logging.warning(f"Could not add photo: {e}")
    else:
        c.setFillColor(colors.lightgrey)
        c.rect(x + 2, y + 2, size - 4, size - 4, fill=True, stroke=False)


def draw_logo(c, x, y, size, logo_url=None):
    """Draw institution logo"""
    if not logo_url:
        c.setStrokeColor(colors.HexColor("#666666"))
        c.setLineWidth(0.5)
        c.circle(x + size/2, y + size/2, size/2, fill=False, stroke=True)
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


def get_logo_url(institution):
    """Get logo URL from institution data"""
    if not institution:
        return None
    return institution.get("logo") or institution.get("logo_url") or institution.get("institution_logo") or None


def get_institution_name(institution, lang="bn"):
    """Get institution name dynamically from settings"""
    if not institution:
        return ""
    
    if lang == "bn":
        return (institution.get("name_bn") or institution.get("name") or 
                institution.get("institution_name") or institution.get("school_name") or "")
    elif lang == "en":
        name = (institution.get("name_en") or institution.get("english_name") or 
                institution.get("institution_name_en") or institution.get("school_name") or 
                institution.get("name") or "")
        return name.upper() if name else ""
    return institution.get("name", "") or institution.get("school_name", "")


def draw_red_curved_footer(c, width, footer_height):
    """Draw red curved footer at bottom"""
    c.setFillColor(RED_FOOTER)
    p = c.beginPath()
    p.moveTo(0, 0)
    p.lineTo(width, 0)
    p.lineTo(width, footer_height - 2*mm)
    p.curveTo(width * 0.75, footer_height + 2*mm, width * 0.25, footer_height - 1*mm, 0, footer_height + 1*mm)
    p.lineTo(0, 0)
    p.close()
    c.drawPath(p, fill=True, stroke=False)


def generate_front_side(c, student, institution, class_name=""):
    """Generate front side of ID card matching exact sample design"""
    margin = 3 * mm
    
    draw_circuit_pattern(c, CARD_WIDTH, CARD_HEIGHT)
    
    logo_size = 10 * mm
    logo_url = get_logo_url(institution)
    draw_logo(c, margin, CARD_HEIGHT - margin - logo_size, logo_size, logo_url)
    
    name_bn = get_institution_name(institution, "bn")
    name_en = get_institution_name(institution, "en")
    eiin = institution.get("eiin_code") or institution.get("eiin") or ""
    established = institution.get("established") or institution.get("established_year") or ""
    address = institution.get("address") or institution.get("full_address") or ""
    
    text_x = margin + logo_size + 2*mm
    text_width = CARD_WIDTH - text_x - margin
    y_pos = CARD_HEIGHT - margin - 2*mm
    
    if name_bn:
        draw_bengali_text(c, text_x, y_pos, name_bn, 6, color=(0, 80, 0), bold=True)
        y_pos -= 5*mm
    
    if name_en:
        c.setFillColor(colors.HexColor("#006400"))
        c.setFont("Helvetica-Bold", 4)
        c.drawString(text_x, y_pos, name_en[:35])
        y_pos -= 3.5*mm
    
    if eiin:
        c.setFillColor(colors.black)
        c.setFont("Helvetica", 4)
        c.drawString(text_x, y_pos, f"EIIN CODE: {eiin}")
        y_pos -= 3*mm
    
    if established:
        draw_bengali_text(c, text_x, y_pos, f"স্থাপিত: {established} ইং", 4, color=(0, 0, 0))
        y_pos -= 4*mm
    
    if address:
        addr_short = address[:40] + "।" if len(address) > 40 else address
        draw_bengali_text(c, margin, y_pos, addr_short, 4, color=(51, 51, 51))
        y_pos -= 5*mm
    
    photo_size = 22 * mm
    photo_x = margin
    photo_y = y_pos - photo_size - 2*mm
    photo_url = student.get("photo") or student.get("photo_url") or student.get("profile_image") or None
    draw_photo_with_red_border(c, photo_x, photo_y, photo_size, photo_url)
    
    info_x = photo_x + photo_size + 4*mm
    info_y = y_pos - 3*mm
    
    name = student.get("name") or student.get("full_name") or ""
    position = student.get("designation") or student.get("position") or class_name or ""
    father = student.get("father_name") or student.get("father") or ""
    student_address = student.get("address") or student.get("permanent_address") or ""
    joining_date = student.get("joining_date") or student.get("admission_date") or ""
    dob = student.get("date_of_birth") or student.get("dob") or ""
    blood_group = student.get("blood_group") or ""
    mobile = student.get("phone") or student.get("mobile") or student.get("contact") or ""
    
    draw_bengali_text(c, margin, photo_y - 3*mm, f"নাম: {name}", 7, color=(0, 0, 0), bold=True)
    
    if position:
        draw_bengali_text(c, margin, photo_y - 9*mm, f"পদের নাম: {position}", 5, color=(139, 0, 0), bold=True)
    
    details_y = photo_y - 15*mm
    line_height = 4.5*mm
    label_x = margin
    value_x = margin + 18*mm
    
    details = [
        ("পিতা", father),
        ("ঠিকানা", student_address[:25] if student_address else ""),
        ("যোগদানের তারিখ", joining_date),
        ("জন্ম তারিখ", dob),
        ("রক্তের গ্রুপ", blood_group),
        ("মোবাইল", mobile),
    ]
    
    for label, value in details:
        if value:
            draw_bengali_text(c, label_x, details_y, label, 4.5, color=(0, 0, 0), bold=True)
            c.setFont("Helvetica", 4)
            c.setFillColor(colors.black)
            c.drawString(label_x + 16*mm, details_y - 1*mm, ":")
            
            if any(ord(ch) > 127 for ch in str(value)):
                draw_bengali_text(c, value_x, details_y, str(value), 4.5, color=(51, 51, 51))
            else:
                c.setFont("Helvetica", 5)
                c.drawString(value_x, details_y - 1*mm, str(value))
            
            details_y -= line_height
    
    sig_y = 12*mm
    c.setStrokeColor(colors.HexColor("#999999"))
    c.setDash([1, 1])
    c.line(margin, sig_y, CARD_WIDTH - margin, sig_y)
    c.setDash([])
    
    draw_bengali_text(c, margin, sig_y - 5*mm, "প্রধান শিক্ষক", 5, color=(0, 0, 0), centered=True, width=CARD_WIDTH - 2*margin)
    
    draw_red_curved_footer(c, CARD_WIDTH, 4*mm)


def generate_back_side(c, student, institution):
    """Generate back side of ID card matching exact sample design"""
    margin = 3 * mm
    
    draw_circuit_pattern(c, CARD_WIDTH, CARD_HEIGHT)
    
    name_bn = get_institution_name(institution, "bn")
    name_en = get_institution_name(institution, "en")
    address = institution.get("address") or institution.get("full_address") or ""
    phone = institution.get("phone") or institution.get("mobile") or institution.get("contact") or ""
    
    y_pos = CARD_HEIGHT - margin - 2*mm
    
    if name_bn:
        draw_bengali_text(c, 0, y_pos, name_bn, 6, color=(0, 80, 0), bold=True, centered=True, width=CARD_WIDTH)
        y_pos -= 5*mm
    
    if name_en:
        c.setFillColor(colors.HexColor("#006400"))
        c.setFont("Helvetica-Bold", 4.5)
        name_width = c.stringWidth(name_en[:40], "Helvetica-Bold", 4.5)
        c.drawString((CARD_WIDTH - name_width) / 2, y_pos, name_en[:40])
        y_pos -= 6*mm
    
    seal_size = 14 * mm
    seal_x = (CARD_WIDTH - seal_size) / 2
    seal_y = y_pos - seal_size - 2*mm
    
    logo_url = get_logo_url(institution)
    if logo_url:
        draw_logo(c, seal_x, seal_y, seal_size, logo_url)
    else:
        c.setStrokeColor(colors.HexColor("#006400"))
        c.setLineWidth(1)
        c.circle(seal_x + seal_size/2, seal_y + seal_size/2, seal_size/2, fill=False, stroke=True)
    
    y_pos = seal_y - 4*mm
    
    message_lines = [
        "এই কার্ডটি প্রতিষ্ঠানের নিজস্ব পরিচিতি।",
        "ব্যবহারকারী ব্যতিত অন্য কোথাও পাওয়া",
        "গেলে অনুগ্রহ করে বিদ্যালয়ের ঠিকানায়",
        "পৌঁছে দেওয়ার জন্য অনুরোধ করা হলো।"
    ]
    
    for line in message_lines:
        draw_bengali_text(c, 0, y_pos, line, 4.5, color=(51, 51, 51), centered=True, width=CARD_WIDTH)
        y_pos -= 4*mm
    
    y_pos -= 2*mm
    
    qr_size = 22 * mm
    qr_x = (CARD_WIDTH - qr_size) / 2
    qr_y = y_pos - qr_size - 2*mm
    
    student_id = student.get("id") or student.get("student_id") or student.get("admission_no") or ""
    name = student.get("name") or student.get("full_name") or ""
    qr_data = f"ID:{student_id}|Name:{name}|Institution:{name_en}"
    
    try:
        qr = qrcode.QRCode(version=1, box_size=10, border=1)
        qr.add_data(qr_data)
        qr.make(fit=True)
        qr_img = qr.make_image(fill_color="black", back_color="white")
        
        qr_temp = tempfile.NamedTemporaryFile(delete=False, suffix=".png")
        qr_img.save(qr_temp.name)
        qr_temp.close()
        
        c.drawImage(qr_temp.name, qr_x, qr_y, qr_size, qr_size)
        os.unlink(qr_temp.name)
    except Exception as e:
        logging.warning(f"QR generation failed: {e}")
        c.setStrokeColor(colors.black)
        c.rect(qr_x, qr_y, qr_size, qr_size, fill=False, stroke=True)
    
    y_pos = qr_y - 4*mm
    
    if address:
        addr_short = address[:45] + "।" if len(address) > 45 else address + "।"
        draw_bengali_text(c, 0, y_pos, addr_short, 4, color=(51, 51, 51), centered=True, width=CARD_WIDTH)
        y_pos -= 4*mm
    
    if phone:
        draw_bengali_text(c, 0, y_pos, f"মোবাইল: {phone}", 4.5, color=(0, 0, 0), bold=True, centered=True, width=CARD_WIDTH)


def generate_student_id_card_pdf(student: dict, institution: dict, class_name: str = "") -> bytes:
    """Generate complete student ID card PDF with front and back sides"""
    register_fonts()
    
    buffer = BytesIO()
    c = pdf_canvas.Canvas(buffer, pagesize=(CARD_WIDTH, CARD_HEIGHT))
    
    generate_front_side(c, student, institution, class_name)
    c.showPage()
    
    generate_back_side(c, student, institution)
    c.showPage()
    
    c.save()
    buffer.seek(0)
    return buffer.getvalue()


def generate_staff_id_card_pdf(staff: dict, institution: dict) -> bytes:
    """Generate complete staff ID card PDF with front and back sides"""
    register_fonts()
    
    buffer = BytesIO()
    c = pdf_canvas.Canvas(buffer, pagesize=(CARD_WIDTH, CARD_HEIGHT))
    
    position = staff.get("designation") or staff.get("position") or staff.get("role") or ""
    generate_front_side(c, staff, institution, position)
    c.showPage()
    
    generate_back_side(c, staff, institution)
    c.showPage()
    
    c.save()
    buffer.seek(0)
    return buffer.getvalue()
