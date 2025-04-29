'use client';

import { useState } from 'react';
import { Input } from '@/src/app/components/ui/input';
import { Button } from '@/src/app/components/ui/button';
import { useToast } from '@/src/hooks/use-toast';
import { motion } from 'framer-motion';
import { Send } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

type ChatComponentProps = {
  summary: string;
  transcript: string;
};

export function ChatComponent({ summary, transcript }: ChatComponentProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const { toast } = useToast();

  const handleChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !summary) return;

    setIsChatLoading(true);
    const userMessage = { role: 'user' as const, content: newMessage };
    setMessages(prev => [...prev, userMessage]);
    setNewMessage('');

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: newMessage,
          transcript,
          summary,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get chat response');
      }

      const data = await response.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Error',
        description: 'Failed to get chat response',
        variant: 'destructive',
      });
    } finally {
      setIsChatLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-gray-800 rounded-lg p-4"
    >
      <div className="max-h-96 overflow-y-auto mb-4">
        {messages.map((msg, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={`mb-4 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}
          >
            <div
              className={`inline-block p-3 rounded-lg ${
                msg.role === 'user' ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-200'
              }`}
            >
              {msg.role === 'assistant' ? (
                <ReactMarkdown className="prose prose-invert max-w-none">
                  {msg.content}
                </ReactMarkdown>
              ) : (
                msg.content
              )}
            </div>
          </motion.div>
        ))}
      </div>

      <form onSubmit={handleChat} className="flex gap-2">
        <Input
          type="text"
          placeholder="Ask a question about the video..."
          value={newMessage}
          onChange={e => setNewMessage(e.target.value)}
          disabled={isChatLoading}
          className="bg-gray-700 text-white border-gray-600 focus:border-purple-500"
        />
        <Button
          type="submit"
          disabled={isChatLoading}
          className="bg-purple-600 hover:bg-purple-700 text-white"
        >
          <Send className="h-4 w-4 mr-2" />
          Send
        </Button>
      </form>
    </motion.div>
  );
}
