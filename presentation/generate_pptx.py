"""
PaperVault – Professional PowerPoint Presentation Generator
Creates an 8-slide presentation with blue/white academic theme,
architecture diagrams, flowcharts, icons, and speaker notes.
"""

from pptx import Presentation
from pptx.util import Inches, Pt, Emu
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE
import os

# ── Color Palette (Blue/White Academic Theme) ─────────────────────────────
DARK_BLUE = RGBColor(0x0D, 0x1B, 0x2A)       # #0D1B2A - Deep navy
PRIMARY_BLUE = RGBColor(0x1B, 0x4F, 0x72)     # #1B4F72 - Primary blue
ACCENT_BLUE = RGBColor(0x21, 0x96, 0xF3)      # #2196F3 - Accent blue
LIGHT_BLUE = RGBColor(0xBB, 0xDE, 0xFB)       # #BBDEFB - Light blue
VERY_LIGHT_BLUE = RGBColor(0xE3, 0xF2, 0xFD)  # #E3F2FD - Very light blue
WHITE = RGBColor(0xFF, 0xFF, 0xFF)
DARK_TEXT = RGBColor(0x1A, 0x1A, 0x2E)         # #1A1A2E - Dark text
GRAY_TEXT = RGBColor(0x5A, 0x5A, 0x7A)         # #5A5A7A - Gray text
MEDIUM_BLUE = RGBColor(0x15, 0x65, 0xC0)       # #1565C0 - Medium blue
ORANGE_ACCENT = RGBColor(0xFF, 0x98, 0x00)     # #FF9800 - Orange accent
GREEN_ACCENT = RGBColor(0x4C, 0xAF, 0x50)      # #4CAF50 - Green accent
RED_ACCENT = RGBColor(0xE5, 0x39, 0x35)        # #E53935 - Red accent
TEAL_ACCENT = RGBColor(0x00, 0x96, 0x88)       # #009688 - Teal accent
PURPLE_ACCENT = RGBColor(0x7B, 0x1F, 0xA2)     # #7B1FA2 - Purple accent
SLIDE_BG = RGBColor(0xF8, 0xFA, 0xFF)          # #F8FAFF - Slide background

# ── Dimensions ────────────────────────────────────────────────────────────
SLIDE_WIDTH = Inches(13.333)
SLIDE_HEIGHT = Inches(7.5)


def set_slide_bg(slide, color):
    """Set solid background color for a slide."""
    background = slide.background
    fill = background.fill
    fill.solid()
    fill.fore_color.rgb = color


def add_shape(slide, shape_type, left, top, width, height, fill_color=None, line_color=None, line_width=None):
    """Add a shape to the slide."""
    shape = slide.shapes.add_shape(shape_type, left, top, width, height)
    shape.shadow.inherit = False
    if fill_color:
        shape.fill.solid()
        shape.fill.fore_color.rgb = fill_color
    else:
        shape.fill.background()
    if line_color:
        shape.line.color.rgb = line_color
        if line_width:
            shape.line.width = Pt(line_width)
    else:
        shape.line.fill.background()
    return shape


def add_textbox(slide, left, top, width, height, text, font_size=14, font_color=DARK_TEXT,
                bold=False, alignment=PP_ALIGN.LEFT, font_name="Calibri", line_spacing=1.2):
    """Add a textbox with text to the slide."""
    txBox = slide.shapes.add_textbox(left, top, width, height)
    tf = txBox.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = text
    p.font.size = Pt(font_size)
    p.font.color.rgb = font_color
    p.font.bold = bold
    p.font.name = font_name
    p.alignment = alignment
    p.space_after = Pt(0)
    p.line_spacing = Pt(font_size * line_spacing)
    return txBox


def add_multiline_textbox(slide, left, top, width, height, lines, font_size=14, font_color=DARK_TEXT,
                          bold=False, alignment=PP_ALIGN.LEFT, font_name="Calibri", bullet=False,
                          line_spacing=1.5):
    """Add a textbox with multiple lines."""
    txBox = slide.shapes.add_textbox(left, top, width, height)
    tf = txBox.text_frame
    tf.word_wrap = True
    for i, line in enumerate(lines):
        if i == 0:
            p = tf.paragraphs[0]
        else:
            p = tf.add_paragraph()
        text = f"•  {line}" if bullet else line
        p.text = text
        p.font.size = Pt(font_size)
        p.font.color.rgb = font_color
        p.font.bold = bold
        p.font.name = font_name
        p.alignment = alignment
        p.space_after = Pt(4)
        p.line_spacing = Pt(font_size * line_spacing)
    return txBox


def add_rounded_rect(slide, left, top, width, height, fill_color, text="", font_size=11,
                     font_color=WHITE, line_color=None):
    """Add a rounded rectangle with centered text."""
    shape = add_shape(slide, MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height,
                      fill_color=fill_color, line_color=line_color)
    if text:
        tf = shape.text_frame
        tf.word_wrap = True
        tf.paragraphs[0].alignment = PP_ALIGN.CENTER
        p = tf.paragraphs[0]
        p.text = text
        p.font.size = Pt(font_size)
        p.font.color.rgb = font_color
        p.font.bold = True
        p.font.name = "Calibri"
        shape.text_frame.margin_left = Pt(4)
        shape.text_frame.margin_right = Pt(4)
        shape.text_frame.margin_top = Pt(4)
        shape.text_frame.margin_bottom = Pt(4)
        shape.text_frame.auto_size = None
    # Vertically center
    shape.text_frame.paragraphs[0].alignment = PP_ALIGN.CENTER
    return shape


def add_arrow_down(slide, left, top, length, color=ACCENT_BLUE):
    """Add a downward arrow connector."""
    shape = slide.shapes.add_shape(MSO_SHAPE.DOWN_ARROW, left, top, Inches(0.35), length)
    shape.fill.solid()
    shape.fill.fore_color.rgb = color
    shape.line.fill.background()
    shape.shadow.inherit = False
    return shape


