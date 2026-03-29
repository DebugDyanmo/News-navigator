"use client";

import * as React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

// ─── Types ────────────────────────────────────────────────────────────────────

type Language = "hi" | "ta" | "te" | "bn";

type TranslationResult = {
  language: Language;
  translated_text: string;
  local_context: string;
  simplified_terms: { original: string; translated: string; explanation: string }[];
  cultural_note?: string;
};

// ─── Language config ──────────────────────────────────────────────────────────

const LANGUAGES: { id: Language; label: string; native: string; flag: string; region: string }[] = [
  { id: "hi", label: "Hindi", native: "हिंदी", flag: "🇮🇳", region: "North India" },
  { id: "ta", label: "Tamil", native: "தமிழ்", flag: "🏳️", region: "Tamil Nadu" },
  { id: "te", label: "Telugu", native: "తెలుగు", flag: "🏳️", region: "Andhra / Telangana" },
  { id: "bn", label: "Bengali", native: "বাংলা", flag: "🏳️", region: "West Bengal" },
];

// ─── Mock translations ────────────────────────────────────────────────────────

const MOCK_TRANSLATIONS: Record<Language, TranslationResult> = {
  hi: {
    language: "hi",
    translated_text:
      "भारत के केंद्रीय बजट 2025 में सरकार ने बुनियादी ढांचे पर खर्च 11% बढ़ाकर ₹11.1 लाख करोड़ कर दिया है। इससे सड़क, रेलवे और बंदरगाह जैसे क्षेत्रों में नई नौकरियां आएंगी। शेयर बाजार में निफ्टी 1.2% ऊपर गया। विशेषज्ञों का कहना है कि राजकोषीय घाटा 4.9% पर है, जो ब्याज दरों में कटौती की गुंजाइश कम करता है।",
    local_context:
      "उत्तर भारत के किसानों और छोटे व्यापारियों के लिए: बुनियादी ढांचे में निवेश से ग्रामीण सड़कें और मंडियां बेहतर होंगी, जिससे आपकी उपज बाजार तक जल्दी पहुंचेगी।",
    simplified_terms: [
      { original: "Fiscal Deficit", translated: "राजकोषीय घाटा", explanation: "सरकार की कमाई से ज्यादा खर्च — जैसे घर में आमदनी से ज्यादा उधार लेना।" },
      { original: "Capital Expenditure", translated: "पूंजीगत व्यय", explanation: "सरकार का वो पैसा जो सड़क, पुल, रेलवे बनाने में लगता है।" },
      { original: "Nifty", translated: "निफ्टी", explanation: "भारत की 50 बड़ी कंपनियों का शेयर बाजार सूचकांक।" },
    ],
    cultural_note: "बजट को दिवाली की तरह समझें — सरकार तय करती है कि अगले साल पैसा कहाँ जलाना है और कहाँ बचाना है।",
  },
  ta: {
    language: "ta",
    translated_text:
      "இந்தியாவின் 2025 மத்திய பட்ஜெட்டில் அரசு உள்கட்டமைப்பு செலவை 11% அதிகரித்து ₹11.1 லட்சம் கோடியாக நிர்ணயித்துள்ளது. சாலைகள், ரயில்வே மற்றும் துறைமுகங்களில் புதிய வேலைவாய்ப்புகள் உருவாகும். நிஃப்டி 1.2% உயர்ந்தது. நிதி பற்றாக்குறை 4.9% என்பதால் வட்டி விகிதம் குறைக்கப்படுவதற்கான வாய்ப்பு குறைவு என நிபுணர்கள் கூறுகின்றனர்.",
    local_context:
      "தமிழ்நாட்டு தொழில்முனைவோருக்கு: துறைமுக மேம்பாடு சென்னை மற்றும் தூத்துக்குடி வழியாக ஏற்றுமதியை எளிதாக்கும். ஆட்டோமொபைல் மற்றும் தகவல் தொழில்நுட்ப நிறுவனங்கள் பயனடையும்.",
    simplified_terms: [
      { original: "Fiscal Deficit", translated: "நிதி பற்றாக்குறை", explanation: "அரசின் வருமானத்தை விட செலவு அதிகமாக இருப்பது — வீட்டு கடன் போல." },
      { original: "Capital Expenditure", translated: "மூலதன செலவு", explanation: "சாலை, பாலம், ரயில் போன்ற நிரந்தர சொத்துகளுக்கான அரசு முதலீடு." },
      { original: "Nifty", translated: "நிஃப்டி", explanation: "இந்தியாவின் முன்னணி 50 நிறுவனங்களின் பங்கு சந்தை குறியீடு." },
    ],
    cultural_note: "பட்ஜெட்டை பொங்கல் பரிசு போல் நினைத்துக்கொள்ளுங்கள் — யாருக்கு என்ன கிடைக்கும் என்று அரசு முடிவு செய்கிறது.",
  },
  te: {
    language: "te",
    translated_text:
      "భారత 2025 కేంద్ర బడ్జెట్‌లో ప్రభుత్వం మౌలిక సదుపాయాల వ్యయాన్ని 11% పెంచి ₹11.1 లక్షల కోట్లకు నిర్ణయించింది. రోడ్లు, రైల్వే, నౌకాశ్రయాలలో కొత్త ఉద్యోగాలు వస్తాయి. నిఫ్టీ 1.2% పెరిగింది. ఆర్థిక లోటు 4.9% వద్ద ఉండటం వల్ల వడ్డీ రేట్లు తగ్గే అవకాశం తక్కువని నిపుణులు చెప్తున్నారు.",
    local_context:
      "తెలంగాణ మరియు ఆంధ్రప్రదేశ్ రైతులకు: మౌలిక సదుపాయాల పెట్టుబడి గ్రామీణ రోడ్లు మరియు నీటిపారుదల ప్రాజెక్టులను మెరుగుపరుస్తుంది. ఫార్మా మరియు టెక్స్‌టైల్ రంగాలు లాభపడతాయి.",
    simplified_terms: [
      { original: "Fiscal Deficit", translated: "ఆర్థిక లోటు", explanation: "ప్రభుత్వ ఆదాయం కంటే ఖర్చు ఎక్కువగా ఉండటం — ఇంట్లో అప్పు తీసుకున్నట్లు." },
      { original: "Capital Expenditure", translated: "మూలధన వ్యయం", explanation: "రోడ్లు, వంతెనలు, రైల్వే వంటి శాశ్వత ఆస్తులకు ప్రభుత్వ పెట్టుబడి." },
      { original: "Nifty", translated: "నిఫ్టీ", explanation: "భారతదేశంలోని అగ్రశ్రేణి 50 కంపెనీల స్టాక్ మార్కెట్ సూచిక." },
    ],
    cultural_note: "బడ్జెట్‌ను ఉగాది పచ్చడిలా అర్థం చేసుకోండి — తీపి, పులుపు, చేదు అన్నీ కలిసి ఉంటాయి.",
  },
  bn: {
    language: "bn",
    translated_text:
      "ভারতের ২০২৫ কেন্দ্রীয় বাজেটে সরকার অবকাঠামো ব্যয় ১১% বাড়িয়ে ₹১১.১ লক্ষ কোটি করেছে। সড়ক, রেলওয়ে ও বন্দরে নতুন কর্মসংস্থান তৈরি হবে। নিফটি ১.২% বেড়েছে। বিশেষজ্ঞরা বলছেন রাজকোষীয় ঘাটতি ৪.৯% থাকায় সুদের হার কমার সুযোগ কম।",
    local_context:
      "পশ্চিমবঙ্গের ব্যবসায়ীদের জন্য: কলকাতা বন্দরের উন্নয়নে রপ্তানি সহজ হবে। চা শিল্প ও পাট শিল্পে নতুন বিনিয়োগের সুযোগ আসতে পারে।",
    simplified_terms: [
      { original: "Fiscal Deficit", translated: "রাজকোষীয় ঘাটতি", explanation: "সরকারের আয়ের চেয়ে ব্যয় বেশি — যেন সংসারে আয়ের বেশি খরচ।" },
      { original: "Capital Expenditure", translated: "মূলধনী ব্যয়", explanation: "রাস্তা, সেতু, রেলওয়ের মতো স্থায়ী সম্পদে সরকারি বিনিয়োগ।" },
      { original: "Nifty", translated: "নিফটি", explanation: "ভারতের শীর্ষ ৫০ কোম্পানির শেয়ার বাজার সূচক।" },
    ],
    cultural_note: "বাজেটকে দুর্গাপূজার বাজারের মতো ভাবুন — কে কতটা পাবে সেটা আগেই ঠিক হয়ে যায়।",
  },
};

