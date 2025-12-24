import { useState, useEffect } from 'react';
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
  Menu,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { EmailItem } from '@/components/EmailItem';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { fetchGmailMessages, formatRelativeTime, type GmailMessage } from '@/lib/gmail';

const sidebarItems = [
  { icon: InboxIcon, label: 'Inbox', count: 0, active: true },
  { icon: Star, label: 'Starred', count: 0 },
  { icon: Send, label: 'Sent' },
  { icon: Archive, label: 'Archive' },
  { icon: Trash2, label: 'Trash' },
];

const Inbox = () => {
  const navigate = useNavigate();
  const { user, accessToken, signOut } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [emails, setEmails] = useState<GmailMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchEmails = async (showRefreshSpinner = false) => {
    if (!accessToken) {
      setError('No access token available. Please sign in again.');
      setIsLoading(false);
      return;
    }

    try {
      if (showRefreshSpinner) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);
      
      const messages = await fetchGmailMessages(accessToken, 20);
      setEmails(messages);
    } catch (err: any) {
      console.error('Error fetching emails:', err);
      setError(err.message || 'Failed to fetch emails');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (accessToken) {
      fetchEmails();
    } else {
      setIsLoading(false);
      setError('Please sign in to view your emails.');
    }
  }, [accessToken]);

  const handleRefresh = () => {
    fetchEmails(true);
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const unreadCount = emails.filter(e => !e.isRead).length;
  const starredCount = emails.filter(e => e.labelIds.includes('STARRED')).length;

  const filteredEmails = emails.filter(email => 
    email.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    email.sender.toLowerCase().includes(searchQuery.toLowerCase()) ||
    email.preview.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
          {/* Logo and User Info */}
          <div className="p-6 border-b border-border">
            <div className="flex items-center gap-2 mb-4">
              <Mail className="h-6 w-6 text-accent" />
              <span className="text-lg font-semibold text-foreground">Gmail Automation</span>
            </div>
            {user && (
              <div className="flex items-center gap-3">
                {user.photoURL ? (
                  <img 
                    src={user.photoURL} 
                    alt={user.displayName || 'User'} 
                    className="w-8 h-8 rounded-full"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent font-medium">
                    {user.displayName?.charAt(0) || user.email?.charAt(0) || 'U'}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{user.displayName || 'User'}</p>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                </div>
              </div>
            )}
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
            <button 
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-2 hover:bg-secondary rounded-lg transition-colors text-muted-foreground hover:text-foreground disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </header>

        {/* Email List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-accent" />
              <p className="text-muted-foreground">Loading your emails...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 px-4">
              <AlertCircle className="h-12 w-12 text-destructive" />
              <p className="text-destructive text-center">{error}</p>
              <Button onClick={() => fetchEmails()} variant="outline">
                Try Again
              </Button>
            </div>
          ) : (
            <>
              <div className="border-b border-border px-4 py-3 bg-card/30">
                <span className="text-sm text-muted-foreground">
                  Showing <span className="text-foreground font-medium">{filteredEmails.length}</span> of {emails.length} emails
                  {unreadCount > 0 && (
                    <span className="ml-2">(<span className="text-accent">{unreadCount} unread</span>)</span>
                  )}
                </span>
              </div>
              
              {filteredEmails.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 gap-4">
                  <Mail className="h-12 w-12 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    {searchQuery ? 'No emails match your search' : 'No emails found'}
                  </p>
                </div>
              ) : (
                filteredEmails.map((email) => (
                  <EmailItem
                    key={email.id}
                    sender={email.sender}
                    subject={email.subject}
                    preview={email.preview}
                    time={formatRelativeTime(email.date)}
                    isStarred={email.labelIds.includes('STARRED')}
                    isRead={email.isRead}
                    hasAttachment={email.hasAttachment}
                    onClick={() => console.log('Open email:', email.id)}
                  />
                ))
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default Inbox;
