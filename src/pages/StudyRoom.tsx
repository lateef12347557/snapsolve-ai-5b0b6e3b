import { useState, useEffect, useRef } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Send, ArrowLeft, Users, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Navbar } from "@/components/NavFooter";
import { supabase } from "@/integrations/supabase/client";
import { streamSolve } from "@/lib/ai-solver";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";

const StudyRoom = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const [searchParams] = useSearchParams();
  const userName = searchParams.get("user") || "Anonymous";
  const [room, setRoom] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!roomId) return;
    fetchRoom();
    fetchMessages();
    const channel = supabase
      .channel(`room-${roomId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "study_room_messages", filter: `room_id=eq.${roomId}` },
        (payload) => {
          setMessages((prev) => {
            if (prev.find(m => m.id === payload.new.id)) return prev;
            return [...prev, payload.new];
          });
        })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [roomId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchRoom = async () => {
    const { data } = await supabase.from("study_rooms").select("*").eq("id", roomId!).single();
    setRoom(data);
  };

  const fetchMessages = async () => {
    const { data } = await supabase.from("study_room_messages").select("*").eq("room_id", roomId!).order("created_at", { ascending: true });
    setMessages(data || []);
    setLoading(false);
  };

  const sendMessage = async () => {
    if (!input.trim()) return;
    const msg = input.trim();
    setInput("");
    await supabase.from("study_room_messages").insert({ room_id: roomId!, user_name: userName, message: msg });
  };

  const askAI = async () => {
    if (!input.trim()) { toast.error("Type a question first"); return; }
    const question = input.trim();
    setInput("");
    setAiLoading(true);

    // Post user question
    await supabase.from("study_room_messages").insert({ room_id: roomId!, user_name: userName, message: question });

    // Stream AI response
    let aiResponse = "";
    await streamSolve({
      question,
      subject: room?.subject || undefined,
      onDelta: (chunk) => { aiResponse += chunk; },
      onDone: async () => {
        await supabase.from("study_room_messages").insert({ room_id: roomId!, user_name: "🤖 SnapSolve AI", message: aiResponse, message_type: "ai" });
        setAiLoading(false);
      },
      onError: (err) => { toast.error(err); setAiLoading(false); },
    });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="pt-20 flex-1 flex flex-col max-w-3xl mx-auto w-full px-4">
        {/* Header */}
        <div className="flex items-center gap-3 py-4 border-b border-border/50">
          <Link to="/rooms"><ArrowLeft className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" /></Link>
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-foreground truncate">{room?.name || "Loading..."}</h2>
            {room?.subject && <span className="text-xs text-primary">{room.subject}</span>}
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Users className="w-3 h-3" /> Live
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto py-4 space-y-3 min-h-0" style={{ maxHeight: "calc(100vh - 220px)" }}>
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
          ) : messages.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm py-8">No messages yet. Start the conversation!</p>
          ) : (
            messages.map((msg) => (
              <motion.div key={msg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className={`flex flex-col ${msg.user_name === userName ? "items-end" : "items-start"}`}>
                <span className="text-xs text-muted-foreground mb-1 px-1">{msg.user_name}</span>
                <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                  msg.message_type === "ai"
                    ? "bg-primary/10 border border-primary/20 text-foreground"
                    : msg.user_name === userName
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground"
                }`}>
                  {msg.message_type === "ai" ? (
                    <div className="prose prose-invert prose-sm max-w-none prose-p:text-foreground/90 prose-strong:text-primary">
                      <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{msg.message}</ReactMarkdown>
                    </div>
                  ) : msg.message}
                </div>
              </motion.div>
            ))
          )}
          {aiLoading && (
            <div className="flex items-start">
              <div className="bg-primary/10 border border-primary/20 rounded-2xl px-4 py-2.5 flex items-center gap-2 text-sm text-primary">
                <Loader2 className="w-3 h-3 animate-spin" /> AI is thinking...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="py-3 border-t border-border/50 flex gap-2">
          <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type a message or question..."
            className="bg-card border-border flex-1" onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }} />
          <Button variant="ghost" size="icon" onClick={askAI} disabled={aiLoading} title="Ask AI">
            <Sparkles className="w-4 h-4 text-primary" />
          </Button>
          <Button variant="hero" size="icon" onClick={sendMessage}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default StudyRoom;
