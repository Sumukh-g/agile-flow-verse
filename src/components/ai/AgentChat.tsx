import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { api } from '@/lib/api';
import { toast } from 'sonner';

type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };

export function AgentChat({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [provider, setProvider] = useState<'openai' | 'google' | 'gemini' | 'perplexity'>('openai');
  const [model, setModel] = useState<string>('gpt-4o-mini');
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'system', content: 'You are a helpful assistant for project and workflow automation.' },
  ]);
  const [sending, setSending] = useState(false);
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, open]);

  // Update default model when provider changes
  useEffect(() => {
    if (provider === 'openai') setModel('gpt-4o-mini');
    if (provider === 'google' || provider === 'gemini') setModel('gemini-1.5-flash');
    if (provider === 'perplexity') setModel('llama-3.1-sonar-large-128k-online');
  }, [provider]);

  const send = async () => {
    const content = input.trim();
    if (!content) return;
    setInput('');
    const nextMessages = [...messages, { role: 'user', content } as ChatMessage];
    setMessages(nextMessages);
    setSending(true);
    try {
      const resp = await api.agents.ai.chat({ provider, model, messages: nextMessages });
      setMessages([...nextMessages, { role: 'assistant', content: resp.content }]);
    } catch (e: any) {
      const status = e?.response?.status || e?.status;
      if (status === 403 || status === 402) {
        toast.error('AI chat is available for Premium plans. Please upgrade to access.');
      } else {
        toast.error(e?.apiError?.message || 'Chat failed');
      }
    } finally {
      setSending(false);
    }
  };

  const startNew = () => {
    setMessages([{ role: 'system', content: 'You are a helpful assistant for project and workflow automation.' }]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>AI Agent Chat</DialogTitle>
          <DialogDescription>Ask questions, generate tasks, analyze workflows, and more.</DialogDescription>
        </DialogHeader>
        <div className="flex items-center gap-2">
          <Select value={provider} onValueChange={(v) => setProvider(v as any)}>
            <SelectTrigger className="w-56">
              <SelectValue placeholder="Provider" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="openai">ChatGPT</SelectItem>
              <SelectItem value="google">Gemini</SelectItem>
              <SelectItem value="perplexity">Perplexity</SelectItem>
            </SelectContent>
          </Select>
          <Input
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder="Model (auto-filled)"
            className="flex-1"
          />
          <Button variant="outline" onClick={startNew}>New</Button>
        </div>
        <div ref={listRef} className="h-72 overflow-auto rounded-md border p-3 space-y-3 bg-background">
          {messages.filter(m => m.role !== 'system').map((m, idx) => (
            <div key={idx} className={`p-2 rounded ${m.role === 'assistant' ? 'bg-muted' : 'bg-primary/10'}`}>
              <div className="text-xs text-muted-foreground mb-1">{m.role === 'assistant' ? 'Assistant' : 'You'}</div>
              <div className="whitespace-pre-wrap text-sm">{m.content}</div>
            </div>
          ))}
          {messages.filter(m => m.role !== 'system').length === 0 && (
            <div className="text-muted-foreground text-sm">Start by asking: “Generate tasks from this goal...” or “Analyze my workflow...”</div>
          )}
        </div>
        <div className="space-y-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message and press Send"
            onKeyDown={(e) => {
              if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') send();
            }}
          />
          <div className="flex justify-end">
            <Button onClick={send} disabled={sending}>{sending ? 'Sending...' : 'Send'}</Button>
          </div>
        </div>
        <div className="text-xs text-muted-foreground">
          Note: AI chat is available for Premium plans. Your organization’s plan controls access.
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default AgentChat;