def add_arrow_right(slide, left, top, length, color=ACCENT_BLUE):
    """Add a right arrow."""
    shape = slide.shapes.add_shape(MSO_SHAPE.RIGHT_ARROW, left, top, length, Inches(0.3))
    shape.fill.solid()
    shape.fill.fore_color.rgb = color
    shape.line.fill.background()
    shape.shadow.inherit = False
    return shape


def add_circle_icon(slide, left, top, size, fill_color, icon_text="", font_size=16):
    """Add a circle with icon text (emoji/symbol)."""
    shape = add_shape(slide, MSO_SHAPE.OVAL, left, top, size, size, fill_color=fill_color)
    if icon_text:
        tf = shape.text_frame
        tf.word_wrap = False
        p = tf.paragraphs[0]
        p.text = icon_text
        p.font.size = Pt(font_size)
        p.font.color.rgb = WHITE
        p.font.bold = True
        p.alignment = PP_ALIGN.CENTER
        p.font.name = "Segoe UI Emoji"
        shape.text_frame.margin_left = Pt(0)
        shape.text_frame.margin_right = Pt(0)
    return shape


def add_decorative_bar(slide, left, top, width, height, color):
    """Add a decorative accent bar."""
    return add_shape(slide, MSO_SHAPE.RECTANGLE, left, top, width, height, fill_color=color)


def add_slide_number(slide, number, total=8):
    """Add slide number at the bottom."""
    add_textbox(slide, Inches(12.2), Inches(7.05), Inches(1), Inches(0.35),
                f"{number} / {total}", font_size=10, font_color=GRAY_TEXT,
                alignment=PP_ALIGN.RIGHT, font_name="Calibri")


def add_header_section(slide, title, subtitle="", slide_num=1):
    """Add a consistent header section to content slides."""
    # Top accent bar
    add_decorative_bar(slide, Inches(0), Inches(0), SLIDE_WIDTH, Inches(0.06), ACCENT_BLUE)

    # Left accent bar
    add_decorative_bar(slide, Inches(0), Inches(0), Inches(0.06), SLIDE_HEIGHT, PRIMARY_BLUE)

    # Header background
    add_shape(slide, MSO_SHAPE.RECTANGLE, Inches(0.06), Inches(0.06), SLIDE_WIDTH, Inches(1.1),
              fill_color=DARK_BLUE)

    # Title
    add_textbox(slide, Inches(0.6), Inches(0.18), Inches(10), Inches(0.55),
                title, font_size=28, font_color=WHITE, bold=True, font_name="Calibri")

    # Subtitle
    if subtitle:
        add_textbox(slide, Inches(0.6), Inches(0.7), Inches(10), Inches(0.4),
                    subtitle, font_size=14, font_color=LIGHT_BLUE, font_name="Calibri")

    # PaperVault branding
    add_textbox(slide, Inches(11.2), Inches(0.35), Inches(2), Inches(0.45),
                "PaperVault", font_size=16, font_color=ACCENT_BLUE, bold=True,
                alignment=PP_ALIGN.RIGHT, font_name="Calibri")

    # Bottom bar
    add_decorative_bar(slide, Inches(0), Inches(7.28), SLIDE_WIDTH, Inches(0.22), PRIMARY_BLUE)

    # Slide number
    add_slide_number(slide, slide_num)


def create_card(slide, left, top, width, height, title, items, icon_text, icon_color,
                title_size=13, item_size=11):
    """Create a card-like container with icon, title, and bullet items."""
    # Card background
    card = add_shape(slide, MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height,
                     fill_color=WHITE, line_color=VERY_LIGHT_BLUE, line_width=1.5)

    # Icon circle
    add_circle_icon(slide, left + Inches(0.15), top + Inches(0.15), Inches(0.45),
                    icon_color, icon_text, font_size=14)

    # Title
    add_textbox(slide, left + Inches(0.7), top + Inches(0.18), width - Inches(0.85), Inches(0.35),
                title, font_size=title_size, font_color=PRIMARY_BLUE, bold=True, font_name="Calibri")

    # Items
    if items:
        add_multiline_textbox(slide, left + Inches(0.25), top + Inches(0.6),
                              width - Inches(0.4), height - Inches(0.7),
                              items, font_size=item_size, font_color=DARK_TEXT,
                              bullet=True, line_spacing=1.6)

    return card


# ══════════════════════════════════════════════════════════════════════════
# SLIDE 1: Title Slide
# ══════════════════════════════════════════════════════════════════════════
def create_slide_1(prs):
    slide = prs.slides.add_slide(prs.slide_layouts[6])  # Blank layout
    set_slide_bg(slide, DARK_BLUE)

    # Decorative shapes
    # Top-right decorative circle
    add_shape(slide, MSO_SHAPE.OVAL, Inches(10.5), Inches(-1.5), Inches(4), Inches(4),
              fill_color=RGBColor(0x1B, 0x3A, 0x5C))
    add_shape(slide, MSO_SHAPE.OVAL, Inches(11), Inches(-1), Inches(3), Inches(3),
              fill_color=RGBColor(0x1B, 0x45, 0x6A))

    # Bottom-left decorative circle
    add_shape(slide, MSO_SHAPE.OVAL, Inches(-1.5), Inches(5.5), Inches(3.5), Inches(3.5),
              fill_color=RGBColor(0x1B, 0x3A, 0x5C))

    # Accent line top
    add_decorative_bar(slide, Inches(0), Inches(0), SLIDE_WIDTH, Inches(0.08), ACCENT_BLUE)

    # Left accent bar
    add_decorative_bar(slide, Inches(1.5), Inches(1.5), Inches(0.08), Inches(4.5), ACCENT_BLUE)

    # Document icon area
    icon_shape = add_shape(slide, MSO_SHAPE.ROUNDED_RECTANGLE, Inches(2.0), Inches(1.6),
                           Inches(1.2), Inches(1.2), fill_color=ACCENT_BLUE)
    tf = icon_shape.text_frame
    tf.word_wrap = False
    p = tf.paragraphs[0]
    p.text = "📄"
    p.font.size = Pt(40)
    p.alignment = PP_ALIGN.CENTER
    p.font.name = "Segoe UI Emoji"

    # Project Name
    add_textbox(slide, Inches(2.0), Inches(3.0), Inches(9), Inches(0.9),
                "PaperVault", font_size=52, font_color=WHITE, bold=True, font_name="Calibri")

    # Subtitle
    add_textbox(slide, Inches(2.0), Inches(3.85), Inches(9), Inches(0.55),
                "Previous Year Question Paper Sharing Platform", font_size=22,
                font_color=LIGHT_BLUE, font_name="Calibri")

    # Divider line
    add_decorative_bar(slide, Inches(2.0), Inches(4.55), Inches(3), Inches(0.04), ACCENT_BLUE)

    # Presenter details
    details = [
        "Presented By:  Vikesh Kumar",
        "UID:  25MCI10099",
        "MCA (AI & ML)  |  Chandigarh University"
    ]
    add_multiline_textbox(slide, Inches(2.0), Inches(4.8), Inches(6), Inches(1.5),
                          details, font_size=16, font_color=RGBColor(0xB0, 0xBE, 0xC5),
                          font_name="Calibri", line_spacing=1.8)

    # Bottom bar
    add_decorative_bar(slide, Inches(0), Inches(7.28), SLIDE_WIDTH, Inches(0.22), ACCENT_BLUE)

    # Academic year
    add_textbox(slide, Inches(9.5), Inches(6.5), Inches(3.5), Inches(0.4),
                "Academic Year 2025–2026", font_size=13, font_color=GRAY_TEXT,
                alignment=PP_ALIGN.RIGHT, font_name="Calibri")

    # Speaker Notes
    notes_slide = slide.notes_slide
    notes_slide.notes_text_frame.text = (
        "Good morning/afternoon everyone. I am Vikesh Kumar, UID 25MCI10099, "
        "pursuing MCA in AI & ML from Chandigarh University. "
        "Today I'll present my project – PaperVault, a Previous Year Question Paper Sharing Platform. "
        "This project addresses a common problem faced by students: finding previous year question papers. "
        "Let me walk you through the problem, our solution, and how we built it."
    )