const SAMPLE_ARTICLE = `India's Union Budget 2025 has increased capital expenditure by 11% to ₹11.1 lakh crore, signalling a strong infrastructure push. Markets reacted positively — Nifty gained 1.2% on budget day as defence and railways stocks surged. The fiscal deficit is pegged at 4.9% of GDP, leaving limited room for RBI rate cuts. Experts say the budget prioritises growth over consolidation, with rural spending up 8% and PLI schemes extended to 5 new sectors.`;

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

async function translateArticle(text: string, language: Language): Promise<TranslationResult> {
  const res = await fetch(`${API_BASE}/vernacular/translate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, language }),
  });
  if (!res.ok) throw new Error(`Vernacular API error: ${res.status}`);
  return res.json();
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function VernacularPage() {
  const [articleText, setArticleText] = React.useState(SAMPLE_ARTICLE);
  const [selectedLang, setSelectedLang] = React.useState<Language>("hi");
  const [result, setResult] = React.useState<TranslationResult | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleTranslate(lang?: Language) {
    const l = lang ?? selectedLang;
    setSelectedLang(l);
    setLoading(true);
    setError(null);
    try {
      const data = await translateArticle(articleText, l);
      setResult(data);
    } catch {
      setError("Backend offline — showing demo translation.");
      setResult(MOCK_TRANSLATIONS[l]);
    } finally {
      setLoading(false);
    }
  }

  const langConfig = LANGUAGES.find((l) => l.id === selectedLang)!;

  return (
    <main className="min-h-screen bg-gradient-to-b from-orange-950 to-zinc-950">
      {/* Header */}
      <div className="sticky top-0 z-20 border-b border-orange-900/50 bg-orange-950/90 backdrop-blur">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-4">
          <div>
            <div className="text-xs font-medium tracking-wide text-orange-500">VERNACULAR BUSINESS ENGINE</div>
            <div className="text-lg font-semibold text-orange-100">Context-Aware Business News in Your Language</div>
          </div>
          <Badge className="ml-auto border-amber-700 bg-amber-950 text-amber-300">Roadmap</Badge>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <p className="text-orange-200/70 max-w-2xl text-sm">
          Not literal translation — culturally adapted explanations with local context. Business jargon is simplified,
          regional relevance is added, and cultural analogies make complex finance accessible.
        </p>

        {/* Language selector */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.id}
              type="button"
              onClick={() => handleTranslate(lang.id)}
              className={[
                "rounded-xl border p-3 text-left transition-all hover:scale-[1.02]",
                selectedLang === lang.id
                  ? "border-orange-500 bg-orange-900/50 text-orange-100"
                  : "border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-zinc-500",
              ].join(" ")}
            >
              <div className="text-xl mb-1">{lang.flag}</div>
              <div className="font-medium text-sm">{lang.label}</div>
              <div className="text-xs opacity-70">{lang.native}</div>
              <div className="text-xs opacity-50 mt-0.5">{lang.region}</div>
            </button>
          ))}
        </div>

        {/* Article input */}
        <Card className="border-zinc-700 bg-zinc-900">
          <CardHeader>
            <div className="font-medium text-zinc-100">Source Article (English)</div>
            <div className="text-xs text-zinc-500">Edit or paste any ET article text below.</div>
          </CardHeader>
          <CardContent className="space-y-3">
            <textarea
              value={articleText}
              onChange={(e) => setArticleText(e.target.value)}
              rows={4}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-orange-500 resize-none"
            />
            <Button
              onClick={() => handleTranslate()}
              disabled={loading}
              className="bg-orange-600 hover:bg-orange-500 text-white"
            >
              {loading ? "Translating…" : `🌐 Translate to ${langConfig.label}`}
            </Button>
            {error && <div className="text-xs text-amber-400">{error}</div>}
          </CardContent>
        </Card>

        {/* Loading skeleton */}
        {loading && (
          <Card className="border-zinc-700 bg-zinc-900 animate-pulse">
            <CardContent className="pt-5 space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-4 rounded bg-zinc-800" style={{ width: `${90 - i * 8}%` }} />
              ))}
            </CardContent>
          </Card>
        )}

        {/* Result */}
        {result && !loading && (
          <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
            {/* Main translation */}
            <Card className="border-zinc-700 bg-zinc-900">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="font-medium text-zinc-100">
                    {langConfig.flag} {langConfig.label} ({langConfig.native})
                  </div>
                  <Badge variant="outline" className="text-[10px] border-orange-700 text-orange-400">
                    Context-Adapted
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-zinc-200 leading-relaxed text-base">{result.translated_text}</p>

                <Separator className="bg-zinc-700" />

                {/* Local context */}
                <div className="rounded-lg border border-orange-900/50 bg-orange-950/30 p-4">
                  <div className="text-xs font-medium uppercase tracking-wide text-orange-400 mb-2">
                    📍 Local Context for {langConfig.region}
                  </div>
                  <p className="text-sm text-orange-200">{result.local_context}</p>
                </div>

                {/* Cultural note */}
                {result.cultural_note && (
                  <div className="rounded-lg border border-yellow-900/50 bg-yellow-950/20 p-3">
                    <div className="text-xs font-medium text-yellow-400 mb-1">💡 Cultural Analogy</div>
                    <p className="text-sm text-yellow-200 italic">{result.cultural_note}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Simplified terms */}
            <Card className="border-zinc-700 bg-zinc-900 h-fit">
              <CardHeader>
                <div className="font-medium text-zinc-100">📖 Jargon Simplified</div>
                <div className="text-xs text-zinc-500">Finance terms explained in plain language.</div>
              </CardHeader>
              <CardContent className="space-y-3">
                {result.simplified_terms.map((term) => (
                  <div key={term.original} className="rounded-lg border border-zinc-700 bg-zinc-800 p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono text-zinc-400">{term.original}</span>
                      <span className="text-zinc-600">→</span>
                      <span className="text-sm font-medium text-orange-300">{term.translated}</span>
                    </div>
                    <p className="text-xs text-zinc-400">{term.explanation}</p>
                  </div>
                ))}

                <Separator className="bg-zinc-700" />

                {/* Language coverage */}
                <div>
                  <div className="text-xs font-medium uppercase tracking-wide text-zinc-500 mb-2">Coverage</div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {LANGUAGES.map((l) => (
                      <button
                        key={l.id}
                        type="button"
                        onClick={() => handleTranslate(l.id)}
                        className={[
                          "rounded-lg border px-2 py-1.5 text-xs text-left transition-colors",
                          selectedLang === l.id
                            ? "border-orange-600 bg-orange-900/40 text-orange-300"
                            : "border-zinc-700 bg-zinc-800 text-zinc-400 hover:bg-zinc-700",
                        ].join(" ")}
                      >
                        {l.flag} {l.label}
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </main>
  );
}
