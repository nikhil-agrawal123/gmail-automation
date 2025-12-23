import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Mail, 
  Inbox as InboxIcon, 
  Send, 
  Star, 
  Trash2, 
  Archive,
  Search,
  RefreshCw,
  Settings,
  LogOut,
  Menu
} from 'lucide-react';
import { EmailItem } from '@/components/EmailItem';
import { Button } from '@/components/ui/button';

// Mock email data
const mockEmails = [
  {
    id: 1,
    sender: 'GitHub',
    subject: 'Your pull request has been merged',
    preview: 'Congratulations! Your pull request #42 has been successfully merged into main branch...',
    time: '2m ago',
    isStarred: true,
    isRead: false,
    hasAttachment: false,
  },
  {
    id: 2,
    sender: 'Stripe',
    subject: 'Your monthly invoice is ready',
    preview: 'Your invoice for December 2024 is now available. Total amount: $299.00...',
    time: '1h ago',
    isStarred: false,
    isRead: false,
    hasAttachment: true,
  },
  {
    id: 3,
    sender: 'Notion',
    subject: 'Weekly digest: Updates in your workspace',
    preview: 'Here is a summary of what happened in your workspace this week...',
    time: '3h ago',
    isStarred: false,
    isRead: true,
    hasAttachment: false,
  },
  {
    id: 4,
    sender: 'Linear',
    subject: 'You have been assigned to 3 new issues',
    preview: 'New issues have been assigned to you: Fix login bug, Update dashboard UI, Add tests...',
    time: '5h ago',
    isStarred: true,
    isRead: true,
    hasAttachment: false,
  },
  {
    id: 5,
    sender: 'Figma',
    subject: 'John commented on your design',
    preview: 'John Smith left a comment: "This looks great! Can we adjust the spacing on..."',
    time: 'Yesterday',
    isStarred: false,
    isRead: true,
    hasAttachment: false,
  },
  {
    id: 6,
    sender: 'Slack',
    subject: 'You have unread messages in #general',
    preview: 'Catch up on 12 unread messages in the #general channel from your team...',
    time: 'Yesterday',
    isStarred: false,
    isRead: true,
    hasAttachment: false,
  },
  {
    id: 7,
    sender: 'AWS',
    subject: 'Your bill for November 2024',
    preview: 'Your AWS bill for November 2024 is ready. Total charges: $156.78...',
    time: '2 days ago',
    isStarred: false,
    isRead: true,
    hasAttachment: true,
  },
];

const sidebarItems = [
  { icon: InboxIcon, label: 'Inbox', count: 12, active: true },
  { icon: Star, label: 'Starred', count: 3 },
  { icon: Send, label: 'Sent' },
  { icon: Archive, label: 'Archive' },
  { icon: Trash2, label: 'Trash' },
];

const Inbox = () => {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleLogout = () => {
    navigate('/');
  };

  return (
    <div className="h-screen w-full bg-background flex overflow-hidden">
      {/* Mobile sidebar overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:relative inset-y-0 left-0 z-50
        w-64 bg-card border-r border-border
        transform transition-transform duration-200 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-border">
            <div className="flex items-center gap-2">
              <Mail className="h-6 w-6 text-accent" />
              <span className="text-lg font-semibold text-foreground">MailFlow</span>
            </div>
          </div>

          {/* Compose Button */}
          <div className="p-4">
            <Button className="w-full gap-2" size="lg">
              <Mail className="h-4 w-4" />
              Compose
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-2">
            {sidebarItems.map((item, index) => (
              <button
                key={index}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1
                  transition-colors duration-200
                  ${item.active 
                    ? 'bg-accent/10 text-accent' 
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                  }
                `}
              >
                <item.icon className="h-4 w-4" />
                <span className="flex-1 text-left text-sm font-medium">{item.label}</span>
                {item.count && (
                  <span className={`
                    text-xs px-2 py-0.5 rounded-full
                    ${item.active ? 'bg-accent text-accent-foreground' : 'bg-muted text-muted-foreground'}
                  `}>
                    {item.count}
                  </span>
                )}
              </button>
            ))}
          </nav>

          {/* Bottom actions */}
          <div className="p-4 border-t border-border space-y-1">
            <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors">
              <Settings className="h-4 w-4" />
              <span className="text-sm font-medium">Settings</span>
            </button>
            <button 
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span className="text-sm font-medium">Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 border-b border-border flex items-center justify-between px-4 lg:px-6 bg-card/50 backdrop-blur-sm">
          <div className="flex items-center gap-4">
            <button 
              className="lg:hidden p-2 hover:bg-secondary rounded-lg transition-colors"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu className="h-5 w-5 text-foreground" />
            </button>
            
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search emails..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64 lg:w-80 h-10 pl-10 pr-4 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-secondary rounded-lg transition-colors text-muted-foreground hover:text-foreground">
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </header>

        {/* Email List */}
        <div className="flex-1 overflow-y-auto">
          <div className="border-b border-border px-4 py-3 bg-card/30">
            <span className="text-sm text-muted-foreground">
              Showing <span className="text-foreground font-medium">{mockEmails.length}</span> emails
            </span>
          </div>
          
          {mockEmails.map((email) => (
            <EmailItem
              key={email.id}
              sender={email.sender}
              subject={email.subject}
              preview={email.preview}
              time={email.time}
              isStarred={email.isStarred}
              isRead={email.isRead}
              hasAttachment={email.hasAttachment}
              onClick={() => console.log('Open email:', email.id)}
            />
          ))}
        </div>
      </main>
    </div>
  );
};

export default Inbox;
