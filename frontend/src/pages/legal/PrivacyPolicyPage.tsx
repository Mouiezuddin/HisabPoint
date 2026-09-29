import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export function PrivacyPolicyPage() {
  const navigate = useNavigate();
  const [lang, setLang] = useState<'en' | 'hi'>('en');

  return (
    <div className="min-h-screen bg-wood-desk text-stone-900 selection:bg-gold-500 selection:text-forest-950 font-sans p-4 sm:p-8">
      <div className="max-w-4xl mx-auto bg-[#f7f4ea] rounded-3xl border-4 border-[#d4af37]/60 shadow-2xl p-6 sm:p-10 relative leather-stitch bg-paper-lines">
        {/* Navigation & Language Switcher Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 mb-6 border-b border-[#d6cbaf] gap-4">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate('/')}>
            <img
              src="/logo-mark.webp"
              alt="HisabPoint Logo"
              className="w-10 h-10 rounded-xl object-contain shadow-sm border border-[#c4b595] bg-[#f7f4ea]"
            />
            <div>
              <span className="text-2xl font-black font-serif text-[#194a32] tracking-tight group-hover:underline">
                HisabPoint
              </span>
              <p className="text-[11px] text-[#786f62] font-semibold">Privacy Policy & DPDP Act Compliance</p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-center">
            {/* Language Switcher mandated by Section 5(3) of DPDP Act 2023 */}
            <div className="flex items-center bg-[#eae3d2] p-1 rounded-xl border border-[#d6cbaf] text-xs font-bold">
              <button
                type="button"
                onClick={() => setLang('en')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  lang === 'en' ? 'bg-[#194a32] text-white shadow-xs' : 'text-stone-700 hover:text-stone-950'
                }`}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => setLang('hi')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  lang === 'hi' ? 'bg-[#194a32] text-white shadow-xs' : 'text-stone-700 hover:text-stone-950'
                }`}
              >
                हिन्दी (Hindi)
              </button>
            </div>

            <button
              onClick={() => navigate(-1)}
              className="px-3.5 py-1.5 text-xs font-bold rounded-xl border border-[#d6cbaf] bg-white text-stone-700 hover:bg-[#eae3d2] transition-colors"
            >
              ← Back
            </button>
          </div>
        </div>

        {/* Legal Notice Header */}
        <div className="space-y-2 mb-8">
          <div className="inline-block px-3 py-1 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-800 text-[11px] font-bold uppercase tracking-wider">
            {lang === 'en'
              ? 'Statutory Privacy Notice under DPDP Act, 2023 (India)'
              : 'डिजिटल व्यक्तिगत डेटा संरक्षण अधिनियम, 2023 के अंतर्गत सांविधिक सूचना'}
          </div>
          <h1 className="text-3xl sm:text-4xl font-black font-serif text-[#194a32]">
            {lang === 'en' ? 'Privacy Policy & Data Notice' : 'गोपनीयता नीति एवं डेटा सूचना'}
          </h1>
          <p className="text-xs text-[#786f62]">
            {lang === 'en'
              ? 'Last updated: September 2026 • Effective in compliance with Digital Personal Data Protection Act, 2023'
              : 'अंतिम अद्यतन: सितंबर 2026 • डिजिटल व्यक्तिगत डेटा संरक्षण अधिनियम, 2023 के अनुपालन में प्रभावी'}
          </p>
        </div>

        {/* Content Section: English or Hindi */}
        {lang === 'en' ? (
          <div className="space-y-6 text-sm text-[#423b32] leading-relaxed">
            {/* Visual Transparency Lifecycle */}
            <div className="bg-white p-5 rounded-2xl border border-[#ded5be] shadow-xs space-y-3">
              <h2 className="text-base font-black font-serif text-[#194a32] flex items-center gap-2">
                <span>📊</span>
                <span>At a Glance: What Happens to Your Data</span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5 text-xs">
                <div className="bg-[#f7f4ea] p-3 rounded-xl border border-[#e5dec8] space-y-1">
                  <span className="text-lg">📥</span>
                  <p className="font-bold text-stone-900">1. Collection</p>
                  <p className="text-[11px] text-stone-600">Only essential ledger records and merchant contact info.</p>
                </div>
                <div className="bg-[#f7f4ea] p-3 rounded-xl border border-[#e5dec8] space-y-1">
                  <span className="text-lg">🔒</span>
                  <p className="font-bold text-stone-900">2. Storage</p>
                  <p className="text-[11px] text-stone-600">Encrypted in PostgreSQL with tenant database isolation.</p>
                </div>
                <div className="bg-[#f7f4ea] p-3 rounded-xl border border-[#e5dec8] space-y-1">
                  <span className="text-lg">⚙️</span>
                  <p className="font-bold text-stone-900">3. Purpose</p>
                  <p className="text-[11px] text-stone-600">Solely for khata balance calculations and invoices.</p>
                </div>
                <div className="bg-[#f7f4ea] p-3 rounded-xl border border-[#e5dec8] space-y-1">
                  <span className="text-lg">🚫</span>
                  <p className="font-bold text-stone-900">4. Sharing</p>
                  <p className="text-[11px] text-stone-600">Zero ad networks. Never sold or rented to anyone.</p>
                </div>
                <div className="bg-[#f7f4ea] p-3 rounded-xl border border-[#e5dec8] space-y-1">
                  <span className="text-lg">🗑️</span>
                  <p className="font-bold text-stone-900">5. Erasure</p>
                  <p className="text-[11px] text-stone-600">Purged on command when you delete an entry or account.</p>
                </div>
              </div>
            </div>

            <section className="space-y-2">
              <h2 className="text-lg font-bold font-serif text-[#194a32]">1. Introduction & Data Fiduciary Identity</h2>
              <p>
                <strong>HisabPoint Technologies</strong> (&quot;HisabPoint&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) provides a cloud-based digital credit notebook (khata) and billing application for local merchants and small business owners in India.
              </p>
              <p>
                Under the <strong>Digital Personal Data Protection Act, 2023 (&quot;DPDP Act&quot;)</strong>, HisabPoint operates as a <strong>Data Fiduciary</strong> in respect of your shopkeeper account information, and as a <strong>Data Processor</strong> in respect of ledger entries and customer credit transactions you manage on behalf of your shop&apos;s patrons.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-bold font-serif text-[#194a32]">2. Categories of Personal Data Collected (Section 5 Notice)</h2>
              <div className="bg-white p-4 rounded-2xl border border-[#e5dec8] space-y-3">
                <div>
                  <h3 className="font-bold text-stone-900 text-xs uppercase tracking-wide">A. Shopkeeper (User) Data</h3>
                  <p className="text-xs text-stone-600 mt-1">
                    Full name, shop/business name, email address, mobile number, physical store address, GSTIN, encrypted password hashes (bcrypt/PBKDF2), Two-Factor Authentication TOTP keys, IP addresses, and secure authentication session tokens.
                  </p>
                </div>
                <div className="border-t border-stone-200 pt-3">
                  <h3 className="font-bold text-stone-900 text-xs uppercase tracking-wide">B. Customer Ledger Data</h3>
                  <p className="text-xs text-stone-600 mt-1">
                    Customer contact name, mobile number, delivery address, transaction history (credit given, payments received, transaction dates), itemized billing summaries, and invoice records created by you.
                  </p>
                </div>
              </div>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-bold font-serif text-[#194a32]">3. Purpose of Processing (Section 4 & 7)</h2>
              <p>We process personal data strictly for lawful and specified purposes:</p>
              <ul className="list-disc pl-5 space-y-1 text-xs text-stone-700">
                <li>Providing and maintaining your digital khata ledger and balance calculations.</li>
                <li>Generating and rendering GST-compliant invoices and receipt vouchers.</li>
                <li>Facilitating merchant-initiated WhatsApp payment reminders.</li>
                <li>Ensuring security, two-factor authentication, and preventing unauthorized brute-force account intrusion.</li>
                <li>Fulfilling legal and regulatory requirements under applicable laws of India.</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-bold font-serif text-[#194a32]">4. Your Rights as a Data Principal (Chapter III of DPDP Act)</h2>
              <p>Under the DPDP Act 2023, you enjoy complete sovereign control over your personal data:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="bg-[#f0ebe0] p-3.5 rounded-xl border border-[#ded5be] space-y-1">
                  <p className="font-bold text-[#194a32]">Right to Access Information (Sec 11)</p>
                  <p className="text-stone-600">
                    You have the right to obtain a full summary of personal data held about you and download an immediate, machine-readable JSON copy via the <strong>Export My Data</strong> feature in Settings.
                  </p>
                </div>
                <div className="bg-[#f0ebe0] p-3.5 rounded-xl border border-[#ded5be] space-y-1">
                  <p className="font-bold text-[#194a32]">Right to Correction & Erasure (Sec 12)</p>
                  <p className="text-stone-600">
                    You can update inaccurate details in your Profile. You also hold the statutory Right to Erasure (&quot;Right to be Forgotten&quot;) to permanently wipe your account and all associated customer ledger records.
                  </p>
                </div>
                <div className="bg-[#f0ebe0] p-3.5 rounded-xl border border-[#ded5be] space-y-1">
                  <p className="font-bold text-[#194a32]">Right of Grievance Redressal (Sec 13)</p>
                  <p className="text-stone-600">
                    You can lodge grievances directly with our designated Grievance Officer, who will resolve concerns within the statutory 30-day timeframe.
                  </p>
                </div>
                <div className="bg-[#f0ebe0] p-3.5 rounded-xl border border-[#ded5be] space-y-1">
                  <p className="font-bold text-[#194a32]">Right to Nominate (Sec 14)</p>
                  <p className="text-stone-600">
                    You have the right to nominate an authorized individual to exercise your data rights in the unfortunate event of death or incapacity.
                  </p>
                </div>
              </div>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-bold font-serif text-[#194a32]">5. Right to Withdraw Consent (Section 6(4))</h2>
              <p>
                You may withdraw your consent for personal data processing at any time. When you choose to withdraw consent or delete your account via <strong>Settings &gt; Privacy &gt; Delete Account</strong>, all your personal data, business profiles, and ledger transactions are immediately and irreversibly purged from our live database.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-bold font-serif text-[#194a32]">6. Protection of Children&apos;s Data (Section 9)</h2>
              <p>
                HisabPoint is exclusively designed for commercial business owners aged 18 years or older. We do not knowingly collect, track, profile, or process personal data belonging to children under 18 years of age without verifiable parental consent.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-bold font-serif text-[#194a32]">7. Grievance Redressal Officer & Escalation to DPBI</h2>
              <div className="bg-[#194a32] text-white p-5 rounded-2xl space-y-3">
                <p className="font-bold font-serif text-gold-300 text-sm">
                  Designated Data Protection & Grievance Officer:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-stone-200">
                  <p><strong>Name:</strong> Grievance Redressal Officer</p>
                  <p><strong>Designation:</strong> Head of Compliance & Privacy</p>
                  <p><strong>Email:</strong> <a href="mailto:grievance@hisabpoint.com" className="text-gold-300 underline">grievance@hisabpoint.com</a></p>
                  <p><strong>Resolution SLA:</strong> Acknowledged within 48h, resolved within 30 days</p>
                </div>
                <p className="text-[11px] text-emerald-200 pt-2 border-t border-emerald-800">
                  <strong>Appellate Escalation:</strong> If you are unsatisfied with the grievance resolution provided by HisabPoint, you have the statutory right under Section 18 of the DPDP Act 2023 to submit a complaint directly to the <strong>Data Protection Board of India (DPBI)</strong>.
                </p>
              </div>
            </section>
          </div>
        ) : (
          <div className="space-y-6 text-sm text-[#423b32] leading-relaxed font-sans">
            {/* Visual Transparency Lifecycle (Hindi) */}
            <div className="bg-white p-5 rounded-2xl border border-[#ded5be] shadow-xs space-y-3">
              <h2 className="text-base font-black font-serif text-[#194a32] flex items-center gap-2">
                <span>📊</span>
                <span>एक नज़र में: आपके डेटा के साथ क्या होता है?</span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5 text-xs">
                <div className="bg-[#f7f4ea] p-3 rounded-xl border border-[#e5dec8] space-y-1">
                  <span className="text-lg">📥</span>
                  <p className="font-bold text-stone-900">१. संग्रह</p>
                  <p className="text-[11px] text-stone-600">सिर्फ आवश्यक खाता रिकॉर्ड और संपर्क विवरण।</p>
                </div>
                <div className="bg-[#f7f4ea] p-3 rounded-xl border border-[#e5dec8] space-y-1">
                  <span className="text-lg">🔒</span>
                  <p className="font-bold text-stone-900">२. भंडारण</p>
                  <p className="text-[11px] text-stone-600">एन्क्रिप्टेड डेटाबेस और अलग-अलग खाता सुरक्षा।</p>
                </div>
                <div className="bg-[#f7f4ea] p-3 rounded-xl border border-[#e5dec8] space-y-1">
                  <span className="text-lg">⚙️</span>
                  <p className="font-bold text-stone-900">३. उपयोग</p>
                  <p className="text-[11px] text-stone-600">केवल बही-खाता हिसाब और बिल तैयार करने के लिए।</p>
                </div>
                <div className="bg-[#f7f4ea] p-3 rounded-xl border border-[#e5dec8] space-y-1">
                  <span className="text-lg">🚫</span>
                  <p className="font-bold text-stone-900">४. गोपनीयता</p>
                  <p className="text-[11px] text-stone-600">डेटा कभी किसी को बेचा या साझा नहीं किया जाता।</p>
                </div>
                <div className="bg-[#f7f4ea] p-3 rounded-xl border border-[#e5dec8] space-y-1">
                  <span className="text-lg">🗑️</span>
                  <p className="font-bold text-stone-900">५. डेटा मिटाना</p>
                  <p className="text-[11px] text-stone-600">आपके अनुरोध पर रिकॉर्ड हमेशा के लिए मिटा दिए जाते हैं।</p>
                </div>
              </div>
            </div>

            <section className="space-y-2">
              <h2 className="text-lg font-bold font-serif text-[#194a32]">१. परिचय एवं डेटा न्यासी (Data Fiduciary)</h2>
              <p>
                <strong>हिसाबपॉइंट टेक्नोलॉजीज</strong> (&quot;HisabPoint&quot;) भारत के स्थानीय व्यापारियों और छोटे दुकानदारों के लिए डिजिटल बही-खाता और बिलिंग सॉफ़्टवेयर प्रदान करता है।
              </p>
              <p>
                <strong>डिजिटल व्यक्तिगत डेटा संरक्षण अधिनियम, २०२३ (DPDP Act, 2023)</strong> के अनुसार, आपके दुकानदार खाते की जानकारी के लिए HisabPoint एक <strong>डेटा फिड्यूशरी (डेटा न्यासी)</strong> के रूप में कार्य करता है, तथा आपके ग्राहकों के उधारी/जमा रिकॉर्ड के संबंध में <strong>डेटा प्रोसेसर</strong> के रूप में सेवा प्रदान करता है।
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-bold font-serif text-[#194a32]">२. एकत्रित किए जाने वाले व्यक्तिगत डेटा (धारा ५ के तहत सूचना)</h2>
              <div className="bg-white p-4 rounded-2xl border border-[#e5dec8] space-y-3 text-xs">
                <div>
                  <h3 className="font-bold text-stone-900 uppercase">क. दुकानदार (उपयोगकर्ता) की जानकारी:</h3>
                  <p className="text-stone-600 mt-1">
                    पूरा नाम, दुकान का नाम, ईमेल, मोबाइल नंबर, दुकान का पता, GSTIN, एन्क्रिप्टेड पासवर्ड, और २-स्टेप सत्यापन (2FA) कोड।
                  </p>
                </div>
                <div className="border-t border-stone-200 pt-3">
                  <h3 className="font-bold text-stone-900 uppercase">ख. ग्राहक बही-खाता डेटा:</h3>
                  <p className="text-stone-600 mt-1">
                    ग्राहक का नाम, मोबाइल नंबर, उधारी/जमा का विवरण, राशि, लेन-देन की तिथि और बिल विवरण।
                  </p>
                </div>
              </div>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-bold font-serif text-[#194a32]">३. डेटा प्रोसेसिंग का उद्देश्य (धारा ४ और ७)</h2>
              <ul className="list-disc pl-5 space-y-1 text-xs text-stone-700">
                <li>दुकान का डिजिटल बही-खाता और बकाया हिसाब सुरक्षित रखना।</li>
                <li>दुकान के लिए जीएसटी और सामान्य बिल तैयार करना।</li>
                <li>व्हाट्सएप के जरिए ग्राहक को बकाया भुगतान याद दिलाना।</li>
                <li>धोखाधड़ी और अनधिकृत पहुंच से खाते की सुरक्षा करना।</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-bold font-serif text-[#194a32]">४. डेटा प्रिंसिपल (उपयोगकर्ता) के कानूनी अधिकार (अध्याय III)</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="bg-[#f0ebe0] p-3.5 rounded-xl border border-[#ded5be] space-y-1">
                  <p className="font-bold text-[#194a32]">डेटा देखने व डाउनलोड करने का अधिकार (धारा ११)</p>
                  <p className="text-stone-600">
                    आप सेटिंग्स में जाकर &quot;Export My Data&quot; विकल्प से अपना सारा डेटा कभी भी JSON फ़ाइल में डाउनलोड कर सकते हैं।
                  </p>
                </div>
                <div className="bg-[#f0ebe0] p-3.5 rounded-xl border border-[#ded5be] space-y-1">
                  <p className="font-bold text-[#194a32]">सुधार और डेटा मिटाने का अधिकार (धारा १२)</p>
                  <p className="text-stone-600">
                    आप अपनी जानकारी बदल सकते हैं या &quot;Delete Account&quot; करके अपने खाते और सारे रिकॉर्ड को हमेशा के लिए मिटा सकते हैं।
                  </p>
                </div>
                <div className="bg-[#f0ebe0] p-3.5 rounded-xl border border-[#ded5be] space-y-1">
                  <p className="font-bold text-[#194a32]">शिकायत निवारण का अधिकार (धारा १३)</p>
                  <p className="text-stone-600">
                    किसी भी समस्या पर हमारे शिकायत अधिकारी से संपर्क कर सकते हैं, जिसे ३० दिनों में हल किया जाएगा।
                  </p>
                </div>
                <div className="bg-[#f0ebe0] p-3.5 rounded-xl border border-[#ded5be] space-y-1">
                  <p className="font-bold text-[#194a32]">नामांकन (Nominate) का अधिकार (धारा १४)</p>
                  <p className="text-stone-600">
                    असमर्थता या मृत्यु की स्थिति में अपने खाते का अधिकार किसी अन्य व्यक्ति को सौंपने का अधिकार।
                  </p>
                </div>
              </div>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-bold font-serif text-[#194a32]">५. शिकायत निवारण अधिकारी एवं भारतीय डेटा संरक्षण बोर्ड (DPBI)</h2>
              <div className="bg-[#194a32] text-white p-5 rounded-2xl space-y-3">
                <p className="font-bold font-serif text-gold-300 text-sm">
                  नामित डेटा संरक्षण एवं शिकायत निवारण अधिकारी:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-stone-200">
                  <p><strong>ईमेल:</strong> <a href="mailto:grievance@hisabpoint.com" className="text-gold-300 underline">grievance@hisabpoint.com</a></p>
                  <p><strong>समय सीमा:</strong> ४८ घंटों में पावती, ३० दिनों में समाधान</p>
                </div>
                <p className="text-[11px] text-emerald-200 pt-2 border-t border-emerald-800">
                  <strong>अपील का अधिकार:</strong> यदि आप हमारे समाधान से संतुष्ट नहीं हैं, तो आप अधिनियम की धारा १८ के तहत सीधे <strong>भारतीय डेटा संरक्षण बोर्ड (Data Protection Board of India)</strong> के समक्ष शिकायत दर्ज कर सकते हैं।
                </p>
              </div>
            </section>
          </div>
        )}

        {/* Footer actions */}
        <div className="mt-8 pt-6 border-t border-[#d6cbaf] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#786f62]">
          <p>© 2026 HisabPoint Technologies. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/terms')} className="hover:text-[#194a32] font-bold underline">
              Terms of Service & DPA
            </button>
            <button onClick={() => navigate('/')} className="hover:text-[#194a32] font-bold">
              Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
