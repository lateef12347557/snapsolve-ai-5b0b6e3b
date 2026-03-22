import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Users, BookOpen, Loader2, Trash2, Archive, Lock, Globe, Copy, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import DashboardLayout from "@/components/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

const subjects = ["Math", "Physics", "Chemistry", "General"];

function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

const StudyRooms = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");
  const [newRoomSubject, setNewRoomSubject] = useState("General");
  const [isPrivate, setIsPrivate] = useState(false);
  const [customCode, setCustomCode] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    fetchRooms();
    const channel = supabase
      .channel("rooms-list")
      .on("postgres_changes", { event: "*", schema: "public", table: "study_rooms" }, () => fetchRooms())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchRooms = async () => {
    // Fetch public rooms + user's own private rooms
    const { data, error } = await supabase
      .from("study_rooms")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false });
    if (error) toast.error("Failed to load rooms");
    else {
      const filtered = (data || []).filter(r => !r.is_private || r.user_id === user?.id);
      setRooms(filtered);
    }
    setLoading(false);
  };

  const createRoom = async () => {
    if (!newRoomName.trim()) { toast.error("Enter a room name"); return; }
    setCreating(true);
    const code = isPrivate ? (customCode.trim().toUpperCase() || generateRoomCode()) : null;
    
    const { error } = await supabase.from("study_rooms").insert({
      name: newRoomName.trim(),
      subject: newRoomSubject,
      created_by: profile?.display_name || "Anonymous",
      user_id: user?.id,
      is_private: isPrivate,
      room_code: code,
    });
    if (error) {
      if (error.message.includes("duplicate")) toast.error("That room code is already taken, try another");
      else toast.error("Failed to create room");
    } else {
      setNewRoomName(""); setShowCreate(false); setCustomCode(""); setIsPrivate(false);
      toast.success(isPrivate ? `Room created! Code: ${code}` : "Room created!");
      fetchRooms();
    }
    setCreating(false);
  };

  const joinRoom = async () => {
    if (!joinCode.trim()) { toast.error("Enter a room code"); return; }
    setJoining(true);
    const { data, error } = await supabase
      .from("study_rooms")
      .select("id")
      .eq("room_code", joinCode.trim().toUpperCase())
      .eq("is_active", true)
      .single();
    if (error || !data) { toast.error("Room not found. Check the code and try again."); setJoining(false); return; }
    navigate(`/rooms/${data.id}`);
    setJoining(false);
  };

  const copyCode = (e: React.MouseEvent, code: string) => {
    e.preventDefault(); e.stopPropagation();
    navigator.clipboard.writeText(code);
    toast.success("Room code copied!");
  };

  const archiveRoom = async (e: React.MouseEvent, roomId: string) => {
    e.preventDefault(); e.stopPropagation();
    const { error } = await supabase.from("study_rooms").update({ is_active: false }).eq("id", roomId);
    if (error) toast.error("Failed to archive room");
    else { toast.success("Room archived"); fetchRooms(); }
  };

  const deleteRoom = async (e: React.MouseEvent, roomId: string) => {
    e.preventDefault(); e.stopPropagation();
    const { error } = await supabase.from("study_rooms").delete().eq("id", roomId);
    if (error) toast.error("Failed to delete room");
    else { toast.success("Room deleted"); fetchRooms(); }
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <motion.div className="text-center mb-8" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl md:text-3xl font-bold mb-1">
            Collaborate <span className="text-gradient-primary">in Real-Time</span>
          </h1>
          <p className="text-muted-foreground text-sm">Join or create a study room to solve problems together</p>
        </motion.div>

        {/* Join by code */}
        <motion.div className="mb-6 flex justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 }}>
          <div className="flex gap-2 max-w-sm w-full">
            <Input
              placeholder="Enter room code (e.g. ABC123)"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              className="bg-card border-border uppercase tracking-widest font-mono text-center"
              maxLength={8}
              onKeyDown={(e) => { if (e.key === "Enter") joinRoom(); }}
            />
            <Button variant="hero" onClick={joinRoom} disabled={joining}>
              <LogIn className="w-4 h-4 mr-1" /> Join
            </Button>
          </div>
        </motion.div>

        {/* Create room */}
        <motion.div className="mb-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
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

              {/* Private toggle */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsPrivate(false)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${!isPrivate ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"}`}
                >
                  <Globe className="w-3.5 h-3.5" /> Public
                </button>
                <button
                  onClick={() => setIsPrivate(true)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${isPrivate ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"}`}
                >
                  <Lock className="w-3.5 h-3.5" /> Private
                </button>
              </div>

              {isPrivate && (
                <Input
                  placeholder="Custom code (leave blank for auto-generated)"
                  value={customCode}
                  onChange={(e) => setCustomCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
                  className="bg-secondary/30 border-border uppercase tracking-widest font-mono"
                  maxLength={8}
                />
              )}

              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => { setShowCreate(false); setIsPrivate(false); setCustomCode(""); }} className="flex-1">Cancel</Button>
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
                <Link to={`/rooms/${room.id}`}
                  className="block rounded-2xl bg-gradient-card border border-border/50 p-5 hover:border-primary/30 transition-all group">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {room.is_private ? <Lock className="w-3.5 h-3.5 text-muted-foreground" /> : <Globe className="w-3.5 h-3.5 text-muted-foreground" />}
                      <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">{room.name}</h3>
                    </div>
                    <div className="flex items-center gap-1">
                      {room.subject && <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">{room.subject}</span>}
                      {room.room_code && (
                        <button onClick={(e) => copyCode(e, room.room_code)} className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors" title="Copy code">
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {user?.id === room.user_id && (
                        <>
                          <button onClick={(e) => archiveRoom(e, room.id)} className="p-1.5 rounded-lg text-muted-foreground hover:text-accent hover:bg-accent/10 transition-colors" title="Archive">
                            <Archive className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={(e) => deleteRoom(e, room.id)} className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors" title="Delete">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">Created by {room.created_by}</p>
                    {room.room_code && (
                      <span className="text-xs font-mono text-muted-foreground bg-secondary/50 px-2 py-0.5 rounded">{room.room_code}</span>
                    )}
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default StudyRooms;
