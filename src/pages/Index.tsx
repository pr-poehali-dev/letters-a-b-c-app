import { useState, useRef, useCallback, useEffect } from "react";
import Icon from "@/components/ui/icon";

const UPLOAD_URL = "https://functions.poehali.dev/d60c0969-c3cd-4d2f-90b7-620f64ac9ffd";
const IMAGE_UPLOAD_URL = "https://functions.poehali.dev/11a80b3a-ce5b-4989-9b35-5eba9c362438";
const LIST_URL = "https://functions.poehali.dev/4b0c28bc-b49e-4834-869b-d7228657df5d";
const SERVE_URL = "https://functions.poehali.dev/20d2b520-f02e-4ee1-a2b5-c42c28ec5cdd";

const AUDIO_SLOTS = [
  { key: "a", label: 'Буква "А"' },
  { key: "petuh", label: 'Слово "Петух"' },
  { key: "b", label: 'Буква "Б"' },
  { key: "banan", label: 'Слово "Банан"' },
  { key: "v", label: 'Буква "В"' },
  { key: "lastochka", label: 'Слово "Ласточка"' },
];

const IMAGE_SLOTS = [
  { key: "petuh", label: "Картинка Петух" },
  { key: "banan", label: "Картинка Банан" },
  { key: "lastochka", label: "Картинка Ласточка" },
];

const DEFAULT_IMAGES: Record<string, string> = {
  petuh: "https://cdn.poehali.dev/projects/56129175-d3b6-45a1-9e31-141730f2c62e/files/97939e00-e7d2-4001-aaea-5b1f072ca113.jpg",
  banan: "https://cdn.poehali.dev/projects/56129175-d3b6-45a1-9e31-141730f2c62e/files/2d40b47d-599e-4196-8b7d-fc19ddb0c451.jpg",
  lastochka: "https://cdn.poehali.dev/projects/56129175-d3b6-45a1-9e31-141730f2c62e/files/c937470b-b3d4-4be3-8d14-013067e9f043.jpg",
};