# ══════════════════════════════════════════════════════════════════════════
# SLIDE 2: Problem Statement
# ══════════════════════════════════════════════════════════════════════════
def create_slide_2(prs):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    set_slide_bg(slide, SLIDE_BG)
    add_header_section(slide, "Problem Statement",
                       "Why do students need PaperVault?", 2)

    # Problem cards - 2x2 grid
    problems = [
        ("🔍", "Difficult Discovery", "Students struggle to find previous year question papers before exams, wasting valuable study time.", RED_ACCENT),
        ("📱", "Scattered Resources", "Papers are scattered across WhatsApp groups, Google Drives, and personal collections with no organization.", ORANGE_ACCENT),
        ("🗄️", "No Central Repository", "There is no centralized, searchable platform for storing and retrieving academic question papers.", PRIMARY_BLUE),
        ("⚡", "Need for Simplicity", "Students need a simple, fast, and reliable academic repository that requires no registration to access.", TEAL_ACCENT),
    ]

    positions = [
        (Inches(0.5), Inches(1.6)),
        (Inches(6.7), Inches(1.6)),
        (Inches(0.5), Inches(4.4)),
        (Inches(6.7), Inches(4.4)),
    ]

    for i, (icon, title, desc, color) in enumerate(problems):
        left, top = positions[i]
        card_w = Inches(6.0)
        card_h = Inches(2.4)

        # Card background
        add_shape(slide, MSO_SHAPE.ROUNDED_RECTANGLE, left, top, card_w, card_h,
                  fill_color=WHITE, line_color=VERY_LIGHT_BLUE, line_width=1.5)

        # Color accent on left
        add_decorative_bar(slide, left + Inches(0.08), top + Inches(0.3), Inches(0.06), Inches(1.8), color)

        # Icon
        add_circle_icon(slide, left + Inches(0.4), top + Inches(0.35), Inches(0.7), color, icon, 22)

        # Number badge
        add_rounded_rect(slide, left + Inches(4.8), top + Inches(0.25), Inches(0.9), Inches(0.4),
                         color, f"0{i+1}", font_size=12, font_color=WHITE)

        # Title
        add_textbox(slide, left + Inches(1.3), top + Inches(0.35), Inches(3.3), Inches(0.45),
                    title, font_size=18, font_color=PRIMARY_BLUE, bold=True, font_name="Calibri")

        # Description
        add_textbox(slide, left + Inches(1.3), top + Inches(0.9), Inches(4.4), Inches(1.3),
                    desc, font_size=13, font_color=GRAY_TEXT, font_name="Calibri", line_spacing=1.5)

    # Speaker Notes
    notes_slide = slide.notes_slide
    notes_slide.notes_text_frame.text = (
        "Let's start with the problem. Every semester, students scramble to find previous year question papers. "
        "These papers are scattered across multiple WhatsApp groups, personal Google Drives, and informal channels. "
        "There's no single centralized platform where students can upload, search, and download these papers. "
        "What we need is a simple academic repository that doesn't require complex registration – "
        "just a clean, organized platform for sharing and accessing question papers."
    )


