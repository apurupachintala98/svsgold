import React, { useState, useEffect, useRef } from 'react'
import { ChevronLeft, Loader, AlertCircle, Download, Printer, FileDown } from 'lucide-react'
import { accountsAPI } from '../api/api'
import PdfGenerator from '../utils/PdfGenerator'
import { useNavigate } from 'react-router-dom'

export default function ApplicationPreview({ application, userIdentifier, onBack }) {
  const navigate = useNavigate()
  const printRef = useRef(null)
  const [previewData, setPreviewData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    (async () => {
      try {
        setLoading(true)
        let preview = {}

        const res = await accountsAPI.searchCustomer(userIdentifier)
        const d = res.data || {}
        const appId = application?.application_id

        // Match pledge & ornaments by application_id
        const allPledges = d.pledge_details || []
        const appPledge = appId ? allPledges.find(p => p.application_id === appId) : allPledges[0]
        const allOrnaments = d.ornaments || []
        const appOrnaments = appId ? allOrnaments.filter(o => o.application_id === appId) : allOrnaments

        preview = {
          account: d.customer || {},
          addresses: d.addresses || [],
          documents: d.documents || [],
          bank_account: d.bank_accounts?.[0] || null,
          pledge_details: appPledge || {},
          ornaments: appOrnaments
        }

        if (application) preview.application = { ...preview.application, ...application }
        setPreviewData(preview)
      } catch { setError('Failed to load preview data.') }
      finally { setLoading(false) }
    })()
  }, [application, userIdentifier])

  const handleDownloadPdf = async () => {
    if (!previewData) return
    try {
      setDownloading(true)
      const g = new PdfGenerator()
      const t = application?.application_type || previewData.application?.application_type || ''
      const b = t === 'PLEDGE_RELEASE' ? await g.generatePledgeReleasePdf(previewData) : await g.generateDirectBuyingPdf(previewData)
      const a = document.createElement('a')
      a.href = URL.createObjectURL(new Blob([b], { type: 'application/pdf' }))
      a.download = `${previewData.application?.application_no || 'application'}.pdf`
      a.click(); URL.revokeObjectURL(a.href)
    } catch { setError('Failed to generate PDF.') }
    finally { setDownloading(false) }
  }

  const handlePrint = () => {
    const h = printRef.current?.innerHTML; if (!h) return
    const w = window.open('', '_blank')
    w.document.write(`<html><head><title>Application</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Times New Roman',serif;background:#fff}@media print{.no-print{display:none!important}@page{margin:10mm}}</style></head><body>${h}</body></html>`)
    w.document.close(); setTimeout(() => { w.print(); w.close() }, 400)
  }

  /* ---- Data extraction ---- */
  const app = previewData?.application || {}
  const acc = previewData?.account || {}
  const addrs = previewData?.addresses || []
  const pledge = previewData?.pledge_details || {}
  const ornaments = previewData?.ornaments || []
  const docs = previewData?.documents || []
  const appType = application?.application_type || app.application_type || ''
  const isPR = appType === 'PLEDGE_RELEASE'

  const name = acc.name || [acc.first_name, acc.last_name].filter(Boolean).join(' ') || pledge.pledger_name || ''
  const present = addrs.find(a => /present|current|residential/i.test(a.address_type)) || addrs[0] || {}
  const perm = addrs.find(a => /permanent/i.test(a.address_type)) || addrs[1] || present
  const fA = (a) => typeof a === 'string' ? a : [a?.address_line, a?.street, a?.city, a?.state, a?.pincode].filter(Boolean).join(', ')
  const age = (d) => { if (!d) return ''; const b = new Date(d), t = new Date(); let a = t.getFullYear() - b.getFullYear(); if (t.getMonth() < b.getMonth() || (t.getMonth() === b.getMonth() && t.getDate() < b.getDate())) a--; return a }
  const cur = (n) => (!n && n !== 0) ? '' : Number(n).toLocaleString('en-IN')

  // Find photo from documents or account
  const photoDoc = docs.find(d => /photo/i.test(d.document_type))
  const photoUrl = acc.photo_url || photoDoc?.file_path || ''

  let tQ = 0, tW = 0
  ornaments.forEach(o => { tQ += Number(o.quantity) || 0; tW += Number(o.approx_weight_gms) || 0 })

  const blue = '#2c5f8a'
  const cb = '1px solid #6a9ec7'
  const hBg = 'linear-gradient(180deg, #3a7ab5, #2c5f8a)'
  const lbl = { border: cb, padding: '6px 10px', fontWeight: 'bold', background: '#f0f6fb', fontSize: '11px' }
  const val = { border: cb, padding: '6px 10px', fontSize: '11px' }

  if (loading) return (
    <div className="flex items-center justify-center h-96"><div className="text-center">
      <Loader size={48} className="animate-spin mx-auto mb-4" style={{ color: '#a36e24' }} /><p className="text-gray-600">Loading Preview...</p>
    </div></div>
  )

  return (
    <div className="space-y-6">
      {/* Action bar */}
      <div className="flex items-center justify-between no-print">
        <button onClick={onBack} className="flex items-center gap-2 px-4 py-2 text-amber-700 hover:bg-amber-50 rounded-xl font-medium transition-colors"><ChevronLeft size={20} /> Back to Applications</button>
       
      </div>

      {error && <div className="flex items-start gap-3 p-4 bg-red-50 border-2 border-red-200 rounded-xl"><AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} /><span className="text-sm text-red-700">{error}</span></div>}

      {/* ================================================================ */}
      {/*  PAGE 1: APPLICATION FORM                                       */}
      {/* ================================================================ */}
      <div ref={printRef}>
        <div style={{ fontFamily: "'Times New Roman',Georgia,serif", maxWidth: '750px', margin: '0 auto', background: '#fff', border: '1px solid #ddd', borderRadius: '4px', overflow: 'hidden' }}>

          {/* HEADER */}
          <div style={{ background: hBg, padding: '18px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ color: '#fff', lineHeight: '1.5' }}>
              <div style={{ fontSize: '16px', fontWeight: 'bold' }}>SVS GOLD PRIVATE LIMITED</div>
              <div style={{ fontSize: '10px', opacity: .85 }}>3-4-659/3, YMCA, Narayanguda,</div>
              <div style={{ fontSize: '10px', opacity: .85 }}>Himayathnagar, Hyderabad - 29</div>
              <div style={{ fontSize: '10px', opacity: .85 }}>98855 88220</div>
              <div style={{ fontSize: '10px', opacity: .85 }}>www.svsgold.com</div>
            </div>
            <div style={{ textAlign: 'center', color: '#fff' }}>
              <div style={{ fontSize: '20px', fontWeight: 'bold', letterSpacing: '2px' }}>APPLICATION FORM</div>
            </div>
            <div style={{ width: '100px', height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img src="/svslogo-white.png" alt="SVS Gold" style={{ maxHeight: '65px', maxWidth: '95px', objectFit: 'contain' }} />
            </div>
          </div>

          <div style={{ padding: '20px 28px' }}>

            {/* CUSTOMER DETAILS with Photo */}
            <div style={{ fontSize: '13px', fontWeight: 'bold', color: blue, marginBottom: '8px' }}>CUSTOMER DETAILS</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '16px' }}>
              <tbody>
                <tr>
                  <td style={lbl} width="120">Application No.</td>
                  <td style={val} colSpan={5}>{app.application_no || ''}</td>
                  {/* Photo cell spanning multiple rows */}
                  <td style={{ border: cb, padding: '4px', textAlign: 'center', verticalAlign: 'top', width: '90px' }} rowSpan={8}>
                    {photoUrl ? (
                      <img src={photoUrl} alt="Customer" style={{ width: '80px', height: '95px', objectFit: 'cover', borderRadius: '2px' }} />
                    ) : (
                      <div style={{ width: '80px', height: '95px', background: '#f0f6fb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', color: '#999', border: '1px dashed #bbb', margin: '0 auto' }}>Photo</div>
                    )}
                  </td>
                </tr>
                <tr>
                  <td style={lbl}>Name</td>
                  <td style={val} colSpan={5}>{name}</td>
                </tr>
                <tr>
                  <td style={lbl}>Email ID</td>
                  <td style={val}>{acc.email || ''}</td>
                  <td style={{ ...lbl, width: '60px' }}>D.O.B.</td>
                  <td style={val}>{acc.date_of_birth || ''}</td>
                  <td style={{ ...lbl, width: '40px' }}>Age</td>
                  <td style={{ ...val, width: '40px' }}>{age(acc.date_of_birth)}</td>
                </tr>
                <tr>
                  <td style={lbl}>Mobile No.</td>
                  <td style={val}>{app.mobile || acc.mobile || userIdentifier || ''}</td>
                  <td style={lbl}>Aadhar No.</td>
                  <td style={val}>{acc.aadhar_no != null ? String(acc.aadhar_no) : ''}</td>
                  <td style={lbl}>PAN No.</td>
                  <td style={val}>{acc.pan_no != null ? String(acc.pan_no) : ''}</td>
                </tr>
                <tr>
                  <td style={lbl}>Present Address</td>
                  <td style={val} colSpan={5}>{fA(present)}</td>
                </tr>
                <tr>
                  <td style={lbl}>Permanent Address</td>
                  <td style={val} colSpan={5}>{fA(perm)}</td>
                </tr>
                <tr>
                  <td style={lbl}>Occupation</td>
                  <td style={val}>{acc.occupation || ''}</td>
                  <td style={lbl}>Gender</td>
                  <td style={val}>{acc.gender || ''}</td>
                  <td style={lbl}>Marital Status</td>
                  <td style={val}>{acc.marital_status || ''}</td>
                </tr>
              </tbody>
            </table>

            {/* DECLARATION / RELEASE FORM */}
            {!isPR ? (
              <>
                <div style={{ fontSize: '14px', fontWeight: 'bold', textAlign: 'center', color: blue, marginBottom: '10px', textDecoration: 'underline' }}>OWNERSHIP DECLARATION</div>
                <div style={{ fontSize: '11px', lineHeight: '1.8', textAlign: 'justify', marginBottom: '20px' }}>
                  I <strong style={{ borderBottom: '1px solid #333', padding: '0 4px' }}>{name || '____________'}</strong> hereby declare on the oath that the gold items described below belongs to me, and I am the sole owner of the gold items which I offered to sell to <strong>SVS Gold Private Limited (' SVS Gold')</strong>. I confirm that I have acquired these properties legally and declare that I have clear, absolute transferable, and saleable rights on the articles offered to sell. I propose to sell the under-mentioned items to SVS Gold and confirm that all the information provided here are true and correct. I have thoroughly read and understood the Terms & Conditions mentioned along with the application form. I further state that I shall be legally held responsible to any Government Authority. If the gold items sold by me found to be stolen property, then SVS Gold shall have no liability or responsibility towards the payment of value of the same to me and can handover it to the Authorities, if required.
                </div>
              </>
            ) : (
              <>
                <div style={{ fontSize: '14px', fontWeight: 'bold', textAlign: 'center', color: blue, marginBottom: '10px', textDecoration: 'underline' }}>GOLD RELEASE FORM</div>
                <div style={{ fontSize: '11px', lineHeight: '1.9', textAlign: 'justify', marginBottom: '20px' }}>
                  I am <strong>{pledge.pledger_name || '______'}</strong> having gold ornaments pledged with <strong>{pledge.financier_name || '______'}</strong>, <strong>{pledge.branch_name || '______'}</strong> branch (the financier company), but my financial situation prevents me from releasing them. I have decided to sell these gold ornaments to <strong>SVS Gold Private Limited (' SVS Gold')</strong> and I am authorizing their representative, Mr. <strong>{pledge.authorized_person || '______'}</strong>, to release the ornaments on my behalf by settling the total dues of Rs. <strong>{cur(pledge.total_due) || '______'}</strong>, including Rs. <strong>{cur(pledge.principal_amount) || '______'}</strong> as principal and Rs. <strong>{cur(pledge.interest_amount) || '______'}</strong> as an interest to the financier / customer account directly. I have the original pawn ticket/loan documents for release. Once SVS Gold has possession of the gold ornaments, any remaining balance should be settled to me based on the rate declared by SVS Gold, minus their 5% margin on the market value of the gold ornaments. The documents submitted by me subsequently, if found to be incorrect or sham /not genuine in such event I shall be held liable to the financier company and SVS Gold. Also, I shall be solely responsible for any legal action. I hereby submit cheque No. <strong>{pledge.cheque_no || '______'}</strong> dated <strong>{pledge.cheque_date || '______'}</strong> against receipt of advance as a security deposit.
                </div>
              </>
            )}

            {/* ORNAMENTS TABLE */}
            <div style={{ fontSize: '11px', textAlign: 'center', fontWeight: 'bold', marginBottom: '6px', color: blue }}>List of the ornaments offered for sale to SVS GOLD</div>
            {isPR && (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                <tbody>
                  <tr><td style={lbl} width="180">Pledger Name and Address</td><td style={val}>{[pledge.pledger_name, pledge.pledger_address || fA(present)].filter(Boolean).join(', ')}</td></tr>
                  <tr><td style={lbl}>Gold Loan Account No</td><td style={val}>{pledge.gold_loan_account_no || ''}</td></tr>
                </tbody>
              </table>
            )}
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', marginBottom: '14px' }}>
              <thead>
                <tr style={{ background: '#f0f6fb' }}>
                  <th style={{ border: cb, padding: '7px 8px', textAlign: 'left', fontWeight: 'bold', width: '45px' }}>S. No.</th>
                  <th style={{ border: cb, padding: '7px 8px', textAlign: 'left', fontWeight: 'bold' }}>Item Name</th>
                  <th style={{ border: cb, padding: '7px 8px', textAlign: 'center', fontWeight: 'bold', width: '65px' }}>Quantity</th>
                  {isPR && <th style={{ border: cb, padding: '7px 8px', textAlign: 'center', fontWeight: 'bold', width: '100px' }}>Purity (In Carats)</th>}
                  <th style={{ border: cb, padding: '7px 8px', textAlign: 'center', fontWeight: 'bold', width: '130px' }}>Approx. Weight (In GMS)</th>
                  {!isPR && <th style={{ border: cb, padding: '7px 8px', textAlign: 'center', fontWeight: 'bold', width: '90px' }}>Item Photo</th>}
                </tr>
              </thead>
              <tbody>
                {ornaments.map((o, i) => (
                  <tr key={i}>
                    <td style={{ ...val, textAlign: 'center' }}>{i + 1}</td>
                    <td style={val}>{o.item_name || ''}</td>
                    <td style={{ ...val, textAlign: 'center' }}>{o.quantity || ''}</td>
                    {isPR && <td style={{ ...val, textAlign: 'center' }}>{o.purity_percentage || ''}</td>}
                    <td style={{ ...val, textAlign: 'center' }}>{o.approx_weight_gms || ''}</td>
                    {!isPR && <td style={{ ...val, textAlign: 'center', padding: '3px' }}>{o.item_photo_url ? <img src={o.item_photo_url} alt="" style={{ width: '36px', height: '36px', objectFit: 'cover', borderRadius: '3px' }} /> : ''}</td>}
                  </tr>
                ))}
                {Array.from({ length: Math.max(0, 5 - ornaments.length) }).map((_, i) => (
                  <tr key={`e${i}`}><td style={{ ...val, height: '26px' }}>&nbsp;</td><td style={val}>&nbsp;</td><td style={val}>&nbsp;</td>{isPR && <td style={val}>&nbsp;</td>}<td style={val}>&nbsp;</td>{!isPR && <td style={val}>&nbsp;</td>}</tr>
                ))}
                <tr style={{ background: '#f0f6fb' }}>
                  <td style={{ ...lbl }} colSpan={2}>Total No. of Quantity</td>
                  <td style={{ ...val, textAlign: 'center', fontWeight: 'bold' }}>{tQ || ''}</td>
                  {isPR && <td style={{ ...lbl, textAlign: 'center' }}>Total Approx. weight (Gms)</td>}
                  {!isPR && <td style={{ ...lbl, textAlign: 'center' }} colSpan={2}>Total Approx. weight (Gms)</td>}
                  <td style={{ ...val, textAlign: 'center', fontWeight: 'bold' }}>{tW ? tW.toFixed(2) : ''}</td>
                </tr>
              </tbody>
            </table>

            <div style={{ fontSize: '10.5px', lineHeight: '1.7', marginBottom: '16px' }}>
              These weights are approximate only.<br />
              I confirm that I have read, understood, and agree with the terms & conditions laid down by <strong>SVS Gold</strong> in the application form.
            </div>

            {/* DATE / PLACE / SIGNATURE */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '10px' }}>
              <table style={{ fontSize: '11px', borderCollapse: 'collapse' }}><tbody>
                <tr><td style={lbl}>Date</td><td style={{ ...val, minWidth: '150px' }}>{app.application_date || ''}</td></tr>
                <tr><td style={lbl}>Place</td><td style={val}>{app.place || ''}</td></tr>
              </tbody></table>
              <div style={{ textAlign: 'center' }}>
                <div style={{ width: '220px', borderBottom: '1px solid #666', paddingBottom: '40px', marginBottom: '4px' }}></div>
                <div style={{ fontSize: '10px', color: '#555' }}>Customer Signature / Thumb Impression</div>
              </div>
            </div>
          </div>

          {/* ================================================================ */}
          {/*  PAGE 2: TERMS & CONDITIONS                                     */}
          {/* ================================================================ */}
          <div style={{ borderTop: '3px solid #2c5f8a', padding: '24px 28px' }}>
            <div style={{ fontSize: '14px', fontWeight: 'bold', textAlign: 'center', color: blue, marginBottom: '14px', textDecoration: 'underline' }}>
              Our Terms and Conditions for Sale of Gold Items
            </div>
            <ol style={{ fontSize: '10px', lineHeight: '1.75', paddingLeft: '18px', color: '#1f2937', marginBottom: '20px' }}>
              <li style={{ marginBottom: '4px' }}><strong>SVS</strong> Gold Private Limited (" <strong>SVS</strong> Gold") will only accept Gold Items which are exclusively owned by the Seller and the Seller undertakes that the Gold Items are acquired by him/her/them either through purchase, gift or inheritance and has sole authority to sell the same.</li>
              <li style={{ marginBottom: '4px' }}><strong>SVS</strong> Gold will not return Gold Items once sold, under any circumstances to Seller(s). Once the purchase of Gold Items is concluded, Value/Gold will pay the value of Gold Items in Indian Rupees only to the bank account of the seller.</li>
              <li style={{ marginBottom: '4px' }}><strong>SVS</strong> Gold reserves all rights to accept or reject any application and/or offer for sale of Gold Items, without any explanation or justification.</li>
              <li style={{ marginBottom: '4px' }}>Upon purchase of Gold Items <strong>SVS</strong> Gold acquires absolute right to sell, transfer, assign, and accumulate all the rights and title on the Gold Items sold and shall be at liberty to deal with it including selling Gold Items to other individuals, entities, companies, and/or firms or melting of the purchased Gold Items.</li>
              <li style={{ marginBottom: '4px' }}><strong>SVS</strong> Gold shall not be held responsible if the Seller uses the sales proceeds for any illegal purposes like anti-national, criminal and/or anti-social activities.</li>
              <li style={{ marginBottom: '4px' }}>In case the sold Gold Items are found to be stolen or spurious article(s)/ornaments, then the Seller or his/her legal representative shall be held solely responsible for all the consequences, including criminal/legal liability, losses, damages and repayment of the entire amount with interest and (or) compensation to <strong>SVS</strong> Gold including legal costs and indemnify <strong>SVS</strong> Gold for damage and loss suffered by it.</li>
              <li style={{ marginBottom: '4px' }}><strong>SVS</strong> Gold shall reserve all the rights to verify the pledge information submitted by the Seller, upon verification if the information found to be false/ misleading then <strong>SVS</strong> Gold can take all measures like sharing the information to concerned Govt authorities either voluntarily or when called for by any Statutory body.</li>
              <li style={{ marginBottom: '4px' }}>In case, the Seller changes his/her mind about selling after releasing from the pledge financier and/or failed to release the pledge gold, he/she liable to reimburse the total advance paid to the financier.</li>
              <li style={{ marginBottom: '4px' }}>Any failure to reimburse the advance payment made to the financier by the Seller to <strong>SVS</strong> Gold before the end of the transaction day will result it to be treated as sale to <strong>SVS</strong> Gold.</li>
              <li style={{ marginBottom: '4px' }}>For the pledge gold release, if the value of such Gold Items is found to be less than the amount paid to the Seller in the form of advance towards the release of the pledge in such case the Seller shall be responsible for making the payment immediately for the difference amount to <strong>SVS</strong> Gold.</li>
              <li style={{ marginBottom: '4px' }}><strong>SVS</strong> Gold uses an internationally renowned XRF technology carat-checking machine to ascertain the purity of the Gold Items offered by Seller(s) for sale by an authorized valuator at our store. Purity readings may differ based on the checking/examination methodology.</li>
              <li style={{ marginBottom: '4px' }}><strong>SVS</strong> Gold shall not be held responsible for the loss of purity and weight after the melting, and Seller(s) will have to pay the losses as well as the transaction charges, if needed.</li>
              <li style={{ marginBottom: '4px' }}><strong>SVS</strong> Gold shall not be responsible for returning the item(s) in the same shape and size after melting, which appears like same as before melting.</li>
              <li style={{ marginBottom: '4px' }}><strong>SVS</strong> Gold may follow other examination procedures such as acid, salt, and other prevailing tests to confirm purity, if required.</li>
              <li style={{ marginBottom: '4px' }}><strong>SVS</strong> Gold shall deduct the weight of any material other than gold before arriving at the actual weight.</li>
              <li style={{ marginBottom: '4px' }}><strong>SVS</strong> Gold shall reserve all the rights to conduct physical or telephonic verification to establish the credibility and ownership of the Gold Items. This does not absolve the Seller's liability under points 1 and 6.</li>
              <li style={{ marginBottom: '4px' }}>The value will be based on the market price of 24-carat gold, which is subject to fluctuations during the day of melting/ acquiring the Gold Items.</li>
              <li style={{ marginBottom: '4px' }}><strong>SVS</strong> Gold shall take the Seller's biometric details for record purposes only, which shall be kept confidential.</li>
              <li style={{ marginBottom: '4px' }}>Seller(s) aged below 21 years must be accompanied by the legal guardian(s); both Seller(s) and legal guardian(s) are equally responsible for all the consequences, if any.</li>
              <li style={{ marginBottom: '4px' }}><strong>SVS</strong> Gold can charge up to 5% of the valuation of the ornaments to Seller, if he/she changes his/her mind about selling after ornament is dismantled and/or melted; this payment can be made in cash or gold to Seller by <strong>SVS</strong> Gold.</li>
              <li style={{ marginBottom: '4px' }}>All disputes arising from this transaction shall be settled by binding arbitration within the jurisdiction of Hyderabad, Telangana.</li>
            </ol>

            <div style={{ fontSize: '10.5px', lineHeight: '1.8', marginBottom: '24px', textAlign: 'justify' }}>
              By signing the declaration, the Seller agrees to all the terms and conditions and decides to sell the Gold Items of their free will, in a conscious state of mind, and without coercion or duress. Furthermore, the Seller is satisfied with the valuation methods and the amount <strong>SVS</strong> Gold offers as the sale proceeds.
            </div>

            {/* DATE / PLACE / SIGNATURE (Page 2) */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '24px' }}>
              <table style={{ fontSize: '11px', borderCollapse: 'collapse' }}><tbody>
                <tr><td style={lbl}>Date</td><td style={{ ...val, minWidth: '150px' }}>{app.application_date || ''}</td></tr>
                <tr><td style={lbl}>Place</td><td style={val}>{app.place || ''}</td></tr>
              </tbody></table>
              <div style={{ textAlign: 'center' }}>
                <div style={{ width: '220px', borderBottom: '1px solid #666', paddingBottom: '40px', marginBottom: '4px' }}></div>
                <div style={{ fontSize: '10px', color: '#555' }}>Customer Signature / Thumb Impression</div>
              </div>
            </div>

            {/* FOR OFFICE USE ONLY */}
            <div style={{ borderTop: '2px solid #2c5f8a', paddingTop: '16px' }}>
              <div style={{ fontSize: '13px', fontWeight: 'bold', textAlign: 'center', color: blue, marginBottom: '12px' }}>FOR OFFICE USE ONLY</div>
              <div style={{ fontSize: '10.5px', lineHeight: '1.8', textAlign: 'justify', marginBottom: '16px' }}>
                I have seen and verified all the customers original documents presented by him/her. Therefore, based on customers declaration, I believe the customer is genuine.
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <table style={{ fontSize: '11px', borderCollapse: 'collapse' }}><tbody>
                  <tr><td style={lbl}>Branch Manager Name</td><td style={{ ...val, minWidth: '180px' }}></td></tr>
                  <tr><td style={lbl}>Signature</td><td style={val}></td></tr>
                </tbody></table>
                <table style={{ fontSize: '11px', borderCollapse: 'collapse' }}><tbody>
                  <tr><td style={lbl}>Date</td><td style={{ ...val, minWidth: '120px' }}></td></tr>
                  <tr><td style={lbl}>Place</td><td style={val}></td></tr>
                </tbody></table>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* BOTTOM ACTIONS */}
      {(() => {
        const status = (application?.status || app.status || '').toUpperCase()
        const isSubmitted = ['SUBMITTED','APPROVED','COMPLETED'].includes(status)
        return (
          <>
            <div className="flex justify-center"><button onClick={handlePrint} className="px-6 py-2.5 bg-white text-gray-700 font-medium rounded-xl shadow-sm border border-gray-200 flex items-center gap-2 text-sm hover:bg-gray-50"><FileDown size={16} /> Print / Download</button></div>
            {!isSubmitted && (
              <div className="flex justify-center no-print">
                <button onClick={() => navigate('/estimation', { state: { application: previewData } })} className="px-10 py-3 text-white font-semibold rounded-xl shadow-lg flex items-center justify-center gap-2 text-sm transition-all hover:-translate-y-0.5" style={{ background: 'linear-gradient(135deg,#16a34a,#15803d)', boxShadow: '0 4px 14px rgba(22,163,74,0.3)' }}>
                  Accept & Continue to Estimation →
                </button>
              </div>
            )}
          </>
        )
      })()}
    </div>
  )
}