"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  User, GraduationCap, Code, Plus, X, Search,
  ArrowRight, ArrowLeft, Phone, MapPin, Award, Sun, Moon
} from "lucide-react";
import { toast } from "sonner";
import { useSession } from "@/store/SessionContext";
import { FloatingLines } from "@/components/FloatingLines";
import { updateUserProfile } from "@/lib/api";

const availableAvatars = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256&h=256&fit=crop",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=256&h=256&fit=crop",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=256&h=256&fit=crop",
  "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=256&h=256&fit=crop"
];

const presetSkills = [
  "React", "Next.js", "TypeScript", "Node.js", "Python", "FastAPI", "Docker", "Kubernetes",
  "AWS", "CrewAI", "LangGraph", "MCP (Model Context Protocol)", "LangChain", "JavaScript", 
  "MongoDB", "PostgreSQL", "Tailwind CSS", "Git", "CI/CD", "DevOps", "Azure", "GCP", 
  "PyTorch", "TensorFlow", "Java", "C++"
];

export default function OnboardingPage() {
  const router = useRouter();
  const { profile, updateProfile, theme, toggleTheme } = useSession();
  const [step, setStep] = useState(1);

  // Form states initialized from context
  const [fullName, setFullName] = useState(profile.fullName);
  const [email, setEmail] = useState(profile.email);
  const [phone, setPhone] = useState(profile.phone);
  const [profilePic, setProfilePic] = useState(profile.profilePic);
  
  const [college, setCollege] = useState(profile.college);
  const [department, setDepartment] = useState(profile.department);
  const [degree, setDegree] = useState(profile.degree);
  const [graduationYear, setGraduationYear] = useState(profile.graduationYear);
  const [cgpa, setCgpa] = useState(profile.cgpa);
  const [currentEducation, setCurrentEducation] = useState(profile.currentEducation);

  const [skills, setSkills] = useState<string[]>(profile.skills);
  const [githubUrl, setGithubUrl] = useState(profile.githubUrl);
  const [linkedinUrl, setLinkedinUrl] = useState(profile.linkedinUrl);
  const [portfolioUrl, setPortfolioUrl] = useState(profile.portfolioUrl);
  const [preferredDomain, setPreferredDomain] = useState(profile.preferredDomain);
  const [preferredJobLocation, setPreferredJobLocation] = useState(profile.preferredJobLocation);

  // Auto-complete skill search states
  const [skillSearch, setSkillSearch] = useState("");
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSkillSearch(val);
    if (val.trim() === "") {
      setFilteredSuggestions([]);
    } else {
      const filtered = presetSkills.filter(
        (skill) => 
          skill.toLowerCase().includes(val.toLowerCase()) && 
          !skills.includes(skill)
      );
      setFilteredSuggestions(filtered);
    }
  };

  const handleAddSkill = (skill: string) => {
    if (!skills.includes(skill)) {
      setSkills([...skills, skill]);
      setSkillSearch("");
      setFilteredSuggestions([]);
      toast.success(`Added ${skill}`);
    }
  };

  const handleCreateCustomSkill = () => {
    if (skillSearch.trim() !== "" && !skills.includes(skillSearch.trim())) {
      setSkills([...skills, skillSearch.trim()]);
      setSkillSearch("");
      setFilteredSuggestions([]);
      toast.success(`Added custom skill: ${skillSearch.trim()}`);
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter((s) => s !== skillToRemove));
  };

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      // Save all to global state
      updateProfile({
        fullName,
        email,
        phone,
        profilePic,
        college,
        department,
        degree,
        graduationYear,
        cgpa,
        currentEducation,
        skills,
        githubUrl,
        linkedinUrl,
        portfolioUrl,
        preferredDomain,
        preferredJobLocation
      });

      // Call API to save to Supabase DB profiles table
      updateUserProfile({
        name: fullName,
        phone_number: phone,
        skills: skills,
        education: `${degree} in ${department}, ${college}`,
        location: preferredJobLocation,
        ultimate_goal: preferredDomain,
      })
      .then(() => console.log("Onboarding profile saved to Supabase!"))
      .catch(err => console.error("Failed to save onboarding details to DB:", err));

      toast.success("Profile saved successfully!");
      router.push("/upload");
    }
  };

  const handlePrev = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  return (
    <div className="flex-1 min-h-screen neu-bg flex flex-col items-center justify-center p-6 relative overflow-hidden select-none text-slate-100">
      
      {/* Background Particles Network */}
      <FloatingLines />

      {/* Back to Login Button */}
      <Link 
        href="/login"
        className="absolute top-6 left-6 z-30 flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold neu-button transition-all text-slate-400 hover:text-teal-400 border-none cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Login
      </Link>

      {/* Theme Toggle Button */}
      <button
        onClick={toggleTheme}
        className="absolute top-8 right-10 lg:right-16 z-30 w-16 h-8.5 rounded-full transition-colors duration-300 flex items-center px-0.5 focus:outline-none cursor-pointer border-none bg-slate-150 dark:bg-slate-900/60 neu-pressed"
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

      {/* Background Blur shapes */}
      <div className="absolute top-[-10%] left-[-10%] w-[350px] h-[350px] rounded-full bg-teal-500/5 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[350px] h-[350px] rounded-full bg-purple-500/5 blur-[100px] pointer-events-none" />
      
      {/* Container */}
      <div className="w-full max-w-7xl px-4 lg:px-10 flex flex-col gap-6 relative z-10">
        
        {/* Step Indicator */}
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-3">
            <img src="/logo.jpeg" alt="VTP Logo" className="w-12 h-12 rounded-xl object-cover shadow-md border-none neu-circle" />
            <span className="text-base font-bold text-slate-200">Profile Setup</span>
          </div>
          <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest bg-slate-100 dark:bg-[#172033] px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-800/80 shadow-xs">
            Step {step} of 3
          </span>
        </div>

        {/* Wizard Form Wrapper - Horizontal Accordion Layout */}
        <div className="flex flex-col lg:flex-row gap-5 w-full items-stretch min-h-[580px]">
          
          {/* STEP 1 CARD */}
          {step === 1 ? (
            <div className="flex-1 lg:flex-[4.5] neu-card p-8 rounded-3xl bg-white dark:bg-[#1A2336] border-none text-left flex flex-col gap-5 transition-all duration-500">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col gap-5 h-full"
              >
                <div className="flex items-center justify-between border-b border-slate-200/10 pb-4">
                  <div>
                    <div className="text-[11px] font-mono text-slate-400 dark:text-slate-500 uppercase tracking-widest font-bold">01 //</div>
                    <h2 className="text-xl font-black text-slate-100 flex items-center gap-2 tracking-tight mt-1">
                      <User className="w-5.5 h-5.5 text-teal-405 dark:text-teal-400" />
                      Personal Information
                    </h2>
                    <p className="text-slate-400 text-xs mt-1 font-semibold">Contact Details & Avatar</p>
                  </div>
                </div>

                <img 
                  src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=600&q=80" 
                  alt="Personal Info Banner" 
                  className="rounded-2xl w-full h-32 object-cover opacity-85 dark:opacity-75 shadow-sm border border-slate-200/15" 
                />

                {/* Profile Picture Uploader */}
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Profile Picture</label>
                  <div className="flex items-center gap-4 mt-1">
                    {profilePic ? (
                      <div className="relative">
                        <img 
                          src={profilePic} 
                          alt="Current Avatar" 
                          className="w-16 h-16 rounded-full object-cover border-2 border-teal-450 dark:border-teal-400 shadow-md"
                        />
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-teal-500 to-emerald-500 text-white font-black flex items-center justify-center text-2xl border-2 border-teal-450 dark:border-teal-450 shadow-md shadow-black/20">
                        {fullName ? fullName.charAt(0).toUpperCase() : "?"}
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row gap-2">
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        id="profile-pic-file-input" 
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            if (file.size > 2 * 1024 * 1024) {
                              toast.error("Avatar size exceeds limit of 2 MB.");
                              return;
                            }
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setProfilePic(reader.result as string);
                              toast.success("Avatar updated!");
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => document.getElementById("profile-pic-file-input")?.click()}
                        className="px-4 py-2.5 rounded-xl text-[10px] font-bold transition-all cursor-pointer border-none neu-button text-slate-350 hover:text-teal-500 dark:hover:text-teal-450"
                      >
                        Upload Photo
                      </button>
                      {profilePic && (
                        <button
                          type="button"
                          onClick={() => setProfilePic("")}
                          className="px-4 py-2.5 rounded-xl text-[10px] font-bold transition-all cursor-pointer border-none neu-button text-slate-400 hover:text-rose-500"
                        >
                          Use Initials Fallback
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Input Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Full Name</label>
                    <input 
                      type="text" 
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="h-11 rounded-xl px-4 text-xs font-semibold text-slate-350 neu-input border-none"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email Address</label>
                    <input 
                      type="email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-11 rounded-xl px-4 text-xs font-semibold text-slate-355 neu-input border-none"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Phone Number</label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
                      <input 
                        type="text" 
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full h-11 rounded-xl pl-10 pr-4 text-xs font-semibold text-slate-350 neu-input border-none"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Education Level</label>
                    <select 
                      value={currentEducation}
                      onChange={(e) => setCurrentEducation(e.target.value)}
                      className="h-11 rounded-xl px-4 text-xs font-semibold text-slate-350 neu-input border-none cursor-pointer"
                    >
                      <option value="" disabled>Select Education Level</option>
                      <option value="Final Year (B.Tech)">Final Year Student</option>
                      <option value="Third Year (B.Tech)">Pre-Final Year Student</option>
                      <option value="Fresh Graduate">Fresh Graduate</option>
                      <option value="Postgraduate (M.Tech)">Postgraduate Student</option>
                    </select>
                  </div>
                </div>

                {/* Flow Controls */}
                <div className="flex items-center justify-between border-t border-slate-800/40 pt-5 mt-auto">
                  <div />
                  <button
                    type="button"
                    onClick={handleNext}
                    className="px-6 py-3 rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-white font-bold flex items-center justify-center gap-2 shadow-md hover:-translate-y-0.5 transition-all cursor-pointer group border border-teal-400/20"
                  >
                    Next Step
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </motion.div>
            </div>
          ) : (
            <div 
              onClick={() => setStep(1)}
              className="w-full lg:w-16 lg:flex-[0.3] flex flex-row lg:flex-col py-3 lg:py-6 px-5 items-center justify-between cursor-pointer opacity-75 hover:opacity-100 hover:scale-[1.02] transition-all duration-300 neu-card rounded-2xl bg-white dark:bg-[#1A2336] border-none shadow-sm min-h-[52px] lg:min-h-[500px]"
            >
              <div className="text-sm font-mono text-slate-450 dark:text-slate-500 font-black">01</div>
              <span 
                style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }} 
                className="hidden lg:block text-xs font-black text-slate-450 dark:text-slate-500 uppercase tracking-widest my-auto"
              >
                Personal Info
              </span>
              <span className="lg:hidden text-xs font-bold text-slate-450 uppercase tracking-wider">
                Personal Information
              </span>
              <User className="w-4 h-4 text-slate-450 dark:text-slate-500" />
            </div>
          )}

          {/* STEP 2 CARD */}
          {step === 2 ? (
            <div className="flex-1 lg:flex-[4.5] neu-card p-8 rounded-3xl bg-white dark:bg-[#1A2336] border-none text-left flex flex-col gap-5 transition-all duration-500">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col gap-5 h-full"
              >
                <div className="flex items-center justify-between border-b border-slate-200/10 pb-4">
                  <div>
                    <div className="text-[11px] font-mono text-slate-400 dark:text-slate-500 uppercase tracking-widest font-bold">02 //</div>
                    <h2 className="text-xl font-black text-slate-100 flex items-center gap-2 tracking-tight mt-1">
                      <GraduationCap className="w-5.5 h-5.5 text-teal-405 dark:text-teal-400" />
                      Academic History
                    </h2>
                    <p className="text-slate-400 text-xs mt-1 font-semibold">University Major & Scores</p>
                  </div>
                </div>

                <img 
                  src="https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=600&q=80" 
                  alt="Academic Banner" 
                  className="rounded-2xl w-full h-32 object-cover opacity-85 dark:opacity-75 shadow-sm border border-slate-200/15" 
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5 md:col-span-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">College Name</label>
                    <input 
                      type="text" 
                      value={college}
                      onChange={(e) => setCollege(e.target.value)}
                      className="h-11 rounded-xl px-4 text-xs font-semibold text-slate-350 neu-input border-none"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Department / Major</label>
                    <input 
                      type="text" 
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="h-11 rounded-xl px-4 text-xs font-semibold text-slate-350 neu-input border-none"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Degree Type</label>
                    <input 
                      type="text" 
                      value={degree}
                      onChange={(e) => setDegree(e.target.value)}
                      className="h-11 rounded-xl px-4 text-xs font-semibold text-slate-350 neu-input border-none"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Graduation Year</label>
                    <input 
                      type="text" 
                      value={graduationYear}
                      onChange={(e) => setGraduationYear(e.target.value)}
                      className="h-11 rounded-xl px-4 text-xs font-semibold text-slate-350 neu-input border-none"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">CGPA / GPA</label>
                    <div className="relative">
                      <Award className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
                      <input 
                        type="text" 
                        value={cgpa}
                        onChange={(e) => setCgpa(e.target.value)}
                        className="w-full h-11 rounded-xl pl-10 pr-4 text-xs font-semibold text-slate-350 neu-input border-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Flow Controls */}
                <div className="flex items-center justify-between border-t border-slate-800/40 pt-5 mt-auto">
                  <button
                    type="button"
                    onClick={handlePrev}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold neu-button transition-all flex items-center gap-2 cursor-pointer border-none"
                  >
                    <ArrowLeft className="w-4 h-4" /> Back
                  </button>
                  <button
                    type="button"
                    onClick={handleNext}
                    className="px-6 py-3 rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-white font-bold flex items-center justify-center gap-2 shadow-md hover:-translate-y-0.5 transition-all cursor-pointer group border border-teal-400/20"
                  >
                    Next Step
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </motion.div>
            </div>
          ) : (
            <div 
              onClick={() => setStep(2)}
              className="w-full lg:w-16 lg:flex-[0.3] flex flex-row lg:flex-col py-3 lg:py-6 px-5 items-center justify-between cursor-pointer opacity-75 hover:opacity-100 hover:scale-[1.02] transition-all duration-300 neu-card rounded-2xl bg-white dark:bg-[#1A2336] border-none shadow-sm min-h-[52px] lg:min-h-[500px]"
            >
              <div className="text-sm font-mono text-slate-455 dark:text-slate-500 font-black">02</div>
              <span 
                style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }} 
                className="hidden lg:block text-xs font-black text-slate-455 dark:text-slate-500 uppercase tracking-widest my-auto"
              >
                Academic Profile
              </span>
              <span className="lg:hidden text-xs font-bold text-slate-455 uppercase tracking-wider">
                Academic History
              </span>
              <GraduationCap className="w-4 h-4 text-slate-450 dark:text-slate-500" />
            </div>
          )}

          {/* STEP 3 CARD */}
          {step === 3 ? (
            <div className="flex-1 lg:flex-[4.5] neu-card p-8 rounded-3xl bg-white dark:bg-[#1A2336] border-none text-left flex flex-col gap-5 transition-all duration-500">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col gap-5 h-full"
              >
                <div className="flex items-center justify-between border-b border-slate-200/10 pb-4">
                  <div>
                    <div className="text-[11px] font-mono text-slate-400 dark:text-slate-500 uppercase tracking-widest font-bold">03 //</div>
                    <h2 className="text-xl font-black text-slate-100 flex items-center gap-2 tracking-tight mt-1">
                      <Code className="w-5.5 h-5.5 text-teal-405 dark:text-teal-400" />
                      Skills & Preferences
                    </h2>
                    <p className="text-slate-400 text-xs mt-1 font-semibold">Competencies & Career Targets</p>
                  </div>
                </div>

                <img 
                  src="https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=600&q=80" 
                  alt="Skills Banner" 
                  className="rounded-2xl w-full h-32 object-cover opacity-85 dark:opacity-75 shadow-sm border border-slate-200/15" 
                />

                {/* Skills Chips Controller */}
                <div className="flex flex-col gap-2.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Extracted Tech Competencies</label>
                  <div className="flex flex-wrap gap-2.5 p-4 rounded-2xl min-h-[60px] neu-pressed border-none">
                    {skills.length === 0 ? (
                      <span className="text-xs text-slate-500 font-semibold">No skills added yet...</span>
                    ) : (
                      skills.map((skill) => (
                        <span 
                          key={skill}
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-400 px-3 py-1.5 rounded-xl border-none neu-button"
                        >
                          {skill}
                          <button 
                            type="button" 
                            onClick={() => handleRemoveSkill(skill)}
                            className="p-0.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-rose-400 transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </span>
                      ))
                    )}
                  </div>

                  {/* Skill Search & Autocomplete suggestions */}
                  <div className="relative">
                    <div className="relative">
                      <Search className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
                      <input 
                        type="text" 
                        value={skillSearch}
                        onChange={handleSearchChange}
                        placeholder="Search technology (e.g. Docker, LangGraph)..."
                        className="w-full h-11 rounded-xl pl-10 pr-4 text-xs font-semibold text-slate-350 neu-input border-none"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleCreateCustomSkill();
                          }
                        }}
                      />
                    </div>

                    <AnimatePresence>
                      {filteredSuggestions.length > 0 && (
                        <motion.div 
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 5 }}
                          className="absolute left-0 right-0 top-12 max-h-40 overflow-y-auto neu-card shadow-2xl rounded-2xl p-2.5 z-50 flex flex-col gap-1 text-xs border-none"
                        >
                          {filteredSuggestions.map((item) => (
                            <button
                              key={item}
                              type="button"
                              onClick={() => handleAddSkill(item)}
                              className="w-full text-left px-3 py-2 hover:bg-[#172033] hover:text-teal-400 font-bold rounded-lg flex items-center justify-between transition-colors"
                            >
                              {item}
                              <Plus className="w-3.5 h-3.5 text-slate-500" />
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Prefs & Portfolio Links */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Preferred Career Domain</label>
                    <select 
                      value={preferredDomain}
                      onChange={(e) => setPreferredDomain(e.target.value)}
                      className="h-11 rounded-xl px-4 text-xs font-semibold text-slate-350 neu-input border-none cursor-pointer"
                    >
                      <option value="" disabled>Select Career Domain</option>
                      <option value="Full Stack Development">Full Stack Engineering</option>
                      <option value="Frontend Development">Frontend Developer</option>
                      <option value="Machine Learning Engineering">ML / AI Engineer</option>
                      <option value="DevOps & Infrastructure">DevOps Platform Engineer</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Preferred Job Location</label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
                      <input 
                        type="text" 
                        value={preferredJobLocation}
                        onChange={(e) => setPreferredJobLocation(e.target.value)}
                        className="w-full h-11 rounded-xl pl-10 pr-4 text-xs font-semibold text-slate-350 neu-input border-none"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">GitHub URL</label>
                    <input 
                      type="url" 
                      value={githubUrl}
                      onChange={(e) => setGithubUrl(e.target.value)}
                      placeholder="https://github.com/yourusername"
                      className="h-11 rounded-xl px-4 text-xs font-semibold text-slate-350 neu-input border-none"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">LinkedIn URL</label>
                    <input 
                      type="url" 
                      value={linkedinUrl}
                      onChange={(e) => setLinkedinUrl(e.target.value)}
                      placeholder="https://linkedin.com/in/yourprofile"
                      className="h-11 rounded-xl px-4 text-xs font-semibold text-slate-350 neu-input border-none"
                    />
                  </div>
                </div>

                {/* Flow Controls */}
                <div className="flex items-center justify-between border-t border-slate-800/40 pt-5 mt-auto">
                  <button
                    type="button"
                    onClick={handlePrev}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold neu-button transition-all flex items-center gap-2 cursor-pointer border-none"
                  >
                    <ArrowLeft className="w-4 h-4" /> Back
                  </button>
                  <button
                    type="button"
                    onClick={handleNext}
                    className="px-6 py-3 rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-white font-bold flex items-center justify-center gap-2 shadow-md hover:-translate-y-0.5 transition-all cursor-pointer group border border-teal-400/20"
                  >
                    Continue to Resume Upload
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </motion.div>
            </div>
          ) : (
            <div 
              onClick={() => setStep(3)}
              className="w-full lg:w-16 lg:flex-[0.3] flex flex-row lg:flex-col py-3 lg:py-6 px-5 items-center justify-between cursor-pointer opacity-75 hover:opacity-100 hover:scale-[1.02] transition-all duration-300 neu-card rounded-2xl bg-white dark:bg-[#1A2336] border-none shadow-sm min-h-[52px] lg:min-h-[500px]"
            >
              <div className="text-sm font-mono text-slate-455 dark:text-slate-500 font-black">03</div>
              <span 
                style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }} 
                className="hidden lg:block text-xs font-black text-slate-455 dark:text-slate-500 uppercase tracking-widest my-auto"
              >
                Professional Skills
              </span>
              <span className="lg:hidden text-xs font-bold text-slate-455 uppercase tracking-wider">
                Skills & Preferences
              </span>
              <Code className="w-4 h-4 text-slate-450 dark:text-slate-500" />
            </div>
          )}

        </div>
      </div>

    </div>
  );
}