# ══════════════════════════════════════════════════════════════════════════
# SLIDE 3: Project Overview & Objectives
# ══════════════════════════════════════════════════════════════════════════
def create_slide_3(prs):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    set_slide_bg(slide, SLIDE_BG)
    add_header_section(slide, "Project Overview & Objectives",
                       "What PaperVault aims to achieve", 3)

    # Central project overview text
    add_textbox(slide, Inches(0.5), Inches(1.45), Inches(12.3), Inches(0.55),
                "PaperVault is a centralized question paper repository that simplifies academic document sharing and retrieval.",
                font_size=15, font_color=DARK_TEXT, font_name="Calibri", bold=False)

    # Objectives as horizontal cards
    objectives = [
        ("📚", "Centralized\nRepository", "Single platform for all\nquestion papers", ACCENT_BLUE),
        ("📤", "Easy Upload\nSystem", "Upload PDFs without\nany registration", TEAL_ACCENT),
        ("🔎", "Smart Search\n& Filters", "Find papers by subject,\nyear, and exam type", ORANGE_ACCENT),
        ("✅", "Admin Approval\nSystem", "Quality control through\nadmin review process", GREEN_ACCENT),
        ("👥", "Student\nAccess", "Free and easy access\nfor all students", PURPLE_ACCENT),
    ]

    card_w = Inches(2.25)
    card_h = Inches(4.4)
    start_x = Inches(0.5)
    gap = Inches(0.28)
    top_y = Inches(2.2)

    for i, (icon, title, desc, color) in enumerate(objectives):
        left = start_x + i * (card_w + gap)

        # Card background
        card = add_shape(slide, MSO_SHAPE.ROUNDED_RECTANGLE, left, top_y, card_w, card_h,
                         fill_color=WHITE, line_color=VERY_LIGHT_BLUE, line_width=1.5)

        # Top color bar
        add_decorative_bar(slide, left + Inches(0.1), top_y + Inches(0.05), card_w - Inches(0.2),
                           Inches(0.06), color)

        # Icon circle
        icon_size = Inches(0.9)
        add_circle_icon(slide, left + (card_w - icon_size) / 2, top_y + Inches(0.4),
                        icon_size, color, icon, 28)

        # Number
        add_textbox(slide, left, top_y + Inches(1.5), card_w, Inches(0.35),
                    f"0{i+1}", font_size=12, font_color=color, bold=True,
                    alignment=PP_ALIGN.CENTER, font_name="Calibri")

        # Title
        add_textbox(slide, left + Inches(0.15), top_y + Inches(1.85), card_w - Inches(0.3), Inches(0.7),
                    title, font_size=14, font_color=PRIMARY_BLUE, bold=True,
                    alignment=PP_ALIGN.CENTER, font_name="Calibri")

        # Description
        add_textbox(slide, left + Inches(0.15), top_y + Inches(2.65), card_w - Inches(0.3), Inches(1.2),
                    desc, font_size=12, font_color=GRAY_TEXT,
                    alignment=PP_ALIGN.CENTER, font_name="Calibri", line_spacing=1.5)

        # Bottom accent line
        add_decorative_bar(slide, left + Inches(0.6), top_y + card_h - Inches(0.3),
                           card_w - Inches(1.2), Inches(0.04), color)

    # Speaker Notes
    notes_slide = slide.notes_slide
    notes_slide.notes_text_frame.text = (
        "PaperVault is designed with five core objectives. "
        "First, it serves as a centralized repository – one place for all question papers. "
        "Second, the upload system is frictionless – students can upload PDFs without registration. "
        "Third, we provide smart search and filtering by subject, year, and exam type. "
        "Fourth, an admin approval system ensures quality control – every uploaded paper is reviewed. "
        "And fifth, all approved papers are freely accessible to every student. "
        "These objectives together create a streamlined academic document-sharing ecosystem."
    )


# ══════════════════════════════════════════════════════════════════════════
# SLIDE 4: Technology Stack
# ══════════════════════════════════════════════════════════════════════════
def create_slide_4(prs):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    set_slide_bg(slide, SLIDE_BG)
    add_header_section(slide, "Technology Stack",
                       "Layered architecture with modern technologies", 4)

    # Architecture layers - stacked from top to bottom
    layers = [
        ("PRESENTATION LAYER", "React.js  •  Tailwind CSS  •  Axios  •  Responsive UI", ACCENT_BLUE, "⚛️"),
        ("API LAYER", "Express.js APIs  •  Netlify Serverless Functions  •  REST Endpoints", MEDIUM_BLUE, "🔗"),
        ("SECURITY LAYER", "JWT Authentication  •  Protected Routes  •  Admin Authorization", ORANGE_ACCENT, "🔒"),
        ("DATA LAYER", "MongoDB Atlas  •  GridFS (PDF Storage)  •  Metadata Collections", GREEN_ACCENT, "🗃️"),
        ("HOSTING & DEPLOYMENT", "Netlify  •  CI/CD Pipeline  •  Serverless Architecture", PURPLE_ACCENT, "☁️"),
    ]

    layer_w = Inches(10.5)
    layer_h = Inches(0.85)
    start_x = Inches(1.4)
    start_y = Inches(1.6)
    gap = Inches(0.2)

    for i, (name, tech, color, icon) in enumerate(layers):
        top = start_y + i * (layer_h + gap)

        # Layer shape
        layer = add_rounded_rect(slide, start_x, top, layer_w, layer_h, color,
                                 "", font_size=12)

        # Icon
        add_textbox(slide, start_x + Inches(0.3), top + Inches(0.12), Inches(0.5), Inches(0.6),
                    icon, font_size=22, font_color=WHITE, alignment=PP_ALIGN.CENTER,
                    font_name="Segoe UI Emoji")

        # Layer name
        add_textbox(slide, start_x + Inches(0.9), top + Inches(0.08), Inches(3.5), Inches(0.35),
                    name, font_size=14, font_color=WHITE, bold=True, font_name="Calibri")

        # Technologies
        add_textbox(slide, start_x + Inches(0.9), top + Inches(0.43), Inches(9), Inches(0.35),
                    tech, font_size=12, font_color=RGBColor(0xE8, 0xEA, 0xF6), font_name="Calibri")

        # Arrows between layers
        if i < len(layers) - 1:
            arrow_left = start_x + layer_w / 2 - Inches(0.175)
            arrow_top = top + layer_h
            add_arrow_down(slide, arrow_left, arrow_top, gap, GRAY_TEXT)

    # Side panel - key highlights
    panel_x = Inches(0.3)
    panel_y = Inches(1.6)
    panel_w = Inches(0.9)

    highlights = [
        ("F", ACCENT_BLUE),
        ("A", MEDIUM_BLUE),
        ("S", ORANGE_ACCENT),
        ("D", GREEN_ACCENT),
        ("H", PURPLE_ACCENT),
    ]
    for i, (letter, color) in enumerate(highlights):
        top = panel_y + i * (layer_h + gap)
        add_circle_icon(slide, panel_x + Inches(0.15), top + Inches(0.13), Inches(0.55),
                        color, letter, 16)

    # Speaker Notes
    notes_slide = slide.notes_slide
    notes_slide.notes_text_frame.text = (
        "Our technology stack follows a clean layered architecture. "
        "The Presentation Layer uses React.js with Tailwind CSS for a responsive, modern UI, and Axios for API calls. "
        "The API Layer is built with Express.js, deployed as Netlify Serverless Functions for scalability. "
        "Security is handled through JWT Authentication with protected routes and admin authorization. "
        "The Data Layer uses MongoDB Atlas for metadata and GridFS for storing large PDF files. "
        "Finally, the entire application is hosted on Netlify with a CI/CD pipeline for seamless deployment. "
        "This serverless architecture ensures cost-efficiency and automatic scaling."
    )