const PAGES = [
  { letter: "А", word: "петух", wordDisplay: "Петух", letterKey: "a", wordKey: "petuh", bgSolid: "#FF6B9D", letterColor: "#FFE135", letterShadow: "#C85A00", stars: ["⭐", "✨", "🌟"], emoji: "🐓" },
  { letter: "Б", word: "банан", wordDisplay: "Банан", letterKey: "b", wordKey: "banan", bgSolid: "#7BC67E", letterColor: "#FFF176", letterShadow: "#2E7D32", stars: ["🍃", "✨", "💚"], emoji: "🍌" },
  { letter: "В", word: "ласточка", wordDisplay: "Ласточка", letterKey: "v", wordKey: "lastochka", bgSolid: "#5C9BD6", letterColor: "#E0F7FA", letterShadow: "#0D47A1", stars: ["☁️", "✨", "💙"], emoji: "🐦" },
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

function playAudio(key: string | null, fallbackText: string): Promise<void> {
  return new Promise((resolve) => {
    if (!key) { speakFallback(fallbackText, resolve); return; }
    const url = `${SERVE_URL}?key=${key}&t=${Date.now()}`;
    const audio = new Audio(url);
    audio.onended = () => resolve();
    audio.onerror = () => speakFallback(fallbackText, resolve);
    audio.play().catch(() => speakFallback(fallbackText, resolve));
  });
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function getFileExt(file: File): string {
  return file.name.split(".").pop()?.toLowerCase() || "jpg";
}

export default function Index() {
  const [currentPage, setCurrentPage] = useState(0);
  const [letterAnim, setLetterAnim] = useState(false);
  const [imageAnim, setImageAnim] = useState(false);
  const [slideDir, setSlideDir] = useState<"left" | "right" | null>(null);
  const [showAdmin, setShowAdmin] = useState(false);
  const [adminTab, setAdminTab] = useState<"audio" | "images">("audio");
  const [audioKeys, setAudioKeys] = useState<Record<string, string | null>>({});
  const [imageUrls, setImageUrls] = useState<Record<string, string | null>>({});
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const [uploadDone, setUploadDone] = useState<Record<string, boolean>>({});
  const touchStartX = useRef<number | null>(null);

  const page = PAGES[currentPage];

  const loadAll = useCallback(() => {
    fetch(LIST_URL + "?t=" + Date.now(), { cache: "no-store" })
      .then(r => r.json())
      .then(data => {
        const parsed = typeof data === "string" ? JSON.parse(data) : data;
        const audio = parsed.audio || parsed;
        const images = parsed.images || {};
        const audioResult: Record<string, string | null> = {};
        for (const key in audio) audioResult[key] = audio[key] ? key : null;
        setAudioKeys(audioResult);
        const imageResult: Record<string, string | null> = {};
        for (const key in images) {
          imageResult[key] = images[key]
            ? `${SERVE_URL}?type=image&key=${key}&t=${Date.now()}`
            : null;
        }
        setImageUrls(imageResult);
      })
      .catch(e => console.error("Load error", e));
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

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
    playAudio(audioKeys[page.letterKey] ?? null, page.letter);
    setLetterAnim(true);
    setTimeout(() => setLetterAnim(false), 800);
  };

  const handleImageClick = () => {
    playAudio(audioKeys[page.wordKey] ?? null, page.word);
    setImageAnim(true);
    setTimeout(() => setImageAnim(false), 800);
  };

  const handleAudioUpload = async (slotKey: string, file: File) => {
    setUploading(p => ({ ...p, [slotKey]: true }));
    setUploadDone(p => ({ ...p, [slotKey]: false }));
    try {
      const data = await fileToBase64(file);
      const res = await fetch(UPLOAD_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ key: slotKey, data }) });
      const json = await res.json();
      const parsed = typeof json === "string" ? JSON.parse(json) : json;
      if (parsed.url) { setUploadDone(p => ({ ...p, [slotKey]: true })); setTimeout(() => loadAll(), 500); }
    } catch (e) { console.error("Audio upload error", e); }
    setUploading(p => ({ ...p, [slotKey]: false }));
  };

  const handleImageUpload = async (slotKey: string, file: File) => {
    setUploading(p => ({ ...p, [`img_${slotKey}`]: true }));
    setUploadDone(p => ({ ...p, [`img_${slotKey}`]: false }));
    try {
      const data = await fileToBase64(file);
      const ext = getFileExt(file);
      const res = await fetch(IMAGE_UPLOAD_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ key: slotKey, data, ext }) });
      const json = await res.json();
      const parsed = typeof json === "string" ? JSON.parse(json) : json;
      if (parsed.url) {
        setUploadDone(p => ({ ...p, [`img_${slotKey}`]: true }));
        // Показываем через прокси чтобы обойти CORS
        setImageUrls(p => ({ ...p, [slotKey]: `${SERVE_URL}?type=image&key=${slotKey}&t=${Date.now()}` }));
      }
    } catch (e) { console.error("Image upload error", e); }
    setUploading(p => ({ ...p, [`img_${slotKey}`]: false }));
  };

  const slideClass = slideDir === "left" ? "animate-slide-left" : slideDir === "right" ? "animate-slide-right" : "";

  const getPageImage = (wordKey: string) => imageUrls[wordKey] || DEFAULT_IMAGES[wordKey];

  if (showAdmin) {
    return (
      <div className="min-h-screen w-full flex flex-col" style={{ background: "linear-gradient(135deg, #667eea, #764ba2)" }}>
        <div className="flex items-center gap-3 px-4 py-4">
          <button onClick={() => setShowAdmin(false)} className="w-10 h-10 rounded-full flex items-center justify-center cursor-pointer" style={{ background: "rgba(255,255,255,0.25)" }}>
            <Icon name="ArrowLeft" size={20} className="text-white" />
          </button>
          <h1 className="font-caveat font-bold text-white text-2xl">Настройки</h1>
          <button onClick={loadAll} className="ml-auto w-9 h-9 rounded-full flex items-center justify-center cursor-pointer" style={{ background: "rgba(255,255,255,0.2)" }} title="Обновить">
            <Icon name="RefreshCw" size={16} className="text-white" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 px-4 mb-4">
          {(["audio", "images"] as const).map(tab => (
            <button key={tab} onClick={() => setAdminTab(tab)}
              className="flex-1 py-2 rounded-xl font-nunito font-bold text-sm cursor-pointer transition-all"
              style={{ background: adminTab === tab ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.2)", color: adminTab === tab ? "#764ba2" : "white" }}>
              {tab === "audio" ? "🔊 Аудио" : "🖼️ Картинки"}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-8 flex flex-col gap-3">
          {adminTab === "audio" && (
            <>
              <p className="font-nunito text-white/80 text-sm mb-1">Загрузи MP3-файлы с голосом для каждой буквы и слова.</p>
              {AUDIO_SLOTS.map((slot) => {
                const has = !!audioKeys[slot.key];
                const isUp = uploading[slot.key];
                const isDone = uploadDone[slot.key];
                return (
                  <div key={slot.key} className="rounded-2xl p-4 flex items-center gap-3" style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(10px)" }}>
                    <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: has ? "rgba(100,220,100,0.4)" : "rgba(255,255,255,0.2)" }}>
                      {isUp ? <Icon name="Loader2" size={18} className="text-white animate-spin" /> : (isDone || has) ? <Icon name="CheckCircle" size={18} className="text-green-200" /> : <Icon name="Music" size={18} className="text-white/60" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-nunito font-bold text-white text-sm">{slot.label}</div>
                      <div className="font-nunito text-white/60 text-xs mt-0.5">{has ? "Загружен ✓" : "Не загружен"}</div>
                    </div>
                    <label className="cursor-pointer">
                      <input type="file" accept="audio/mp3,audio/mpeg,.mp3" className="hidden" disabled={isUp}
                        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleAudioUpload(slot.key, f); e.target.value = ""; }} />
                      <div className="px-3 py-2 rounded-xl font-nunito font-bold text-white text-sm flex items-center gap-1" style={{ background: "rgba(255,255,255,0.25)" }}>
                        <Icon name="Upload" size={14} className="text-white" />
                        {has ? "Заменить" : "Загрузить"}
                      </div>
                    </label>
                  </div>
                );
              })}
            </>
          )}

          {adminTab === "images" && (
            <>
              <p className="font-nunito text-white/80 text-sm mb-1">Загрузи свои картинки (JPG, PNG). Они заменят стандартные.</p>
              {IMAGE_SLOTS.map((slot) => {
                const currentUrl = imageUrls[slot.key];
                const previewUrl = currentUrl || DEFAULT_IMAGES[slot.key];
                const isUp = uploading[`img_${slot.key}`];
                const isDone = uploadDone[`img_${slot.key}`];
                return (
                  <div key={slot.key} className="rounded-2xl p-4 flex items-center gap-3" style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(10px)" }}>
                    <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 border-2 border-white/30">
                      <img src={previewUrl || ""} alt={slot.label} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-nunito font-bold text-white text-sm">{slot.label}</div>
                      <div className="font-nunito text-white/60 text-xs mt-0.5">
                        {isDone ? "Загружена ✓" : currentUrl ? "Своя картинка" : "Стандартная"}
                      </div>
                    </div>
                    <label className="cursor-pointer">
                      <input type="file" accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp" className="hidden" disabled={isUp}
                        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageUpload(slot.key, f); e.target.value = ""; }} />
                      <div className="px-3 py-2 rounded-xl font-nunito font-bold text-white text-sm flex items-center gap-1" style={{ background: "rgba(255,255,255,0.25)" }}>
                        {isUp ? <Icon name="Loader2" size={14} className="text-white animate-spin" /> : <Icon name="Upload" size={14} className="text-white" />}
                        {currentUrl ? "Заменить" : "Загрузить"}
                      </div>
                    </label>
                  </div>
                );
              })}
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center overflow-hidden relative"
      style={{ background: `linear-gradient(135deg, ${page.bgSolid}cc, ${page.bgSolid}88)`, transition: "background 0.5s ease" }}
      onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -left-20 w-64 h-64 rounded-full opacity-30 animate-float" style={{ background: "rgba(255,255,255,0.4)", animationDelay: "0s" }} />
        <div className="absolute -bottom-10 -right-10 w-48 h-48 rounded-full opacity-20 animate-float" style={{ background: "rgba(255,255,255,0.3)", animationDelay: "1s" }} />
        {[...Array(12)].map((_, i) => (
          <div key={i} className="absolute rounded-full opacity-40" style={{ width: `${8 + (i % 3) * 6}px`, height: `${8 + (i % 3) * 6}px`, background: "rgba(255,255,255,0.5)", top: `${10 + (i * 17) % 80}%`, left: `${5 + (i * 23) % 90}%` }} />
        ))}
      </div>

      <button onClick={() => setShowAdmin(true)} className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full flex items-center justify-center cursor-pointer" style={{ background: "rgba(255,255,255,0.25)", backdropFilter: "blur(8px)" }}>
        <Icon name="Settings" size={18} className="text-white" />
      </button>

      <div className={`relative z-10 flex flex-col items-center w-full max-w-sm mx-auto px-4 ${slideClass}`} style={{ minHeight: "100dvh", justifyContent: "center" }}>
        <div className="flex gap-4 mb-2 text-2xl">
          {page.stars.map((s, i) => <span key={i} className="animate-float" style={{ animationDelay: `${i * 0.4}s`, fontSize: "1.6rem" }}>{s}</span>)}
        </div>

        <button onClick={handleLetterClick} className={`relative select-none cursor-pointer transition-transform active:scale-90 ${letterAnim ? "animate-wiggle" : ""}`} style={{ background: "none", border: "none", padding: 0 }}>
          <span className="font-caveat font-bold leading-none" style={{ fontSize: "clamp(120px, 35vw, 180px)", color: page.letterColor, textShadow: `6px 6px 0px ${page.letterShadow}, 0 0 40px rgba(255,255,255,0.4)`, display: "block", filter: "drop-shadow(0 8px 20px rgba(0,0,0,0.2))" }}>
            {page.letter}
          </span>
          <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-white/70 font-nunito whitespace-nowrap" style={{ fontSize: "0.75rem" }}>👆 нажми на меня!</span>
        </button>

        <button onClick={handleImageClick} className={`mt-8 relative cursor-pointer select-none transition-transform active:scale-95 ${imageAnim ? "animate-pop" : ""}`} style={{ background: "none", border: "none", padding: 0 }}>
          <div className="rounded-3xl overflow-hidden shadow-2xl border-4 border-white/50" style={{ width: "clamp(200px, 60vw, 260px)", height: "clamp(200px, 60vw, 260px)", background: "rgba(255,255,255,0.25)" }}>
            <img src={getPageImage(page.wordKey)} alt={page.wordDisplay} className="w-full h-full object-cover" />
          </div>
          <div className="mt-3 px-6 py-2 rounded-full font-caveat font-bold text-white text-center shadow-lg" style={{ background: "rgba(255,255,255,0.25)", backdropFilter: "blur(10px)", fontSize: "clamp(1.4rem, 6vw, 1.8rem)", textShadow: "0 2px 8px rgba(0,0,0,0.3)" }}>
            {page.wordDisplay} {page.emoji}
          </div>
          <span className="block text-center text-white/70 font-nunito mt-1" style={{ fontSize: "0.75rem" }}>👆 нажми на меня!</span>
        </button>

        <div className="flex items-center gap-4 mt-10">
          <button onClick={goPrev} disabled={currentPage === 0} className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-90 ${currentPage === 0 ? "opacity-30 cursor-not-allowed" : "opacity-100 hover:scale-110 cursor-pointer"}`} style={{ background: "rgba(255,255,255,0.35)", backdropFilter: "blur(8px)" }}>
            <Icon name="ChevronLeft" size={24} className="text-white" />
          </button>
          <div className="flex gap-3">
            {PAGES.map((_, i) => (
              <button key={i} onClick={() => goTo(i)} className="transition-all duration-300 rounded-full cursor-pointer" style={{ width: i === currentPage ? "28px" : "12px", height: "12px", background: i === currentPage ? "white" : "rgba(255,255,255,0.5)", boxShadow: i === currentPage ? "0 2px 8px rgba(0,0,0,0.2)" : "none" }} />
            ))}
          </div>
          <button onClick={goNext} disabled={currentPage === PAGES.length - 1} className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-90 ${currentPage === PAGES.length - 1 ? "opacity-30 cursor-not-allowed" : "opacity-100 hover:scale-110 cursor-pointer"}`} style={{ background: "rgba(255,255,255,0.35)", backdropFilter: "blur(8px)" }}>
            <Icon name="ChevronRight" size={24} className="text-white" />
          </button>
        </div>

        <button onClick={async () => { await playAudio(audioKeys[page.letterKey] ?? null, page.letter); await playAudio(audioKeys[page.wordKey] ?? null, page.word); }}
          className="mt-5 flex items-center gap-2 px-5 py-3 rounded-full font-nunito font-bold text-white shadow-lg transition-all active:scale-95 hover:scale-105 cursor-pointer"
          style={{ background: "rgba(255,255,255,0.25)", backdropFilter: "blur(10px)", fontSize: "1rem", border: "2px solid rgba(255,255,255,0.5)" }}>
          <Icon name="Volume2" size={20} className="text-white" />
          Повторить всё
        </button>
      </div>
    </div>
  );
}