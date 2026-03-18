import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, SkipForward, SkipBack, Video, Loader2, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";

interface VideoExplanationProps {
  solution: string;
}

interface Slide {
  title: string;
  content: string;
}

function parseSolutionToSlides(solution: string): Slide[] {
  const slides: Slide[] = [];
  const sections = solution.split(/(?=#{1,3}\s|\*\*\d+\.\s|\*\*Step|\*\*Understanding|\*\*Key Concepts|\*\*Final Answer|\*\*Intuition)/);

  for (const section of sections) {
    const trimmed = section.trim();
    if (!trimmed || trimmed.length < 10) continue;

    const titleMatch = trimmed.match(/^(?:#{1,3}\s*)?(?:\*\*)?(.+?)(?:\*\*)?(?:\n|$)/);
    const title = titleMatch?.[1]?.replace(/[*#]/g, "").trim() || "Step";
    const content = trimmed.replace(/^.*?\n/, "").trim() || trimmed;

    slides.push({ title: title.slice(0, 60), content });
  }

  if (slides.length === 0 && solution.trim()) {
    const sentences = solution.split(/[.!?]\s+/).filter(s => s.trim().length > 15);
    const chunkSize = Math.ceil(sentences.length / Math.min(5, Math.max(2, Math.floor(sentences.length / 3))));
    for (let i = 0; i < sentences.length; i += chunkSize) {
      slides.push({ title: `Part ${Math.floor(i / chunkSize) + 1}`, content: sentences.slice(i, i + chunkSize).join(". ") + "." });
    }
  }

  return slides;
}

const VideoExplanation = ({ solution }: VideoExplanationProps) => {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (solution) setSlides(parseSolutionToSlides(solution));
  }, [solution]);

  useEffect(() => {
    return () => {
      clearInterval(timerRef.current);
      speechSynthesis.cancel();
    };
  }, []);

  const speakSlide = (index: number) => {
    speechSynthesis.cancel();
    if (!voiceEnabled) return;
    const text = slides[index]?.content.replace(/[*#$\\{}[\]]/g, "").replace(/\s+/g, " ").trim();
    if (!text) return;
    const utt = new SpeechSynthesisUtterance(text);
    utt.rate = 0.95;
    utt.pitch = 1;
    utt.onstart = () => setIsSpeaking(true);
    utt.onend = () => setIsSpeaking(false);
    utteranceRef.current = utt;
    speechSynthesis.speak(utt);
  };

  const goToSlide = (index: number) => {
    const next = Math.max(0, Math.min(slides.length - 1, index));
    setCurrentSlide(next);
    if (isPlaying) speakSlide(next);
  };

  const togglePlay = () => {
    if (isPlaying) {
      clearInterval(timerRef.current);
      speechSynthesis.cancel();
      setIsPlaying(false);
      setIsSpeaking(false);
    } else {
      setIsPlaying(true);
      speakSlide(currentSlide);
      timerRef.current = setInterval(() => {
        setCurrentSlide((prev) => {
          const next = prev + 1;
          if (next >= slides.length) {
            clearInterval(timerRef.current);
            setIsPlaying(false);
            speechSynthesis.cancel();
            return prev;
          }
          speakSlide(next);
          return next;
        });
      }, 8000);
    }
  };

  if (slides.length === 0) return null;

  return (
    <div className="rounded-2xl bg-gradient-card border border-border/50 shadow-elevated overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-border/50">
        <Video className="w-4 h-4 text-accent" />
        <span className="text-sm font-semibold text-foreground">AI Video Explanation</span>
        <span className="text-xs text-muted-foreground ml-auto">{currentSlide + 1} / {slides.length}</span>
      </div>

      {/* Slide display */}
      <div className="relative aspect-video bg-background flex items-center justify-center p-8 md:p-12 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5" />
        <AnimatePresence mode="wait">
          <motion.div key={currentSlide} initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.4 }}
            className="relative z-10 text-center max-w-2xl">
            <h3 className="text-lg md:text-2xl font-bold text-primary mb-4">{slides[currentSlide]?.title}</h3>
            <p className="text-sm md:text-base text-foreground/80 leading-relaxed whitespace-pre-wrap">
              {slides[currentSlide]?.content.replace(/[*#]/g, "").slice(0, 300)}
              {(slides[currentSlide]?.content.length || 0) > 300 ? "..." : ""}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Progress bar */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-secondary">
          <motion.div className="h-full bg-gradient-primary" animate={{ width: `${((currentSlide + 1) / slides.length) * 100}%` }} transition={{ duration: 0.3 }} />
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-3 px-6 py-4">
        <Button variant="ghost" size="icon" onClick={() => setVoiceEnabled(!voiceEnabled)} className="text-muted-foreground">
          {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </Button>
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
    </div>
  );
};

export default VideoExplanation;
