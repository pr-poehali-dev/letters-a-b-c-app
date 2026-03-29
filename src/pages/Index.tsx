import { useState, useRef, useCallback } from "react";
import Icon from "@/components/ui/icon";

const PAGES = [
  {
    letter: "А",
    word: "петух",
    wordDisplay: "Петух",
    letterAudio: "/audio/a.mp3",
    wordAudio: "/audio/petuh.mp3",
    image: "https://cdn.poehali.dev/projects/56129175-d3b6-45a1-9e31-141730f2c62e/files/97939e00-e7d2-4001-aaea-5b1f072ca113.jpg",
    bg: "from-orange-400 via-pink-400 to-rose-400",
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
    letterAudio: "/audio/b.mp3",
    wordAudio: "/audio/banan.mp3",
    image: "https://cdn.poehali.dev/projects/56129175-d3b6-45a1-9e31-141730f2c62e/files/2d40b47d-599e-4196-8b7d-fc19ddb0c451.jpg",
    bg: "from-yellow-400 via-lime-400 to-green-400",
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
    letterAudio: "/audio/v.mp3",
    wordAudio: "/audio/lastochka.mp3",
    image: "https://cdn.poehali.dev/projects/56129175-d3b6-45a1-9e31-141730f2c62e/files/c937470b-b3d4-4be3-8d14-013067e9f043.jpg",
    bg: "from-sky-400 via-blue-400 to-indigo-400",
    bgSolid: "#5C9BD6",
    letterColor: "#E0F7FA",
    letterShadow: "#0D47A1",
    stars: ["☁️", "✨", "💙"],
    emoji: "🐦",
  },
];

function playAudio(audioPath: string, fallbackText: string): Promise<void> {
  return new Promise((resolve) => {
    const audio = new Audio(audioPath);
    audio.onended = () => resolve();
    audio.onerror = () => {
      // Файл не найден — используем синтез речи
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(fallbackText);
      utter.lang = "ru-RU";
      utter.rate = 0.85;
      utter.pitch = 1.2;
      utter.onend = () => resolve();
      window.speechSynthesis.speak(utter);
    };
    audio.play().catch(() => {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(fallbackText);
      utter.lang = "ru-RU";
      utter.rate = 0.85;
      utter.pitch = 1.2;
      utter.onend = () => resolve();
      window.speechSynthesis.speak(utter);
    });
  });
}

