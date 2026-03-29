import { useState, useRef, useCallback, useEffect } from "react";
import Icon from "@/components/ui/icon";

const UPLOAD_URL = "https://functions.poehali.dev/d60c0969-c3cd-4d2f-90b7-620f64ac9ffd";
const LIST_URL = "https://functions.poehali.dev/4b0c28bc-b49e-4834-869b-d7228657df5d";

const AUDIO_SLOTS = [
  { key: "a", label: 'Буква "А"' },
  { key: "petuh", label: 'Слово "Петух"' },
  { key: "b", label: 'Буква "Б"' },
  { key: "banan", label: 'Слово "Банан"' },
  { key: "v", label: 'Буква "В"' },
  { key: "lastochka", label: 'Слово "Ласточка"' },
];

const PAGES = [
  {
    letter: "А",
    word: "петух",
    wordDisplay: "Петух",
    letterKey: "a",
    wordKey: "petuh",
    image: "https://cdn.poehali.dev/projects/56129175-d3b6-45a1-9e31-141730f2c62e/files/97939e00-e7d2-4001-aaea-5b1f072ca113.jpg",
    bgSolid: "#FF6B9D",
    letterColor: "#FFE135",
    letterShadow: "#C85A00",
    stars: ["⭐", "✨", "🌟"],
    emoji: "🐓",
  },
  {
    letter: "Б",
    word: "банан",
    wordDisplay: "Банан",
    letterKey: "b",
    wordKey: "banan",
    image: "https://cdn.poehali.dev/projects/56129175-d3b6-45a1-9e31-141730f2c62e/files/2d40b47d-599e-4196-8b7d-fc19ddb0c451.jpg",
    bgSolid: "#7BC67E",
    letterColor: "#FFF176",
    letterShadow: "#2E7D32",
    stars: ["🍃", "✨", "💚"],
    emoji: "🍌",
  },
  {
    letter: "В",
    word: "ласточка",
    wordDisplay: "Ласточка",
    letterKey: "v",
    wordKey: "lastochka",
    image: "https://cdn.poehali.dev/projects/56129175-d3b6-45a1-9e31-141730f2c62e/files/c937470b-b3d4-4be3-8d14-013067e9f043.jpg",
    bgSolid: "#5C9BD6",
    letterColor: "#E0F7FA",
    letterShadow: "#0D47A1",
    stars: ["☁️", "✨", "💙"],
    emoji: "🐦",
  },
];

function speakFallback(text: string, onEnd?: () => void) {
  window.speechSynthesis.cancel();
  const isSingleLetter = text.length === 1;
  const spokenText = isSingleLetter ? `${text}...${text}...${text}` : text;
  const utter = new SpeechSynthesisUtterance(spokenText);
  utter.lang = "ru-RU";
  utter.rate = isSingleLetter ? 0.5 : 0.7;
  utter.pitch = 1.1;
  utter.volume = 1.0;
  if (onEnd) utter.onend = onEnd;
  window.speechSynthesis.speak(utter);
}