# ══════════════════════════════════════════════════════════════════════════
# SLIDE 5: System Architecture
# ══════════════════════════════════════════════════════════════════════════
def create_slide_5(prs):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    set_slide_bg(slide, SLIDE_BG)
    add_header_section(slide, "System Architecture",
                       "Data flow and component interaction diagram", 5)

    # ─── Left Flow: Student/User Flow ─────────────────────
    left_x = Inches(0.8)
    flow_w = Inches(2.5)
    box_h = Inches(0.7)

    # Student/User box
    add_rounded_rect(slide, left_x, Inches(1.6), flow_w, box_h, ACCENT_BLUE,
                     "👤  Student / User", 13)

    add_arrow_down(slide, left_x + flow_w/2 - Inches(0.175), Inches(2.3), Inches(0.35), ACCENT_BLUE)

    # React Frontend
    add_rounded_rect(slide, left_x, Inches(2.65), flow_w, box_h, MEDIUM_BLUE,
                     "⚛️  React Frontend", 13)

    add_arrow_down(slide, left_x + flow_w/2 - Inches(0.175), Inches(3.35), Inches(0.35), MEDIUM_BLUE)

    # Netlify Functions
    add_rounded_rect(slide, left_x, Inches(3.7), flow_w, box_h, PRIMARY_BLUE,
                     "⚡  Netlify Serverless", 13)

    add_arrow_down(slide, left_x + flow_w/2 - Inches(0.175), Inches(4.4), Inches(0.35), PRIMARY_BLUE)

    # MongoDB Atlas
    add_rounded_rect(slide, left_x, Inches(4.75), flow_w, box_h, GREEN_ACCENT,
                     "🗃️  MongoDB Atlas", 13)

    add_arrow_down(slide, left_x + flow_w/2 - Inches(0.175), Inches(5.45), Inches(0.35), GREEN_ACCENT)

    # GridFS
    add_rounded_rect(slide, left_x, Inches(5.8), flow_w, box_h, TEAL_ACCENT,
                     "📦  GridFS PDF Storage", 13)

    # "USER FLOW" label
    add_textbox(slide, left_x, Inches(6.7), flow_w, Inches(0.35),
                "USER FLOW", font_size=11, font_color=ACCENT_BLUE, bold=True,
                alignment=PP_ALIGN.CENTER, font_name="Calibri")

    # ─── Center: Connection arrows ─────────────────────
    center_x = Inches(3.5)

    # Horizontal arrow from Netlify to Admin section
    add_arrow_right(slide, Inches(3.4), Inches(3.9), Inches(2.5), ORANGE_ACCENT)

    # Label on arrow
    add_textbox(slide, Inches(3.6), Inches(3.55), Inches(2.2), Inches(0.35),
                "API Requests", font_size=10, font_color=ORANGE_ACCENT, bold=True,
                alignment=PP_ALIGN.CENTER, font_name="Calibri")

    # ─── Right Flow: Admin Flow ──────────────────────────
    right_x = Inches(6.1)

    # Admin Dashboard
    add_rounded_rect(slide, right_x, Inches(1.6), flow_w, box_h, ORANGE_ACCENT,
                     "🛡️  Admin Dashboard", 13)

    add_arrow_down(slide, right_x + flow_w/2 - Inches(0.175), Inches(2.3), Inches(0.35), ORANGE_ACCENT)

    # JWT Auth
    add_rounded_rect(slide, right_x, Inches(2.65), flow_w, box_h, RED_ACCENT,
                     "🔐  JWT Authentication", 13)

    add_arrow_down(slide, right_x + flow_w/2 - Inches(0.175), Inches(3.35), Inches(0.35), RED_ACCENT)

    # Protected APIs
    add_rounded_rect(slide, right_x, Inches(3.7), flow_w, box_h, PRIMARY_BLUE,
                     "🔒  Protected APIs", 13)

    add_arrow_down(slide, right_x + flow_w/2 - Inches(0.175), Inches(4.4), Inches(0.35), PRIMARY_BLUE)

    # Approve/Reject
    add_rounded_rect(slide, right_x, Inches(4.75), flow_w, box_h, GREEN_ACCENT,
                     "✅  Approve / ❌  Reject", 13)

    # "ADMIN FLOW" label
    add_textbox(slide, right_x, Inches(5.6), flow_w, Inches(0.35),
                "ADMIN FLOW", font_size=11, font_color=ORANGE_ACCENT, bold=True,
                alignment=PP_ALIGN.CENTER, font_name="Calibri")

    # ─── Far Right: Data Flow Legend ─────────────────────
    legend_x = Inches(9.3)
    legend_y = Inches(1.6)
    legend_w = Inches(3.6)

    # Legend card
    add_shape(slide, MSO_SHAPE.ROUNDED_RECTANGLE, legend_x, legend_y, legend_w, Inches(5.2),
              fill_color=WHITE, line_color=VERY_LIGHT_BLUE, line_width=1.5)

    add_textbox(slide, legend_x + Inches(0.2), legend_y + Inches(0.15), legend_w - Inches(0.4), Inches(0.4),
                "📊  Data Flow Summary", font_size=14, font_color=PRIMARY_BLUE, bold=True, font_name="Calibri")

    add_decorative_bar(slide, legend_x + Inches(0.2), legend_y + Inches(0.55),
                       legend_w - Inches(0.4), Inches(0.03), ACCENT_BLUE)

    flow_items = [
        "1.  User browses/uploads papers via React UI",
        "2.  React sends API calls to Netlify Functions",
        "3.  Functions interact with MongoDB Atlas",
        "4.  PDFs stored in GridFS buckets",
        "5.  Admin logs in via JWT Auth",
        "6.  Admin reviews & approves/rejects via Protected APIs",
        "7.  Approved papers become visible to all users"
    ]

    add_multiline_textbox(slide, legend_x + Inches(0.2), legend_y + Inches(0.75),
                          legend_w - Inches(0.4), Inches(4.2),
                          flow_items, font_size=11, font_color=DARK_TEXT,
                          font_name="Calibri", line_spacing=1.8)

    # Speaker Notes
    notes_slide = slide.notes_slide
    notes_slide.notes_text_frame.text = (
        "This diagram shows the complete system architecture with two main flows. "
        "On the left, we have the User Flow: Students interact with the React frontend, "
        "which communicates with Netlify Serverless Functions. These functions connect to MongoDB Atlas "
        "for metadata and GridFS for PDF storage. "
        "On the right, we have the Admin Flow: Administrators access a dedicated dashboard, "
        "authenticate via JWT, and use protected APIs to review, approve, or reject submitted papers. "
        "The two flows are connected through the API layer, ensuring separation of concerns "
        "and proper access control."
    )


