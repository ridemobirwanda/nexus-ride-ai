import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, ArrowLeft, Phone, Loader2 } from 'lucide-react';
import ChatMessage from './ChatMessage';
import { useChat } from '@/hooks/useChat';

interface ChatInterfaceProps {
  rideId: string;
  userType: 'passenger' | 'driver';
  userId: string;
  otherPartyName: string;
  otherPartyPhone?: string;
  otherPartyPhoto?: string;
  onBack: () => void;
}

const ChatInterface = ({
  rideId,
  userType,
  userId,
  otherPartyName,
  otherPartyPhone,
  otherPartyPhoto,
  onBack
}: ChatInterfaceProps) => {
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const { messages, isLoading, isSending, sendMessage } = useChat({
    rideId,
    userType,
    userId
  });

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim()) return;
    
    const success = await sendMessage(newMessage);
    if (success) {
      setNewMessage('');
      inputRef.current?.focus();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCall = () => {
    if (otherPartyPhone) {
      window.location.href = `tel:${otherPartyPhone}`;
    }
  };

  const quickReplies = userType === 'driver' 
    ? [
        "I'm on my way",
        "I'm here",
        "Arriving in 5 min",
        "Stuck in traffic"
      ]
    : [
        "I'm waiting outside",
        "I'll be right there",
        "Can you wait?",
        "At pickup location"
      ];

  const handleQuickReply = async (message: string) => {
    const success = await sendMessage(message);
    if (success) {
      inputRef.current?.focus();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-card border-b px-4 py-3 sticky top-0 z-10">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <Avatar className="h-10 w-10">
              <AvatarImage src={otherPartyPhoto} />
              <AvatarFallback className="bg-primary/10 text-primary">
                {otherPartyName?.charAt(0)?.toUpperCase() || '?'}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="font-semibold">{otherPartyName || 'Chat'}</h1>
              <p className="text-xs text-muted-foreground">Active ride</p>
            </div>
          </div>
          {otherPartyPhone && (
            <Button variant="outline" size="icon" onClick={handleCall}>
              <Phone className="h-4 w-4" />
            </Button>
          )}
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-2xl mx-auto space-y-3">
          {messages.length === 0 ? (
            <div className="text-center text-muted-foreground py-12">
              <p className="text-sm">No messages yet</p>
              <p className="text-xs mt-1">Send a message to start the conversation</p>
            </div>
          ) : (
            messages.map((msg) => (
              <ChatMessage
                key={msg.id}
                message={msg.message}
                timestamp={msg.created_at}
                isOwn={msg.sender_type === userType}
                senderName={msg.sender_type !== userType ? otherPartyName : undefined}
              />
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Quick Replies */}
      <div className="border-t bg-card/50 px-4 py-2">
        <div className="max-w-2xl mx-auto flex gap-2 overflow-x-auto pb-1">
          {quickReplies.map((reply) => (
            <Button
              key={reply}
              variant="outline"
              size="sm"
              onClick={() => handleQuickReply(reply)}
              disabled={isSending}
              className="whitespace-nowrap text-xs flex-shrink-0"
            >
              {reply}
            </Button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="border-t bg-card p-4">
        <div className="max-w-2xl mx-auto flex gap-2">
          <Input
            ref={inputRef}
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1"
            disabled={isSending}
          />
          <Button 
            onClick={handleSend} 
            disabled={!newMessage.trim() || isSending}
            size="icon"
          >
            {isSending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
