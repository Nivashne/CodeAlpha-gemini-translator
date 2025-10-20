import React, { useState, useCallback } from 'react';
import { LANGUAGES, Language } from './constants';
import { translateText } from './services/geminiService';
import { CopyIcon, SpeakerIcon, SwapIcon } from './components/icons';

const LanguageSelector = ({
  id,
  value,
  onChange,
  languages,
}: {
  id: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  languages: Language[];
}) => (
  <select
    id={id}
    value={value}
    onChange={onChange}
    className="w-full bg-slate-700 border border-slate-600 rounded-md p-2 focus:ring-2 focus:ring-sky-500 focus:outline-none transition"
  >
    {languages.map((lang) => (
      <option key={lang.code} value={lang.name}>
        {lang.name}
      </option>
    ))}
  </select>
);

const TranslationCard = ({
  id,
  label,
  text,
  onTextChange,
  lang,
  onLangChange,
  isReadOnly = false,
  isLoading = false,
  onCopy,
  onSpeak,
  languages,
}: {
  id: string;
  label: string;
  text: string;
  onTextChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  lang: string;
  onLangChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  isReadOnly?: boolean;
  isLoading?: boolean;
  onCopy?: () => void;
  onSpeak?: () => void;
  languages: Language[];
}) => {
  return (
    <div className="bg-slate-800 rounded-xl p-6 flex flex-col h-full shadow-lg">
      <LanguageSelector id={`${id}-lang`} value={lang} onChange={onLangChange} languages={languages} />
      <div className="relative flex-grow mt-4">
        <textarea
          id={id}
          value={text}
          onChange={onTextChange}
          readOnly={isReadOnly}
          placeholder={isReadOnly ? '' : 'Enter text...'}
          className={`w-full h-full bg-slate-900 rounded-md p-4 resize-none focus:ring-2 focus:ring-sky-500 focus:outline-none transition ${isReadOnly ? 'text-slate-300' : ''}`}
        />
        {isLoading && (
          <div className="absolute inset-0 bg-slate-900 bg-opacity-75 flex items-center justify-center rounded-md">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-400"></div>
          </div>
        )}
      </div>
      {(onCopy || onSpeak) && (
        <div className="flex items-center justify-end mt-4 space-x-2">
          {onSpeak && (
            <button onClick={onSpeak} className="p-2 text-slate-400 hover:text-sky-400 transition rounded-full hover:bg-slate-700" title="Listen">
              <SpeakerIcon />
            </button>
          )}
          {onCopy && (
            <button onClick={onCopy} className="p-2 text-slate-400 hover:text-sky-400 transition rounded-full hover:bg-slate-700" title="Copy text">
              <CopyIcon />
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default function App() {
  const [sourceLang, setSourceLang] = useState('English');
  const [targetLang, setTargetLang] = useState('Spanish');
  const [sourceText, setSourceText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState('');

  const handleTranslate = useCallback(async () => {
    if (!sourceText.trim()) return;
    setIsLoading(true);
    setError(null);
    setTranslatedText('');

    const translation = await translateText(sourceText, sourceLang, targetLang);
    
    if (translation.startsWith('Error:')) {
        setError(translation);
    } else {
        setTranslatedText(translation);
    }
    setIsLoading(false);
  }, [sourceText, sourceLang, targetLang]);

  const handleSwapLanguages = () => {
    const tempLang = sourceLang;
    setSourceLang(targetLang);
    setTargetLang(tempLang);
    // Optional: swap text as well
    const tempText = sourceText;
    setSourceText(translatedText);
    setTranslatedText(tempText);
  };

  const handleCopy = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text).then(
      () => {
        setCopySuccess('Copied!');
        setTimeout(() => setCopySuccess(''), 2000);
      },
      (err) => {
        setCopySuccess('Failed to copy');
        console.error('Could not copy text: ', err);
      }
    );
  };
  
  const handleSpeak = (text: string, langName: string) => {
    if ('speechSynthesis' in window && text) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      const langCode = LANGUAGES.find(l => l.name === langName)?.code;
      if (langCode) {
        // Attempt to find a matching voice
        const voices = window.speechSynthesis.getVoices();
        utterance.voice = voices.find(voice => voice.lang.startsWith(langCode)) || null;
        utterance.lang = langCode;
      }
      window.speechSynthesis.speak(utterance);
    } else {
      alert("Text-to-speech is not supported in your browser or there's no text to speak.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
      <header className="text-center mb-8">
        <h1 className="text-4xl sm:text-5xl font-bold text-sky-400">Gemini Translator</h1>
        <p className="text-slate-400 mt-2">Instant translations powered by AI</p>
      </header>
      
      <main className="w-full max-w-5xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-0 relative">
          <TranslationCard
            id="source"
            label="Source"
            text={sourceText}
            onTextChange={(e) => setSourceText(e.target.value)}
            lang={sourceLang}
            onLangChange={(e) => setSourceLang(e.target.value)}
            languages={LANGUAGES}
            onCopy={sourceText ? () => handleCopy(sourceText) : undefined}
            onSpeak={sourceText ? () => handleSpeak(sourceText, sourceLang) : undefined}
          />

          <div className="flex items-center justify-center my-2 md:my-0 md:absolute md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 z-10">
            <button
              onClick={handleSwapLanguages}
              className="p-3 bg-slate-700 text-slate-300 hover:bg-sky-600 hover:text-white rounded-full transition-transform duration-300 ease-in-out hover:rotate-180"
              title="Swap languages"
            >
              <SwapIcon className="w-5 h-5" />
            </button>
          </div>

          <TranslationCard
            id="target"
            label="Target"
            text={translatedText}
            lang={targetLang}
            onLangChange={(e) => setTargetLang(e.target.value)}
            isReadOnly
            isLoading={isLoading}
            onCopy={translatedText ? () => handleCopy(translatedText) : undefined}
            onSpeak={translatedText ? () => handleSpeak(translatedText, targetLang) : undefined}
            languages={LANGUAGES}
          />
        </div>

        <div className="mt-6 text-center">
            <button
                onClick={handleTranslate}
                disabled={isLoading || !sourceText.trim()}
                className="bg-sky-600 text-white font-bold py-3 px-10 rounded-full hover:bg-sky-500 transition-colors disabled:bg-slate-600 disabled:cursor-not-allowed disabled:text-slate-400"
            >
                {isLoading ? 'Translating...' : 'Translate'}
            </button>
        </div>

        {error && <div className="mt-4 text-center text-red-400 bg-red-900 bg-opacity-30 p-3 rounded-md">{error}</div>}
        {copySuccess && <div className="fixed bottom-5 left-1/2 -translate-x-1/2 bg-green-600 text-white py-2 px-4 rounded-full shadow-lg">{copySuccess}</div>}

      </main>
    </div>
  );
}