# ══════════════════════════════════════════════════════════════════════════
# SLIDE 6: Working Flow
# ══════════════════════════════════════════════════════════════════════════
def create_slide_6(prs):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    set_slide_bg(slide, SLIDE_BG)
    add_header_section(slide, "Working Flow",
                       "Step-by-step upload and approval workflow", 6)

    # Flowchart steps
    steps = [
        ("01", "Student\nUploads PDF", ACCENT_BLUE, "📤"),
        ("02", "PDF Stored\nin GridFS", TEAL_ACCENT, "📦"),
        ("03", "Metadata Saved\nin MongoDB", GREEN_ACCENT, "🗃️"),
        ("04", "Status:\nPending", ORANGE_ACCENT, "⏳"),
        ("05", "Admin\nReviews", PRIMARY_BLUE, "👁️"),
        ("06", "Approve /\nReject", RED_ACCENT, "✅"),
        ("07", "Approved Papers\nVisible to All", PURPLE_ACCENT, "🌐"),
    ]

    # Layout: horizontal flowchart
    box_w = Inches(1.45)
    box_h = Inches(1.4)
    start_x = Inches(0.5)
    arrow_len = Inches(0.3)
    y_pos = Inches(2.3)
    gap = Inches(0.35)

    total_width = len(steps) * box_w + (len(steps) - 1) * (arrow_len + gap)

    for i, (num, label, color, icon) in enumerate(steps):
        left = start_x + i * (box_w + arrow_len + gap)

        # Step box
        add_rounded_rect(slide, left, y_pos, box_w, box_h, color, "", 10)

        # Icon
        add_textbox(slide, left, y_pos + Inches(0.12), box_w, Inches(0.4),
                    icon, font_size=22, font_color=WHITE, alignment=PP_ALIGN.CENTER,
                    font_name="Segoe UI Emoji")

        # Step number
        add_textbox(slide, left, y_pos + Inches(0.52), box_w, Inches(0.3),
                    f"STEP {num}", font_size=8, font_color=RGBColor(0xE0, 0xE0, 0xFF),
                    bold=True, alignment=PP_ALIGN.CENTER, font_name="Calibri")

        # Label
        add_textbox(slide, left + Inches(0.05), y_pos + Inches(0.8), box_w - Inches(0.1), Inches(0.55),
                    label, font_size=10, font_color=WHITE, bold=True,
                    alignment=PP_ALIGN.CENTER, font_name="Calibri")

        # Arrow between steps
        if i < len(steps) - 1:
            arrow_x = left + box_w
            add_arrow_right(slide, arrow_x + Inches(0.02), y_pos + box_h/2 - Inches(0.15),
                            arrow_len + gap - Inches(0.04), GRAY_TEXT)

    # Detailed description below
    desc_y = Inches(4.2)
    desc_items = [
        ("Upload Phase", "Student fills in paper details (subject, year, exam type) and uploads PDF file through the React interface.", ACCENT_BLUE),
        ("Storage Phase", "The PDF is stored in GridFS (MongoDB's file storage) while metadata is saved in a MongoDB collection with status 'Pending'.", TEAL_ACCENT),
        ("Review Phase", "Admin logs into the dashboard, reviews pending submissions, previews the PDF, and approves or rejects each paper.", ORANGE_ACCENT),
        ("Access Phase", "Approved papers appear in search results and are accessible to all students for download.", PURPLE_ACCENT),
    ]

    for i, (phase, desc, color) in enumerate(desc_items):
        left = Inches(0.5) + i * Inches(3.15)
        top = desc_y

        # Phase card
        add_shape(slide, MSO_SHAPE.ROUNDED_RECTANGLE, left, top, Inches(2.95), Inches(2.6),
                  fill_color=WHITE, line_color=VERY_LIGHT_BLUE, line_width=1.5)

        # Color top bar
        add_decorative_bar(slide, left + Inches(0.1), top + Inches(0.06), Inches(2.75), Inches(0.05), color)

        # Phase name
        add_textbox(slide, left + Inches(0.15), top + Inches(0.2), Inches(2.65), Inches(0.35),
                    phase, font_size=13, font_color=color, bold=True, font_name="Calibri")

        # Description
        add_textbox(slide, left + Inches(0.15), top + Inches(0.6), Inches(2.65), Inches(1.8),
                    desc, font_size=11, font_color=GRAY_TEXT, font_name="Calibri", line_spacing=1.5)

    # Speaker Notes
    notes_slide = slide.notes_slide
    notes_slide.notes_text_frame.text = (
        "Let me walk you through the complete workflow. "
        "Step 1: A student uploads a PDF through the interface, providing metadata like subject name, year, and exam type. "
        "Step 2: The PDF file is stored in GridFS, MongoDB's file storage system designed for large files. "
        "Step 3: The paper's metadata is saved in a MongoDB collection. "
        "Step 4: The submission status is marked as 'Pending' for admin review. "
        "Step 5: The admin reviews the submission through the admin dashboard. "
        "Step 6: The admin can either approve or reject the submission. "
        "Step 7: Once approved, the paper becomes visible to all users in the search results. "
        "This workflow ensures quality control while keeping the upload process simple for students."
    )