function playAudio(url: string | null, fallbackText: string): Promise<void> {
  return new Promise((resolve) => {
    if (!url) { speakFallback(fallbackText, resolve); return; }
    const audio = new Audio(url + "?t=" + Date.now());
    audio.onended = () => resolve();
    audio.onerror = () => speakFallback(fallbackText, resolve);
    audio.play().catch(() => speakFallback(fallbackText, resolve));
  });
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function Index() {
  const [currentPage, setCurrentPage] = useState(0);
  const [letterAnim, setLetterAnim] = useState(false);
  const [imageAnim, setImageAnim] = useState(false);
  const [slideDir, setSlideDir] = useState<"left" | "right" | null>(null);
  const [showAdmin, setShowAdmin] = useState(false);
  const [audioUrls, setAudioUrls] = useState<Record<string, string | null>>({});
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const [uploadDone, setUploadDone] = useState<Record<string, boolean>>({});
  const touchStartX = useRef<number | null>(null);

  const page = PAGES[currentPage];

  const loadAudioUrls = useCallback(() => {
    fetch(LIST_URL + "?t=" + Date.now(), { cache: "no-store" })
      .then(r => r.json())
      .then(data => {
        const parsed = typeof data === "string" ? JSON.parse(data) : data;
        // Добавляем cache-buster к каждому URL чтобы браузер не кешировал
        const withBuster: Record<string, string | null> = {};
        for (const key in parsed) {
          withBuster[key] = parsed[key] ? parsed[key] + "?t=" + Date.now() : null;
        }
        setAudioUrls(withBuster);
      })
      .catch(e => console.error("Audio list error", e));
  }, []);

  useEffect(() => { loadAudioUrls(); }, [loadAudioUrls]);

  const goTo = useCallback((index: number) => {
    if (index === currentPage) return;
    setSlideDir(index > currentPage ? "left" : "right");
    setTimeout(() => { setCurrentPage(index); setSlideDir(null); }, 350);
  }, [currentPage]);

  const goNext = () => { if (currentPage < PAGES.length - 1) goTo(currentPage + 1); };
  const goPrev = () => { if (currentPage > 0) goTo(currentPage - 1); };

  const onTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) { if (diff > 0) goNext(); else goPrev(); }
    touchStartX.current = null;
  };

  const handleLetterClick = () => {
    playAudio(audioUrls[page.letterKey] ?? null, page.letter);
    setLetterAnim(true);
    setTimeout(() => setLetterAnim(false), 800);
  };

  const handleImageClick = () => {
    playAudio(audioUrls[page.wordKey] ?? null, page.word);
    setImageAnim(true);
    setTimeout(() => setImageAnim(false), 800);
  };

  const handleUpload = async (slotKey: string, file: File) => {
    setUploading(p => ({ ...p, [slotKey]: true }));
    setUploadDone(p => ({ ...p, [slotKey]: false }));
    try {
      const data = await fileToBase64(file);
      const res = await fetch(UPLOAD_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: slotKey, data }),
      });
      const json = await res.json();
      const parsed = typeof json === "string" ? JSON.parse(json) : json;
      if (parsed.url) {
        setUploadDone(p => ({ ...p, [slotKey]: true }));
        // Перезагружаем весь список с сервера без кеша
        setTimeout(() => loadAudioUrls(), 500);
      }
    } catch (e) {
      console.error("Upload error", e);
    }
    setUploading(p => ({ ...p, [slotKey]: false }));
  };

  const slideClass = slideDir === "left" ? "animate-slide-left" : slideDir === "right" ? "animate-slide-right" : "";

  if (showAdmin) {
    return (
      <div className="min-h-screen w-full flex flex-col" style={{ background: "linear-gradient(135deg, #667eea, #764ba2)" }}>
        <div className="flex items-center gap-3 px-4 py-4">
          <button
            onClick={() => setShowAdmin(false)}
            className="w-10 h-10 rounded-full flex items-center justify-center cursor-pointer"
            style={{ background: "rgba(255,255,255,0.25)" }}
          >
            <Icon name="ArrowLeft" size={20} className="text-white" />
          </button>
          <h1 className="font-caveat font-bold text-white text-2xl">Загрузка аудио</h1>
          <button
            onClick={loadAudioUrls}
            className="ml-auto w-9 h-9 rounded-full flex items-center justify-center cursor-pointer"
            style={{ background: "rgba(255,255,255,0.2)" }}
            title="Обновить список"
          >
            <Icon name="RefreshCw" size={16} className="text-white" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-8 flex flex-col gap-3">
          <p className="font-nunito text-white/80 text-sm mb-2">
            Загрузи MP3-файлы с голосом для каждой буквы и слова. После загрузки они сохранятся навсегда.
          </p>
          {AUDIO_SLOTS.map((slot) => {
            const hasAudio = !!audioUrls[slot.key];
            const isUploading = uploading[slot.key];
            const isDone = uploadDone[slot.key];
            return (
              <div
                key={slot.key}
                className="rounded-2xl p-4 flex items-center gap-3"
                style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(10px)" }}
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: hasAudio ? "rgba(100,220,100,0.4)" : "rgba(255,255,255,0.2)" }}
                >
                  {isUploading ? (
                    <Icon name="Loader2" size={18} className="text-white animate-spin" />
                  ) : isDone || hasAudio ? (
                    <Icon name="CheckCircle" size={18} className="text-green-200" />
                  ) : (
                    <Icon name="Music" size={18} className="text-white/60" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-nunito font-bold text-white text-sm">{slot.label}</div>
                  <div className="font-nunito text-white/60 text-xs mt-0.5">
                    {hasAudio ? "Файл загружен ✓" : "Файл не загружен"}
                  </div>
                </div>
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="audio/mp3,audio/mpeg,.mp3"
                    className="hidden"
                    disabled={isUploading}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleUpload(slot.key, file);
                      e.target.value = "";
                    }}
                  />
                  <div
                    className="px-3 py-2 rounded-xl font-nunito font-bold text-white text-sm flex items-center gap-1"
                    style={{ background: "rgba(255,255,255,0.25)" }}
                  >
                    <Icon name="Upload" size={14} className="text-white" />
                    {hasAudio ? "Заменить" : "Загрузить"}
                  </div>
                </label>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-center overflow-hidden relative"
      style={{ background: `linear-gradient(135deg, ${page.bgSolid}cc, ${page.bgSolid}88)`, transition: "background 0.5s ease" }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -left-20 w-64 h-64 rounded-full opacity-30 animate-float" style={{ background: "rgba(255,255,255,0.4)", animationDelay: "0s" }} />
        <div className="absolute -bottom-10 -right-10 w-48 h-48 rounded-full opacity-20 animate-float" style={{ background: "rgba(255,255,255,0.3)", animationDelay: "1s" }} />
        {[...Array(12)].map((_, i) => (
          <div key={i} className="absolute rounded-full opacity-40" style={{ width: `${8 + (i % 3) * 6}px`, height: `${8 + (i % 3) * 6}px`, background: "rgba(255,255,255,0.5)", top: `${10 + (i * 17) % 80}%`, left: `${5 + (i * 23) % 90}%` }} />
        ))}
      </div>

      {/* Settings button */}
      <button
        onClick={() => setShowAdmin(true)}
        className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full flex items-center justify-center cursor-pointer"
        style={{ background: "rgba(255,255,255,0.25)", backdropFilter: "blur(8px)" }}
        aria-label="Настройки аудио"
      >
        <Icon name="Settings" size={18} className="text-white" />
      </button>

      {/* Main card */}
      <div className={`relative z-10 flex flex-col items-center w-full max-w-sm mx-auto px-4 ${slideClass}`} style={{ minHeight: "100dvh", justifyContent: "center" }}>
        <div className="flex gap-4 mb-2 text-2xl">
          {page.stars.map((s, i) => (
            <span key={i} className="animate-float" style={{ animationDelay: `${i * 0.4}s`, fontSize: "1.6rem" }}>{s}</span>
          ))}
        </div>

        <button
          onClick={handleLetterClick}
          className={`relative select-none cursor-pointer transition-transform active:scale-90 ${letterAnim ? "animate-wiggle" : ""}`}
          style={{ background: "none", border: "none", padding: 0 }}
          aria-label={`Буква ${page.letter}`}
        >
          <span className="font-caveat font-bold leading-none" style={{ fontSize: "clamp(120px, 35vw, 180px)", color: page.letterColor, textShadow: `6px 6px 0px ${page.letterShadow}, 0 0 40px rgba(255,255,255,0.4)`, display: "block", filter: "drop-shadow(0 8px 20px rgba(0,0,0,0.2))" }}>
            {page.letter}
          </span>
          <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-white/70 font-nunito text-sm whitespace-nowrap" style={{ fontSize: "0.75rem" }}>
            👆 нажми на меня!
          </span>
        </button>

        <button
          onClick={handleImageClick}
          className={`mt-8 relative cursor-pointer select-none transition-transform active:scale-95 ${imageAnim ? "animate-pop" : ""}`}
          style={{ background: "none", border: "none", padding: 0 }}
          aria-label={`Нажми чтобы услышать слово ${page.word}`}
        >
          <div className="rounded-3xl overflow-hidden shadow-2xl border-4 border-white/50" style={{ width: "clamp(200px, 60vw, 260px)", height: "clamp(200px, 60vw, 260px)", background: "rgba(255,255,255,0.25)" }}>
            <img src={page.image} alt={page.wordDisplay} className="w-full h-full object-cover" style={{ objectPosition: "center" }} />
          </div>
          <div className="mt-3 px-6 py-2 rounded-full font-caveat font-bold text-white text-center shadow-lg" style={{ background: "rgba(255,255,255,0.25)", backdropFilter: "blur(10px)", fontSize: "clamp(1.4rem, 6vw, 1.8rem)", textShadow: "0 2px 8px rgba(0,0,0,0.3)" }}>
            {page.wordDisplay} {page.emoji}
          </div>
          <span className="block text-center text-white/70 font-nunito mt-1" style={{ fontSize: "0.75rem" }}>👆 нажми на меня!</span>
        </button>

        <div className="flex items-center gap-4 mt-10">
          <button onClick={goPrev} disabled={currentPage === 0} className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-90 ${currentPage === 0 ? "opacity-30 cursor-not-allowed" : "opacity-100 hover:scale-110 cursor-pointer"}`} style={{ background: "rgba(255,255,255,0.35)", backdropFilter: "blur(8px)" }} aria-label="Назад">
            <Icon name="ChevronLeft" size={24} className="text-white" />
          </button>
          <div className="flex gap-3">
            {PAGES.map((_, i) => (
              <button key={i} onClick={() => goTo(i)} className="transition-all duration-300 rounded-full cursor-pointer" style={{ width: i === currentPage ? "28px" : "12px", height: "12px", background: i === currentPage ? "white" : "rgba(255,255,255,0.5)", boxShadow: i === currentPage ? "0 2px 8px rgba(0,0,0,0.2)" : "none" }} aria-label={`Страница ${i + 1}`} />
            ))}
          </div>
          <button onClick={goNext} disabled={currentPage === PAGES.length - 1} className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-90 ${currentPage === PAGES.length - 1 ? "opacity-30 cursor-not-allowed" : "opacity-100 hover:scale-110 cursor-pointer"}`} style={{ background: "rgba(255,255,255,0.35)", backdropFilter: "blur(8px)" }} aria-label="Вперёд">
            <Icon name="ChevronRight" size={24} className="text-white" />
          </button>
        </div>

        <button
          onClick={async () => {
            await playAudio(audioUrls[page.letterKey] ?? null, page.letter);
            await playAudio(audioUrls[page.wordKey] ?? null, page.word);
          }}
          className="mt-5 flex items-center gap-2 px-5 py-3 rounded-full font-nunito font-bold text-white shadow-lg transition-all active:scale-95 hover:scale-105 cursor-pointer"
          style={{ background: "rgba(255,255,255,0.25)", backdropFilter: "blur(10px)", fontSize: "1rem", border: "2px solid rgba(255,255,255,0.5)" }}
        >
          <Icon name="Volume2" size={20} className="text-white" />
          Повторить всё
        </button>
      </div>
    </div>
  );
}