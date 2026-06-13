from __future__ import annotations

import re
import sys
from pathlib import Path
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    KeepTogether,
    PageBreak,
    PageTemplate,
    Paragraph,
    Preformatted,
    Spacer,
    Table,
    TableStyle,
)
from reportlab.platypus.tableofcontents import TableOfContents


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "study-guide" / "machine-learning-practical-study-guide.md"
OUTPUT_DIR = ROOT / "output" / "pdf"
OUTPUT = OUTPUT_DIR / "machine-learning-practical-study-guide-zh-TW.pdf"
FONT_REGULAR = Path(r"C:\Windows\Fonts\msjh.ttc")
FONT_BOLD = Path(r"C:\Windows\Fonts\msjhbd.ttc")
FONT_MONO = Path(r"C:\Windows\Fonts\consola.ttf")


def register_fonts() -> None:
    if not FONT_REGULAR.exists():
        raise FileNotFoundError(f"Missing font: {FONT_REGULAR}")
    pdfmetrics.registerFont(TTFont("MSJH", str(FONT_REGULAR), subfontIndex=0))
    pdfmetrics.registerFont(TTFont("MSJHBold", str(FONT_BOLD), subfontIndex=0))
    pdfmetrics.registerFont(TTFont("Consolas", str(FONT_MONO)))
    pdfmetrics.registerFontFamily(
        "MSJH", normal="MSJH", bold="MSJHBold",
        italic="MSJH", boldItalic="MSJHBold",
    )


class GuideDocTemplate(BaseDocTemplate):
    def __init__(self, filename: str, **kwargs):
        super().__init__(filename, **kwargs)

    def afterFlowable(self, flowable):
        if isinstance(flowable, Paragraph):
            style_name = flowable.style.name
            if style_name in {"H1", "H2"}:
                level = 0 if style_name == "H1" else 1
                text = flowable.getPlainText()
                key = f"heading-{id(flowable)}"
                self.canv.bookmarkPage(key)
                self.canv.addOutlineEntry(text, key, level=level, closed=False)
                self.notify("TOCEntry", (level, text, self.page, key))


def add_page_number(canvas, doc):
    canvas.saveState()
    width, height = A4
    if doc.page > 1:
        canvas.setStrokeColor(colors.HexColor("#D8E1EA"))
        canvas.setLineWidth(0.4)
        canvas.line(18 * mm, 14 * mm, width - 18 * mm, 14 * mm)
        canvas.setFont("MSJH", 8)
        canvas.setFillColor(colors.HexColor("#64748B"))
        canvas.drawString(18 * mm, 9.5 * mm, "機器學習模型實務研讀教材")
        canvas.drawRightString(width - 18 * mm, 9.5 * mm, str(doc.page))
    canvas.restoreState()


