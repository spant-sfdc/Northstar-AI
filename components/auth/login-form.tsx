"use client"

import { useState } from "react"
import Link from "next/link"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

const schema = z.object({
  email:    z.string().email("Enter a valid email"),
  password: z.string().min(1, "Enter your password"),
})

type FormData = z.infer<typeof schema>

const AUTH_ERRORS: Record<string, string> = {
  link_expired:         "This link has expired or already been used. Please sign in again.",
  auth_callback_failed: "Authentication failed. Please try again.",
}

interface LoginFormProps {
  authError?: string
}

export function LoginForm({ authError }: LoginFormProps) {
  const supabase = createClient()
  const [googleLoading, setGoogleLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  async function onSubmit(values: FormData) {
    const { error } = await supabase.auth.signInWithPassword({
      email:    values.email,
      password: values.password,
    })

    if (error) {
      toast.error("Invalid email or password")
      return
    }

    window.location.href = `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/onboarding`
  }

  async function signInWithGoogle() {
    setGoogleLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin}/auth/callback` },
    })
    if (error) {
      toast.error(error.message)
      setGoogleLoading(false)
    }
  }

  return (
    <div className="w-full max-w-sm">
      {authError && (
        <div className="mb-5 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 text-[13px] text-amber-800">
          {AUTH_ERRORS[authError] ?? "Something went wrong. Please try again."}
        </div>
      )}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-1.5">Welcome back</h1>
        <p className="text-[14px] text-slate-500">Sign in to continue your readiness journey.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-[13px] font-medium text-slate-700">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="sarah@company.com"
            autoComplete="email"
            autoFocus
            {...register("email")}
            className={cn(errors.email && "border-red-300 focus-visible:ring-red-200")}
          />
          {errors.email && (
            <p className="text-[12px] text-red-500">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-[13px] font-medium text-slate-700">Password</Label>
            <Link href="/forgot-password" className="text-[12px] text-indigo-600 hover:underline">
              Forgot password?
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            {...register("password")}
            className={cn(errors.password && "border-red-300 focus-visible:ring-red-200")}
          />
          {errors.password && (
            <p className="text-[12px] text-red-500">{errors.password.message}</p>
          )}
        </div>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-10 bg-indigo-600 hover:bg-indigo-700 text-white font-medium"
        >
          {isSubmitting ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing in…</>
          ) : (
            "Sign in"
          )}
        </Button>
      </form>

      <div className="my-5 flex items-center gap-3">
        <div className="flex-1 h-px bg-slate-200" />
        <span className="text-[12px] text-slate-400 font-medium">or</span>
        <div className="flex-1 h-px bg-slate-200" />
      </div>

      <Button
        variant="outline"
        className="w-full h-10 border-slate-200 text-slate-700 font-medium text-[13.5px]"
        onClick={signInWithGoogle}
        disabled={googleLoading}
      >
        {googleLoading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
        )}
        Continue with Google
      </Button>

      <p className="mt-6 text-center text-[13px] text-slate-500">
        New to SkillSynq?{" "}
        <Link href="/signup" className="text-indigo-600 font-medium hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  )
}
