import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Mail, 
  Inbox as InboxIcon, 
  Send, 
  Star, 
  Trash2, 
  Archive,
  RefreshCw,
  Settings,
  LogOut,
  Menu,
  Loader2,
  AlertCircle,
  Search,
  Paperclip
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { 
  fetchGmailMessages,
  getInboxStats,
  fetchLabelDetails,
  formatRelativeTime,
  type GmailMessage,
  type GmailLabel 
} from '@/lib/gmail';

const sidebarItems = [
  { icon: InboxIcon, label: 'Inbox', count: 0, active: true, id: 'INBOX' },
  { icon: Star, label: 'Starred', count: 0, id: 'STARRED' },
  { icon: Send, label: 'Sent', id: 'SENT' },
  { icon: Archive, label: 'Archive', id: 'ARCHIVE' },
  { icon: Trash2, label: 'Trash', id: 'TRASH' },
];

const Inbox = () => {
  const navigate = useNavigate();
  const { user, accessToken, signOut } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [emails, setEmails] = useState<GmailMessage[]>([]);
  const [labels, setLabels] = useState<GmailLabel[]>([]);
  const [labelStats, setLabelStats] = useState<Record<string, { total: number; unread: number }>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchData = async (showRefreshSpinner = false) => {
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
      
      // Fetch emails and label stats in parallel
      const [messagesResult, statsResult] = await Promise.allSettled([
        fetchGmailMessages(accessToken, 30),
        getInboxStats(accessToken)
      ]);

      if (messagesResult.status === 'fulfilled') {
        setEmails(messagesResult.value);
      } else {
        console.error('Failed to fetch messages:', messagesResult.reason);
      }

      if (statsResult.status === 'fulfilled') {
        setLabels(statsResult.value.labels);
        
        // Fetch detailed stats for important labels
        const labelIds = ['INBOX', 'STARRED', 'SENT', 'TRASH', 'DRAFT', 'SPAM'];
        const statsMap: Record<string, { total: number; unread: number }> = {};
        
        for (const labelId of labelIds) {
          try {
            const labelDetail = await fetchLabelDetails(accessToken, labelId);
            statsMap[labelId] = {
              total: labelDetail.messagesTotal || 0,
              unread: labelDetail.messagesUnread || 0,
            };
          } catch (e) {
            statsMap[labelId] = { total: 0, unread: 0 };
          }
        }
        setLabelStats(statsMap);
      }

      // If both failed, show error
      if (messagesResult.status === 'rejected' && statsResult.status === 'rejected') {
        throw messagesResult.reason;
      }
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError(err.message || 'Failed to fetch emails');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (accessToken) {
      fetchData();
    } else {
      setIsLoading(false);
      setError('Please sign in to view your emails.');
    }
  }, [accessToken]);

  const handleRefresh = () => {
    fetchData(true);
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  // Build dynamic sidebar with counts from label stats
  const dynamicSidebarItems = sidebarItems.map(item => {
    const stats = labelStats[item.id];
    if (stats) {
      return { ...item, count: stats.unread };
    }
    return item;
  });

  // Filter user labels (exclude system labels)
  const userLabels = labels.filter(l => l.type === 'user');

  // Filter emails based on search query
  const filteredEmails = emails.filter(email => 
    email.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    email.sender.toLowerCase().includes(searchQuery.toLowerCase()) ||
    email.preview.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const unreadCount = emails.filter(e => !e.isRead).length;

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
            {dynamicSidebarItems.map((item, index) => (
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
                {item.count !== undefined && item.count > 0 && (
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
                className="w-48 lg:w-80 h-10 pl-10 pr-4 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all"
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
              <Button onClick={() => fetchData()} variant="outline">
                Try Again
              </Button>
            </div>
          ) : (
            <>
              {/* Email Stats Summary */}
              <div className="border-b border-border px-4 py-3 bg-card/30">
                <span className="text-sm text-muted-foreground">
                  Showing <span className="text-foreground font-medium">{filteredEmails.length}</span> of {emails.length} emails
                  {unreadCount > 0 && (
                    <span className="ml-2">(<span className="text-accent">{unreadCount} unread</span>)</span>
                  )}
                </span>
              </div>
              
              {/* Email List */}
              {filteredEmails.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 gap-4">
                  <Mail className="h-12 w-12 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    {searchQuery ? 'No emails match your search' : 'No emails found'}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {filteredEmails.map((email) => (
                    <div
                      key={email.id}
                      className={`flex items-start gap-4 px-4 py-3 hover:bg-secondary/50 cursor-pointer transition-colors ${
                        !email.isRead ? 'bg-accent/5' : ''
                      }`}
                      onClick={() => console.log('Open email:', email.id)}
                    >
                      {/* Avatar */}
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-accent font-medium text-sm">
                        {email.sender.charAt(0).toUpperCase()}
                      </div>
                      
                      {/* Email Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className={`text-sm truncate ${!email.isRead ? 'font-semibold text-foreground' : 'text-foreground'}`}>
                            {email.sender}
                          </span>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {email.hasAttachment && (
                              <Paperclip className="h-3.5 w-3.5 text-muted-foreground" />
                            )}
                            <span className="text-xs text-muted-foreground">
                              {formatRelativeTime(email.date)}
                            </span>
                          </div>
                        </div>
                        <p className={`text-sm truncate mb-1 ${!email.isRead ? 'font-medium text-foreground' : 'text-foreground'}`}>
                          {email.subject}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {email.preview}
                        </p>
                      </div>
                      
                      {/* Star indicator */}
                      {email.labelIds.includes('STARRED') && (
                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500 flex-shrink-0" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default Inbox;
