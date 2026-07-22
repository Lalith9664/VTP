"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/store/SessionContext";
import { motion } from "framer-motion";
import { 
  ArrowLeft, User, LayoutDashboard, Briefcase, 
  LogOut, Save, GraduationCap, MapPin, Target, Award
} from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";

export default function ProfilePage() {
  const router = useRouter();
  const { profile, updateProfile, theme, toggleTheme, sidebarCollapsed, setSidebarCollapsed } = useSession();

  const [name, setName] = useState(profile.fullName);
  const [college, setCollege] = useState(profile.college);
  const [department, setDepartment] = useState(profile.department);
  const [cgpa, setCgpa] = useState(profile.cgpa);
  const [goal, setGoal] = useState("Architect scalable Next.js dashboard environments at Linear or Stripe");
  const [location, setLocation] = useState("Bangalore, India");
  const [saving, setSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      await api.post('/user/update-goal', { goal, location, education: college });
      updateProfile({
        fullName: name,
        college,
        department,
        cgpa
      });
      toast.success("Profile details updated successfully!");
    } catch (err: any) {
      console.warn("FastAPI offline. Fallback updating local context state:", err.message);
      updateProfile({
        fullName: name,
        college,
        department,
        cgpa
      });
      toast.success("Profile details saved offline.");
    } finally {
      setSaving(false);
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
              <h4 className="text-xs font-black text-slate-250 truncate leading-tight">{profile.fullName}</h4>
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
            title={sidebarCollapsed ? "Edit Profile" : undefined}
          >
            <User className="w-4 h-4" />
            {!sidebarCollapsed && <span>Edit Profile</span>}
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
            <span className="text-[10px] uppercase font-black tracking-widest text-slate-400">Settings Profile</span>
          </div>
        </header>

        {/* SCROLLABLE BODY */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 flex flex-col gap-6 max-w-4xl mx-auto w-full">
          
          <div className="flex flex-col gap-1.5 text-left">
            <h1 className="text-xl md:text-2xl font-black text-slate-150 tracking-tight">Configure Professional Profile</h1>
            <p className="text-slate-400 text-xs font-semibold">Update your credentials index and career goal statements to steer agent matching.</p>
          </div>

          <form onSubmit={handleSave} className="p-6 md:p-8 rounded-3xl border-none neu-card flex flex-col gap-6 text-left">
            
            {/* Main Goal Section */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Target className="w-3.5 h-3.5 text-teal-400" /> Ultimate Career Goal
              </label>
              <textarea 
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                rows={2}
                placeholder="E.g., Developer at Stripe"
                className="w-full rounded-xl p-3 text-xs font-semibold text-slate-300 neu-input border-none leading-relaxed resize-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Full Name */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-teal-400" /> Full Name
                </label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-11 rounded-xl px-4 text-xs font-semibold text-slate-300 neu-input border-none"
                />
              </div>

              {/* Location */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-teal-400" /> Location
                </label>
                <input 
                  type="text" 
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full h-11 rounded-xl px-4 text-xs font-semibold text-slate-300 neu-input border-none"
                />
              </div>

              {/* College */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <GraduationCap className="w-3.5 h-3.5 text-amber-400" /> Institution / University
                </label>
                <input 
                  type="text" 
                  value={college}
                  onChange={(e) => setCollege(e.target.value)}
                  className="w-full h-11 rounded-xl px-4 text-xs font-semibold text-slate-300 neu-input border-none"
                />
              </div>

              {/* Department */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Briefcase className="w-3.5 h-3.5 text-rose-400" /> Discipline / Department
                </label>
                <input 
                  type="text" 
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full h-11 rounded-xl px-4 text-xs font-semibold text-slate-300 neu-input border-none"
                />
              </div>

              {/* CGPA */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Award className="w-3.5 h-3.5 text-violet-400" /> Academic Score (CGPA)
                </label>
                <input 
                  type="text" 
                  value={cgpa}
                  onChange={(e) => setCgpa(e.target.value)}
                  className="w-full h-11 rounded-xl px-4 text-xs font-semibold text-slate-300 neu-input border-none"
                />
              </div>

            </div>

            <button 
              type="submit"
              disabled={saving}
              className="w-full h-12 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-teal-400 to-emerald-600 hover:from-teal-500 hover:to-emerald-700 transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-teal-500/10 border-none cursor-pointer active:scale-[0.99] mt-4"
            >
              <Save className="w-4 h-4" /> {saving ? "Saving Changes..." : "Save Profile Credentials"}
            </button>

          </form>

        </main>
      </div>

    </div>
  );
}
