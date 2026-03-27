"use client";

interface LanguageBreakdownProps {
  sentimentByLanguage: Record<string, { score: number; percentage: number }>;
}

const languageNames: Record<string, string> = {
  en: "English",
  hi: "Hindi",
  kok: "Konkani",
  ru: "Russian",
  de: "German",
  fr: "French",
  pt: "Portuguese",
  ar: "Arabic",
  zh: "Chinese",
  ja: "Japanese",
  ko: "Korean",
  es: "Spanish",
  it: "Italian",
  mr: "Marathi",
  kn: "Kannada",
};

const languageFlags: Record<string, string> = {
  en: "🇬🇧",
  hi: "🇮🇳",
  kok: "🇮🇳",
  ru: "🇷🇺",
  de: "🇩🇪",
  fr: "🇫🇷",
  pt: "🇵🇹",
  ar: "🇸🇦",
  zh: "🇨🇳",
  ja: "🇯🇵",
  ko: "🇰🇷",
  es: "🇪🇸",
  it: "🇮🇹",
  mr: "🇮🇳",
  kn: "🇮🇳",
};

export function LanguageBreakdown({ sentimentByLanguage }: LanguageBreakdownProps) {
  const languages = Object.entries(sentimentByLanguage)
    .sort(([, a], [, b]) => b.percentage - a.percentage);

  return (
    <div className="bg-[#1a2235] rounded-xl p-5 card-glow border border-slate-800">
      <h2 className="text-lg font-semibold text-white mb-1">By Language</h2>
      <p className="text-xs text-slate-500 mb-4">Monitoring in 15+ languages</p>

      <div className="space-y-3">
        {languages.map(([lang, data]) => {
          const sentimentColor =
            data.score >= 0.3
              ? "text-green-400"
              : data.score >= 0
              ? "text-yellow-400"
              : "text-red-400";

          return (
            <div key={lang} className="flex items-center gap-3">
              <span className="text-lg w-7 text-center flex-shrink-0">
                {languageFlags[lang] || "🌐"}
              </span>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-300">
                    {languageNames[lang] || lang}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className={`text-sm font-mono font-medium ${sentimentColor}`}>
                      {((data.score + 1) / 2 * 10).toFixed(1)}
                    </span>
                    <span className="text-xs text-slate-500 w-12 text-right">
                      {data.percentage.toFixed(0)}%
                    </span>
                  </div>
                </div>
                <div className="mt-1 w-full bg-slate-800 rounded-full h-1.5">
                  <div
                    className="h-1.5 rounded-full bg-blue-500/50"
                    style={{ width: `${data.percentage}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
