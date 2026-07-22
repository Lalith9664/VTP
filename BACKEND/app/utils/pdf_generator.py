import io
from fpdf import FPDF
from typing import List, Optional

def sanitize_latin1(text: str) -> str:
    """
    Replace common non-latin1 unicode characters with ASCII equivalents
    and strip any remaining unsupported characters to prevent FPDF crash.
    """
    if not text:
        return ""
    replacements = {
        "\u201d": '"', "\u201c": '"', "\u2019": "'", "\u2018": "'",
        "\u2014": "-", "\u2013": "-", "\u2022": "-", "\u2219": "-",
        "\u00b7": "-"
    }
    for orig, repl in replacements.items():
        text = text.replace(orig, repl)
    return text.encode("latin1", errors="ignore").decode("latin1")

class ATSFriendlyResumePDF(FPDF):
    def header(self):
        self.set_font("Helvetica", "B", 16)
        self.cell(0, 10, "Professional Resume", border=0, ln=1, align="C")
        self.ln(2)

    def footer(self):
        self.set_y(-15)
        self.set_font("Helvetica", "I", 8)
        self.cell(0, 10, f"Page {self.page_no()}", border=0, align="C")

def generate_resume_pdf(
    bullets: List[str], 
    user_name: Optional[str] = "Candidate",
    ultimate_goal: Optional[str] = None,
    skills: Optional[List[str]] = None
) -> bytes:
    """
    Generate clean, ATS-friendly PDF bytes from bullet points and profile metadata using standard fpdf.
    """
    pdf = ATSFriendlyResumePDF()
    pdf.add_page()
    pdf.set_auto_page_break(auto=True, margin=15)
    
    # Title / Header
    pdf.set_font("Helvetica", "B", 18)
    pdf.cell(0, 10, sanitize_latin1(user_name), border=0, ln=1, align="L")
    
    if ultimate_goal:
        pdf.set_font("Helvetica", "I", 11)
        pdf.multi_cell(0, 6, sanitize_latin1(f"Target Role: {ultimate_goal}"))
        pdf.ln(3)

    if skills:
        pdf.set_font("Helvetica", "B", 12)
        pdf.cell(0, 8, "Core Competencies & Skills", border=0, ln=1, align="L")
        pdf.set_font("Helvetica", "", 10)
        pdf.multi_cell(0, 6, sanitize_latin1(", ".join(skills)))
        pdf.ln(4)

    # Experience / Key Highlights
    pdf.set_font("Helvetica", "B", 12)
    pdf.cell(0, 8, "Professional Highlights & Experience", border=0, ln=1, align="L")
    pdf.set_font("Helvetica", "", 10)

    for bullet in bullets:
        clean_bullet = bullet.strip().lstrip("-•* ")
        pdf.multi_cell(0, 6, sanitize_latin1(f"- {clean_bullet}"))
        pdf.ln(1)

    # old fpdf returns a string for dest='S'. Encode it to latin1 to get raw PDF bytes.
    pdf_output = pdf.output(dest='S')
    if isinstance(pdf_output, str):
        return pdf_output.encode('latin1')
    return bytes(pdf_output)


