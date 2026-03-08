import { motion } from "framer-motion";
import { useState } from "react";

const InteractiveDemo = () => {
  const [mass, setMass] = useState(10);
  const [acceleration, setAcceleration] = useState(5);
  const force = mass * acceleration;

  return (
    <section className="py-32 px-6 relative">
      <div className="max-w-5xl mx-auto">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="text-gradient-accent">Explore</span> Mode
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Interactive simulations that make abstract concepts tangible.
          </p>
        </motion.div>

        <motion.div
          className="rounded-3xl bg-gradient-card border border-border/50 shadow-elevated overflow-hidden"
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          {/* Terminal header */}
          <div className="flex items-center gap-2 px-6 py-4 border-b border-border/50">
            <div className="w-3 h-3 rounded-full bg-destructive/60" />
            <div className="w-3 h-3 rounded-full bg-accent/60" />
            <div className="w-3 h-3 rounded-full bg-primary/60" />
            <span className="ml-3 text-sm text-muted-foreground font-mono">explore://physics/newtons-second-law</span>
          </div>

          <div className="p-8 md:p-12">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              {/* Controls */}
              <div className="space-y-8">
                <div>
                  <div className="flex justify-between mb-3">
                    <label className="text-sm font-medium text-foreground">Mass (kg)</label>
                    <span className="text-sm font-mono text-primary">{mass} kg</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="50"
                    value={mass}
                    onChange={(e) => setMass(Number(e.target.value))}
                    className="w-full h-2 rounded-full appearance-none bg-secondary cursor-pointer accent-primary"
                    style={{ accentColor: "hsl(187 92% 55%)" }}
                  />
                </div>

                <div>
                  <div className="flex justify-between mb-3">
                    <label className="text-sm font-medium text-foreground">Acceleration (m/s²)</label>
                    <span className="text-sm font-mono text-accent">{acceleration} m/s²</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="20"
                    value={acceleration}
                    onChange={(e) => setAcceleration(Number(e.target.value))}
                    className="w-full h-2 rounded-full appearance-none bg-secondary cursor-pointer"
                    style={{ accentColor: "hsl(32 95% 58%)" }}
                  />
                </div>

                <div className="p-4 rounded-xl bg-secondary/50 border border-border/50">
                  <p className="text-xs text-muted-foreground mb-1 font-mono">// Newton's Second Law</p>
                  <p className="text-sm font-mono text-foreground">
                    F = m × a = {mass} × {acceleration} ={" "}
                    <span className="text-primary font-bold text-lg">{force} N</span>
                  </p>
                </div>
              </div>

              {/* Visualization */}
              <div className="flex flex-col items-center justify-center">
                <motion.div
                  className="relative"
                  animate={{ x: [0, force / 3, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                >
                  <div
                    className="rounded-2xl bg-gradient-primary shadow-glow-primary flex items-center justify-center font-bold text-primary-foreground"
                    style={{
                      width: `${Math.max(60, mass * 3)}px`,
                      height: `${Math.max(60, mass * 3)}px`,
                      fontSize: `${Math.max(14, mass * 0.6)}px`,
                    }}
                  >
                    {mass}kg
                  </div>
                  {/* Force arrow */}
                  <motion.div
                    className="absolute top-1/2 -translate-y-1/2 h-1 bg-accent rounded-full"
                    style={{
                      left: `${Math.max(60, mass * 3) + 8}px`,
                      width: `${force / 2}px`,
                    }}
                  />
                  <motion.div
                    className="absolute top-1/2 -translate-y-1/2 text-accent font-mono text-sm font-bold"
                    style={{ left: `${Math.max(60, mass * 3) + force / 2 + 16}px` }}
                  >
                    {force}N →
                  </motion.div>
                </motion.div>

                <p className="text-xs text-muted-foreground mt-8 text-center">
                  Drag the sliders to see how force changes
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default InteractiveDemo;
