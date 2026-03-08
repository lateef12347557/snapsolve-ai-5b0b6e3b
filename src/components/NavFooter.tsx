import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

const Navbar = () => (
  <motion.nav
    className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 bg-background/80 backdrop-blur-lg border-b border-border/30"
    initial={{ opacity: 0, y: -20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
  >
    <div className="flex items-center gap-2">
      <Sparkles className="w-6 h-6 text-primary" />
      <span className="text-lg font-bold text-foreground">SnapSolve AI</span>
    </div>
    <div className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
      <a href="#features" className="hover:text-foreground transition-colors">Features</a>
      <a href="#demo" className="hover:text-foreground transition-colors">Demo</a>
      <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
    </div>
    <Button variant="hero" size="sm">Get Started</Button>
  </motion.nav>
);

const Footer = () => (
  <footer className="border-t border-border/30 py-12 px-6">
    <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
      <div className="flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-primary" />
        <span className="font-bold text-foreground">SnapSolve AI</span>
      </div>
      <p className="text-sm text-muted-foreground">© 2026 SnapSolve AI. Reimagining education through AI.</p>
    </div>
  </footer>
);

export { Navbar, Footer };
