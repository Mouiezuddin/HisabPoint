"""
Server-side vector PDF generation for invoices using ReportLab.
Produces clean, printable, selectable-text A4 documents with zero browser UI.
"""
import io
from decimal import Decimal
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import mm
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    KeepTogether,
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_RIGHT, TA_LEFT

from .utils import amount_to_words_inr


def _format_inr(val):
    """Format Decimal or number as INR string."""
    if val is None:
        return "₹0.00"
    try:
        d = Decimal(str(val))
        return f"₹{d:,.2f}"
    except Exception:
        return f"₹{val}"


def generate_invoice_pdf(invoice, business_profile=None) -> bytes:
    """
    Generate an authentic A4 PDF invoice document for the given Invoice model instance.
    Returns bytes of the generated PDF file.
    """
    buffer = io.BytesIO()

    # Page setup: A4 with 14mm margins (~40 points)
    margin = 14 * mm
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=margin,
        rightMargin=margin,
        topMargin=margin,
        bottomMargin=margin,
        title=f"Invoice_{invoice.invoice_number}",
        author="HisabPoint",
    )

    printable_width = A4[0] - (2 * margin)  # ~515 points

    styles = getSampleStyleSheet()

    # Custom styles
    style_shop_title = ParagraphStyle(
        "ShopTitle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=16,
        leading=19,
        textColor=colors.HexColor("#0f172a"),
        textTransform="uppercase",
    )
    style_shop_meta = ParagraphStyle(
        "ShopMeta",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8.5,
        leading=11,
        textColor=colors.HexColor("#334155"),
    )
    style_doc_title = ParagraphStyle(
        "DocTitle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=13,
        leading=16,
        alignment=TA_RIGHT,
        textColor=colors.HexColor("#0f172a"),
    )
    style_doc_subtitle = ParagraphStyle(
        "DocSubtitle",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=7.5,
        leading=10,
        alignment=TA_RIGHT,
        textColor=colors.HexColor("#64748b"),
        textTransform="uppercase",
    )
    style_meta_head = ParagraphStyle(
        "MetaHeading",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=7.5,
        leading=10,
        textColor=colors.HexColor("#475569"),
        textTransform="uppercase",
    )
    style_meta_bold = ParagraphStyle(
        "MetaBold",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=9.5,
        leading=12,
        textColor=colors.HexColor("#0f172a"),
    )
    style_meta_text = ParagraphStyle(
        "MetaText",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8,
        leading=11,
        textColor=colors.HexColor("#1e293b"),
    )
    style_th = ParagraphStyle(
        "TableHead",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=8,
        leading=10,
        textColor=colors.HexColor("#0f172a"),
        textTransform="uppercase",
    )
    style_th_right = ParagraphStyle(
        "TableHeadRight",
        parent=style_th,
        alignment=TA_RIGHT,
    )
    style_th_center = ParagraphStyle(
        "TableHeadCenter",
        parent=style_th,
        alignment=TA_CENTER,
    )
    style_td = ParagraphStyle(
        "TableData",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8,
        leading=11,
        textColor=colors.HexColor("#1e293b"),
    )
    style_td_right = ParagraphStyle(
        "TableDataRight",
        parent=style_td,
        alignment=TA_RIGHT,
        fontName="Helvetica",
    )
    style_td_right_bold = ParagraphStyle(
        "TableDataRightBold",
        parent=style_td,
        alignment=TA_RIGHT,
        fontName="Helvetica-Bold",
    )
    style_td_center = ParagraphStyle(
        "TableDataCenter",
        parent=style_td,
        alignment=TA_CENTER,
    )

    story = []

    # 1. Shop details & Business Info
    shop_name = "HisabPoint Merchant"
    owner_name = ""
    address = ""
    phone = ""
    gstin = ""

    if business_profile:
        shop_name = business_profile.shop_name or shop_name
        owner_name = business_profile.owner_name or ""
        address = business_profile.address or ""
        phone = business_profile.phone or ""
        gstin = business_profile.gstin or ""
    elif hasattr(invoice.user, "business_profile"):
        bp = invoice.user.business_profile
        shop_name = bp.shop_name or shop_name
        owner_name = bp.owner_name or ""
        address = bp.address or ""
        phone = bp.phone or ""
        gstin = bp.gstin or ""

    is_tax_invoice = (invoice.tax_amount and invoice.tax_amount > 0) or bool(gstin.strip())
    doc_title_text = "TAX INVOICE" if is_tax_invoice else "RETAIL INVOICE / CASH MEMO"

    shop_info_elements = [
        Paragraph(shop_name, style_shop_title),
    ]
    if owner_name:
        shop_info_elements.append(Paragraph(f"<b>Prop:</b> {owner_name}", style_shop_meta))
    if address:
        shop_info_elements.append(Paragraph(address, style_shop_meta))
    if phone:
        shop_info_elements.append(Paragraph(f"<b>Phone:</b> +91 {phone}", style_shop_meta))
    if gstin:
        shop_info_elements.append(Paragraph(f"<b>GSTIN:</b> {gstin}", style_shop_meta))

    header_table_data = [
        [
            shop_info_elements,
            [
                Paragraph(doc_title_text, style_doc_title),
                Paragraph("Computer Generated Bill", style_doc_subtitle),
                Spacer(1, 4),
                Paragraph(f"<b>Invoice #:</b> {invoice.invoice_number}", style_doc_subtitle),
            ]
        ]
    ]

    header_table = Table(
        header_table_data,
        colWidths=[printable_width * 0.65, printable_width * 0.35],
    )
    header_table.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LINEBELOW", (0, 0), (-1, -1), 1.5, colors.HexColor("#0f172a")),
    ]))
    story.append(header_table)
    story.append(Spacer(1, 8))

    # 2. Meta Grid: Buyer Details (Left) + Invoice Particulars (Right)
    buyer_lines = [
        Paragraph("BILLED TO / BUYER DETAILS", style_meta_head),
        Spacer(1, 2),
        Paragraph(invoice.customer_name, style_meta_bold),
    ]
    if invoice.customer_phone:
        buyer_lines.append(Paragraph(f"Phone: {invoice.customer_phone}", style_meta_text))
    if getattr(invoice, "customer_address", None):
        buyer_lines.append(Paragraph(invoice.customer_address, style_meta_text))
    elif invoice.customer and invoice.customer.address:
        buyer_lines.append(Paragraph(invoice.customer.address, style_meta_text))
    else:
        buyer_lines.append(Paragraph("Counter Sale / Walk-in Customer", style_meta_text))

    buyer_lines.append(Paragraph("Place of Supply: <b>Local (Within State)</b>", style_meta_text))

    # Payment Status Label
    status_label = {
        "paid": "PAID",
        "partially_paid": "PARTIALLY PAID",
        "cancelled": "CANCELLED",
        "unpaid": "DUE",
    }.get(invoice.payment_status, "DUE")

    payment_mode_label = (
        "Credit (Udhar)" if invoice.payment_mode == "credit"
        else invoice.payment_mode.upper()
    )

    particulars_data = [
        [Paragraph("<b>Invoice No:</b>", style_meta_text), Paragraph(invoice.invoice_number, style_meta_bold)],
        [Paragraph("<b>Invoice Date:</b>", style_meta_text), Paragraph(str(invoice.invoice_date), style_meta_text)],
    ]
    if invoice.due_date:
        particulars_data.append(
            [Paragraph("<b>Due Date:</b>", style_meta_text), Paragraph(str(invoice.due_date), style_meta_text)]
        )
    particulars_data.append(
        [Paragraph("<b>Payment Mode:</b>", style_meta_text), Paragraph(payment_mode_label, style_meta_text)]
    )
    particulars_data.append(
        [Paragraph("<b>Payment Status:</b>", style_meta_text), Paragraph(f"<b>{status_label}</b>", style_meta_bold)]
    )

    particulars_table = Table(
        particulars_data,
        colWidths=[(printable_width * 0.5) * 0.45, (printable_width * 0.5) * 0.55],
    )
    particulars_table.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 1),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 1),
    ]))

    info_box_data = [
        [
            buyer_lines,
            [
                Paragraph("INVOICE PARTICULARS", style_meta_head),
                Spacer(1, 2),
                particulars_table,
            ]
        ]
    ]

    info_box = Table(
        info_box_data,
        colWidths=[printable_width * 0.5, printable_width * 0.5],
    )
    info_box.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("BOX", (0, 0), (-1, -1), 0.75, colors.HexColor("#0f172a")),
        ("INNERGRID", (0, 0), (-1, -1), 0.75, colors.HexColor("#0f172a")),
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
    ]))
    story.append(info_box)
    story.append(Spacer(1, 10))

    # 3. Item Table
    items_table_data = [
        [
            Paragraph("#", style_th_center),
            Paragraph("Description of Goods / Services", style_th),
            Paragraph("Qty", style_th_center),
            Paragraph("Unit", style_th_center),
            Paragraph("Rate (₹)", style_th_right),
            Paragraph("Amount (₹)", style_th_right),
        ]
    ]

    items = list(invoice.items.all().order_by("order", "id"))
    for idx, item in enumerate(items):
        qty_str = str(item.quantity) if item.quantity is not None else "-"
        unit_str = item.unit if (item.quantity is not None and item.unit) else "-"
        rate_str = _format_inr(item.unit_price) if item.unit_price is not None else "-"
        amt_str = _format_inr(item.amount)

        items_table_data.append([
            Paragraph(str(idx + 1), style_td_center),
            Paragraph(item.name, style_td),
            Paragraph(qty_str, style_td_center),
            Paragraph(unit_str, style_td_center),
            Paragraph(rate_str, style_td_right),
            Paragraph(amt_str, style_td_right_bold),
        ])

    col_widths = [
        25,                       # #
        printable_width - 25 - 45 - 45 - 80 - 90,  # Description
        45,                       # Qty
        45,                       # Unit
        80,                       # Rate
        90,                       # Amount
    ]

    items_table = Table(items_table_data, colWidths=col_widths, repeatRows=1)
    items_table.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#0f172a")),
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#f1f5f9")),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("LEFTPADDING", (0, 0), (-1, -1), 5),
        ("RIGHTPADDING", (0, 0), (-1, -1), 5),
    ]))
    story.append(items_table)
    story.append(Spacer(1, 10))

    # 4. Summary & Totals Grid
    amount_in_words = amount_to_words_inr(invoice.total_amount)

    left_summary_elements = [
        Paragraph("<b>Amount Chargeable in Words:</b>", style_meta_head),
        Paragraph(amount_in_words, style_meta_bold),
        Spacer(1, 6),
    ]

    if invoice.tax_amount and invoice.tax_amount > 0:
        half_tax_rate = (invoice.tax_rate / Decimal("2")).quantize(Decimal("0.01"))
        half_tax_amount = (invoice.tax_amount / Decimal("2")).quantize(Decimal("0.01"))
        left_summary_elements.extend([
            Paragraph("<b>Intra-State GST Breakdown:</b>", style_meta_head),
            Paragraph(
                f"CGST ({half_tax_rate}%): ₹{half_tax_amount:,.2f}  |  "
                f"SGST ({half_tax_rate}%): ₹{half_tax_amount:,.2f}  |  "
                f"Total GST ({invoice.tax_rate}%): ₹{invoice.tax_amount:,.2f}",
                style_meta_text,
            ),
            Spacer(1, 4),
        ])

    left_summary_elements.extend([
        Paragraph("<b>Terms & Conditions:</b>", style_meta_head),
        Paragraph(f"1. {invoice.terms or 'Goods once sold will not be taken back.'}", style_meta_text),
        Paragraph("2. Subject to local jurisdiction. E. & O.E.", style_meta_text),
    ])

    if invoice.notes:
        left_summary_elements.extend([
            Spacer(1, 2),
            Paragraph(f"<b>Note:</b> {invoice.notes}", style_meta_text),
        ])

    # Right side: Totals calculations
    totals_rows = [
        [Paragraph("Subtotal:", style_meta_text), Paragraph(_format_inr(invoice.subtotal), style_td_right_bold)],
    ]
    if invoice.discount_amount and invoice.discount_amount > 0:
        disc_label = f"Discount ({invoice.discount_value}%):" if invoice.discount_type == "percentage" else "Discount:"
        totals_rows.append([
            Paragraph(disc_label, style_meta_text),
            Paragraph(f"- {_format_inr(invoice.discount_amount)}", style_td_right_bold),
        ])
    if invoice.tax_amount and invoice.tax_amount > 0:
        totals_rows.append([
            Paragraph(f"GST ({invoice.tax_rate}%):", style_meta_text),
            Paragraph(f"+ {_format_inr(invoice.tax_amount)}", style_td_right_bold),
        ])

    totals_rows.append([
        Paragraph("<b>GRAND TOTAL:</b>", style_meta_bold),
        Paragraph(f"<b>{_format_inr(invoice.total_amount)}</b>", style_td_right_bold),
    ])

    if invoice.paid_amount and invoice.paid_amount > 0:
        totals_rows.append([
            Paragraph("Paid Amount:", style_meta_text),
            Paragraph(_format_inr(invoice.paid_amount), style_td_right_bold),
        ])

    balance_due = invoice.balance_due
    if balance_due > 0:
        totals_rows.append([
            Paragraph("<b>BALANCE DUE:</b>", style_meta_bold),
            Paragraph(f"<b>{_format_inr(balance_due)}</b>", style_td_right_bold),
        ])
    else:
        totals_rows.append([
            Paragraph("<b>STATUS:</b>", style_meta_bold),
            Paragraph("<b>✓ FULLY PAID</b>", style_td_right_bold),
        ])

    totals_table = Table(
        totals_rows,
        colWidths=[(printable_width * 0.42) * 0.55, (printable_width * 0.42) * 0.45],
    )
    totals_table.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 2),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
        ("LINEBELOW", (0, 0), (-1, -1), 0.25, colors.HexColor("#cbd5e1")),
    ]))

    summary_box_data = [
        [
            left_summary_elements,
            totals_table,
        ]
    ]

    summary_box = Table(
        summary_box_data,
        colWidths=[printable_width * 0.58, printable_width * 0.42],
    )
    summary_box.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("BOX", (0, 0), (-1, -1), 0.75, colors.HexColor("#0f172a")),
        ("INNERGRID", (0, 0), (-1, -1), 0.75, colors.HexColor("#0f172a")),
        ("BACKGROUND", (0, 0), (0, 0), colors.HexColor("#ffffff")),
        ("BACKGROUND", (1, 0), (1, 0), colors.HexColor("#f8fafc")),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
    ]))
    story.append(summary_box)
    story.append(Spacer(1, 14))

    # 5. Signatory Footer
    footer_data = [
        [
            [
                Paragraph("<i>Certified that the particulars given above are true and correct.</i>", style_shop_meta),
                Paragraph("This is a computer generated invoice and requires no physical signature.", style_shop_meta),
            ],
            [
                Paragraph(f"For <b>{shop_name}</b>", style_th_center),
                Spacer(1, 24),
                Paragraph("__________________________", style_td_center),
                Paragraph("Authorized Signatory", style_th_center),
            ]
        ]
    ]

    footer_table = Table(
        footer_data,
        colWidths=[printable_width * 0.65, printable_width * 0.35],
    )
    footer_table.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "BOTTOM"),
    ]))

    story.append(KeepTogether(footer_table))

    # Build PDF
    doc.build(story)
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes
