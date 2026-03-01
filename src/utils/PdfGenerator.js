import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
export default class PdfGenerator {

  // ─── Template loader ─────────────────────────────────────────────────
  async loadTemplate(filename) {
    const url = `/templates/${filename}`
    const res = await fetch(url)
    if (!res.ok) throw new Error(`Template not found: ${filename}`)
    return PDFDocument.load(await res.arrayBuffer())
  }

  // ─── Draw text (safe — skips null/undefined) ─────────────────────────
  draw(page, text, x, y, opts = {}) {
    if (text === null || text === undefined || text === '') return
    const str = String(text)
    const size = opts.size || 10
    const font = opts.font
    const color = opts.color || rgb(0.05, 0.05, 0.15)
    const max = opts.maxWidth || 999

    let out = str
    if (font && font.widthOfTextAtSize(out, size) > max) {
      while (out.length > 1 && font.widthOfTextAtSize(out + '…', size) > max) out = out.slice(0, -1)
      out += '…'
    }
    page.drawText(out, { x, y, size, font, color })
  }

  // ─── Utility helpers ─────────────────────────────────────────────────
  currency(n) { return (!n && n !== 0) ? '' : Number(n).toLocaleString('en-IN') }

  calcAge(dob) {
    if (!dob) return ''
    const b = new Date(dob), t = new Date()
    let a = t.getFullYear() - b.getFullYear()
    if (t.getMonth() < b.getMonth() || (t.getMonth() === b.getMonth() && t.getDate() < b.getDate())) a--
    return String(a)
  }

  fmtAddr(a) {
    if (!a) return ''
    if (typeof a === 'string') return a
    return [a.address_line, a.street, a.city, a.state, a.pincode].filter(Boolean).join(', ')
  }

  fullName(acc) { return [acc?.first_name, acc?.last_name].filter(Boolean).join(' ') }

  // ─── Customer Details Block (identical layout on both templates) ─────
  fillCustomer(page, font, bold, data) {
    const app = data.application || {}
    const acc = data.account || {}
    const addrs = data.addresses || []
    const pledge = data.pledge_details || {}

    const present = addrs.find(a => /present|current/i.test(a.address_type)) || addrs[0] || {}
    const perm = addrs.find(a => /permanent/i.test(a.address_type)) || addrs[1] || present
    const name = this.fullName(acc) || pledge.pledger_name || ''

    
    // Application No.
    this.draw(page, app.application_no, 109, 703, { font, size: 10, maxWidth: 380 })

    // Name
    this.draw(page, name, 72.5, 668, { font, size: 10, maxWidth: 440 })

    // Email ID  |  D.O.B.  |  Age
    this.draw(page, acc.email, 75, 653, { font, size: 9, maxWidth: 225 })
    this.draw(page, acc.date_of_birth, 312.5, 653, { font, size: 10, maxWidth: 90 })
    this.draw(page, this.calcAge(acc.date_of_birth), 417, 653, { font, size: 10 })

    // Mobile No.  |  Aadhar No.  |  PAN No.
    this.draw(page, app.mobile || acc.mobile, 94, 637, { font, size: 10, maxWidth: 120 })
    this.draw(page, acc.aadhar_no, 234, 637, { font, size: 10, maxWidth: 140 })
    this.draw(page, acc.pan_no, 386.5, 637, { font, size: 10, maxWidth: 110 })

    // Present Address
    this.draw(page, this.fmtAddr(present), 122, 619, { font, size: 8, maxWidth: 430 })

    // Permanent Address
    this.draw(page, this.fmtAddr(perm), 129, 589, { font, size: 8, maxWidth: 420 })

    // Occupation  |  Gender  |  Marital Status
    this.draw(page, acc.occupation, 96, 554, { font, size: 10, maxWidth: 155 })
    this.draw(page, acc.gender, 270, 554, { font, size: 10, maxWidth: 110 })
    this.draw(page, acc.marital_status, 405, 554, { font, size: 10, maxWidth: 120 })
  }

  // ═══════════════════════════════════════════════════════════════════════
  //  DIRECT BUYING PDF
  // ═══════════════════════════════════════════════════════════════════════
  async generateDirectBuyingPdf(data) {
    const pdfDoc = await this.loadTemplate('direct-buying.pdf')
    const font = await pdfDoc.embedFont(StandardFonts.TimesRoman)
    const bold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold)
    const page = pdfDoc.getPages()[0]

