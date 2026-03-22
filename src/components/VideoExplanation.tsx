import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, SkipForward, SkipBack, Video, Volume2, VolumeX, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

interface VideoExplanationProps {
  solution: string;
}

interface Slide {
  title: string;
  content: string;
  bulletPoints: string[];
}

function parseSolutionToSlides(solution: string): Slide[] {
  const slides: Slide[] = [];
  const sections = solution.split(/(?=#{1,3}\s|\*\*\d+\.\s|\*\*Step|\*\*Understanding|\*\*Key Concepts|\*\*Final Answer|\*\*Intuition|\*\*What is it|\*\*How it Works|\*\*Real-World|\*\*Analogies|\*\*Fun Fact|\*\*Quick Summary)/);

  for (const section of sections) {
    const trimmed = section.trim();
    if (!trimmed || trimmed.length < 10) continue;

    const titleMatch = trimmed.match(/^(?:#{1,3}\s*)?(?:(?:\*\*|\d+\.\s))?(.+?)(?:(?:\*\*|\s\d+\.\s))?(?:\n|$)/);
    const title = titleMatch?.[1]?.replace(/[*#]/g, "").trim() || "Step";
    const body = trimmed.replace(/^.*?\n/, "").trim() || trimmed;

    const bullets = body.match(/(?:^|\n)\s*[-•*]\s+(.+)/g)?.map(b => b.replace(/^\s*[-•*]\s+/, "").trim()) || [];
    
    const sentences = body.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 5);
    if (sentences.length > 4) {
      const chunkSize = Math.ceil(sentences.length / Math.ceil(sentences.length / 3));
      for (let i = 0; i < sentences.length; i += chunkSize) {
        const chunk = sentences.slice(i, i + chunkSize);
        const partNum = Math.floor(i / chunkSize) + 1;
        slides.push({
          title: i === 0 ? title.slice(0, 60) : `${title.slice(0, 50)} (part ${partNum})`,
          content: chunk.join(" "),
          bulletPoints: i === 0 ? bullets.slice(0, 3) : [],
        });
      }
    } else {
      slides.push({ title: title.slice(0, 60), content: body, bulletPoints: bullets });
    }
  }

  if (slides.length < 10 && solution.trim()) {
    const allContent = slides.map(s => s.content).join(" ");
    const sentences = allContent.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 15);
    if (sentences.length >= 10) {
      const newSlides: Slide[] = [];
      const chunkSize = Math.max(2, Math.ceil(sentences.length / 15));
      for (let i = 0; i < sentences.length; i += chunkSize) {
        newSlides.push({
          title: `Part ${Math.floor(i / chunkSize) + 1}`,
          content: sentences.slice(i, i + chunkSize).join(" "),
          bulletPoints: [],
        });
      }
      return newSlides;
    }
  }

  if (slides.length === 0 && solution.trim()) {
    const sentences = solution.split(/[.!?]\s+/).filter(s => s.trim().length > 15);
    const chunkSize = Math.max(2, Math.ceil(sentences.length / 15));
    for (let i = 0; i < sentences.length; i += chunkSize) {
      slides.push({
        title: `Part ${Math.floor(i / chunkSize) + 1}`,
        content: sentences.slice(i, i + chunkSize).join(". ") + ".",
        bulletPoints: [],
      });
    }
  }

  return slides;
}

const slideAnimations = [
  { initial: { opacity: 0, x: 80, scale: 0.95 }, animate: { opacity: 1, x: 0, scale: 1 }, exit: { opacity: 0, x: -80, scale: 0.95 } },
  { initial: { opacity: 0, y: 60, rotateX: 15 }, animate: { opacity: 1, y: 0, rotateX: 0 }, exit: { opacity: 0, y: -60, rotateX: -15 } },
  { initial: { opacity: 0, scale: 0.8 }, animate: { opacity: 1, scale: 1 }, exit: { opacity: 0, scale: 1.1 } },
];

const VideoExplanation = ({ solution }: VideoExplanationProps) => {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceIndex, setSelectedVoiceIndex] = useState(0);
  const [showVoiceMenu, setShowVoiceMenu] = useState(false);
  const [speed, setSpeed] = useState(0.9);
  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (solution) setSlides(parseSolutionToSlides(solution));
  }, [solution]);

  useEffect(() => {
    const loadVoices = () => {
      const available = speechSynthesis.getVoices().filter(v => v.lang.startsWith("en"));
      if (available.length > 0) {
        setVoices(available);
        // Prefer a natural sounding voice
        const preferred = available.findIndex(v =>
          /samantha|karen|daniel|google.*us|natural/i.test(v.name)
        );
        if (preferred >= 0) setSelectedVoiceIndex(preferred);
      }
    };
    loadVoices();
    speechSynthesis.addEventListener("voiceschanged", loadVoices);
    return () => {
      clearInterval(timerRef.current);
      speechSynthesis.cancel();
      speechSynthesis.removeEventListener("voiceschanged", loadVoices);
    };
  }, []);

  const cleanTextForSpeech = (text: string): string => {
    let cleaned = text;
    // Replace display LaTeX $$...$$ — keep inner content as readable text
    cleaned = cleaned.replace(/\$\$(.+?)\$\$/gs, (_, inner) => inner);
    // Replace inline LaTeX $...$ — keep inner content
    cleaned = cleaned.replace(/\$(.+?)\$/g, (_, inner) => inner);
    // Convert common LaTeX commands to spoken words
    cleaned = cleaned.replace(/\\boxed{([^}]*)}/g, "$1");
    cleaned = cleaned.replace(/\\frac{([^}]*)}{([^}]*)}/g, "$1 over $2");
    cleaned = cleaned.replace(/\\sqrt{([^}]*)}/g, "square root of $1");
    cleaned = cleaned.replace(/\\times/g, " times ");
    cleaned = cleaned.replace(/\\div/g, " divided by ");
    cleaned = cleaned.replace(/\\pm/g, " plus or minus ");
    cleaned = cleaned.replace(/\\approx/g, " approximately ");
    cleaned = cleaned.replace(/\\neq/g, " not equal to ");
    cleaned = cleaned.replace(/\\leq/g, " less than or equal to ");
    cleaned = cleaned.replace(/\\geq/g, " greater than or equal to ");
    cleaned = cleaned.replace(/\\cdot/g, " times ");
    cleaned = cleaned.replace(/\\infty/g, " infinity ");
    cleaned = cleaned.replace(/\\pi/g, " pi ");
    cleaned = cleaned.replace(/\\theta/g, " theta ");
    cleaned = cleaned.replace(/\\alpha/g, " alpha ");
    cleaned = cleaned.replace(/\\beta/g, " beta ");
    // Remove remaining backslash commands
    cleaned = cleaned.replace(/\\[a-zA-Z]+/g, " ");
    // Replace math symbols with words
    cleaned = cleaned.replace(/\^2/g, " squared ");
    cleaned = cleaned.replace(/\^3/g, " cubed ");
    cleaned = cleaned.replace(/\^(\d+)/g, " to the power of $1 ");
    cleaned = cleaned.replace(/\^{([^}]*)}/g, " to the power of $1 ");
    cleaned = cleaned.replace(/_(\d)/g, " sub $1 ");
    cleaned = cleaned.replace(/_{([^}]*)}/g, " sub $1 ");
    // Clean remaining special characters
    cleaned = cleaned.replace(/[{}[\]|\\]/g, " ");
    cleaned = cleaned.replace(/\*\*/g, "");
    cleaned = cleaned.replace(/[#*_~`]/g, "");
    // Normalize whitespace
    cleaned = cleaned.replace(/\s+/g, " ").trim();
    return cleaned;
  };

  const speakSlide = (index: number, onFinished?: () => void) => {
    speechSynthesis.cancel();
    if (!voiceEnabled) {
      // If voice is off, wait a few seconds then advance
      onFinished?.();
      return;
    }
    const slideData = slides[index];
    if (!slideData) { onFinished?.(); return; }
    
    const titleText = slideData.title.replace(/[*#]/g, "").trim();
    const contentText = cleanTextForSpeech(slideData.content);
    const fullText = `${titleText}. ${contentText}`;
    
    if (!fullText || fullText.length < 5) { onFinished?.(); return; }
    
    // Chrome has a bug where long utterances cut off. Split into chunks.
    const chunks = fullText.match(/.{1,200}(?:\s|$)/g) || [fullText];
    
    let chunkIndex = 0;
    const speakNextChunk = () => {
      if (chunkIndex >= chunks.length) {
        setIsSpeaking(false);
        onFinished?.();
        return;
      }
      const utt = new SpeechSynthesisUtterance(chunks[chunkIndex]);
      utt.rate = speed;
      utt.pitch = 1.0;
      if (voices[selectedVoiceIndex]) utt.voice = voices[selectedVoiceIndex];
      utt.onstart = () => setIsSpeaking(true);
      utt.onend = () => {
        chunkIndex++;
        speakNextChunk();
      };
      utt.onerror = () => {
        setIsSpeaking(false);
        onFinished?.();
      };
      utteranceRef.current = utt;
      speechSynthesis.speak(utt);
    };
    
    speakNextChunk();
  };

  const playFromSlide = (index: number) => {
    if (index >= slides.length) {
      setIsPlaying(false);
      setIsSpeaking(false);
      return;
    }
    setCurrentSlide(index);
    if (voiceEnabled) {
      speakSlide(index, () => {
        // Only advance to next slide AFTER speech fully finishes
        playFromSlide(index + 1);
      });
    } else {
      // No voice: wait 8 seconds per slide then advance
      timerRef.current = setTimeout(() => {
        playFromSlide(index + 1);
      }, 8000);
    }
  };

  const goToSlide = (index: number) => {
    const next = Math.max(0, Math.min(slides.length - 1, index));
    setCurrentSlide(next);
    speechSynthesis.cancel();
    if (isPlaying) {
      // Restart play chain from this slide
      playFromSlide(next);
    }
  };

  const togglePlay = () => {
    if (isPlaying) {
      clearTimeout(timerRef.current);
      speechSynthesis.cancel();
      setIsPlaying(false);
      setIsSpeaking(false);
    } else {
      setIsPlaying(true);
      playFromSlide(currentSlide);
    }
  };

  if (slides.length === 0) return null;

  const anim = slideAnimations[currentSlide % slideAnimations.length];
  const slide = slides[currentSlide];
  const cleanContent = slide?.content.replace(/[*#]/g, "").slice(0, 500);
  const totalMinutes = Math.ceil((slides.length * 20) / 60);

  return (
    <div className="rounded-2xl bg-gradient-card border border-border/50 shadow-elevated overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-border/50">
        <Video className="w-4 h-4 text-accent" />
        <span className="text-sm font-semibold text-foreground">AI Video Explanation</span>
        <span className="text-xs text-muted-foreground ml-auto">{currentSlide + 1} / {slides.length} · ~{totalMinutes} min</span>
      </div>

      <div className="relative aspect-video bg-background flex items-center justify-center p-8 md:p-12 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5" />
        <motion.div
          className="absolute top-0 left-0 w-48 h-48 rounded-full bg-primary/5 blur-3xl"
          animate={{ x: [0, 40, 0], y: [0, 30, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-0 right-0 w-64 h-64 rounded-full bg-accent/5 blur-3xl"
          animate={{ x: [0, -30, 0], y: [0, -40, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />

        <motion.div
          className="absolute top-4 left-4 w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-sm"
          key={`num-${currentSlide}`}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", damping: 15 }}
        >
          {currentSlide + 1}
        </motion.div>

        {isSpeaking && (
          <motion.div
            className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <motion.div className="w-1.5 h-1.5 rounded-full bg-primary" animate={{ scale: [1, 1.4, 1] }} transition={{ repeat: Infinity, duration: 0.8 }} />
            <motion.div className="w-1.5 h-1.5 rounded-full bg-primary" animate={{ scale: [1, 1.4, 1] }} transition={{ repeat: Infinity, duration: 0.8, delay: 0.2 }} />
            <motion.div className="w-1.5 h-1.5 rounded-full bg-primary" animate={{ scale: [1, 1.4, 1] }} transition={{ repeat: Infinity, duration: 0.8, delay: 0.4 }} />
            <span className="text-xs text-primary font-medium ml-1">Speaking</span>
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={anim.initial}
            animate={anim.animate}
            exit={anim.exit}
            transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
            className="relative z-10 text-center max-w-2xl w-full"
          >
            <motion.h3
              className="text-lg md:text-2xl font-bold text-primary mb-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              {slide?.title}
            </motion.h3>
            <motion.div
              className="h-0.5 bg-gradient-to-r from-transparent via-primary/40 to-transparent mx-auto mb-4"
              initial={{ width: 0 }}
              animate={{ width: "60%" }}
              transition={{ delay: 0.3, duration: 0.5 }}
            />

            {slide?.bulletPoints && slide.bulletPoints.length > 0 && (
              <div className="text-left mx-auto max-w-lg mb-3 space-y-1.5">
                {slide.bulletPoints.slice(0, 4).map((bp, i) => (
                  <motion.div
                    key={i}
                    className="flex items-start gap-2 text-sm text-foreground/80"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + i * 0.12 }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                    <span>{bp.replace(/[*#$\\]/g, "").slice(0, 100)}</span>
                  </motion.div>
                ))}
              </div>
            )}

            <motion.p
              className="text-sm md:text-base text-foreground/80 leading-relaxed whitespace-pre-wrap"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35 }}
            >
              {cleanContent}
              {(slide?.content.length || 0) > 500 ? "..." : ""}
            </motion.p>
          </motion.div>
        </AnimatePresence>

        <div className="absolute bottom-0 left-0 right-0 h-1 bg-secondary">
          <motion.div className="h-full bg-gradient-to-r from-primary to-accent" animate={{ width: `${((currentSlide + 1) / slides.length) * 100}%` }} transition={{ duration: 0.3 }} />
        </div>
      </div>

      <div className="px-6 py-4 space-y-3">
        <div className="flex items-center justify-center gap-3">
          <div className="relative">
            <Button variant="ghost" size="icon" onClick={() => setShowVoiceMenu(!showVoiceMenu)} className="text-muted-foreground">
              {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              <ChevronDown className="w-2.5 h-2.5 ml-0.5" />
            </Button>
            {showVoiceMenu && (
              <div className="absolute bottom-full mb-2 left-0 w-56 rounded-xl bg-card border border-border shadow-elevated p-3 z-20 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-foreground">Voice</span>
                  <button onClick={() => { setVoiceEnabled(!voiceEnabled); speechSynthesis.cancel(); }} className="text-xs text-primary">
                    {voiceEnabled ? "Mute" : "Unmute"}
                  </button>
                </div>
                <select
                  className="w-full text-xs bg-secondary/50 border border-border rounded-lg px-2 py-1.5 text-foreground"
                  value={selectedVoiceIndex}
                  onChange={(e) => setSelectedVoiceIndex(Number(e.target.value))}
                >
                  {voices.map((v, i) => (
                    <option key={i} value={i}>{v.name.replace(/\(.+\)/, "").trim()}</option>
                  ))}
                </select>
                <div>
                  <span className="text-xs text-muted-foreground">Speed: {speed.toFixed(2)}x</span>
                  <Slider min={0.5} max={1.5} step={0.05} value={[speed]} onValueChange={([v]) => setSpeed(v)} className="mt-1" />
                </div>
              </div>
            )}
          </div>

          <Button variant="ghost" size="icon" onClick={() => goToSlide(currentSlide - 1)} disabled={currentSlide === 0}>
            <SkipBack className="w-4 h-4" />
          </Button>
          <Button variant="hero" size="icon" onClick={togglePlay} className="w-12 h-12 rounded-full">
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={() => goToSlide(currentSlide + 1)} disabled={currentSlide >= slides.length - 1}>
            <SkipForward className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex justify-center gap-1.5 flex-wrap">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => goToSlide(i)}
              className={`h-1.5 rounded-full transition-all ${i === currentSlide ? "w-6 bg-primary" : "w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/50"}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default VideoExplanation;
