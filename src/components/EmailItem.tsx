import { Star, Paperclip } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmailItemProps {
  sender: string;
  subject: string;
  preview: string;
  time: string;
  isStarred?: boolean;
  isRead?: boolean;
  hasAttachment?: boolean;
  onClick?: () => void;
}

const EmailItem = ({
  sender,
  subject,
  preview,
  time,
  isStarred = false,
  isRead = true,
  hasAttachment = false,
  onClick
}: EmailItemProps) => {
  return (
    <div
      onClick={onClick}
      className={cn(
        "group flex items-start gap-4 p-4 border-b border-border cursor-pointer transition-all duration-200",
        "hover:bg-secondary/50",
        !isRead && "bg-accent/5"
      )}
    >
      {/* Star */}
      <button 
        className={cn(
          "mt-1 transition-colors",
          isStarred ? "text-yellow-500" : "text-muted-foreground hover:text-yellow-500"
        )}
        onClick={(e) => {
          e.stopPropagation();
          // Toggle star logic
        }}
      >
        <Star className="h-4 w-4" fill={isStarred ? "currentColor" : "none"} />
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-4 mb-1">
          <span className={cn(
            "text-sm truncate",
            !isRead ? "font-semibold text-foreground" : "font-medium text-foreground/80"
          )}>
            {sender}
          </span>
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {time}
          </span>
        </div>
        <div className="flex items-center gap-2 mb-1">
          <span className={cn(
            "text-sm truncate",
            !isRead ? "font-medium text-foreground" : "text-foreground/70"
          )}>
            {subject}
          </span>
          {hasAttachment && (
            <Paperclip className="h-3 w-3 text-muted-foreground flex-shrink-0" />
          )}
        </div>
        <p className="text-xs text-muted-foreground truncate">
          {preview}
        </p>
      </div>

      {/* Unread indicator */}
      {!isRead && (
        <div className="mt-2 w-2 h-2 rounded-full bg-accent flex-shrink-0" />
      )}
    </div>
  );
};

export { EmailItem };
