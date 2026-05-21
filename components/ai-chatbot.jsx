'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { apiClient } from '@/lib/api/client'
import { Bot, X, Send, Loader2, Sparkles, MessageCircle, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { v4 as uuidv4 } from 'uuid'

const SUGGESTIONS = [
  'Berapa total siswa aktif?',
  'Siapa wali kelas 7A?',
  'Berapa tunggakan SPP bulan ini?',
  'Daftar guru matematika',
]

export function AIChatbot() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [sessionId] = useState(() => uuidv4())
  const scrollRef = useRef(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, loading])

  const send = async (text) => {
    const userMsg = (text ?? input).trim()
    if (!userMsg || loading) return
    setInput('')
    const newMessages = [...messages, { role: 'user', content: userMsg }]
    setMessages(newMessages)
    setLoading(true)
    try {
      const res = await apiClient.post('/chat', { message: userMsg, sessionId, history: newMessages })
      setMessages([...newMessages, { role: 'assistant', content: res.data.reply }])
    } catch (e) {
      setMessages([...newMessages, { role: 'assistant', content: 'Maaf, terjadi kesalahan. Coba lagi.' }])
    } finally {
      setLoading(false)
    }
  }

  const clear = () => setMessages([])

  return (
    <>
      {/* Floating Button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 group h-14 w-14 rounded-full bg-gradient-to-br from-indigo-600 via-blue-600 to-cyan-500 text-white shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-200 flex items-center justify-center"
          aria-label="Open AI Chat"
        >
          <Bot className="h-6 w-6" />
          <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-emerald-400 ring-2 ring-background animate-pulse" />
          <span className="absolute right-full mr-3 whitespace-nowrap rounded-md bg-foreground text-background px-2 py-1 text-xs opacity-0 group-hover:opacity-100 transition-opacity">Tanya AI</span>
        </button>
      )}

      {/* Chat Panel */}
      {open && (
        <Card className="fixed bottom-6 right-6 z-50 w-[calc(100vw-3rem)] sm:w-[400px] h-[600px] max-h-[80vh] shadow-2xl flex flex-col overflow-hidden">
          <div className="flex items-center gap-3 p-4 border-b bg-gradient-to-br from-indigo-600 via-blue-600 to-cyan-500 text-white">
            <div className="h-9 w-9 rounded-lg bg-white/20 flex items-center justify-center backdrop-blur"><Sparkles className="h-5 w-5" /></div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm">Asisten SekolahKu</h3>
              <p className="text-xs text-blue-100">AI siap bantu tanya data sekolah</p>
            </div>
            {messages.length > 0 && <Button variant="ghost" size="icon" className="h-8 w-8 text-white hover:bg-white/20" onClick={clear}><Trash2 className="h-4 w-4" /></Button>}
            <Button variant="ghost" size="icon" className="h-8 w-8 text-white hover:bg-white/20" onClick={() => setOpen(false)}><X className="h-4 w-4" /></Button>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <div className="text-center py-6 space-y-4">
                <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Bot className="h-7 w-7" /></div>
                <div>
                  <h4 className="font-semibold">Halo! 👋</h4>
                  <p className="text-sm text-muted-foreground mt-1 max-w-xs mx-auto">Tanyakan apa saja tentang data sekolah, siswa, guru, atau pembayaran SPP.</p>
                </div>
                <div className="space-y-2 text-left">
                  <p className="text-xs font-medium text-muted-foreground px-1">Contoh pertanyaan:</p>
                  {SUGGESTIONS.map((s, i) => (
                    <button key={i} onClick={() => send(s)} className="w-full text-left text-xs p-2.5 rounded-lg border bg-muted/30 hover:bg-muted/60 hover:border-primary transition-colors">
                      <MessageCircle className="h-3 w-3 inline mr-2 text-primary" /> {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={cn('flex gap-2', m.role === 'user' ? 'flex-row-reverse' : 'flex-row')}>
                <Avatar className="h-7 w-7 shrink-0">
                  <AvatarFallback className={cn('text-[10px]', m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-gradient-to-br from-indigo-600 to-cyan-500 text-white')}>
                    {m.role === 'user' ? 'U' : <Bot className="h-3.5 w-3.5" />}
                  </AvatarFallback>
                </Avatar>
                <div className={cn('rounded-2xl px-3.5 py-2 max-w-[80%] text-sm whitespace-pre-wrap break-words', m.role === 'user' ? 'bg-primary text-primary-foreground rounded-tr-sm' : 'bg-muted rounded-tl-sm')}>
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex gap-2">
                <Avatar className="h-7 w-7"><AvatarFallback className="bg-gradient-to-br from-indigo-600 to-cyan-500 text-white"><Bot className="h-3.5 w-3.5" /></AvatarFallback></Avatar>
                <div className="rounded-2xl rounded-tl-sm bg-muted px-3.5 py-3 text-sm">
                  <div className="flex gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
          </div>

          <form onSubmit={(e) => { e.preventDefault(); send() }} className="p-3 border-t flex gap-2">
            <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Tanya tentang data sekolah..." disabled={loading} className="text-sm" />
            <Button type="submit" size="icon" disabled={loading || !input.trim()}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </form>
        </Card>
      )}
    </>
  )
}
