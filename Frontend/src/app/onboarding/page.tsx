"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  User, GraduationCap, Code, Plus, X, Search,
  ArrowRight, ArrowLeft, Phone, MapPin, Award
} from "lucide-react";
import { toast } from "sonner";
import { useSession } from "@/store/SessionContext";

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
  const { profile, updateProfile } = useSession();
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
      
      {/* Background Blur shapes */}
      <div className="absolute top-[-10%] left-[-10%] w-[350px] h-[350px] rounded-full bg-sky-500/5 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[350px] h-[350px] rounded-full bg-purple-500/5 blur-[100px] pointer-events-none" />
      
      {/* Container */}
      <div className="w-full max-w-[620px] flex flex-col gap-6 relative z-10">
        
        {/* Step Indicator */}
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-400 to-indigo-500 flex items-center justify-center text-white font-bold neu-circle border-none">
              A
            </div>
            <span className="text-base font-bold text-slate-200">Profile Setup</span>
          </div>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-[#172033] px-3 py-1.5 rounded-full border border-slate-800 shadow-sm">
            Step {step} of 3
          </span>
        </div>

        {/* Wizard Form Wrapper - Neumorphic Card */}
        <div className="w-full neu-card p-8 md:p-10 rounded-3xl flex flex-col gap-6 text-left border-none">
          
          {/* STEP 1: Personal Info */}
          {step === 1 && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col gap-6"
            >
              <div>
                <h2 className="text-xl font-black text-slate-100 flex items-center gap-2 tracking-tight">
                  <User className="w-5.5 h-5.5 text-sky-400" />
                  Personal Information
                </h2>
                <p className="text-slate-400 text-xs mt-1 font-semibold">Let's start with your contact details and a profile avatar.</p>
              </div>

              {/* Avatar Selector */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Choose Profile Picture</label>
                <div className="flex items-center gap-4 mt-1">
                  <img 
                    src={profilePic} 
                    alt="Current Avatar" 
                    className="w-16 h-16 rounded-full object-cover border-2 border-sky-400/50 shadow-md shadow-black/30"
                  />
                  <div className="flex gap-2.5">
                    {availableAvatars.map((url, index) => (
                      <button
                        key={index}
                        onClick={() => setProfilePic(url)}
                        className={`w-10 h-10 rounded-full overflow-hidden border-2 cursor-pointer transition-all ${profilePic === url ? "border-sky-400 scale-105" : "border-transparent opacity-60 hover:opacity-100"}`}
                      >
                        <img src={url} alt="preset-avatar" className="w-full h-full object-cover" />
                      </button>
                    ))}
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
                    className="h-11 rounded-xl px-4 text-xs font-semibold text-slate-300 neu-input border-none"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email Address</label>
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-11 rounded-xl px-4 text-xs font-semibold text-slate-300 neu-input border-none"
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
                      className="w-full h-11 rounded-xl pl-10 pr-4 text-xs font-semibold text-slate-300 neu-input border-none"
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Education Level</label>
                  <select 
                    value={currentEducation}
                    onChange={(e) => setCurrentEducation(e.target.value)}
                    className="h-11 rounded-xl px-4 text-xs font-semibold text-slate-300 neu-input border-none cursor-pointer"
                  >
                    <option value="Final Year (B.Tech)">Final Year Student</option>
                    <option value="Third Year (B.Tech)">Pre-Final Year Student</option>
                    <option value="Fresh Graduate">Fresh Graduate</option>
                    <option value="Postgraduate (M.Tech)">Postgraduate Student</option>
                  </select>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 2: Academics */}
          {step === 2 && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col gap-6"
            >
              <div>
                <h2 className="text-xl font-black text-slate-100 flex items-center gap-2 tracking-tight">
                  <GraduationCap className="w-5.5 h-5.5 text-sky-400" />
                  Academic History
                </h2>
                <p className="text-slate-400 text-xs mt-1 font-semibold">Specify your university, engineering major, and scores.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5 md:col-span-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">College Name</label>
                  <input 
                    type="text" 
                    value={college}
                    onChange={(e) => setCollege(e.target.value)}
                    className="h-11 rounded-xl px-4 text-xs font-semibold text-slate-300 neu-input border-none"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Department / Major</label>
                  <input 
                    type="text" 
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="h-11 rounded-xl px-4 text-xs font-semibold text-slate-300 neu-input border-none"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Degree Type</label>
                  <input 
                    type="text" 
                    value={degree}
                    onChange={(e) => setDegree(e.target.value)}
                    className="h-11 rounded-xl px-4 text-xs font-semibold text-slate-300 neu-input border-none"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Graduation Year</label>
                  <input 
                    type="text" 
                    value={graduationYear}
                    onChange={(e) => setGraduationYear(e.target.value)}
                    className="h-11 rounded-xl px-4 text-xs font-semibold text-slate-300 neu-input border-none"
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
                      className="w-full h-11 rounded-xl pl-10 pr-4 text-xs font-semibold text-slate-300 neu-input border-none"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 3: Skills & Domain preferences */}
          {step === 3 && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col gap-6"
            >
              <div>
                <h2 className="text-xl font-black text-slate-100 flex items-center gap-2 tracking-tight">
                  <Code className="w-5.5 h-5.5 text-sky-400" />
                  Skills & Preferences
                </h2>
                <p className="text-slate-400 text-xs mt-1 font-semibold">Manage core competencies and job application parameters.</p>
              </div>

              {/* Skills Chips Controller */}
              <div className="flex flex-col gap-2.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Extracted Tech Competencies</label>
                
                {/* Active Skills Chips - Neumorphic Pressed Panel */}
                <div className="flex flex-wrap gap-2.5 p-4 rounded-2xl min-h-[60px] neu-pressed border-none">
                  {skills.length === 0 ? (
                    <span className="text-xs text-slate-500 font-semibold">No skills added yet...</span>
                  ) : (
                    skills.map((skill) => (
                      <span 
                        key={skill}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-400 px-3 py-1.5 rounded-xl border-none neu-button"
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

                  {/* Autocomplete Suggestions Box - Neumorphic Card */}
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
                            className="w-full text-left px-3 py-2 hover:bg-[#172033] hover:text-sky-400 font-bold rounded-lg flex items-center justify-between transition-colors"
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
                      className="w-full h-11 rounded-xl pl-10 pr-4 text-xs font-semibold text-slate-300 neu-input border-none"
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
                    className="h-11 rounded-xl px-4 text-xs font-semibold text-slate-300 neu-input border-none"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">LinkedIn URL</label>
                  <input 
                    type="url" 
                    value={linkedinUrl}
                    onChange={(e) => setLinkedinUrl(e.target.value)}
                    placeholder="https://linkedin.com/in/yourprofile"
                    className="h-11 rounded-xl px-4 text-xs font-semibold text-slate-300 neu-input border-none"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* Flow Controls */}
          <div className="flex items-center justify-between border-t border-slate-800/40 pt-6 mt-4">
            {step > 1 ? (
              <button
                type="button"
                onClick={handlePrev}
                className="px-5 py-2.5 rounded-xl text-xs font-bold neu-button transition-all flex items-center gap-2 cursor-pointer border-none"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
            ) : (
              <div />
            )}

            <button
              type="button"
              onClick={handleNext}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-400 hover:to-indigo-400 text-white font-bold flex items-center justify-center gap-2 shadow-md hover:-translate-y-0.5 transition-all cursor-pointer group border border-sky-400/20"
            >
              {step === 3 ? "Continue to Resume Upload" : "Next Step"}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

        </div>
      </div>

    </div>
  );
}
