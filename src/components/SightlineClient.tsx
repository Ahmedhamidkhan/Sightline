"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Upload, Send, History, Menu, X, LogIn, Loader2, Link as LinkIcon, PanelLeftClose, PanelLeftOpen, Trash2, Plus } from "lucide-react"
import { createClient } from "@/utils/supabase/client"
import { ThemeToggle } from "./ThemeToggle"
import { User } from "@supabase/supabase-js"
import ReactMarkdown from "react-markdown"

interface Query {
  id: string;
  image_url: string;
  question: string;
  answer: string;
  created_at: string;
}

interface GroupedQuery extends Query {
  all_queries: Query[];
}

export default function SightlineClient({ user }: { user: User }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true) // Open by default on desktop
  const [history, setHistory] = useState<Query[]>([])
  
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [imageUrl, setImageUrl] = useState("")
  const [question, setQuestion] = useState("")
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [currentAnswers, setCurrentAnswers] = useState<Query[]>([])

  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchHistory()
    
    // Auto-close sidebar on mobile initially
    if (window.innerWidth < 640) {
      setIsSidebarOpen(false)
    }
  }, [])

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [currentAnswers])

  const fetchHistory = async () => {
    const { data, error } = await supabase
      .from('queries')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (data) setHistory(data)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.reload()
  }

  const handleDeleteHistoryItem = async (e: React.MouseEvent, imageUrl: string) => {
    e.stopPropagation();
    
    // Optimistic update
    setHistory(prev => prev.filter(q => q.image_url !== imageUrl));
    
    if (previewUrl === imageUrl || currentAnswers.some(ans => ans.image_url === imageUrl)) {
      setCurrentAnswers([]);
      setPreviewUrl(null);
      setFile(null);
      setImageUrl("");
    }

    const { error } = await supabase
      .from('queries')
      .delete()
      .eq('image_url', imageUrl);
      
    if (error) {
      console.error("Failed to delete history item:", error);
      fetchHistory(); // Revert on failure
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      if (selectedFile.size > 5 * 1024 * 1024) {
        setError("File size must be under 5MB")
        return
      }
      setFile(selectedFile)
      setPreviewUrl(URL.createObjectURL(selectedFile))
      setImageUrl("")
      setError("")
      setCurrentAnswers([]) 
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const droppedFile = e.dataTransfer.files?.[0]
    if (droppedFile && droppedFile.type.startsWith('image/')) {
      if (droppedFile.size > 5 * 1024 * 1024) {
        setError("File size must be under 5MB")
        return
      }
      setFile(droppedFile)
      setPreviewUrl(URL.createObjectURL(droppedFile))
      setImageUrl("")
      setError("")
      setCurrentAnswers([])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!question.trim()) {
      setError("Please ask a question.")
      return
    }
    if (!file && !imageUrl && currentAnswers.length === 0) {
      setError("Please upload an image or provide a URL.")
      return
    }

    setLoading(true)
    setError("")

    const formData = new FormData()
    formData.append("question", question)
    
    if (currentAnswers.length > 0) {
      formData.append("imageUrl", currentAnswers[0].image_url)
    } else {
      if (file) formData.append("image", file)
      if (imageUrl) formData.append("imageUrl", imageUrl)
    }

    try {
      const res = await fetch("/api/vision", {
        method: "POST",
        body: formData,
      })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Failed to analyze image")
      }

      setCurrentAnswers(prev => [...prev, data.query])
      setHistory(prev => [data.query, ...prev])
      setQuestion("")

    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Group history by image_url so follow-ups are combined
  const groupedHistory = Object.values(history.reduce((acc, curr) => {
    if (!acc[curr.image_url]) {
      acc[curr.image_url] = {
        ...curr,
        all_queries: [curr]
      }
    } else {
      acc[curr.image_url].all_queries.push(curr)
    }
    return acc
  }, {} as Record<string, GroupedQuery>))

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 sm:hidden" 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar for History */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 transform transition-all duration-300 ease-in-out border-r border-border bg-card shadow-2xl glass flex flex-col 
        ${isSidebarOpen ? 'translate-x-0 w-80 sm:relative' : '-translate-x-full w-80 sm:w-0 sm:absolute sm:opacity-0 sm:overflow-hidden'}`}
      >
        <div className="flex items-center justify-between p-6 border-b border-border min-w-[320px]">
          <h2 className="text-lg font-semibold tracking-tight text-foreground flex items-center gap-2">
            <History className="w-5 h-5 text-muted-foreground" />
            History
          </h2>
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-secondary"
            title="Collapse Sidebar"
          >
            <PanelLeftClose className="w-5 h-5" />
          </button>
        </div>
        
        {/* NEW CHAT BUTTON */}
        <div className="p-4 pb-0 min-w-[320px]">
          <button 
            onClick={() => {
              setCurrentAnswers([])
              setPreviewUrl(null)
              setFile(null)
              setImageUrl("")
              if(window.innerWidth < 640) setIsSidebarOpen(false)
            }}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground px-4 py-3 text-sm font-semibold hover:scale-[1.02] active:scale-[0.98] transition-transform shadow-md"
          >
            <Plus className="w-5 h-5" />
            New Chat
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 min-w-[320px]">
          {groupedHistory.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground mt-10">
              No previous queries.
            </div>
          ) : (
            groupedHistory.map((item) => (
              <div 
                key={item.id} 
                className="p-3 rounded-xl bg-secondary/30 border border-border/50 hover:bg-secondary/80 transition-all duration-300 hover:translate-x-1 hover:shadow-md cursor-pointer group" 
                onClick={() => {
                  // Reverse to show oldest first in chat view
                  setCurrentAnswers([...item.all_queries].reverse())
                  setPreviewUrl(item.image_url)
                  setFile(null)
                  setImageUrl(item.image_url)
                  if(window.innerWidth < 640) setIsSidebarOpen(false)
                }}
              >
                <div className="flex items-start gap-3 relative">
                  <img src={item.image_url} alt="History thumb" className="w-12 h-12 rounded-lg object-cover bg-background shrink-0" />
                  <div className="flex-1 min-w-0 pr-6">
                    <p className="text-sm font-medium text-foreground truncate">{item.all_queries[item.all_queries.length - 1].question}</p>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-xs text-muted-foreground truncate">{item.all_queries.length} interaction{item.all_queries.length > 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  <button 
                    onClick={(e) => handleDeleteHistoryItem(e, item.image_url)}
                    className="absolute top-1/2 -translate-y-1/2 right-1 text-muted-foreground hover:text-destructive p-2 rounded-md hover:bg-destructive/10 transition-colors opacity-0 group-hover:opacity-100"
                    title="Delete history"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="p-6 border-t border-border space-y-4 min-w-[320px]">
          <div className="text-xs text-muted-foreground truncate">
            Signed in as <br/><span className="font-medium text-foreground">{user.email}</span>
          </div>
          <button 
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-secondary px-4 py-3 text-sm font-medium text-secondary-foreground hover:bg-secondary/80 transition-colors"
          >
            <LogIn className="w-4 h-4 rotate-180" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full relative z-0 transition-all duration-300">
        <header className="flex-shrink-0 flex items-center justify-between p-4 sm:p-6 bg-background/80 backdrop-blur-md border-b border-border z-10">
          <div className="flex items-center gap-3">
            {!isSidebarOpen && (
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-secondary"
                title="Expand Sidebar"
              >
                <PanelLeftOpen className="w-5 h-5" />
              </button>
            )}
            <h1 className="text-xl font-bold tracking-tighter uppercase sm:hidden">Sightline</h1>
          </div>
          <div className="flex items-center">
            <ThemeToggle />
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 sm:p-8 pb-40 sm:pb-40">
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="text-center space-y-2">
              <h1 className="text-4xl sm:text-5xl font-black tracking-tighter uppercase hidden sm:block mb-8">Sightline.</h1>
            </div>

            {/* Current Answers Flow */}
            {(currentAnswers.length > 0 || previewUrl) && (
              <div className="space-y-6">
                <div className="w-full h-64 sm:h-96 rounded-2xl overflow-hidden bg-muted border border-border shadow-sm relative group">
                  <img src={previewUrl || (currentAnswers.length > 0 ? currentAnswers[0].image_url : '')} alt="Analyzed" className="w-full h-full object-contain" />
                </div>
                
                {currentAnswers.map((ans, idx) => (
                  <motion.div 
                    key={ans.id || idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full bg-secondary/20 border border-border rounded-2xl overflow-hidden shadow-sm p-6 sm:p-8 space-y-4 hover:-translate-y-1 hover:shadow-xl hover:border-primary/30 transition-all duration-300"
                  >
                    <div className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-2">
                      Q: {ans.question}
                    </div>
                    <div className="text-foreground leading-relaxed text-sm sm:text-base">
                      <ReactMarkdown
                        components={{
                          p: ({node, ...props}) => <p className="mb-4 last:mb-0" {...props} />,
                          ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-4 space-y-1" {...props} />,
                          ol: ({node, ...props}) => <ol className="list-decimal pl-5 mb-4 space-y-1" {...props} />,
                          li: ({node, ...props}) => <li className="" {...props} />,
                          strong: ({node, ...props}) => <strong className="font-semibold text-foreground" {...props} />
                        }}
                      >
                        {ans.answer}
                      </ReactMarkdown>
                    </div>
                  </motion.div>
                ))}
                <div ref={messagesEndRef} className="h-4" />
              </div>
            )}

            {/* Upload Zone (Only show if no image is currently active) */}
            {!previewUrl && currentAnswers.length === 0 && (
              <div 
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                className={`group relative rounded-2xl border-2 border-dashed border-muted bg-secondary/30 hover:border-primary/50 hover:bg-secondary/50 p-2 text-center transition-all duration-300 cursor-pointer overflow-hidden min-h-[300px] flex items-center justify-center hover:scale-[1.01] hover:shadow-lg`}
              >
                <input 
                  ref={fileInputRef}
                  type="file" 
                  className="absolute inset-0 z-10 h-full w-full opacity-0 cursor-pointer" 
                  accept="image/*" 
                  onChange={handleFileChange}
                />
                <div className="flex flex-col items-center justify-center space-y-4 p-12">
                  <div className="rounded-full bg-background p-4 shadow-sm group-hover:scale-105 transition-transform duration-300">
                    <Upload className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground">Click to upload or drag and drop</p>
                    <p className="text-xs text-muted-foreground">PNG, JPG, or WEBP (max. 5MB)</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Persistent Input Form at Bottom (Floating Pill) */}
        <div className="absolute bottom-6 left-0 right-0 z-20 px-4 pointer-events-none">
          <form onSubmit={handleSubmit} className="max-w-4xl mx-auto pointer-events-auto">
            {error && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-4 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm text-center shadow-lg">
                {error}
              </motion.div>
            )}

            <div className="relative rounded-2xl glass shadow-2xl flex flex-col sm:flex-row items-stretch sm:items-center focus-within:ring-2 focus-within:ring-primary/20 transition-all p-2">
              {/* Only show URL input if no image is currently active */}
              {!previewUrl && currentAnswers.length === 0 && (
                <div className="flex items-center flex-1 border-b sm:border-b-0 sm:border-r border-border pb-1 sm:pb-0 px-2">
                  <div className="flex-shrink-0 text-muted-foreground">
                    <LinkIcon className="w-5 h-5" />
                  </div>
                  <input 
                    type="text" 
                    value={imageUrl}
                    onChange={(e) => { setImageUrl(e.target.value); setPreviewUrl(null); setFile(null); if(fileInputRef.current) fileInputRef.current.value = "" }}
                    placeholder="Paste an image URL..." 
                    className="flex-1 bg-transparent px-3 py-3 sm:py-4 text-sm outline-none placeholder:text-muted-foreground"
                    disabled={!!file}
                  />
                </div>
              )}
              
              <div className="flex items-center flex-1 px-2 pt-1 sm:pt-0">
                <input 
                  type="text" 
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Ask a question about the image..." 
                  className="flex-1 bg-transparent px-3 py-3 sm:py-4 text-sm outline-none placeholder:text-foreground placeholder:font-medium"
                />
                <button 
                  type="submit"
                  disabled={loading}
                  className="flex items-center justify-center rounded-lg bg-primary text-primary-foreground p-3 transition-transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 ml-2"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </form>
        </div>

      </main>

    </div>
  )
}
