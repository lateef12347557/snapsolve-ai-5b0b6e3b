import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Send, X, Loader2, Upload, BookOpen, Atom, Calculator, FlaskConical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { streamSolve } from "@/lib/ai-solver";
import SolutionDisplay from "@/components/SolutionDisplay";
import { Navbar } from "@/components/NavFooter";
import { toast } from "sonner";

const subjects = [
  { id: "math", label: "Math", icon: Calculator },
  { id: "physics", label: "Physics", icon: Atom },
  { id: "chemistry", label: "Chemistry", icon: FlaskConical },
];

const SolverPage = () => {
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
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image must be under 10MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setImagePreview(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  }, []);

  const clearImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSolve = async () => {
    if (!question.trim() && !imagePreview) {
      toast.error("Please enter a question or upload an image");
      return;
    }

    setIsLoading(true);
    setSolution("");
    setShowSolution(true);

    try {
      await streamSolve({
        question: question.trim(),
        subject,
        imageBase64: imagePreview || undefined,
        onDelta: (chunk) => {
          setSolution((prev) => prev + chunk);
        },
        onDone: () => {
          setIsLoading(false);
        },
        onError: (err) => {
          toast.error(err);
          setIsLoading(false);
        },
      });
    } catch (err) {
      toast.error("Failed to connect to AI solver");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16 px-6">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <motion.div
            className="text-center mb-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/5 mb-4">
              <BookOpen className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">AI Problem Solver</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">
              Snap it. <span className="text-gradient-primary">Solve it.</span>
            </h1>
            <p className="text-muted-foreground">
              Upload a photo or type your problem — get step-by-step AI explanations
            </p>
          </motion.div>

          {/* Subject selector */}
          <motion.div
            className="flex justify-center gap-3 mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            {subjects.map((s) => (
              <button
                key={s.id}
                onClick={() => setSubject(subject === s.id ? undefined : s.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all border ${
                  subject === s.id
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-card text-muted-foreground hover:border-primary/30"
                }`}
              >
                <s.icon className="w-4 h-4" />
                {s.label}
              </button>
            ))}
          </motion.div>

          {/* Input area */}
          <motion.div
            className="rounded-2xl bg-gradient-card border border-border/50 shadow-elevated p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            {/* Image preview */}
            <AnimatePresence>
              {imagePreview && (
                <motion.div
                  className="relative mb-4 rounded-xl overflow-hidden border border-border/50"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <img
                    src={imagePreview}
                    alt="Uploaded problem"
                    className="max-h-64 w-full object-contain bg-secondary/30"
                  />
                  <button
                    onClick={clearImage}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-background/80 text-foreground hover:bg-background transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            <Textarea
              placeholder="Type your question here... e.g. 'Solve x² + 5x + 6 = 0' or 'What is the molar mass of H₂SO₄?'"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="min-h-[100px] bg-transparent border-0 resize-none text-foreground placeholder:text-muted-foreground focus-visible:ring-0 text-base"
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSolve();
              }}
            />

            <div className="flex items-center justify-between mt-4">
              <div className="flex gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handleImageUpload}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-muted-foreground hover:text-primary"
                >
                  <Camera className="w-4 h-4 mr-1" />
                  Photo
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (fileInputRef.current) {
                      fileInputRef.current.removeAttribute("capture");
                      fileInputRef.current.click();
                      fileInputRef.current.setAttribute("capture", "environment");
                    }
                  }}
                  className="text-muted-foreground hover:text-primary"
                >
                  <Upload className="w-4 h-4 mr-1" />
                  Upload
                </Button>
              </div>

              <Button
                variant="hero"
                onClick={handleSolve}
                disabled={isLoading || (!question.trim() && !imagePreview)}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                {isLoading ? "Solving..." : "Solve"}
              </Button>
            </div>
          </motion.div>

          {/* Solution */}
          <AnimatePresence>
            {showSolution && (
              <motion.div
                className="mt-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <SolutionDisplay content={solution} isLoading={isLoading} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default SolverPage;
