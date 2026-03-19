import { motion } from "framer-motion";
import { Calculator, Users, History, ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";

const quickActions = [
  {
    title: "AI Solver",
    desc: "Snap a photo or type a problem to get step-by-step solutions",
    icon: Calculator,
    href: "/solve",
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    title: "Study Rooms",
    desc: "Collaborate with others and solve problems together in real-time",
    icon: Users,
    href: "/rooms",
    color: "text-accent",
    bg: "bg-accent/10",
  },
  {
    title: "History",
    desc: "Review your previously solved problems and solutions",
    icon: History,
    href: "/history",
    color: "text-emerald-400",
    bg: "bg-emerald-400/10",
  },
];

const Dashboard = () => {
  const { profile } = useAuth();

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        {/* Greeting */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-1">
            Hey, <span className="text-gradient-primary">{profile?.display_name || "Student"}</span> 👋
          </h1>
          <p className="text-muted-foreground">What would you like to learn today?</p>
        </motion.div>

        {/* Quick actions */}
        <div className="grid gap-4 md:grid-cols-3">
          {quickActions.map((action, i) => (
            <motion.div key={action.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <Link
                to={action.href}
                className="block rounded-2xl bg-gradient-card border border-border/50 p-6 hover:border-primary/30 transition-all group"
              >
                <div className={`w-12 h-12 rounded-xl ${action.bg} flex items-center justify-center mb-4`}>
                  <action.icon className={`w-6 h-6 ${action.color}`} />
                </div>
                <h3 className="font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
                  {action.title}
                </h3>
                <p className="text-sm text-muted-foreground mb-3">{action.desc}</p>
                <span className="inline-flex items-center text-xs text-primary font-medium">
                  Get started <ArrowRight className="w-3 h-3 ml-1" />
                </span>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Tip */}
        <motion.div
          className="mt-8 rounded-2xl bg-primary/5 border border-primary/20 p-5 flex items-start gap-3"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
        >
          <Sparkles className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-foreground mb-1">Pro Tip</p>
            <p className="text-sm text-muted-foreground">
              You can upload a photo of any math, physics, or chemistry problem and our AI will solve it step-by-step with explanations!
            </p>
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
