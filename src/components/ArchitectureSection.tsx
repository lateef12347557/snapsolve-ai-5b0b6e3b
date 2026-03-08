import { motion } from "framer-motion";
import { Server, Cpu, Layers, Database } from "lucide-react";

const stack = [
  { icon: Layers, label: "Frontend", tech: "React Native / Expo", desc: "Cross-platform mobile & web" },
  { icon: Server, label: "Gateway", tech: "FastAPI (Python)", desc: "AI orchestration & routing" },
  { icon: Cpu, label: "AI Models", tech: "SymPy · RDKit · Veo · Lyria", desc: "Math, Chemistry, Video, Audio" },
  { icon: Database, label: "Data", tech: "PostgreSQL + Redis", desc: "Knowledge graphs & caching" },
];

const ArchitectureSection = () => {
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
            Technical <span className="text-gradient-accent">Architecture</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            A modular, scalable pipeline built for millions of learners.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stack.map((item, i) => (
            <motion.div
              key={item.label}
              className="relative p-6 rounded-2xl bg-gradient-card border border-border/50 shadow-elevated text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              {i < stack.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 -right-2 w-4 h-px bg-primary/40" />
              )}
              <div className="inline-flex p-3 rounded-xl bg-primary/10 mb-4">
                <item.icon className="w-6 h-6 text-primary" />
              </div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{item.label}</p>
              <h3 className="text-sm font-bold text-foreground mb-1">{item.tech}</h3>
              <p className="text-xs text-muted-foreground">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ArchitectureSection;