    const app = data.application || {}
    const acc = data.account || {}
    const ornaments = data.ornaments || []

    // ── Customer Details ──
    this.fillCustomer(page, font, bold, data)

    // ── Ownership Declaration: "I ______ hereby declare…" ──
    this.draw(page, this.fullName(acc), 45, 522, { font: bold, size: 10, maxWidth: 140 })

    // ── Ornaments Table ──
    //  Cols:  S.No  |  Item Name  |  Quantity  |  Approx. Weight (In GMS)  |  Item Photo
    const T = { sno: 37.5, item: 92.5, qty: 262.5, wt: 310, y0: 247, rh: 26, max: 5 }
    let tQty = 0, tWt = 0

    ornaments.slice(0, T.max).forEach((o, i) => {
      const y = T.y0 - i * T.rh
      this.draw(page, i + 1,                T.sno,  y, { font, size: 9 })
      this.draw(page, o.item_name,          T.item, y, { font, size: 9, maxWidth: 155 })
      this.draw(page, o.quantity,            T.qty,  y, { font, size: 9 })
      this.draw(page, o.approx_weight_gms,  T.wt,   y, { font, size: 9 })
      tQty += Number(o.quantity) || 0
      tWt  += Number(o.approx_weight_gms) || 0
    })

    // Totals
    this.draw(page, tQty,            112.5, 117, { font: bold, size: 10 })
    this.draw(page, tWt.toFixed(2),  310,   117, { font: bold, size: 10 })

    // ── Date & Place ──
    this.draw(page, app.application_date, 79, 57, { font, size: 10 })
    this.draw(page, app.place,            79, 43, { font, size: 10 })

