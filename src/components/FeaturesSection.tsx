import { motion } from "framer-motion";
import { Brain, Video, SlidersHorizontal, Map, Bot, Trophy, WifiOff } from "lucide-react";

const features = [
  {
    icon: Video,
    title: "Dynamic Video Generation",
    description: "30-60 second AI animations explaining the intuition behind solutions, not just mechanical steps.",
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    icon: SlidersHorizontal,
    title: "Interactive Explore Mode",
    description: "Drag sliders to change variables in real-time. See how F=ma reacts when you modify mass or acceleration.",
    color: "text-accent",
    bg: "bg-accent/10",
  },
  {
    icon: Map,
    title: "Knowledge Graph",
    description: "A living map of your strengths and weaknesses across Math, Physics, and Chemistry. Always evolving.",
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    icon: Bot,
    title: "AI Tutor Personas",
    description: "Choose 'The Professor' for rigor or 'Study Buddy' for casual learning. Customizable voice & avatar.",
    color: "text-accent",
    bg: "bg-accent/10",
  },
  {
    icon: Trophy,
    title: "Gamification & Social",
    description: "Global leaderboards, problem-solving streaks, and collaborative Study Rooms with friends.",
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    icon: WifiOff,
    title: "Offline Mode",
    description: "Text-based solutions when you're offline. Videos pre-render automatically when connectivity returns.",
    color: "text-accent",
    bg: "bg-accent/10",
  },
];

const FeaturesSection = () => {
  return (
    <section className="py-32 px-6 relative">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(var(--primary)/0.03),transparent_70%)]" />
      <div className="max-w-6xl mx-auto relative z-10">
        <motion.div
          className="text-center mb-20"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-accent/30 bg-accent/5 mb-6">
            <Brain className="w-4 h-4 text-accent" />
            <span className="text-sm font-medium text-accent">The Engine</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Beyond <span className="text-gradient-primary">Answers</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            A learning engine that understands, explains, and adapts to how you think.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              className="group p-6 rounded-2xl bg-gradient-card border border-border/50 hover:border-primary/30 transition-all duration-300 shadow-elevated"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              whileHover={{ y: -4 }}
            >
              <div className={`inline-flex p-3 rounded-xl ${feature.bg} mb-4`}>
                <feature.icon className={`w-6 h-6 ${feature.color}`} />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
