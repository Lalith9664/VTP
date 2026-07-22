"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/store/SessionContext";
import { motion } from "framer-motion";
import { 
  ArrowLeft, Users, LayoutDashboard, Briefcase, 
  LogOut, Send, Plus, Sparkles
} from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";

export default function FriendsPage() {
  const router = useRouter();
  const { profile, theme, toggleTheme, sidebarCollapsed, setSidebarCollapsed } = useSession();

  const [friendEmail, setFriendEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const [friends, setFriends] = useState([
    {
      name: "Aditya Sharma",
      email: "aditya.sharma@nit.edu",
      hiredAt: "Google",
      jobMatch: "Software Engineering Intern",
      avatar: "AS"
    },
    {
      name: "Sneha Reddy",
      email: "sneha.reddy@nit.edu",
      hiredAt: "Vercel",
      jobMatch: "Frontend Architect",
      avatar: "SR"
    },
    {
      name: "Rohan Das",
      email: "rohan.das@nit.edu",
      hiredAt: "Stripe",
      jobMatch: "API Systems Engineer",
      avatar: "RD"
    }
  ]);

  const handleAddFriend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!friendEmail.trim()) {
      toast.warning("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      await api.post('/user/add-friend', { email: friendEmail });
      
      const newFriend = {
        name: friendEmail.split('@')[0].split('.').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
        email: friendEmail,
        hiredAt: "Pending Auth...",
        jobMatch: "Analyzing resume...",
        avatar: friendEmail.substring(0, 2).toUpperCase()
      };
      setFriends([...friends, newFriend]);
      toast.success(`Invitation sent to ${friendEmail}!`);
      setFriendEmail("");
    } catch (err: any) {
      console.warn("FastAPI offline. Fallback adding friend locally:", err.message);
      const newFriend = {
        name: friendEmail.split('@')[0].split('.').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
        email: friendEmail,
        hiredAt: "Matching...",
        jobMatch: "Reviewing profile...",
        avatar: friendEmail.substring(0, 2).toUpperCase()
      };
      setFriends([...friends, newFriend]);
      toast.success("Friend added locally.");
      setFriendEmail("");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    toast.success("Logged out successfully.");
    router.push("/");
  };

  return (
    <div className="flex-1 min-h-screen flex neu-bg font-sans relative select-none text-slate-100 transition-colors duration-300">
      
      {/* Background radial overlays */}
      <div className="absolute top-0 right-0 w-[45%] h-[40%] rounded-full bg-gradient-to-br from-teal-500/5 to-emerald-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[40%] h-[40%] rounded-full bg-gradient-to-tr from-purple-500/5 to-teal-500/5 blur-[130px] pointer-events-none" />

      {/* SIDEBAR NAVIGATION (Desktop) */}
      <aside className={`hidden lg:flex flex-col h-screen fixed left-0 top-0 neu-sidebar-bg border-r border-slate-200/60 gap-8 z-30 shadow-2xl transition-all duration-300 ${sidebarCollapsed ? "w-20 p-4" : "w-64 p-6"}`}>
        
        {/* Logo Header */}
        <div 
          className={`flex items-center gap-3 cursor-pointer select-none ${sidebarCollapsed ? "justify-center" : ""}`}
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          <img src="/logo.jpeg" alt="VTP Logo" className="w-12 h-12 rounded-xl object-cover shadow-md border-none neu-circle transition-all duration-300" />
          {!sidebarCollapsed && <span className="text-lg font-bold text-slate-200">VTP</span>}
        </div>

        {/* User Quick Info */}
        {!sidebarCollapsed ? (
          <div className="flex items-center gap-3 p-3 rounded-2xl border-none neu-pressed">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-teal-400 to-emerald-500 text-white font-black flex items-center justify-center text-xs neu-circle border-none">
              {profile.fullName.substring(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1 text-left">
              <h4 className="text-xs font-black text-slate-255 truncate leading-tight">{profile.fullName}</h4>
              <span className="text-[9px] text-slate-400 uppercase tracking-widest font-black truncate block mt-0.5">{profile.department}</span>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center p-2 rounded-2xl border-none neu-pressed" title={profile.fullName}>
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-teal-400 to-emerald-500 text-white font-black flex items-center justify-center text-xs neu-circle border-none">
              {profile.fullName.substring(0, 2).toUpperCase()}
            </div>
          </div>
        )}

        {/* Menu Items */}
        <nav className="flex-grow flex flex-col gap-1.5">
          <button 
            onClick={() => router.push("/dashboard")}
            className={`flex items-center gap-3 rounded-xl transition-all text-left text-slate-400 hover:text-slate-200 neu-button border-none mb-1.5 ${sidebarCollapsed ? "justify-center p-3" : "px-4 py-3 text-xs font-bold"}`}
            title={sidebarCollapsed ? "Dashboard Home" : undefined}
          >
            <LayoutDashboard className="w-4 h-4 text-teal-400" />
            {!sidebarCollapsed && <span>Dashboard Home</span>}
          </button>

          <button 
            onClick={() => router.push("/dashboard")}
            className={`flex items-center gap-3 rounded-xl transition-all text-left text-teal-400 neu-pressed border-none ${sidebarCollapsed ? "justify-center p-3" : "px-4 py-3 text-xs font-bold"}`}
            title={sidebarCollapsed ? "Peer Insights" : undefined}
          >
            <Users className="w-4 h-4" />
            {!sidebarCollapsed && <span>Peer Insights</span>}
          </button>
        </nav>

        {/* Bottom Actions */}
        <div className="flex flex-col gap-2 border-t border-slate-800/40 pt-4">
          <button 
            onClick={handleLogout}
            className={`flex items-center gap-3 rounded-xl transition-all text-left neu-button border-none ${sidebarCollapsed ? "justify-center p-3 text-slate-400 hover:text-rose-400" : "px-4 py-3 text-xs font-bold text-slate-400 hover:text-rose-400"}`}
            title={sidebarCollapsed ? "Logout" : undefined}
          >
            <LogOut className="w-4 h-4" />
            {!sidebarCollapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className={`flex-1 flex flex-col min-w-0 relative z-25 transition-all duration-300 ${sidebarCollapsed ? "lg:pl-20" : "lg:pl-64"}`}>
        
        {/* HEADER BAR */}
        <header className="sticky top-0 z-35 w-full neu-header-bg border-b border-slate-200/60 h-16 flex items-center justify-between px-6 shadow-md">
          <button 
            onClick={() => router.push("/dashboard")}
            className="flex items-center gap-1 text-xs font-bold text-slate-300 hover:text-slate-100 cursor-pointer border-none bg-transparent"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </button>
          
          <div className="flex items-center gap-4">
            {/* Dark/Light Mode Toggle Switch */}
            <div className="flex items-center gap-2 mr-1">
              <button
                onClick={toggleTheme}
                className="w-16 h-8.5 rounded-full relative transition-colors duration-300 flex items-center px-0.5 focus:outline-none cursor-pointer border-none bg-slate-150 dark:bg-slate-900/60 neu-pressed"
                aria-label="Toggle Theme Mode"
              >
                {/* Left Indicator (circular ring outline) */}
                <div className="absolute left-2.5 w-3 h-3 rounded-full border-2 border-slate-700 dark:border-slate-500 opacity-80" />
                
                {/* Right Indicator (glowing horizontal white line) */}
                <div 
                  className="absolute right-3.5 w-3.5 h-0.5 rounded-full opacity-100 z-0" 
                  style={{ backgroundColor: "#ffffff", boxShadow: "0 0 8px #ffffff" }}
                />

                {/* Sliding Knob */}
                <motion.div
                  layout
                  className="w-7.5 h-7.5 rounded-full border-none shadow-md cursor-pointer bg-white dark:bg-slate-300 z-10"
                  animate={{ x: theme === "dark" ? 0 : 30 }}
                  transition={{ duration: 0.1, ease: "easeOut" }}
                />
              </button>
            </div>
            <span className="text-[10px] uppercase font-black tracking-widest text-slate-400">Peer Network</span>
          </div>
        </header>

        {/* SCROLLABLE BODY */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 flex flex-col gap-8 max-w-4xl mx-auto w-full">
          
          {/* Header Info */}
          <div className="flex flex-col gap-1.5 text-left">
            <h1 className="text-xl md:text-2xl font-black text-slate-150 tracking-tight">Peer Insights Network</h1>
            <p className="text-slate-400 text-xs font-semibold">Coordinate with friends, compare matched metrics, and track hiring statuses in real-time.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            
            {/* Add Friend Form */}
            <div className="md:col-span-4 p-6 rounded-3xl border-none neu-card flex flex-col gap-4 text-left h-fit">
              <div className="flex items-center gap-2 border-b border-slate-800/40 pb-3.5">
                <Plus className="w-4.5 h-4.5 text-teal-400" />
                <h3 className="font-extrabold text-slate-200 text-xs uppercase tracking-wider">Invite Peer</h3>
              </div>
              
              <form onSubmit={handleAddFriend} className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Friend Email</label>
                  <input 
                    type="email" 
                    value={friendEmail}
                    onChange={(e) => setFriendEmail(e.target.value)}
                    placeholder="friend@university.edu"
                    className="w-full h-11 rounded-xl px-4 text-xs font-semibold text-slate-300 neu-input border-none"
                  />
                </div>
                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-teal-400 to-emerald-500 hover:from-teal-500 hover:to-emerald-600 transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-teal-500/10 border-none cursor-pointer active:scale-[0.98]"
                >
                  <Send className="w-3.5 h-3.5" /> {loading ? "Inviting..." : "Send Invitation"}
                </button>
              </form>
            </div>

            {/* Friends list */}
            <div className="md:col-span-8 p-6 rounded-3xl border-none neu-card flex flex-col gap-5 text-left">
              <div className="flex items-center gap-2 border-b border-slate-800/40 pb-3.5">
                <Sparkles className="w-4.5 h-4.5 text-teal-400" />
                <h3 className="font-extrabold text-slate-200 text-xs uppercase tracking-wider">Connected Peers ({friends.length})</h3>
              </div>

              <div className="flex flex-col gap-3">
                {friends.map((friend) => (
                  <div key={friend.email} className="p-4 rounded-2xl flex items-center justify-between border-none neu-pressed hover:-translate-y-0.5 transition-all">
                    <div className="flex items-center gap-4 text-left">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-teal-500 to-emerald-500 text-white font-black flex items-center justify-center text-xs shadow-md neu-circle border-none">
                        {friend.avatar}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-150">{friend.name}</h4>
                        <span className="text-[10px] text-slate-455 font-semibold leading-relaxed mt-0.5 block">{friend.email}</span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1.5 text-right">
                      <span className="text-[10px] font-black text-teal-400 uppercase bg-teal-500/10 px-2.5 py-1 rounded-full border border-teal-500/15">
                        hired @ {friend.hiredAt}
                      </span>
                      <span className="text-[9px] text-slate-400 font-semibold flex items-center gap-1 mt-0.5">
                        <Briefcase className="w-3.5 h-3.5 text-teal-400" /> {friend.jobMatch}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </main>
      </div>

    </div>
  );
}