def build_styles():
    base = getSampleStyleSheet()
    ink = colors.HexColor("#132238")
    blue = colors.HexColor("#155E75")
    cyan = colors.HexColor("#0891B2")
    muted = colors.HexColor("#475569")

    styles = {
        "CoverKicker": ParagraphStyle(
            "CoverKicker", parent=base["Normal"], fontName="MSJH",
            fontSize=11, leading=16, textColor=cyan, alignment=TA_CENTER,
            spaceAfter=10,
        ),
        "CoverTitle": ParagraphStyle(
            "CoverTitle", parent=base["Title"], fontName="MSJHBold",
            fontSize=27, leading=38, textColor=ink, alignment=TA_CENTER,
            spaceAfter=12,
        ),
        "CoverSubtitle": ParagraphStyle(
            "CoverSubtitle", parent=base["Normal"], fontName="MSJH",
            fontSize=13, leading=21, textColor=muted, alignment=TA_CENTER,
            spaceAfter=16,
        ),
        "Body": ParagraphStyle(
            "Body", parent=base["BodyText"], fontName="MSJH",
            fontSize=10.2, leading=17.2, textColor=ink, alignment=TA_JUSTIFY,
            spaceAfter=6, wordWrap="CJK",
        ),
        "H1": ParagraphStyle(
            "H1", parent=base["Heading1"], fontName="MSJHBold",
            fontSize=17, leading=24, textColor=blue, spaceBefore=15,
            spaceAfter=8, keepWithNext=True, wordWrap="CJK",
        ),
        "H2": ParagraphStyle(
            "H2", parent=base["Heading2"], fontName="MSJHBold",
            fontSize=12.5, leading=19, textColor=colors.HexColor("#0F4C5C"),
            spaceBefore=10, spaceAfter=5, keepWithNext=True, wordWrap="CJK",
        ),
        "Bullet": ParagraphStyle(
            "Bullet", parent=base["BodyText"], fontName="MSJH",
            fontSize=9.9, leading=16.5, textColor=ink, leftIndent=15,
            firstLineIndent=-9, bulletIndent=3, spaceAfter=3, wordWrap="CJK",
        ),
        "Number": ParagraphStyle(
            "Number", parent=base["BodyText"], fontName="MSJH",
            fontSize=9.9, leading=16.5, textColor=ink, leftIndent=18,
            firstLineIndent=-13, spaceAfter=3, wordWrap="CJK",
        ),
        "Code": ParagraphStyle(
            "Code", parent=base["Code"], fontName="Consolas", fontSize=7.4,
            leading=10.5, textColor=colors.HexColor("#334155"),
            backColor=colors.HexColor("#F1F5F9"), borderColor=colors.HexColor("#CBD5E1"),
            borderWidth=0.5, borderPadding=7, leftIndent=2, rightIndent=2,
            spaceBefore=4, spaceAfter=8,
        ),
        "TOCTitle": ParagraphStyle(
            "TOCTitle", parent=base["Heading1"], fontName="MSJHBold",
            fontSize=18, leading=25, textColor=blue, alignment=TA_LEFT,
            spaceAfter=12,
        ),
        "TOC0": ParagraphStyle(
            "TOC0", fontName="MSJH", fontSize=10.5, leading=17,
            leftIndent=0, firstLineIndent=0, textColor=ink, spaceBefore=2,
        ),
        "TOC1": ParagraphStyle(
            "TOC1", fontName="MSJH", fontSize=9.2, leading=14,
            leftIndent=13, firstLineIndent=0, textColor=muted, spaceBefore=1,
        ),
    }
    return styles


def inline_markup(text: str) -> str:
    text = escape(text)
    text = re.sub(r"`([^`]+)`", r"<font name='Consolas'>\1</font>", text)
    text = re.sub(r"\*\*([^*]+)\*\*", r"<b>\1</b>", text)
    return text


def parse_table(lines, start):
    rows = []
    i = start
    while i < len(lines) and lines[i].lstrip().startswith("|"):
        cells = [cell.strip() for cell in lines[i].strip().strip("|").split("|")]
        if not all(re.fullmatch(r":?-{3,}:?", cell) for cell in cells):
            rows.append(cells)
        i += 1
    return rows, i