# ══════════════════════════════════════════════════════════════════════════
# SLIDE 7: Key Features & Challenges
# ══════════════════════════════════════════════════════════════════════════
def create_slide_7(prs):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    set_slide_bg(slide, SLIDE_BG)
    add_header_section(slide, "Key Features & Challenges",
                       "Features implemented and challenges overcome", 7)

    # ─── Left side: Features ──────────────────────────
    features_x = Inches(0.5)
    features_y = Inches(1.5)

    # Features header
    add_rounded_rect(slide, features_x, features_y, Inches(6.0), Inches(0.6), ACCENT_BLUE,
                     "✨  KEY FEATURES", 14)

    features = [
        ("📤", "PDF Upload", "Upload question papers with metadata", ACCENT_BLUE),
        ("🔍", "Search & Filters", "Find papers by subject, year, type", MEDIUM_BLUE),
        ("🛡️", "Admin Dashboard", "Review, approve, or reject submissions", PRIMARY_BLUE),
        ("🔐", "JWT Authentication", "Secure admin access with tokens", ORANGE_ACCENT),
        ("📦", "GridFS Storage", "Handle large PDF files efficiently", GREEN_ACCENT),
        ("☁️", "Serverless Deploy", "Scalable Netlify serverless functions", PURPLE_ACCENT),
    ]

    for i, (icon, title, desc, color) in enumerate(features):
        top = features_y + Inches(0.8) + i * Inches(0.78)

        # Feature row
        add_shape(slide, MSO_SHAPE.ROUNDED_RECTANGLE, features_x, top, Inches(6.0), Inches(0.68),
                  fill_color=WHITE, line_color=VERY_LIGHT_BLUE, line_width=1)

        # Icon circle
        add_circle_icon(slide, features_x + Inches(0.15), top + Inches(0.09), Inches(0.5),
                        color, icon, 16)

        # Title
        add_textbox(slide, features_x + Inches(0.8), top + Inches(0.06), Inches(2.2), Inches(0.3),
                    title, font_size=12, font_color=PRIMARY_BLUE, bold=True, font_name="Calibri")

        # Desc
        add_textbox(slide, features_x + Inches(0.8), top + Inches(0.35), Inches(4.8), Inches(0.3),
                    desc, font_size=10, font_color=GRAY_TEXT, font_name="Calibri")

    # ─── Right side: Challenges ──────────────────────────
    challenges_x = Inches(6.8)
    challenges_y = Inches(1.5)

    # Challenges header
    add_rounded_rect(slide, challenges_x, challenges_y, Inches(6.0), Inches(0.6), ORANGE_ACCENT,
                     "🏆  CHALLENGES SOLVED", 14)

    challenges = [
        ("💾", "Large PDF Storage", "Used GridFS for files exceeding 16MB BSON limit", RED_ACCENT),
        ("🗄️", "MongoDB File Handling", "Implemented chunked file storage & retrieval", ORANGE_ACCENT),
        ("🔒", "Authentication", "Built JWT-based auth with refresh tokens", PRIMARY_BLUE),
        ("⚡", "Serverless Deployment", "Adapted Express.js for Netlify Functions", TEAL_ACCENT),
        ("📄", "PDF Streaming", "Implemented efficient streaming for previews", ACCENT_BLUE),
        ("🌐", "CORS & Security", "Configured cross-origin policies properly", GREEN_ACCENT),
    ]

    for i, (icon, title, desc, color) in enumerate(challenges):
        top = challenges_y + Inches(0.8) + i * Inches(0.78)

        # Challenge row
        add_shape(slide, MSO_SHAPE.ROUNDED_RECTANGLE, challenges_x, top, Inches(6.0), Inches(0.68),
                  fill_color=WHITE, line_color=VERY_LIGHT_BLUE, line_width=1)

        # Icon circle
        add_circle_icon(slide, challenges_x + Inches(0.15), top + Inches(0.09), Inches(0.5),
                        color, icon, 16)

        # Title
        add_textbox(slide, challenges_x + Inches(0.8), top + Inches(0.06), Inches(2.2), Inches(0.3),
                    title, font_size=12, font_color=PRIMARY_BLUE, bold=True, font_name="Calibri")

        # Desc
        add_textbox(slide, challenges_x + Inches(0.8), top + Inches(0.35), Inches(4.8), Inches(0.3),
                    desc, font_size=10, font_color=GRAY_TEXT, font_name="Calibri")

    # Speaker Notes
    notes_slide = slide.notes_slide
    notes_slide.notes_text_frame.text = (
        "Let's look at the key features and the challenges we overcame. "
        "On the features side: We built PDF upload with metadata, search and filter functionality, "
        "an admin dashboard for reviewing submissions, JWT authentication for security, "
        "GridFS for efficient PDF storage, and serverless deployment on Netlify. "
        "On the challenges side: We solved large PDF storage by using GridFS to bypass MongoDB's 16MB BSON limit. "
        "We implemented chunked file storage and retrieval for MongoDB file handling. "
        "JWT-based authentication with refresh tokens secures admin access. "
        "We adapted Express.js to work with Netlify's serverless function architecture. "
        "PDF streaming was optimized for efficient in-browser previews. "
        "And we properly configured CORS policies for secure cross-origin communication."
    )


