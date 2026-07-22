import io
from fpdf import FPDF
from typing import List, Optional

class ATSFriendlyResumePDF(FPDF):
    def header(self):
        self.set_font("Helvetica", "B", 16)
        self.cell(0, 10, "Professional Resume", border=0, new_x="LMARGIN", new_y="NEXT", align="C")
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
    Generate clean, ATS-friendly PDF bytes from bullet points and profile metadata using fpdf2.
    """
    pdf = ATSFriendlyResumePDF()
    pdf.add_page()
    pdf.set_auto_page_break(auto=True, margin=15)
    
    # Title / Header
    pdf.set_font("Helvetica", "B", 18)
    pdf.cell(0, 10, user_name, border=0, new_x="LMARGIN", new_y="NEXT", align="L")
    
    if ultimate_goal:
        pdf.set_font("Helvetica", "I", 11)
        pdf.multi_cell(0, 6, f"Target Role: {ultimate_goal}")
        pdf.ln(3)

    if skills:
        pdf.set_font("Helvetica", "B", 12)
        pdf.cell(0, 8, "Core Competencies & Skills", border=0, new_x="LMARGIN", new_y="NEXT", align="L")
        pdf.set_font("Helvetica", "", 10)
        pdf.multi_cell(0, 6, ", ".join(skills))
        pdf.ln(4)

    # Experience / Key Highlights
    pdf.set_font("Helvetica", "B", 12)
    pdf.cell(0, 8, "Professional Highlights & Experience", border=0, new_x="LMARGIN", new_y="NEXT", align="L")
    pdf.set_font("Helvetica", "", 10)

    for bullet in bullets:
        clean_bullet = bullet.strip().lstrip("-•* ")
        pdf.multi_cell(0, 6, f"• {clean_bullet}")
        pdf.ln(1)

    pdf_output = pdf.output()
    return bytes(pdf_output)
