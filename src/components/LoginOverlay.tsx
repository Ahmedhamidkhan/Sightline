"use client"

import { useState } from "react"
import { createClient } from "@/utils/supabase/client"
import { motion } from "framer-motion"
import { Mail, Sparkles, Loader2 } from "lucide-react"

export default function LoginOverlay() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage("")
    
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setMessage(error.message)
    } else {
      setMessage("Check your email for the magic link!")
    }
    setLoading(false)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[128px] opacity-50" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[128px] opacity-50" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md space-y-8 glass p-8 sm:p-12 rounded-3xl relative z-10 border border-border"
      >
        <div className="text-center space-y-3">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6"
          >
            <Sparkles className="w-8 h-8 text-primary" />
          </motion.div>
          <h1 className="text-4xl font-black tracking-tighter uppercase text-foreground">Sightline.</h1>
          <p className="text-sm text-muted-foreground">Sign in to access the vision portal.</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4 mt-8">
          <div className="space-y-2">
            <div className="relative">
              <Mail className="absolute left-4 top-3.5 h-5 w-5 text-muted-foreground" />
              <input
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-xl border border-border bg-card/50 py-3 pl-12 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-primary py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send Magic Link"}
          </button>

          <div className="relative flex items-center py-2">
            <div className="flex-grow border-t border-border"></div>
            <span className="flex-shrink-0 mx-4 text-xs text-muted-foreground uppercase tracking-widest">or</span>
            <div className="flex-grow border-t border-border"></div>
          </div>

          <button
            type="button"
            onClick={async () => {
              await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                  redirectTo: `${window.location.origin}/auth/callback`,
                },
              })
            }}
            className="w-full rounded-xl bg-secondary py-3 text-sm font-medium text-foreground hover:bg-secondary/80 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background transition-all flex items-center justify-center gap-2"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>
          {message && (
            <motion.p 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`text-center text-sm ${message.includes("Check") ? "text-green-500" : "text-destructive"}`}
            >
              {message}
            </motion.p>
          )}
        </form>
      </motion.div>
    </div>
  )
}