    return pdfDoc.save()
  }

  // ═══════════════════════════════════════════════════════════════════════
  //  PLEDGE RELEASE PDF
  // ═══════════════════════════════════════════════════════════════════════
  async generatePledgeReleasePdf(data) {
    const pdfDoc = await this.loadTemplate('pledge-release.pdf')
    const font = await pdfDoc.embedFont(StandardFonts.TimesRoman)
    const bold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold)
    const page = pdfDoc.getPages()[0]

    const app = data.application || {}
    const pledge = data.pledge_details || {}
    const ornaments = data.ornaments || []

    // ── Customer Details ──
    this.fillCustomer(page, font, bold, data)

    // ── Gold Release Form — paragraph blanks ──

    // "I am _____ having gold ornaments pledged with _____, _____ branch"
    this.draw(page, pledge.pledger_name,   54,  512, { font: bold, size: 9, maxWidth: 95 })
    this.draw(page, pledge.financier_name, 260, 512, { font: bold, size: 9, maxWidth: 140 })
    this.draw(page, pledge.branch_name,    380, 512, { font: bold, size: 9, maxWidth: 80 })

    // "Mr. _____, to release… settling the total dues of Rs. _____,"
    this.draw(page, pledge.authorized_person,       36,  487, { font: bold, size: 9, maxWidth: 110 })
    this.draw(page, this.currency(pledge.total_due), 435, 487, { font: bold, size: 9, maxWidth: 90 })

    // "including Rs. _____ as principal and Rs. _____ as an interest"
    this.draw(page, this.currency(pledge.principal_amount), 87,  473, { font: bold, size: 9, maxWidth: 75 })
    this.draw(page, this.currency(pledge.interest_amount),  216, 473, { font: bold, size: 9, maxWidth: 90 })

    // "cheque No. ___ dated ___"
    this.draw(page, pledge.cheque_no,   320, 430, { font: bold, size: 9, maxWidth: 50 })
    this.draw(page, pledge.cheque_date, 376, 430, { font: bold, size: 9, maxWidth: 55 })

    // ── Ornaments table header fields ──
    const pledgerInfo = [pledge.pledger_name, pledge.pledger_address].filter(Boolean).join(', ')
    this.draw(page, pledgerInfo,                  160, 303, { font, size: 9, maxWidth: 390 })
    this.draw(page, pledge.gold_loan_account_no,  146, 289, { font, size: 9, maxWidth: 400 })

    // ── Ornament data rows ──
    //  Cols:  S.No  |  Item Name  |  Quantity  |  Purity (In Carats)  |  Approx. Weight (In GMS)
    const T = { sno: 37.5, item: 82.5, qty: 238.5, pur: 287.5, wt: 412.5, y0: 257, rh: 25, max: 5 }
    let tQty = 0, tWt = 0

    ornaments.slice(0, T.max).forEach((o, i) => {
      const y = T.y0 - i * T.rh
      this.draw(page, i + 1,                T.sno,  y, { font, size: 9 })
      this.draw(page, o.item_name,          T.item, y, { font, size: 9, maxWidth: 140 })
      this.draw(page, o.quantity,            T.qty,  y, { font, size: 9 })
      this.draw(page, o.purity_percentage,   T.pur,  y, { font, size: 9 })
      this.draw(page, o.approx_weight_gms,  T.wt,   y, { font, size: 9 })
      tQty += Number(o.quantity) || 0
      tWt  += Number(o.approx_weight_gms) || 0
    })

    // Totals
    this.draw(page, tQty,            112.5, 129, { font: bold, size: 10 })
    this.draw(page, tWt.toFixed(2),  312.5, 129, { font: bold, size: 10 })

    // ── Date & Place ──
    this.draw(page, app.application_date, 79, 57, { font, size: 10 })
    this.draw(page, app.place,            79, 43, { font, size: 10 })

    return pdfDoc.save()
  }

  // ═══════════════════════════════════════════════════════════════════════
  //  ESTIMATION PDF  (standalone — no template needed)
  // ═══════════════════════════════════════════════════════════════════════
  async generateEstimationPdf(data) {
    const pdfDoc = await PDFDocument.create()
    const font = await pdfDoc.embedFont(StandardFonts.TimesRoman)
    const bold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold)
    const page = pdfDoc.addPage([595.28, 841.89])
    const { width, height } = page.getSize()
    const blue = rgb(0.12, 0.22, 0.52)
    const gray = rgb(0.35, 0.35, 0.35)

    let y = height - 50

    page.drawText('SVS GOLD PRIVATE LIMITED', { x: 50, y, size: 16, font: bold, color: blue })
    y -= 20
    page.drawText('Estimation Report', { x: 50, y, size: 12, font, color: gray })
    y -= 25
    page.drawLine({ start: { x: 50, y }, end: { x: width - 50, y }, thickness: 1, color: rgb(0.75, 0.75, 0.75) })
    y -= 22

    page.drawText(`Estimation No: ${data.estimation_no || '—'}`, { x: 50, y, size: 10, font: bold })
    page.drawText(`Name: ${data.name || '—'}`, { x: 300, y, size: 10, font })
    y -= 16
    page.drawText(`Mobile: ${data.mobile || '—'}`, { x: 50, y, size: 10, font })
    y -= 28

    const cols = [50, 160, 245, 330, 430]
    const hdrs = ['Item Name', 'Gross Wt (g)', 'Net Wt (g)', 'Gold Rate/g', 'Net Amount']
    page.drawRectangle({ x: 45, y: y - 4, width: width - 90, height: 18, color: rgb(0.92, 0.93, 0.97) })
    hdrs.forEach((h, i) => page.drawText(h, { x: cols[i], y, size: 9, font: bold }))
    y -= 20

    let total = 0
    ;(data.items || []).forEach(it => {
      page.drawText(it.item_name || '—', { x: cols[0], y, size: 9, font })
      page.drawText(String(it.gross_weight || 0), { x: cols[1], y, size: 9, font })
      page.drawText(String(it.net_weight || 0), { x: cols[2], y, size: 9, font })
      page.drawText(String(it.gold_rate || 0), { x: cols[3], y, size: 9, font })
      page.drawText(String(it.net_amount || 0), { x: cols[4], y, size: 9, font })
      total += Number(it.net_amount) || 0
      y -= 16
    })

    y -= 4
    page.drawLine({ start: { x: 50, y: y + 10 }, end: { x: width - 50, y: y + 10 }, thickness: 0.5, color: rgb(0.7, 0.7, 0.7) })
    page.drawText('Grand Total:', { x: 330, y, size: 10, font: bold })
    page.drawText(`Rs. ${total.toFixed(2)}`, { x: 430, y, size: 10, font: bold, color: blue })

    return pdfDoc.save()
  }
}