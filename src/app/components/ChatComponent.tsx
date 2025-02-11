import { useState } from 'react'
import { Input } from '@/src/app/components/ui/input'
import { Button } from '@/src/app/components/ui/button'
import { useToast } from '@/src/hooks/use-toast'

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

type ChatComponentProps = {
  summary: string;
  transcript: string;
};

export function ChatComponent({ summary, transcript }: ChatComponentProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isChatLoading, setIsChatLoading] = useState(false)
  const { toast } = useToast()

  const handleChat = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !summary) return

    setIsChatLoading(true)
    const userMessage = { role: 'user' as const, content: newMessage }
    setMessages(prev => [...prev, userMessage])
    setNewMessage('')

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: newMessage,
          transcript,
          summary
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to get chat response')
      }

      const data = await response.json()
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }])
    } catch (error) {
      console.error('Error:', error)
      toast({
        title: 'Error',
        description: 'Failed to get chat response',
        variant: 'destructive',
      })
    } finally {
      setIsChatLoading(false)
    }
  }

  return (
    <div>
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 max-h-96 overflow-y-auto">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`mb-4 ${
              msg.role === 'user' ? 'text-right' : 'text-left'
            }`}
          >
            <div
              className={`inline-block p-3 rounded-lg ${
                msg.role === 'user'
                  ? 'bg-blue-500 dark:bg-blue-700 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={handleChat} className="mt-4 flex gap-2">
        <Input
          type="text"
          placeholder="Ask a question about the video..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          disabled={isChatLoading}
          className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700"
        />
        <Button
          type="submit"
          disabled={isChatLoading}
          className="bg-blue-500 dark:bg-blue-700 text-white"
        >
          Send
        </Button>
      </form>
    </div>
  )
}