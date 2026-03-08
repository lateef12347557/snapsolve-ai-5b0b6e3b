import { motion } from "framer-motion";
import { Check, Zap, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";

const tiers = [
  {
    name: "Basic",
    price: "Free",
    period: "",
    description: "Get started with text-based solutions",
    icon: Zap,
    features: [
      "10 photo solves per day",
      "Text-based step-by-step solutions",
      "Basic knowledge tracking",
      "Community Study Rooms",
    ],
    cta: "Start Free",
    variant: "hero-outline" as const,
  },
  {
    name: "Pro",
    price: "$12",
    period: "/month",
    description: "Unlimited AI Video + Interactive Simulations",
    icon: Crown,
    popular: true,
    features: [
      "Unlimited photo & voice solves",
      "AI-generated video explanations",
      "Interactive Explore Mode",
      "Full Knowledge Graph",
      "AI Tutor Personas",
      "Offline mode with pre-rendering",
      "1-on-1 AI Tutoring sessions",
    ],
    cta: "Go Pro",
    variant: "hero" as const,
  },
];

const PricingSection = () => {
  return (
    <section className="py-32 px-6 relative">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--accent)/0.03),transparent_60%)]" />
      <div className="max-w-4xl mx-auto relative z-10">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Simple <span className="text-gradient-primary">Pricing</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            Start free. Upgrade when you're ready for the full experience.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8">
          {tiers.map((tier, i) => (
            <motion.div
              key={tier.name}
              className={`relative p-8 rounded-3xl border shadow-elevated ${
                tier.popular
                  ? "bg-gradient-card border-primary/40 shadow-glow-primary"
                  : "bg-gradient-card border-border/50"
              }`}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
            >
              {tier.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-primary text-primary-foreground text-xs font-bold">
                  MOST POPULAR
                </div>
              )}

              <div className={`inline-flex p-3 rounded-xl ${tier.popular ? "bg-primary/10" : "bg-secondary"} mb-4`}>
                <tier.icon className={`w-6 h-6 ${tier.popular ? "text-primary" : "text-muted-foreground"}`} />
              </div>

              <h3 className="text-2xl font-bold text-foreground">{tier.name}</h3>
              <div className="flex items-baseline gap-1 mt-2 mb-2">
                <span className="text-4xl font-bold text-foreground">{tier.price}</span>
                {tier.period && <span className="text-muted-foreground">{tier.period}</span>}
              </div>
              <p className="text-sm text-muted-foreground mb-6">{tier.description}</p>

              <Button variant={tier.variant} size="lg" className="w-full mb-8">
                {tier.cta}
              </Button>

              <ul className="space-y-3">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-3 text-sm">
                    <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <span className="text-foreground/80">{f}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
