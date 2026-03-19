import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Users, BookOpen, Loader2, Trash2, Archive } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Navbar } from "@/components/NavFooter";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { toast } from "sonner";

const subjects = ["Math", "Physics", "Chemistry", "General"];

const StudyRooms = () => {
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");
  const [newRoomSubject, setNewRoomSubject] = useState("General");
  const [userName, setUserName] = useState(() => localStorage.getItem("snapsolve_username") || "");
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    fetchRooms();
    const channel = supabase
      .channel("rooms-list")
      .on("postgres_changes", { event: "*", schema: "public", table: "study_rooms" }, () => fetchRooms())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchRooms = async () => {
    const { data, error } = await supabase
      .from("study_rooms")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false });
    if (error) toast.error("Failed to load rooms");
    else setRooms(data || []);
    setLoading(false);
  };

  const createRoom = async () => {
    if (!newRoomName.trim()) { toast.error("Enter a room name"); return; }
    if (!userName.trim()) { toast.error("Enter your name"); return; }
    localStorage.setItem("snapsolve_username", userName);
    setCreating(true);
    const { error } = await supabase.from("study_rooms").insert({
      name: newRoomName.trim(),
      subject: newRoomSubject,
      created_by: userName.trim(),
    });
    if (error) toast.error("Failed to create room");
    else { setNewRoomName(""); setShowCreate(false); toast.success("Room created!"); fetchRooms(); }
    setCreating(false);
  };

  const archiveRoom = async (e: React.MouseEvent, roomId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const { error } = await supabase.from("study_rooms").update({ is_active: false }).eq("id", roomId);
    if (error) toast.error("Failed to archive room");
    else { toast.success("Room archived"); fetchRooms(); }
  };

  const deleteRoom = async (e: React.MouseEvent, roomId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const { error } = await supabase.from("study_rooms").delete().eq("id", roomId);
    if (error) toast.error("Failed to delete room");
    else { toast.success("Room deleted"); fetchRooms(); }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div className="text-center mb-10" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/5 mb-4">
              <Users className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">Study Rooms</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">
              Collaborate <span className="text-gradient-primary">in Real-Time</span>
            </h1>
            <p className="text-muted-foreground">Join or create a study room to solve problems together</p>
          </motion.div>

          {/* Username input */}
          <motion.div className="mb-6 max-w-xs mx-auto" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
            <Input
              placeholder="Your display name"
              value={userName}
              onChange={(e) => { setUserName(e.target.value); localStorage.setItem("snapsolve_username", e.target.value); }}
              className="text-center bg-card border-border"
            />
          </motion.div>

          {/* Create room */}
          <motion.div className="mb-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
            {!showCreate ? (
              <div className="text-center">
                <Button variant="hero" onClick={() => setShowCreate(true)}>
                  <Plus className="w-4 h-4" /> Create Room
                </Button>
              </div>
            ) : (
              <div className="rounded-2xl bg-gradient-card border border-border/50 p-6 max-w-md mx-auto space-y-4">
                <Input placeholder="Room name" value={newRoomName} onChange={(e) => setNewRoomName(e.target.value)} className="bg-secondary/30 border-border" />
                <div className="flex gap-2 flex-wrap">
                  {subjects.map((s) => (
                    <button key={s} onClick={() => setNewRoomSubject(s)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${newRoomSubject === s ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/30"}`}>
                      {s}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" onClick={() => setShowCreate(false)} className="flex-1">Cancel</Button>
                  <Button variant="hero" onClick={createRoom} disabled={creating} className="flex-1">
                    {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    Create
                  </Button>
                </div>
              </div>
            )}
          </motion.div>

          {/* Rooms list */}
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
          ) : rooms.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p>No active rooms yet. Create one to get started!</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {rooms.map((room, i) => (
                <motion.div key={room.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <Link to={`/rooms/${room.id}?user=${encodeURIComponent(userName || "Anonymous")}`}
                    className="block rounded-2xl bg-gradient-card border border-border/50 p-5 hover:border-primary/30 transition-all group">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">{room.name}</h3>
                      {room.subject && <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">{room.subject}</span>}
                    </div>
                    <p className="text-sm text-muted-foreground">Created by {room.created_by}</p>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudyRooms;
