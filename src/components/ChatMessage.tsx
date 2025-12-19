import { cn } from '@/lib/utils';

interface ChatMessageProps {
  message: string;
  timestamp: string;
  isOwn: boolean;
  senderName?: string;
}

const ChatMessage = ({ message, timestamp, isOwn, senderName }: ChatMessageProps) => {
  return (
    <div className={cn('flex', isOwn ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[75%] px-4 py-2 rounded-2xl',
          isOwn
            ? 'bg-primary text-primary-foreground rounded-br-md'
            : 'bg-muted rounded-bl-md'
        )}
      >
        {!isOwn && senderName && (
          <p className="text-xs font-medium mb-1 opacity-70">{senderName}</p>
        )}
        <p className="text-sm whitespace-pre-wrap break-words">{message}</p>
        <p className={cn('text-xs mt-1', isOwn ? 'opacity-70' : 'text-muted-foreground')}>
          {new Date(timestamp).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </p>
      </div>
    </div>
  );
};

export default ChatMessage;
