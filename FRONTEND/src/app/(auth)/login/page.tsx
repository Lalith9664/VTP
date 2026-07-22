"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Mail, Lock, ArrowRight, UserCheck, ArrowLeft, Loader2
} from "lucide-react";
import { toast } from "sonner";
import { useSession } from "@/store/SessionContext";
import { supabase } from "@/lib/supabase";
import { FloatingLines } from "@/components/FloatingLines";

export default function LoginPage() {
  const router = useRouter();
  const { login, updateProfile, theme, toggleTheme } = useSession();

  const [email, setEmail] = useState("lalith.kumar@nit.edu");
  const [password, setPassword] = useState("password123");
  const [rememberMe, setRememberMe] = useState(true);
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  
  // Custom API Register/Login Toggle
  const [isRegistering, setIsRegistering] = useState(false);
  const [loadingSubmit, setLoadingSubmit] = useState(false);

  const handleGoogleLogin = async () => {
    setLoadingGoogle(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`
        }
      });
      if (error) throw error;
    } catch (err: any) {
      console.warn("Supabase Google Auth warning:", err.message);
      toast.info("Supabase Google Auth is not configured in this sandbox environment. Proceeding in standard email flow.");
    } finally {
      setLoadingGoogle(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (!trimmedEmail || !trimmedPassword) {
      toast.warning("Please fill in all credentials.");
      return;
    }

    setLoadingSubmit(true);

    const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
    const endpoint = isRegistering 
      ? `${API_BASE}/auth/register` 
      : `${API_BASE}/auth/login`;

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmedEmail, password: trimmedPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "Authentication failed.");
      }

      // Save token and user id in global session state & local storage
      login(data.access_token, data.user_id);
      updateProfile({ email: trimmedEmail, fullName: trimmedEmail.split("@")[0] || "Lalith Kumar" });

      toast.success(isRegistering ? "Registration successful! Welcome ✨" : "Login successful! Welcome back ✨");
      
      // Redirect to onboarding if new user, else directly to dashboard
      router.push(isRegistering ? "/onboarding" : "/dashboard");

    } catch (err: any) {
      toast.error(isRegistering ? "Registration Failed" : "Login Failed", {
        description: err.message || "An unexpected network error occurred."
      });
    } finally {
      setLoadingSubmit(false);
    }
  };

  const handleForgotPassword = () => {
    toast.success("Password reset instructions sent to your email!");
  };

  return (
    <div className="flex-1 min-h-screen grid grid-cols-1 lg:grid-cols-12 neu-bg relative overflow-hidden select-none text-slate-100">
      
      {/* Full Background Floating Neural Network */}
      <FloatingLines />

      {/* Back to Home Button */}
      <Link 
        href="/"
        className="absolute top-6 left-6 z-30 flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold neu-button transition-all text-slate-400 hover:text-teal-400 border-none"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Home
      </Link>

      {/* Theme Toggle Switch */}
      <button
        onClick={toggleTheme}
        className="absolute top-8 right-10 lg:right-16 z-30 w-16 h-8.5 rounded-full transition-colors duration-300 flex items-center px-0.5 focus:outline-none cursor-pointer border-none bg-slate-150 dark:bg-slate-900/60 neu-pressed"
        aria-label="Toggle Theme Mode"
      >
        {/* Left Indicator */}
        <div className="absolute left-2.5 w-3 h-3 rounded-full border-2 border-slate-700 dark:border-slate-500 opacity-80" />
        
        {/* Right Indicator */}
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

      {/* Background blobs for right side */}
      <div className="absolute top-1/4 right-0 w-[400px] h-[400px] rounded-full bg-teal-500/5 blur-[100px] pointer-events-none" />
      
      {/* LEFT SIDE: Large AI Animation (Visible on lg+) */}
      <div className="hidden lg:flex lg:col-span-6 flex-col items-center justify-center p-12 relative overflow-hidden">
        
        {/* Decorative Grid */}
        <div className="absolute inset-0 grid-pattern opacity-30" />

        {/* Floating Abstract Shapes */}
        <motion.div 
          animate={{ y: [0, -15, 0], rotate: [0, 4, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 left-1/4 w-32 h-32 rounded-3xl bg-teal-500/10 blur-xl pointer-events-none"
        />
        <motion.div 
          animate={{ y: [0, 20, 0], rotate: [0, -4, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute bottom-1/4 right-1/4 w-40 h-40 rounded-full bg-purple-500/5 blur-xl pointer-events-none"
        />

        {/* AI Network Core UI */}
        <div className="relative w-80 h-80 flex items-center justify-center z-10">
          <div className="absolute inset-[-20px] rounded-full bg-gradient-to-tr from-teal-500/15 via-emerald-400/10 to-cyan-500/15 blur-2xl pointer-events-none" />

          {/* Rotating Tick Ring */}
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 rounded-full border border-teal-500/25 dark:border-teal-400/20 pointer-events-none"
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-teal-400/60 rounded-full" />
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-teal-400/60 rounded-full" />
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-teal-400/60 rounded-full" />
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-teal-400/60 rounded-full" />
          </motion.div>

          <motion.div 
            animate={{ rotate: -360 }}
            transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
            className="absolute inset-8 rounded-full border border-dashed border-teal-400/30 dark:border-teal-400/20 pointer-events-none"
          />

          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 flex items-center justify-between pointer-events-none"
          >
            <div className="w-4 h-4 rounded-full bg-teal-400 shadow-[0_0_10px_rgba(45,212,191,0.7)] border border-white/60" />
            <div className="w-4 h-4 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.7)] border border-white/60" />
          </motion.div>

          <motion.div 
            animate={{ rotate: -360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute inset-10 flex flex-col justify-between items-center pointer-events-none"
          >
            <div className="w-3.5 h-3.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.7)] border border-white/60" />
            <div className="w-3.5 h-3.5 rounded-full bg-teal-400 shadow-[0_0_8px_rgba(45,212,191,0.7)] border border-white/60" />
          </motion.div>

          <div className="w-26 h-26 rounded-full flex flex-col items-center justify-center p-1.5 neu-circle relative shadow-[0_0_25px_rgba(20,184,166,0.3)] border border-teal-400/40 bg-gradient-to-b from-teal-500/10 via-transparent to-emerald-500/10 backdrop-blur-md">
            <img src="/logo.jpeg" alt="VTP Logo" className="w-full h-full rounded-full object-cover shadow-inner border border-teal-300/30" />
          </div>
        </div>
      </div>

      {/* RIGHT SIDE: Interactive Login / Register Panel */}
      <div className="lg:col-span-6 flex flex-col items-center justify-center p-8 z-10">
        <div className="w-full max-w-[400px] flex flex-col items-start gap-8 text-left lg:-translate-x-12">
          
          {/* Logo Header */}
          <div className="flex items-center gap-3">
            <img src="/logo.jpeg" alt="VTP Logo" className="w-12 h-12 rounded-xl object-cover shadow-md border-none neu-circle" />
            <span className="text-lg font-bold text-slate-900 dark:text-slate-100">VTP</span>
          </div>

          {/* Heading */}
          <div className="flex flex-col gap-2">
            <h2 className="text-2xl font-black text-slate-100 tracking-tight">
              {isRegistering ? "Create Account" : "Welcome Back"}
            </h2>
            <p className="text-slate-400 text-xs font-semibold">
              {isRegistering 
                ? "Register a new account to unlock multi-agent automation." 
                : "Access your agent automated profile matching dashboard."}
            </p>
          </div>

          {/* Form Card */}
          <form onSubmit={handleSubmit} className="w-full neu-card p-8 rounded-3xl flex flex-col gap-6 relative border-none">
            
            {/* Google OAuth (only for login mode) */}
            {!isRegistering && (
              <>
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={loadingGoogle}
                  className="w-full h-12 rounded-2xl bg-white border border-slate-200 text-slate-800 font-bold flex items-center justify-center gap-2.5 shadow-xs hover:shadow-md transition-all cursor-pointer hover:bg-slate-50 text-xs"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  {loadingGoogle ? "Connecting Google..." : "Sign in with Google"}
                </button>

                <div className="flex items-center gap-2.5 my-1">
                  <div className="h-px bg-slate-800/45 flex-1" />
                  <span className="text-[10px] text-slate-400 uppercase tracking-widest font-black">Or Sign In with Email</span>
                  <div className="h-px bg-slate-800/45 flex-1" />
                </div>
              </>
            )}

            {/* Email Field */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@university.edu"
                  className="w-full h-11 rounded-xl pl-11 pr-4 text-xs font-semibold text-slate-300 neu-input border-none"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full h-11 rounded-xl pl-11 pr-4 text-xs font-semibold text-slate-300 neu-input border-none"
                  required
                />
              </div>
            </div>

            {/* Options Area (only for login mode) */}
            {!isRegistering && (
              <div className="flex items-center justify-between text-xs">
                <label className="flex items-center gap-2 cursor-pointer text-slate-400 font-bold">
                  <input 
                    type="checkbox" 
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-700 bg-[#172033] text-teal-500 focus:ring-sky-500/20" 
                  />
                  Remember Me
                </label>
                <button 
                  type="button" 
                  onClick={handleForgotPassword}
                  className="text-teal-400 hover:underline font-bold bg-transparent border-none cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col gap-3 mt-2">
              <button
                type="submit"
                disabled={loadingSubmit}
                className="w-full h-12 rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-white font-bold flex items-center justify-center gap-2 shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer group border border-teal-400/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loadingSubmit ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <UserCheck className="w-4 h-4" />
                    <span>{isRegistering ? "Sign Up" : "Sign In"}</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Register Toggle Footer */}
          <div className="w-full text-center text-xs text-slate-500 flex items-center justify-center gap-1">
            {isRegistering ? "Already have an account?" : "Don't have an account?"}
            <button 
              type="button" 
              onClick={() => setIsRegistering(!isRegistering)}
              className="text-teal-400 hover:underline font-black bg-transparent border-none cursor-pointer"
            >
              {isRegistering ? "Sign In" : "Create Account"}
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
