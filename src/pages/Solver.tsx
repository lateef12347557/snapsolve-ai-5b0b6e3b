import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Send, X, Loader2, Upload, BookOpen, Atom, Calculator, FlaskConical, GraduationCap, Lightbulb, Globe, Palette, Code, Music, Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { streamSolve } from "@/lib/ai-solver";
import SolutionDisplay from "@/components/SolutionDisplay";
import VideoExplanation from "@/components/VideoExplanation";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const solveSubjects = [
  { id: "math", label: "Math", icon: Calculator },
  { id: "physics", label: "Physics", icon: Atom },
  { id: "chemistry", label: "Chemistry", icon: FlaskConical },
];

const explainSubjects = [
  { id: "math", label: "Math", icon: Calculator },
  { id: "physics", label: "Physics", icon: Atom },
  { id: "chemistry", label: "Chemistry", icon: FlaskConical },
  { id: "biology", label: "Biology", icon: Leaf },
  { id: "history", label: "History", icon: Globe },
  { id: "computer_science", label: "CS", icon: Code },
  { id: "art", label: "Art", icon: Palette },
  { id: "music", label: "Music", icon: Music },
  { id: "general", label: "General", icon: Lightbulb },
];

type Mode = "solve" | "explain";

const SolverPage = () => {
  const { user } = useAuth();
  const [mode, setMode] = useState<Mode>("solve");
  const [question, setQuestion] = useState("");
  const [subject, setSubject] = useState<string | undefined>();
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [solution, setSolution] = useState("");
  const [showSolution, setShowSolution] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { toast.error("Image must be under 10MB"); return; }
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  }, []);

  const clearImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSolve = async () => {
    if (!question.trim() && !imagePreview) {
      toast.error(mode === "solve" ? "Please enter a question or upload an image" : "Please enter a topic to explain");
      return;
    }
    setIsLoading(true);
    setSolution("");
    setShowSolution(true);

    let fullSolution = "";
    try {
      await streamSolve({
        question: question.trim(),
        subject,
        imageBase64: imagePreview || undefined,
        mode,
        onDelta: (chunk) => {
          fullSolution += chunk;
          setSolution((prev) => prev + chunk);
        },
        onDone: async () => {
          setIsLoading(false);
          if (user) {
            await supabase.from("solution_history").insert({
              user_id: user.id,
              question: question.trim() || "Image problem",
              subject: subject || null,
              solution: fullSolution,
            });
          }
        },
        onError: (err) => { toast.error(err); setIsLoading(false); },
      });
    } catch {
      toast.error("Failed to connect to AI");
      setIsLoading(false);
    }
  };

  const currentSubjects = mode === "solve" ? solveSubjects : explainSubjects;

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <motion.div className="text-center mb-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl md:text-3xl font-bold mb-1">
            {mode === "solve" ? (
              <>Snap it. <span className="text-gradient-primary">Solve it.</span></>
            ) : (
              <>Learn any <span className="text-gradient-primary">topic.</span></>
            )}
          </h1>
          <p className="text-muted-foreground text-sm">
            {mode === "solve"
              ? "Upload a photo or type a problem — get step-by-step AI explanations"
              : "Type any topic and get a clear, detailed explanation with examples"}
          </p>
        </motion.div>

        {/* Mode toggle */}
        <motion.div className="flex justify-center mb-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 }}>
          <div className="inline-flex bg-secondary/50 border border-border rounded-xl p-1">
            <button
              onClick={() => { setMode("solve"); setSubject(undefined); }}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${mode === "solve" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            >
              <Calculator className="w-4 h-4" /> Solve Problem
            </button>
            <button
              onClick={() => { setMode("explain"); setSubject(undefined); }}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${mode === "explain" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            >
              <GraduationCap className="w-4 h-4" /> Explain Topic
            </button>
          </div>
        </motion.div>

        {/* Subject selector */}
        <motion.div className="flex justify-center gap-2 mb-6 flex-wrap" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
          {currentSubjects.map((s) => (
            <button
              key={s.id}
              onClick={() => setSubject(subject === s.id ? undefined : s.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-all border ${
                subject === s.id ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-muted-foreground hover:border-primary/30"
              }`}
            >
              <s.icon className="w-3.5 h-3.5" />
              {s.label}
            </button>
          ))}
        </motion.div>

        {/* Input area */}
        <motion.div className="rounded-2xl bg-gradient-card border border-border/50 shadow-elevated p-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          {mode === "solve" && (
            <AnimatePresence>
              {imagePreview && (
                <motion.div className="relative mb-4 rounded-xl overflow-hidden border border-border/50" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                  <img src={imagePreview} alt="Uploaded problem" className="max-h-64 w-full object-contain bg-secondary/30" />
                  <button onClick={clearImage} className="absolute top-2 right-2 p-1.5 rounded-full bg-background/80 text-foreground hover:bg-background transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          )}

          <Textarea
            placeholder={mode === "solve" ? "Type your question here... e.g. 'Solve x² + 5x + 6 = 0'" : "Type a topic... e.g. 'Explain photosynthesis', 'How does gravity work?', 'What is the French Revolution?'"}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            className="min-h-[100px] bg-transparent border-0 resize-none text-foreground placeholder:text-muted-foreground focus-visible:ring-0 text-base"
            onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSolve(); }}
          />

          <div className="flex items-center justify-between mt-4">
            <div className="flex gap-2">
              {mode === "solve" && (
                <>
                  <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleImageUpload} />
                  <Button variant="ghost" size="sm" onClick={() => fileInputRef.current?.click()} className="text-muted-foreground hover:text-primary">
                    <Camera className="w-4 h-4 mr-1" /> Photo
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => {
                    if (fileInputRef.current) { fileInputRef.current.removeAttribute("capture"); fileInputRef.current.click(); fileInputRef.current.setAttribute("capture", "environment"); }
                  }} className="text-muted-foreground hover:text-primary">
                    <Upload className="w-4 h-4 mr-1" /> Upload
                  </Button>
                </>
              )}
            </div>
            <Button variant="hero" onClick={handleSolve} disabled={isLoading || (!question.trim() && !imagePreview)}>
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : mode === "solve" ? <Send className="w-4 h-4" /> : <Lightbulb className="w-4 h-4" />}
              {isLoading ? (mode === "solve" ? "Solving..." : "Explaining...") : (mode === "solve" ? "Solve" : "Explain")}
            </Button>
          </div>
        </motion.div>

        {/* Solution */}
        <AnimatePresence>
          {showSolution && (
            <motion.div className="mt-8" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <SolutionDisplay content={solution} isLoading={isLoading} />
              {!isLoading && solution && (
                <div className="mt-6">
                  <VideoExplanation solution={solution} />
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
};

export default SolverPage;
