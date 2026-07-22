"use client";

import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { UploadCloud, Loader2, CheckCircle2, FileText } from "lucide-react";
import { toast } from "sonner";
import { uploadResume } from "@/lib/api";
import { useSession } from "@/store/SessionContext";

export interface ResumeUploaderProps {
  /** Called after a successful upload with the server message */
  onSuccess?: (message: string) => void;
}

export function ResumeUploader({ onSuccess }: ResumeUploaderProps) {
  const { setUploadedFile, setResumeScore } = useSession();
  const [uploading,  setUploading]  = useState(false);
  const [uploaded,   setUploaded]   = useState(false);
  const [uploadedName, setUploadedName] = useState<string | null>(null);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      setUploading(true);
      setUploaded(false);

      const toastId = toast.loading("Orchestrating Agent 2: Parsing resume structures...");

      try {
        const res = await uploadResume(file);

        // Update session context so the rest of the app knows a resume exists
        setUploadedFile({
          name: file.name,
          size: (file.size / 1024).toFixed(1) + " KB",
        });
        setResumeScore(84);
        setUploaded(true);
        setUploadedName(file.name);

        toast.success(`Resume "${file.name}" processed successfully! ✅`, {
          id: toastId,
          description: res.message,
        });

        onSuccess?.(res.message);
      } catch (err: any) {
        toast.error("Upload failed.", {
          id: toastId,
          description: err.message || "Check your connection and try again.",
        });
      } finally {
        setUploading(false);
      }
    },
    [setUploadedFile, setResumeScore, onSuccess]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [] },
    multiple: false,
    disabled: uploading,
  });

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all duration-300 flex flex-col items-center justify-center gap-4 ${
        uploading
          ? "opacity-70 cursor-not-allowed border-slate-700/40"
          : isDragActive
          ? "border-[var(--accent)] bg-slate-800/20"
          : uploaded
          ? "border-emerald-500/50 bg-emerald-500/5"
          : "border-slate-800/40 hover:border-[var(--accent)]/60 neu-pressed"
      }`}
    >
      <input {...getInputProps()} />

      {uploading ? (
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="w-8 h-8 text-[var(--accent)] animate-spin" />
          <p className="text-xs font-semibold text-slate-400 mt-1">
            Parsing resume & generating embedding...
          </p>
        </div>
      ) : uploaded ? (
        <div className="flex flex-col items-center gap-3">
          <div className="p-3 rounded-full bg-emerald-500/10">
            <CheckCircle2 className="w-6 h-6 text-emerald-400" />
          </div>
          <div className="flex flex-col gap-0.5">
            <p className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              {uploadedName}
            </p>
            <p className="text-[10px] text-slate-500 font-semibold">
              Resume processed — drop another to replace
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3">
          <div className="p-3 rounded-full border-none neu-circle bg-[#172033]/40">
            <UploadCloud className="w-6 h-6 text-slate-400" />
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-xs font-bold text-slate-200">
              {isDragActive ? "Drop your file here" : "Drop your Resume PDF here"}
            </p>
            <p className="text-[10px] text-slate-500 font-semibold">
              Only PDF documents are supported
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
