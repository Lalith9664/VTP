"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowRight, Play, Briefcase, FileText, Compass, Target, 
  Cpu, Zap, Sparkles, TrendingUp, CheckCircle, Quote, Menu, X, ArrowUpRight
} from "lucide-react";
import { useSession } from "@/store/SessionContext";

export default function LandingPage() {
  const router = useRouter();
  const { theme, toggleTheme } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  // Counter animation simulation
  const [stats, setStats] = useState({ jobs: 0, students: 0, accuracy: 0, domains: 0 });

  useEffect(() => {
    const timer = setTimeout(() => {
      setStats({
        jobs: 25000,
        students: 1500,
        accuracy: 96,
        domains: 10
      });
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const testimonials = [
    {
      name: "Ananya Sharma",
      role: "Software Engineer at Stripe",
      college: "BITS Pilani",
      image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=150&h=150&fit=crop",
      text: "VTP analyzed my GitHub projects, detected my missing skills, and matched me with Stripe. The automated learning planner helped me clear the interviews in 3 weeks!"
    },
    {
      name: "Kabir Mehta",
      role: "Associate Frontend Dev at Vercel",
      college: "DTU Delhi",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=150&h=150&fit=crop",
      text: "The agent pipeline is magic. I uploaded my resume, and within a minute, I had a custom learning roadmap tailored to Vercel's framework requirements. Outstanding interface!"
    },
    {
      name: "Meera Nair",
      role: "Cloud Engineer at Amazon",
      college: "NIT Trichy",
      image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=150&h=150&fit=crop",
      text: "The Anti-Matching section was a game changer. Instead of getting rejected for DevOps roles, VTP showed me exactly what Docker/AWS skills I was missing and how to learn them."
    }
  ];

  const agentSteps = [
    { id: 1, title: "Agent 1", subtitle: "Collecting Jobs", desc: "Crawling thousands of platforms", icon: <Briefcase className="w-5 h-5 text-teal-400" />, progress: 100 },
    { id: 2, title: "Agent 2", subtitle: "Understanding Jobs", desc: "Extracting skills and requirements", icon: <Cpu className="w-5 h-5 text-teal-400" />, progress: 100 },
    { id: 3, title: "Agent 3", subtitle: "Analyzing Resume", desc: "Mapping skills and experience", icon: <FileText className="w-5 h-5 text-purple-400" />, progress: 100 },
    { id: 4, title: "Agent 4", subtitle: "Matching Jobs", desc: "Calculating score & generating roadmap", icon: <Target className="w-5 h-5 text-teal-400" />, progress: 75 }
  ];

  return (
    <div className="flex-1 w-full neu-bg relative overflow-hidden font-sans select-none text-slate-100">
      
      {/* Background Blobs and Rays */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[60%] rounded-full bg-teal-500/10 blur-[130px] pointer-events-none animate-pulse-slow" />
      <div className="absolute top-[20%] right-[-10%] w-[45%] h-[55%] rounded-full bg-purple-500/5 blur-[130px] pointer-events-none animate-pulse-slow" />
      <div className="absolute bottom-[-10%] left-[20%] w-[50%] h-[50%] rounded-full bg-cyan-500/10 blur-[120px] pointer-events-none" />

      {/* Background Grid */}
      <div className="absolute inset-0 grid-pattern pointer-events-none opacity-40" />

      {/* Header / Navbar */}
      <header className="sticky top-0 z-50 w-full neu-header-bg shadow-md shadow-black/10">
        <div className="w-full px-6 lg:px-16 h-18 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.jpeg" alt="VTP Logo" className="w-12 h-12 rounded-xl object-cover shadow-md border-none neu-circle" />
            <span className="text-xl font-bold text-slate-900 dark:text-slate-100">
              VTP
            </span>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-bold text-slate-400">
            <a href="#features" className="hover:text-teal-400 transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-teal-400 transition-colors">How It Works</a>
            <a href="#statistics" className="hover:text-teal-400 transition-colors">Stats</a>
            <a href="#testimonials" className="hover:text-teal-400 transition-colors">Success Stories</a>
          </nav>

          {/* Actions */}
          <div className="hidden md:flex items-center gap-4">
            {/* Dark/Light Mode Toggle Switch */}
            <div className="flex items-center gap-2 mr-2">
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

            <Link 
              href="/login"
              className="px-5 py-2.5 rounded-xl text-xs font-bold neu-button transition-all text-slate-300"
            >
              Sign In
            </Link>
            <Link
              href="/login"
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-md shadow-teal-500/10 hover:translate-y-[-1px] transition-all flex items-center gap-2 cursor-pointer border border-teal-400/20"
            >
              Get Started <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Mobile Menu Btn */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-slate-300 hover:bg-[#172033] rounded-lg neu-button border-none"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Menu Dropdown */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute top-18 left-0 right-0 neu-header-bg border-b border-slate-200/60 shadow-2xl px-6 py-6 flex flex-col gap-4 md:hidden text-left"
            >
              <a 
                href="#features" 
                onClick={() => setMobileMenuOpen(false)}
                className="text-slate-300 font-bold py-2 border-b border-slate-800"
              >
                Features
              </a>
              <a 
                href="#how-it-works" 
                onClick={() => setMobileMenuOpen(false)}
                className="text-slate-300 font-bold py-2 border-b border-slate-800"
              >
                How It Works
              </a>
              <a 
                href="#statistics" 
                onClick={() => setMobileMenuOpen(false)}
                className="text-slate-300 font-bold py-2 border-b border-slate-800"
              >
                Stats
              </a>
              <a 
                href="#testimonials" 
                onClick={() => setMobileMenuOpen(false)}
                className="text-slate-300 font-bold py-2 border-b border-slate-800"
              >
                Success Stories
              </a>
              <div className="flex flex-col gap-3 pt-4">
                <Link 
                  href="/login"
                  className="w-full text-center py-3 rounded-xl text-slate-300 font-bold neu-button"
                >
                  Sign In
                </Link>
                <Link 
                  href="/login"
                  className="w-full text-center py-3 bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded-xl font-bold border border-teal-400/20 shadow-md"
                >
                  Get Started
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Hero Section */}
      <section className="w-full px-6 lg:px-16 pt-16 pb-24 md:py-32 grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
        
        {/* Left Hero */}
        <div className="lg:col-span-7 flex flex-col items-start gap-8 z-10 text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#172033] border border-slate-800 text-teal-400 text-xs font-bold neu-card">
            <Sparkles className="w-3.5 h-3.5 text-teal-400" />
            AI-Powered Multi-Agent Automation
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-slate-100 leading-[1.12]">
            Find Your Dream Job Powered by{" "}
            <span className="bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent">
              Multi-Agent AI
            </span>
          </h1>

          <p className="text-lg md:text-xl text-slate-400 max-w-xl leading-relaxed">
            Our AI scans thousands of fresher jobs, understands your resume, analyzes your skills, and recommends the perfect opportunities automatically.
          </p>

          <div className="flex flex-col sm:flex-row gap-5 w-full sm:w-auto mt-2">
            <Link
              href="/login"
              className="px-8 py-4 rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-bold shadow-lg shadow-teal-500/10 hover:-translate-y-0.5 transition-all text-center flex items-center justify-center gap-2 group cursor-pointer border border-teal-400/20"
            >
              Get Started 
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>

        {/* Right Hero (AI Agents Grid) */}
        <div className="lg:col-span-5 relative flex justify-center items-center">
          <div className="w-full max-w-[400px] flex flex-col gap-6 relative z-10">
            {agentSteps.map((agent, index) => (
              <motion.div
                key={agent.id}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                className="neu-card p-5 rounded-2xl flex items-center gap-4 relative animate-float border-none"
                style={{ 
                  animationDelay: `${index * 1.5}s`,
                }}
              >
                {/* Agent Icon Box */}
                <div className="w-12 h-12 rounded-xl bg-[#172033] flex items-center justify-center border border-slate-800 neu-circle">
                  {agent.icon}
                </div>

                <div className="flex-1 text-left">
                  <div className="flex items-center justify-between">
                    {agent.progress === 100 ? (
                      <span className="inline-flex items-center gap-1 text-[9px] font-bold text-teal-400 bg-teal-950/20 px-2 py-0.5 rounded-full border border-teal-800/40">
                        Done
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-[9px] font-bold text-teal-400 bg-sky-950/20 px-2 py-0.5 rounded-full border border-sky-800/40">
                        <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-ping" /> Analyzing
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-slate-100 text-sm mt-0.5">{agent.subtitle}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">{agent.desc}</p>
                  
                  {/* Progress Line */}
                  <div className="w-full h-1 rounded-full mt-3 overflow-hidden neu-pressed border-none">
                    <div 
                      className="bg-gradient-to-r from-teal-400 to-emerald-500 h-full rounded-full transition-all duration-1000"
                      style={{ width: `${agent.progress}%` }}
                    />
                  </div>
                </div>

                {/* Pulsing Connective Dots */}
                {index < agentSteps.length - 1 && (
                  <div className="absolute bottom-[-24px] left-[34px] w-0.5 h-6 bg-gradient-to-b from-indigo-500 to-[#111827] flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-teal-400/80 animate-ping" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Section */}
      <section id="features" className="w-full px-6 lg:px-16 py-24 relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-16 flex flex-col items-center">
          <div className="px-3 py-1.5 rounded-full bg-[#172033] border border-slate-800 text-teal-400 text-xs font-bold mb-4 neu-card">
            Powerful Automation Capabilities
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-slate-100 leading-tight">
            Features Designed to Accelerate Your Career Launch
          </h2>
          <p className="text-slate-400 mt-4 leading-relaxed">
            Our multi-agent system takes care of the scanning, matching, resume tailoring, and learning, allowing you to focus on acing interviews.
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            {
              title: "AI Job Collection",
              desc: "Simultaneous background crawlers scanning over 40+ platforms for student-friendly roles.",
              icon: <Briefcase className="w-6 h-6 text-teal-400" />
            },
            {
              title: "Resume Intelligence",
              desc: "AuraParser understands deep context, projects, research work, and maps them to job parameters.",
              icon: <FileText className="w-6 h-6 text-teal-400" />
            },
            {
              title: "Multi-Agent AI",
              desc: "4 specialized agents work in sync representing data collection, cleaning, mapping, and planning.",
              icon: <Cpu className="w-6 h-6 text-purple-400" />
            },
            {
              title: "Smart Recommendations",
              desc: "Dynamic scores ranking jobs not just on keyword match but semantic profile fit.",
              icon: <Target className="w-6 h-6 text-teal-400" />
            },
            {
              title: "Skill Gap Analysis",
              desc: "Get list of missing core skills and tech requirements for every single listing.",
              icon: <Zap className="w-6 h-6 text-orange-400" />
            },
            {
              title: "Career Growth Roadmap",
              desc: "Generates custom weekly roadmaps and learning modules to cover missing qualifications.",
              icon: <Compass className="w-6 h-6 text-pink-400" />
            },
            {
              title: "Trending Skills Tracker",
              desc: "Visualizes the fastest growing technologies like CrewAI, LangGraph, and MCP in real-time.",
              icon: <TrendingUp className="w-6 h-6 text-emerald-400" />
            },
            {
              title: "AI Career Assistant",
              desc: "Talk to our simulated career coach on details of company-specific expectations.",
              icon: <Sparkles className="w-6 h-6 text-teal-400" />
            }
          ].map((feat, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className="neu-card neu-card-hover p-6 rounded-3xl flex flex-col items-start gap-4 text-left border-none"
            >
              <div className="w-12 h-12 rounded-2xl bg-[#172033] flex items-center justify-center border border-slate-800 neu-circle shadow-sm">
                {feat.icon}
              </div>
              <h3 className="font-bold text-slate-100 text-base mt-2">{feat.title}</h3>
              <p className="text-slate-400 text-xs leading-relaxed">{feat.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" className="w-full px-6 lg:px-16 py-24 relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-20 flex flex-col items-center">
          <div className="px-3 py-1.5 rounded-full bg-[#172033] border border-slate-800 text-teal-400 text-xs font-bold mb-4 neu-card">
            Workflow Transparency
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-slate-100 leading-tight">
            How The Agent Network Operates
          </h2>
          <p className="text-slate-400 mt-4 leading-relaxed">
            Watch how our coordinated agent system processes data in four consecutive steps.
          </p>
        </div>

        {/* Timeline */}
        <div className="relative max-w-5xl mx-auto flex flex-col gap-12 lg:flex-row lg:justify-between lg:gap-6">
          
          {/* Horizontal Line for Large Screens */}
          <div className="hidden lg:block absolute top-[40px] left-[10%] right-[10%] h-0.5 bg-gradient-to-r from-teal-500 to-emerald-500 opacity-20 pointer-events-none" />

          {[
            { step: "01", title: "Collect Jobs", desc: "Agents monitor API endpoints, job sites, and social platforms, parsing fresher vacancies in real-time." },
            { step: "02", title: "Parse Job Descriptions", desc: "Using advanced semantic LLMs, Agent 2 extracts technologies, soft skills, budget, and location parameters." },
            { step: "03", title: "Analyze Student Resume", desc: "Agent 3 parses your projects, experience, education, and constructs a robust personal skill graph." },
            { step: "04", title: "Generate Personalized Recommendations", desc: "Agent 4 matches your skill graph against parsed jobs, compiling fit scores and tailored study roadmaps." }
          ].map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: idx * 0.15 }}
              className="flex-1 flex flex-col items-center lg:items-start text-center lg:text-left relative z-10 px-4"
            >
              <div className="w-20 h-20 rounded-3xl text-teal-400 flex items-center justify-center text-2xl font-black mb-6 neu-circle border-none">
                {item.step}
              </div>
              <h3 className="font-bold text-slate-100 text-base mb-2">{item.title}</h3>
              <p className="text-slate-400 text-xs leading-relaxed max-w-xs lg:max-w-none">{item.desc}</p>

              {/* Vertical connector for mobile */}
              {idx < 3 && (
                <div className="lg:hidden w-0.5 h-12 bg-teal-500/20 my-4" />
              )}
            </motion.div>
          ))}
        </div>
      </section>

      {/* Statistics Section */}
      <section id="statistics" className="w-full px-6 lg:px-16 py-20 relative z-10">
        <div className="neu-card rounded-3xl p-10 md:p-16 flex flex-col md:flex-row md:items-center justify-around gap-12 text-center border-none">
          {[
            { target: stats.jobs, suffix: "+", label: "Jobs Collected" },
            { target: stats.students, suffix: "+", label: "Students Matched" },
            { target: stats.accuracy, suffix: "%", label: "Matching Accuracy" },
            { target: stats.domains, suffix: "+", label: "Career Domains" }
          ].map((stat, idx) => (
            <div key={idx} className="flex flex-col gap-2">
              <span className="text-4xl md:text-5xl font-black text-teal-400 tracking-tight">
                {stat.target.toLocaleString()}{stat.suffix}
              </span>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials (Carousel) */}
      <section id="testimonials" className="w-full px-6 lg:px-16 py-24 relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-16 flex flex-col items-center">
          <div className="px-3 py-1.5 rounded-full bg-[#172033] border border-slate-800 text-teal-400 text-xs font-bold mb-4 neu-card">
            Success Stories
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-slate-100 leading-tight">
            Loved by Placed Students
          </h2>
        </div>

        {/* Carousel Container */}
        <div className="max-w-3xl mx-auto relative px-4">
          <div className="min-h-[220px] neu-card p-8 md:p-12 rounded-3xl relative flex flex-col items-start gap-6 text-left border-none">
            <Quote className="w-12 h-12 text-slate-800 absolute top-6 right-8 pointer-events-none" />
            
            <p className="text-slate-300 italic text-base leading-relaxed relative z-10">
              "{testimonials[activeTestimonial].text}"
            </p>

            <div className="flex items-center gap-4 mt-4">
              <img 
                src={testimonials[activeTestimonial].image} 
                alt={testimonials[activeTestimonial].name}
                className="w-12 h-12 rounded-full object-cover border border-slate-800 neu-circle"
              />
              <div>
                <h4 className="font-bold text-slate-100 text-sm leading-tight">{testimonials[activeTestimonial].name}</h4>
                <p className="text-[11px] text-teal-400 font-bold mt-0.5">{testimonials[activeTestimonial].role}</p>
                <p className="text-[10px] text-slate-500 font-semibold">{testimonials[activeTestimonial].college}</p>
              </div>
            </div>
          </div>

          {/* Dots Indicator */}
          <div className="flex justify-center gap-2.5 mt-8">
            {testimonials.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setActiveTestimonial(idx)}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${idx === activeTestimonial ? "w-6 bg-teal-400" : "bg-slate-700 hover:bg-slate-600"}`}
              />
            ))}
          </div>
        </div>
      </section>

      <footer className="neu-sidebar-bg relative z-10">
        <div className="w-full px-6 lg:px-16 py-16 grid grid-cols-1 md:grid-cols-12 gap-12">
          
          {/* Logo & Info */}
          <div className="md:col-span-4 flex flex-col items-start gap-4 text-left">
            <div className="flex items-center gap-3">
              <img src="/logo.jpeg" alt="VTP Logo" className="w-12 h-12 rounded-lg object-cover shadow-md" />
              <span className="text-lg font-bold text-slate-200">
                VTP
              </span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed max-w-sm">
              Next-generation multi-agent recruitment automation. Mapping fresher capabilities to modern cloud tech sectors.
            </p>
            <span className="text-[10px] text-slate-500 mt-2 font-bold">
              © 2026 VTP Technologies Inc. All rights reserved.
            </span>
          </div>

          {/* Quick Links */}
          <div className="md:col-span-3 flex flex-col items-start gap-3 text-left">
            <h4 className="font-bold text-slate-200 text-xs uppercase tracking-widest">Product</h4>
            <a href="#features" className="text-slate-400 hover:text-teal-400 text-xs transition-colors">Features</a>
            <a href="#how-it-works" className="text-slate-400 hover:text-teal-400 text-xs transition-colors">Workflow</a>
            <a href="#statistics" className="text-slate-400 hover:text-teal-400 text-xs transition-colors">Case Studies</a>
          </div>

          {/* Resources */}
          <div className="md:col-span-3 flex flex-col items-start gap-3 text-left">
            <h4 className="font-bold text-slate-200 text-xs uppercase tracking-widest">Resources</h4>
            <span className="text-slate-400 hover:text-teal-400 text-xs transition-colors cursor-pointer">Documentation</span>
            <span className="text-slate-400 hover:text-teal-400 text-xs transition-colors cursor-pointer">API Integration</span>
            <span className="text-slate-400 hover:text-teal-400 text-xs transition-colors cursor-pointer">Developer SDKs</span>
          </div>

          {/* Contact */}
          <div className="md:col-span-2 flex flex-col items-start gap-3 text-left">
            <h4 className="font-bold text-slate-200 text-xs uppercase tracking-widest">Company</h4>
            <span className="text-slate-400 hover:text-teal-400 text-xs transition-colors cursor-pointer">About Us</span>
            <span className="text-slate-400 hover:text-teal-400 text-xs transition-colors cursor-pointer">Contact Support</span>
            <span className="text-slate-400 hover:text-teal-400 text-xs transition-colors cursor-pointer">Privacy Policy</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
