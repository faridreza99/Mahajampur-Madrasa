"""
Bengali text rendering helper using PIL for proper complex script shaping
"""
from PIL import Image, ImageDraw, ImageFont
import os
import io

def get_bengali_font_path():
    """Get the path to the Bengali font file"""
    return os.path.join(os.path.dirname(__file__), "fonts", "NotoSansBengali-Regular.ttf")

def render_bengali_text_to_image(text, font_size=16, color=(255, 255, 255)):
    """
    Render Bengali text to a PIL Image with proper text shaping
    
    Args:
        text: Bengali/Unicode text to render
        font_size: Font size in points
        color: RGB tuple for text color (default white)
    
    Returns:
        PIL Image object with rendered text
    """
    font_path = get_bengali_font_path()
    
    # Try to load the Bengali font, fallback to default if not available
    try:
        font = ImageFont.truetype(font_path, font_size)
    except Exception:
        font = ImageFont.load_default()
    
    # Calculate text size using textbbox for newer PIL versions
    try:
        dummy_img = Image.new('RGBA', (1, 1), (0, 0, 0, 0))
        dummy_draw = ImageDraw.Draw(dummy_img)
        bbox = dummy_draw.textbbox((0, 0), text, font=font)
        text_width = bbox[2] - bbox[0] + 10
        text_height = bbox[3] - bbox[1] + 10
    except Exception:
        # Fallback for older PIL versions
        text_width = len(text) * font_size
        text_height = font_size + 10
    
    # Create image with transparent background
    img = Image.new('RGBA', (text_width, text_height), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Draw text with proper shaping
    draw.text((5, 2), text, font=font, fill=(*color, 255))
    
    return img

def save_bengali_text_image(text, output_path, font_size=16, color=(255, 255, 255)):
    """
    Save Bengali text as a PNG image
    
    Args:
        text: Bengali/Unicode text to render  
        output_path: Path to save the image
        font_size: Font size in points
        color: RGB tuple for text color
    
    Returns:
        Path to the saved image
    """
    img = render_bengali_text_to_image(text, font_size, color)
    img.save(output_path, 'PNG')
    return output_path

def get_bengali_text_image_bytes(text, font_size=16, color=(255, 255, 255)):
    """
    Get Bengali text as PNG bytes for embedding in PDF
    
    Args:
        text: Bengali/Unicode text to render
        font_size: Font size in points
        color: RGB tuple for text color
    
    Returns:
        Bytes object containing PNG image data
    """
    img = render_bengali_text_to_image(text, font_size, color)
    buffer = io.BytesIO()
    img.save(buffer, format='PNG')
    buffer.seek(0)
    return buffer.getvalue()
