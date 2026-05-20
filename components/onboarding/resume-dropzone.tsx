"use client"

import { useCallback, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Upload, FileText, X, CheckCircle } from "lucide-react"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

const ACCEPTED = ["application/pdf", "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]
const MAX_MB = 5

interface ResumeDropzoneProps {
  userId: string
  value?: { storagePath: string; fileName: string }
  onChange: (value: { storagePath: string; fileName: string } | null) => void
}

export function ResumeDropzone({ userId, value, onChange }: ResumeDropzoneProps) {
  const [dragging, setDragging]   = useState(false)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress]   = useState(0)

  async function upload(file: File) {
    if (!ACCEPTED.includes(file.type)) {
      toast.error("Upload a PDF or Word document")
      return
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      toast.error(`File must be under ${MAX_MB}MB`)
      return
    }

    setUploading(true)
    setProgress(10)

    const supabase = createClient()
    const ext  = file.name.split(".").pop()
    const path = `${userId}/${crypto.randomUUID()}.${ext}`

    // Simulate progress while uploading
    const ticker = setInterval(() => setProgress((p) => Math.min(p + 10, 85)), 300)

    const { error } = await supabase.storage
      .from("resumes")
      .upload(path, file, { upsert: true, contentType: file.type })

    clearInterval(ticker)

    if (error) {
      toast.error("Upload failed — please try again")
      setUploading(false)
      setProgress(0)
      return
    }

    setProgress(100)
    setTimeout(() => {
      setUploading(false)
      setProgress(0)
      onChange({ storagePath: path, fileName: file.name })
    }, 400)
  }

  const onDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) upload(file)
  }, [userId])

  const onFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) upload(file)
    e.target.value = ""
  }

  if (value) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex items-center gap-4 p-4 rounded-xl border-2 border-emerald-200 bg-emerald-50"
      >
        <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
          <CheckCircle className="w-5 h-5 text-emerald-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13.5px] font-semibold text-emerald-800 truncate">{value.fileName}</p>
          <p className="text-[12px] text-emerald-600">Resume uploaded successfully</p>
        </div>
        <button
          type="button"
          onClick={() => onChange(null)}
          className="p-1 text-emerald-500 hover:text-emerald-700 transition-colors"
          aria-label="Remove resume"
        >
          <X className="w-4 h-4" />
        </button>
      </motion.div>
    )
  }

  return (
    <label
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      className={cn(
        "flex flex-col items-center justify-center gap-3 p-8 rounded-xl border-2 border-dashed cursor-pointer transition-all",
        dragging
          ? "border-indigo-400 bg-indigo-50"
          : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/60"
      )}
    >
      <input type="file" accept=".pdf,.doc,.docx" className="sr-only" onChange={onFileInput} />

      <AnimatePresence mode="wait">
        {uploading ? (
          <motion.div
            key="uploading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-3 w-full"
          >
            <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
              <motion.div
                className="w-5 h-5 border-2 border-indigo-300 border-t-indigo-600 rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
              />
            </div>
            <p className="text-[13px] text-slate-500">Uploading… {progress}%</p>
            <div className="w-full max-w-[200px] h-1 bg-slate-100 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-indigo-500 rounded-full"
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-3 text-center"
          >
            <div className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center transition-colors",
              dragging ? "bg-indigo-100" : "bg-slate-100"
            )}>
              <Upload className={cn("w-6 h-6 transition-colors", dragging ? "text-indigo-600" : "text-slate-500")} />
            </div>
            <div>
              <p className="text-[14px] font-semibold text-slate-700">
                {dragging ? "Drop it here" : "Drag your resume here"}
              </p>
              <p className="text-[12.5px] text-slate-400 mt-0.5">
                or <span className="text-indigo-600 font-medium underline">browse files</span>
              </p>
            </div>
            <div className="flex items-center gap-2">
              {["PDF", "DOC", "DOCX"].map((ext) => (
                <span key={ext} className="text-[10.5px] font-semibold text-slate-400 bg-slate-100 rounded px-2 py-0.5">
                  {ext}
                </span>
              ))}
              <span className="text-[10.5px] text-slate-400">· max {MAX_MB}MB</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </label>
  )
}