def build_story(markdown: str, styles):
    lines = markdown.splitlines()
    story = []
    in_code = False
    code_lines = []
    paragraph_buffer = []
    cover_done = False

    def flush_paragraph():
        if paragraph_buffer:
            text = " ".join(part.strip() for part in paragraph_buffer).strip()
            if text:
                story.append(Paragraph(inline_markup(text), styles["Body"]))
            paragraph_buffer.clear()

    i = 0
    while i < len(lines):
        raw = lines[i]
        line = raw.rstrip()

        if line.startswith("```"):
            flush_paragraph()
            if in_code:
                story.append(Preformatted("\n".join(code_lines), styles["Code"]))
                code_lines = []
                in_code = False
            else:
                in_code = True
            i += 1
            continue

        if in_code:
            code_lines.append(line)
            i += 1
            continue

        if not line.strip():
            flush_paragraph()
            i += 1
            continue

        if line.startswith("# "):
            flush_paragraph()
            title = line[2:].strip()
            if not cover_done:
                story.extend([
                    Spacer(1, 45 * mm),
                    Paragraph("PRACTICAL MACHINE LEARNING GUIDE", styles["CoverKicker"]),
                    Paragraph(inline_markup(title), styles["CoverTitle"]),
                ])
                cover_done = True
            i += 1
            continue

        if cover_done and line.startswith("副標題："):
            flush_paragraph()
            story.append(Paragraph(inline_markup(line.removeprefix("副標題：")), styles["CoverSubtitle"]))
            story.extend([
                Spacer(1, 7 * mm),
                Table(
                    [[Paragraph("實務導向", styles["Body"]), Paragraph("十種核心模型", styles["Body"]), Paragraph("完整建模流程", styles["Body"])]],
                    colWidths=[52 * mm, 52 * mm, 52 * mm],
                    style=TableStyle([
                        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#E6F5F8")),
                        ("TEXTCOLOR", (0, 0), (-1, -1), colors.HexColor("#155E75")),
                        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                        ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#B6DCE5")),
                        ("INNERGRID", (0, 0), (-1, -1), 0.3, colors.HexColor("#B6DCE5")),
                        ("TOPPADDING", (0, 0), (-1, -1), 8),
                        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
                    ]),
                ),
                Spacer(1, 50 * mm),
                Paragraph("適用於表格資料、文字、分群、降維與深度學習專案", styles["CoverSubtitle"]),
                PageBreak(),
                Paragraph("目錄", styles["TOCTitle"]),
            ])
            toc = TableOfContents()
            toc.levelStyles = [styles["TOC0"], styles["TOC1"]]
            story.extend([toc, PageBreak()])
            i += 1
            continue

        if line.startswith("版本："):
            i += 1
            continue

        if line.startswith("## "):
            flush_paragraph()
            story.append(Paragraph(inline_markup(line[3:].strip()), styles["H1"]))
            i += 1
            continue

        if line.startswith("### "):
            flush_paragraph()
            story.append(Paragraph(inline_markup(line[4:].strip()), styles["H2"]))
            i += 1
            continue

        if line.startswith("- "):
            flush_paragraph()
            story.append(Paragraph(inline_markup(line[2:].strip()), styles["Bullet"], bulletText="•"))
            i += 1
            continue

        numbered = re.match(r"^(\d+)\.\s+(.*)$", line)
        if numbered:
            flush_paragraph()
            story.append(Paragraph(
                inline_markup(numbered.group(2)), styles["Number"],
                bulletText=f"{numbered.group(1)}."
            ))
            i += 1
            continue

        if line.lstrip().startswith("|"):
            flush_paragraph()
            rows, i = parse_table(lines, i)
            if rows:
                data = [[Paragraph(inline_markup(cell), styles["Body"]) for cell in row] for row in rows]
                widths = [38 * mm, 42 * mm, 42 * mm, 45 * mm] if len(rows[0]) == 4 else None
                table = Table(data, colWidths=widths, repeatRows=1, hAlign="LEFT")
                table.setStyle(TableStyle([
                    ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#DCECF2")),
                    ("TEXTCOLOR", (0, 0), (-1, 0), colors.HexColor("#0F4C5C")),
                    ("GRID", (0, 0), (-1, -1), 0.35, colors.HexColor("#B8C7D1")),
                    ("VALIGN", (0, 0), (-1, -1), "TOP"),
                    ("LEFTPADDING", (0, 0), (-1, -1), 5),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 5),
                    ("TOPPADDING", (0, 0), (-1, -1), 5),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
                    ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F8FAFC")]),
                ]))
                story.extend([table, Spacer(1, 6)])
            continue

        paragraph_buffer.append(line)
        i += 1

    flush_paragraph()
    return story


def main() -> int:
    register_fonts()
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    markdown = SOURCE.read_text(encoding="utf-8")
    styles = build_styles()

    doc = GuideDocTemplate(
        str(OUTPUT), pagesize=A4,
        rightMargin=18 * mm, leftMargin=18 * mm,
        topMargin=17 * mm, bottomMargin=19 * mm,
        title="台灣產業機器學習模型實務研讀教材",
        author="Machine-Learning-Study",
        subject="Practical machine learning model selection and deployment guide",
    )
    frame = Frame(doc.leftMargin, doc.bottomMargin, doc.width, doc.height, id="main")
    doc.addPageTemplates([PageTemplate(id="guide", frames=[frame], onPage=add_page_number)])
    story = build_story(markdown, styles)
    doc.multiBuild(story)

    visible_text = re.sub(r"```.*?```", "", markdown, flags=re.S)
    visible_text = re.sub(r"[#|`*\-]", "", visible_text)
    cjk_count = len(re.findall(r"[\u3400-\u9fff]", visible_text))
    print(f"Wrote: {OUTPUT}")
    print(f"CJK characters: {cjk_count}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