# ══════════════════════════════════════════════════════════════════════════
# SLIDE 8: Conclusion & Future Scope
# ══════════════════════════════════════════════════════════════════════════
def create_slide_8(prs):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    set_slide_bg(slide, DARK_BLUE)

    # Top accent bar
    add_decorative_bar(slide, Inches(0), Inches(0), SLIDE_WIDTH, Inches(0.08), ACCENT_BLUE)

    # Decorative circles
    add_shape(slide, MSO_SHAPE.OVAL, Inches(-1), Inches(-1), Inches(3), Inches(3),
              fill_color=RGBColor(0x1B, 0x3A, 0x5C))
    add_shape(slide, MSO_SHAPE.OVAL, Inches(11), Inches(5.5), Inches(3.5), Inches(3.5),
              fill_color=RGBColor(0x1B, 0x3A, 0x5C))

    # Section 1: Conclusion
    conclusion_y = Inches(0.8)

    add_textbox(slide, Inches(0.8), conclusion_y, Inches(5), Inches(0.5),
                "📌  CONCLUSION", font_size=22, font_color=ACCENT_BLUE, bold=True, font_name="Calibri")

    add_decorative_bar(slide, Inches(0.8), conclusion_y + Inches(0.55), Inches(2), Inches(0.04), ACCENT_BLUE)

    conclusions = [
        "Built a scalable academic document-sharing platform",
        "Simplified question paper management and retrieval",
        "Implemented secure admin-controlled approval workflow",
        "Deployed as a fully serverless application"
    ]
    add_multiline_textbox(slide, Inches(0.8), conclusion_y + Inches(0.75), Inches(5.5), Inches(1.8),
                          conclusions, font_size=14, font_color=RGBColor(0xB0, 0xBE, 0xC5),
                          bullet=True, font_name="Calibri", line_spacing=1.8)

    # Section 2: Future Scope
    future_y = Inches(0.8)
    future_x = Inches(7.0)

    add_textbox(slide, future_x, future_y, Inches(5.5), Inches(0.5),
                "🚀  FUTURE ENHANCEMENTS", font_size=22, font_color=ORANGE_ACCENT, bold=True,
                font_name="Calibri")

    add_decorative_bar(slide, future_x, future_y + Inches(0.55), Inches(2), Inches(0.04), ORANGE_ACCENT)

    future_items = [
        ("👤", "Student Accounts", "Personal profiles & upload history"),
        ("🤖", "AI-Powered Search", "Smart recommendations using ML"),
        ("📝", "OCR Extraction", "Extract text content from PDFs"),
        ("📊", "Analytics Dashboard", "Usage stats and insights"),
        ("💡", "Subject Recommendations", "Personalized paper suggestions"),
    ]

    for i, (icon, title, desc) in enumerate(future_items):
        top = future_y + Inches(0.75) + i * Inches(0.55)

        add_textbox(slide, future_x, top, Inches(0.4), Inches(0.35),
                    icon, font_size=14, font_color=WHITE, font_name="Segoe UI Emoji")

        add_textbox(slide, future_x + Inches(0.45), top, Inches(2.2), Inches(0.3),
                    title, font_size=13, font_color=WHITE, bold=True, font_name="Calibri")

        add_textbox(slide, future_x + Inches(2.7), top, Inches(3), Inches(0.3),
                    desc, font_size=11, font_color=RGBColor(0x90, 0xA4, 0xAE), font_name="Calibri")

    # ─── Thank You Section ────────────────────────────────
    ty_y = Inches(4.2)

    # Divider
    add_decorative_bar(slide, Inches(2), ty_y, Inches(9.3), Inches(0.03), ACCENT_BLUE)

    # Thank You text
    add_textbox(slide, Inches(0), ty_y + Inches(0.3), SLIDE_WIDTH, Inches(1.0),
                "Thank You", font_size=48, font_color=WHITE, bold=True,
                alignment=PP_ALIGN.CENTER, font_name="Calibri")

    # Questions text
    add_textbox(slide, Inches(0), ty_y + Inches(1.3), SLIDE_WIDTH, Inches(0.5),
                "Questions & Answers", font_size=20, font_color=LIGHT_BLUE,
                alignment=PP_ALIGN.CENTER, font_name="Calibri")

    # Presenter info
    add_textbox(slide, Inches(0), ty_y + Inches(2.0), SLIDE_WIDTH, Inches(0.4),
                "Vikesh Kumar  |  25MCI10099  |  MCA (AI & ML)  |  Chandigarh University",
                font_size=13, font_color=GRAY_TEXT, alignment=PP_ALIGN.CENTER, font_name="Calibri")

    # Bottom bar
    add_decorative_bar(slide, Inches(0), Inches(7.28), SLIDE_WIDTH, Inches(0.22), ACCENT_BLUE)

    # Slide number
    add_slide_number(slide, 8)

    # Speaker Notes
    notes_slide = slide.notes_slide
    notes_slide.notes_text_frame.text = (
        "In conclusion, PaperVault successfully addresses the problem of scattered question papers "
        "by providing a centralized, searchable, and secure platform for academic document sharing. "
        "We built it with a modern tech stack – React, Express.js, MongoDB with GridFS, and serverless deployment. "
        "Looking ahead, we plan to add student accounts for personalized experiences, "
        "AI-powered search for smart recommendations, OCR extraction to make PDFs searchable by content, "
        "an analytics dashboard for usage insights, and subject-based recommendations. "
        "Thank you for your attention. I'm happy to take any questions."
    )


# ══════════════════════════════════════════════════════════════════════════
# MAIN: Generate the presentation
# ══════════════════════════════════════════════════════════════════════════
def main():
    prs = Presentation()

    # Set widescreen 16:9 dimensions
    prs.slide_width = SLIDE_WIDTH
    prs.slide_height = SLIDE_HEIGHT

    print("🎨 Creating Slide 1: Title Slide...")
    create_slide_1(prs)

    print("🎨 Creating Slide 2: Problem Statement...")
    create_slide_2(prs)

    print("🎨 Creating Slide 3: Project Overview & Objectives...")
    create_slide_3(prs)

    print("🎨 Creating Slide 4: Technology Stack...")
    create_slide_4(prs)

    print("🎨 Creating Slide 5: System Architecture...")
    create_slide_5(prs)

    print("🎨 Creating Slide 6: Working Flow...")
    create_slide_6(prs)

    print("🎨 Creating Slide 7: Key Features & Challenges...")
    create_slide_7(prs)

    print("🎨 Creating Slide 8: Conclusion & Future Scope...")
    create_slide_8(prs)

    # Save
    output_dir = os.path.dirname(os.path.abspath(__file__))
    output_path = os.path.join(output_dir, "PaperVault_Presentation.pptx")
    prs.save(output_path)
    print(f"\n✅ Presentation saved to: {output_path}")
    print(f"📊 Total slides: {len(prs.slides)}")


if __name__ == "__main__":
    main()
