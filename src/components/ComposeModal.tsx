import { useState } from 'react';
import { X, Send, Paperclip, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ComposeModalProps {
  isOpen: boolean;
  onClose: () => void;
  toEmail?: string;
}

const ComposeModal = ({ isOpen, onClose, toEmail = '' }: ComposeModalProps) => {
  const [to, setTo] = useState(toEmail);
  const [cc, setCc] = useState('');
  const [bcc, setBcc] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showCcBcc, setShowCcBcc] = useState(false);

  const handleSend = async () => {
    if (!to.trim() || !subject.trim() || !body.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    setIsSending(true);
    try {
      // TODO: Implement actual send functionality
      alert(`Email sent to ${to}`);
      setTo('');
      setCc('');
      setBcc('');
      setSubject('');
      setBody('');
      onClose();
    } catch (error) {
      console.error('Error sending email:', error);
      alert('Failed to send email');
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />

      {/* Side Panel */}
      <div className="fixed inset-0 z-50 flex items-start justify-end pt-16">
        <div className="bg-card border-l border-border w-full max-w-2xl h-[calc(100vh-4rem)] flex flex-col shadow-lg">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h2 className="text-lg font-semibold text-foreground">Compose Email</h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-secondary rounded transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {/* To Field */}
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">To</label>
              <input
                type="email"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                placeholder="recipient@example.com"
                className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 text-sm"
              />
            </div>

            {/* CC/BCC Toggle */}
            <button
              onClick={() => setShowCcBcc(!showCcBcc)}
              className="text-sm text-accent hover:text-accent/80 flex items-center gap-1 transition-colors"
            >
              <ChevronDown className={`h-4 w-4 transition-transform ${showCcBcc ? 'rotate-180' : ''}`} />
              {showCcBcc ? 'Hide' : 'Add'} Cc, Bcc
            </button>

            {/* CC/BCC Fields */}
            {showCcBcc && (
              <>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Cc</label>
                  <input
                    type="email"
                    value={cc}
                    onChange={(e) => setCc(e.target.value)}
                    placeholder="cc@example.com"
                    className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 text-sm"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Bcc</label>
                  <input
                    type="email"
                    value={bcc}
                    onChange={(e) => setBcc(e.target.value)}
                    placeholder="bcc@example.com"
                    className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 text-sm"
                  />
                </div>
              </>
            )}

            {/* Subject Field */}
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Subject</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Email subject"
                className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 text-sm"
              />
            </div>

            {/* Body Field */}
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Message</label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Write your message here..."
                rows={10}
                className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 resize-none text-sm"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-4 border-t border-border bg-card/50">
            <button className="p-2 hover:bg-secondary rounded transition-colors">
              <Paperclip className="h-5 w-5 text-muted-foreground" />
            </button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose} size="sm">
                Discard
              </Button>
              <Button onClick={handleSend} disabled={isSending} size="sm">
                <Send className="h-4 w-4 mr-2" />
                {isSending ? 'Sending...' : 'Send'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export { ComposeModal };
