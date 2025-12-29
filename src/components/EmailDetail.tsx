import { X, Download, Reply, Forward, Star, Trash2, Archive, Paperclip } from 'lucide-react';
import { GmailMessage } from '@/interface/GmailMessage';
import { Button } from '@/components/ui/button';

interface EmailDetailProps {
  email: GmailMessage | null;
  isOpen: boolean;
  onClose: () => void;
  onReply?: (toEmail: string) => void;
}

const EmailDetail = ({ email, isOpen, onClose, onReply }: EmailDetailProps) => {
  if (!isOpen || !email) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />

      {/* Detail Panel */}
      <div className="fixed inset-0 z-50 flex items-start justify-end pt-16">
        <div className="bg-card border-l border-border w-full max-w-2xl h-[calc(100vh-4rem)] flex flex-col shadow-lg">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h2 className="text-lg font-semibold text-foreground truncate">{email.subject}</h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-secondary rounded transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Email Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* From/To Section */}
            <div className="space-y-3">
              {/* From */}
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">From</p>
                <div className="mt-1 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-accent font-medium">
                    {email.sender.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{email.sender}</p>
                    <p className="text-xs text-muted-foreground">{email.senderEmail}</p>
                  </div>
                </div>
              </div>

              {/* To */}
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">To</p>
                <div className="mt-1 ml-0">
                  <p className="text-sm text-foreground">{email.recipient}</p>
                  <p className="text-xs text-muted-foreground">{email.recipientEmail}</p>
                </div>
              </div>

              {/* Date */}
              <div>
                <p className="text-xs text-muted-foreground">
                  {email.date.toLocaleString('en-US', {
                    weekday: 'short',
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-border" />

            {/* Email Body */}
            <div className="space-y-4">
              <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                {email.preview}
              </p>

              {/* Attachments Placeholder */}
              {email.hasAttachment && (
                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-sm font-medium text-foreground mb-3">Attachments</p>
                  <div className="flex items-center gap-2 p-3 bg-secondary/50 rounded-lg">
                    <Paperclip className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      This email has attachments (Download functionality coming soon)
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between p-4 border-t border-border bg-card/50">
            <div className="flex gap-2">
              <button className="p-2 hover:bg-secondary rounded transition-colors" title="Star">
                <Star className="h-5 w-5 text-muted-foreground" />
              </button>
              <button className="p-2 hover:bg-secondary rounded transition-colors" title="Archive">
                <Archive className="h-5 w-5 text-muted-foreground" />
              </button>
              <button className="p-2 hover:bg-secondary rounded transition-colors" title="Delete">
                <Trash2 className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>

            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onReply?.(email.senderEmail)}
              >
                <Reply className="h-4 w-4 mr-2" />
                Reply
              </Button>
              <Button 
                variant="outline"
                size="sm"
              >
                <Forward className="h-4 w-4 mr-2" />
                Forward
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export { EmailDetail };