export default function Index() {
  const [currentPage, setCurrentPage] = useState(0);
  const [letterAnim, setLetterAnim] = useState(false);
  const [imageAnim, setImageAnim] = useState(false);
  const [slideDir, setSlideDir] = useState<"left" | "right" | null>(null);
  const touchStartX = useRef<number | null>(null);

  const page = PAGES[currentPage];

  const goTo = useCallback((index: number) => {
    if (index === currentPage) return;
    setSlideDir(index > currentPage ? "left" : "right");
    setTimeout(() => {
      setCurrentPage(index);
      setSlideDir(null);
    }, 350);
  }, [currentPage]);

  const goNext = () => { if (currentPage < PAGES.length - 1) goTo(currentPage + 1); };
  const goPrev = () => { if (currentPage > 0) goTo(currentPage - 1); };

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) goNext();
      else goPrev();
    }
    touchStartX.current = null;
  };

  const handleLetterClick = () => {
    playAudio(page.letterAudio, page.letter);
    setLetterAnim(true);
    setTimeout(() => setLetterAnim(false), 600);
  };

  const handleImageClick = () => {
    playAudio(page.wordAudio, page.word);
    setImageAnim(true);
    setTimeout(() => setImageAnim(false), 600);
  };

  const slideClass = slideDir === "left"
    ? "animate-slide-left"
    : slideDir === "right"
    ? "animate-slide-right"
    : "";

  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-center overflow-hidden relative"
      style={{
        background: `linear-gradient(135deg, ${page.bgSolid}cc, ${page.bgSolid}88)`,
        transition: "background 0.5s ease",
      }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Animated background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-20 -left-20 w-64 h-64 rounded-full opacity-30 animate-float"
          style={{ background: "rgba(255,255,255,0.4)", animationDelay: "0s" }}
        />
        <div
          className="absolute -bottom-10 -right-10 w-48 h-48 rounded-full opacity-20 animate-float"
          style={{ background: "rgba(255,255,255,0.3)", animationDelay: "1s" }}
        />
        <div
          className="absolute top-1/2 -left-16 w-32 h-32 rounded-full opacity-20 animate-float"
          style={{ background: "rgba(255,255,255,0.25)", animationDelay: "2s" }}
        />
        {/* Decorative dots */}
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full opacity-40"
            style={{
              width: `${8 + (i % 3) * 6}px`,
              height: `${8 + (i % 3) * 6}px`,
              background: "rgba(255,255,255,0.5)",
              top: `${10 + (i * 17) % 80}%`,
              left: `${5 + (i * 23) % 90}%`,
              animationDelay: `${i * 0.3}s`,
            }}
          />
        ))}
      </div>

      {/* Main card */}
      <div
        className={`relative z-10 flex flex-col items-center w-full max-w-sm mx-auto px-4 ${slideClass}`}
        style={{ minHeight: "100dvh", justifyContent: "center" }}
      >
        {/* Stars / decorations */}
        <div className="flex gap-4 mb-2 text-2xl">
          {page.stars.map((s, i) => (
            <span
              key={i}
              className="animate-float"
              style={{ animationDelay: `${i * 0.4}s`, fontSize: "1.6rem" }}
            >
              {s}
            </span>
          ))}
        </div>

        {/* Letter */}
        <button
          onClick={handleLetterClick}
          className={`relative select-none cursor-pointer transition-transform active:scale-90 ${letterAnim ? "animate-wiggle" : ""}`}
          style={{ background: "none", border: "none", padding: 0 }}
          aria-label={`Буква ${page.letter}`}
        >
          <span
            className="font-caveat font-bold leading-none"
            style={{
              fontSize: "clamp(120px, 35vw, 180px)",
              color: page.letterColor,
              textShadow: `6px 6px 0px ${page.letterShadow}, 0 0 40px rgba(255,255,255,0.4)`,
              display: "block",
              filter: "drop-shadow(0 8px 20px rgba(0,0,0,0.2))",
            }}
          >
            {page.letter}
          </span>
          {/* Tap hint */}
          <span
            className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-white/70 font-nunito text-sm whitespace-nowrap"
            style={{ fontSize: "0.75rem" }}
          >
            👆 нажми на меня!
          </span>
        </button>

        {/* Image card */}
        <button
          onClick={handleImageClick}
          className={`mt-8 relative cursor-pointer select-none transition-transform active:scale-95 ${imageAnim ? "animate-pop" : ""}`}
          style={{ background: "none", border: "none", padding: 0 }}
          aria-label={`Нажми чтобы услышать слово ${page.word}`}
        >
          <div
            className="rounded-3xl overflow-hidden shadow-2xl border-4 border-white/50"
            style={{
              width: "clamp(200px, 60vw, 260px)",
              height: "clamp(200px, 60vw, 260px)",
              background: "rgba(255,255,255,0.25)",
            }}
          >
            <img
              src={page.image}
              alt={page.wordDisplay}
              className="w-full h-full object-cover"
              style={{ objectPosition: "center" }}
            />
          </div>
          {/* Word label */}
          <div
            className="mt-3 px-6 py-2 rounded-full font-caveat font-bold text-white text-center shadow-lg"
            style={{
              background: "rgba(255,255,255,0.25)",
              backdropFilter: "blur(10px)",
              fontSize: "clamp(1.4rem, 6vw, 1.8rem)",
              textShadow: "0 2px 8px rgba(0,0,0,0.3)",
              letterSpacing: "0.05em",
            }}
          >
            {page.wordDisplay} {page.emoji}
          </div>
          <span
            className="block text-center text-white/70 font-nunito mt-1"
            style={{ fontSize: "0.75rem" }}
          >
            👆 нажми на меня!
          </span>
        </button>

        {/* Navigation */}
        <div className="flex items-center gap-4 mt-10">
          <button
            onClick={goPrev}
            disabled={currentPage === 0}
            className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-90 ${
              currentPage === 0
                ? "opacity-30 cursor-not-allowed"
                : "opacity-100 hover:scale-110 cursor-pointer"
            }`}
            style={{ background: "rgba(255,255,255,0.35)", backdropFilter: "blur(8px)" }}
            aria-label="Назад"
          >
            <Icon name="ChevronLeft" size={24} className="text-white" />
          </button>

          {/* Dots */}
          <div className="flex gap-3">
            {PAGES.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className="transition-all duration-300 rounded-full cursor-pointer"
                style={{
                  width: i === currentPage ? "28px" : "12px",
                  height: "12px",
                  background: i === currentPage ? "white" : "rgba(255,255,255,0.5)",
                  boxShadow: i === currentPage ? "0 2px 8px rgba(0,0,0,0.2)" : "none",
                }}
                aria-label={`Страница ${i + 1}`}
              />
            ))}
          </div>

          <button
            onClick={goNext}
            disabled={currentPage === PAGES.length - 1}
            className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-90 ${
              currentPage === PAGES.length - 1
                ? "opacity-30 cursor-not-allowed"
                : "opacity-100 hover:scale-110 cursor-pointer"
            }`}
            style={{ background: "rgba(255,255,255,0.35)", backdropFilter: "blur(8px)" }}
            aria-label="Вперёд"
          >
            <Icon name="ChevronRight" size={24} className="text-white" />
          </button>
        </div>

        {/* Repeat button */}
        <button
          onClick={async () => {
            await playAudio(page.letterAudio, page.letter);
            await playAudio(page.wordAudio, page.word);
          }}
          className="mt-5 flex items-center gap-2 px-5 py-3 rounded-full font-nunito font-bold text-white shadow-lg transition-all active:scale-95 hover:scale-105 cursor-pointer"
          style={{
            background: "rgba(255,255,255,0.25)",
            backdropFilter: "blur(10px)",
            fontSize: "1rem",
            border: "2px solid rgba(255,255,255,0.5)",
          }}
        >
          <Icon name="Volume2" size={20} className="text-white" />
          Повторить всё
        </button>
      </div>
    </div>
  );
}