import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Mail, 
  Inbox as InboxIcon, 
  Send, 
  Star, 
  Trash2, 
  RefreshCw,
  Settings,
  LogOut,
  Menu,
  Loader2,
  AlertCircle,
  Search,
  Paperclip,
  UserPlus,
  X,
  ChevronDown,
  Timer,
  GalleryVerticalEnd
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth, ConnectedAccount } from '@/contexts/AuthContext';
import { 
  fetchGmailMessages,
  getInboxStats,
  fetchLabelDetails,
  formatRelativeTime,
  markMessageAsRead
} from '@/lib/gmail';
import { GmailMessage } from '@/interface/GmailMessage';
import { GmailLabel } from '@/interface/GmailLabel';
import { ComposeModal } from '@/components/ComposeModal';
import { EmailDetail } from '@/components/EmailDetail';
import generateText from '@/lib/gemini';

const sidebarItems = [
  { icon: InboxIcon, label: 'Inbox', count: 0, active: true, id: 'INBOX' },
  { icon: Send, label: 'Sent', id: 'SENT' },
  { icon: Trash2, label: 'Trash', id: 'TRASH' },
  { icon: Timer, label: 'Deadlines', id: 'DEADLINES' },
  { icon: GalleryVerticalEnd, label: 'Assignments', id: 'ASSIGNMENTS' },
];

const Inbox = () => {
  const navigate = useNavigate();
  const { user, signOut, connectedAccounts, addAccount, removeAccount, getAccessToken, forceRefreshAccessToken } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [emails, setEmails] = useState<GmailMessage[]>([]);
  const [labels, setLabels] = useState<GmailLabel[]>([]);
  const [labelStats, setLabelStats] = useState<Record<string, { total: number; unread: number }>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showAccountsDropdown, setShowAccountsDropdown] = useState(false);
  const [selectedAccountFilter, setSelectedAccountFilter] = useState<string | 'all'>('all');
  const [showCompose, setShowCompose] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<GmailMessage | null>(null);
  const [showEmailDetail, setShowEmailDetail] = useState(false);
  const [replyTo, setReplyTo] = useState('');
  const [pageTokens, setPageTokens] = useState<Record<string, string | undefined>>({});
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreEmails, setHasMoreEmails] = useState(true);

  const fetchData = async (showRefreshSpinner = false, loadMore = false) => {
    if (connectedAccounts.length === 0) {
      setError('No accounts connected. Please sign in again.');
      setIsLoading(false);
      return;
    }

    // Don't load more if already loading or no more emails
    if (loadMore && (isLoadingMore || !hasMoreEmails)) {
      return;
    }

    try {
      if (showRefreshSpinner) {
        setIsRefreshing(true);
      } else if (loadMore) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
      }
      
      if (!loadMore) {
        setError(null);
      }
      
      // Fetch emails from all connected accounts
      const allNewEmails: GmailMessage[] = [];
      const newPageTokens: Record<string, string | undefined> = loadMore ? { ...pageTokens } : {};
      let anyHasMore = false;

      for (const account of connectedAccounts) {
        try {
          // Get access token from backend (uses stored refresh token)
          let accessToken = await getAccessToken(account.email);
          const currentPageToken = loadMore ? pageTokens[account.email] : undefined;
          
          try {
            const { messages, nextPageToken } = await fetchGmailMessages(
              accessToken, 
              10, 
              account.email,
              currentPageToken
            );
            allNewEmails.push(...messages);
            newPageTokens[account.email] = nextPageToken;
            if (nextPageToken) {
              anyHasMore = true;
            }
          } catch (err: any) {
            // If 401, try to force refresh and retry
            if (err.message?.includes('401')) {
              console.log(`Token expired for ${account.email}, refreshing...`);
              accessToken = await forceRefreshAccessToken(account.email);
              const { messages, nextPageToken } = await fetchGmailMessages(
                accessToken, 
                10, 
                account.email,
                currentPageToken
              );
              allNewEmails.push(...messages);
              newPageTokens[account.email] = nextPageToken;
              if (nextPageToken) {
                anyHasMore = true;
              }
            } else {
              throw err;
            }
          }
        } catch (err) {
          console.error(`Failed to fetch from ${account.email}:`, err);
        }
      }

      setPageTokens(newPageTokens);
      setHasMoreEmails(anyHasMore);

      // Sort and set emails
      if (loadMore) {
        // Append new emails and sort
        const combinedEmails = [...emails, ...allNewEmails];
        combinedEmails.sort((a, b) => b.date.getTime() - a.date.getTime());
        setEmails(combinedEmails);
      } else {
        // Replace emails
        allNewEmails.sort((a, b) => b.date.getTime() - a.date.getTime());
        setEmails(allNewEmails);
      }

      // Fetch stats from primary account (only on initial load)
      if (!loadMore) {
        const primaryAccount = connectedAccounts.find(a => a.isPrimary) || connectedAccounts[0];
        if (primaryAccount) {
          try {
            const primaryToken = await getAccessToken(primaryAccount.email);
            const statsResult = await getInboxStats(primaryToken);
            setLabels(statsResult.labels);
        
            // Fetch detailed stats for important labels
            const labelIds = ['INBOX', 'STARRED', 'SENT', 'TRASH', 'DRAFT', 'SPAM'];
            const statsMap: Record<string, { total: number; unread: number }> = {};
        
            for (const labelId of labelIds) {
              try {
                const labelDetail = await fetchLabelDetails(primaryToken, labelId);
                statsMap[labelId] = {
                  total: labelDetail.messagesTotal || 0,
                  unread: labelDetail.messagesUnread || 0,
                };
              } catch (e) {
                statsMap[labelId] = { total: 0, unread: 0 };
              }
            }
            setLabelStats(statsMap);
          } catch (err) {
            console.error('Error fetching stats:', err);
          }
        }
      }
    } catch (err: any) {
      console.error('Error fetching data:', err);
      if (!loadMore) {
        setError(err.message || 'Failed to fetch emails');
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    if (connectedAccounts.length > 0) {
      fetchData();
    } else {
      setIsLoading(false);
      setError('Please sign in to view your emails.');
    }
  }, [connectedAccounts.length]);

  const handleRefresh = () => {
    fetchData(true);
  };

  const handleLoadMore = () => {
    if (!isLoadingMore && hasMoreEmails) {
      fetchData(false, true);
    }
  };

  // Handle scroll for infinite loading
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    // Load more when user scrolls within 200px of the bottom
    if (scrollHeight - scrollTop - clientHeight < 200) {
      handleLoadMore();
    }
  };

  const handleLogout = async () => {
    console.log( generateText("this is a test request"));
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

  // Filter emails based on search query and account filter
  const filteredEmails = emails.filter(email => {
    const matchesSearch = email.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.sender.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.recipient.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.preview.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesAccount = selectedAccountFilter === 'all' || email.accountEmail === selectedAccountFilter;
    
    return matchesSearch && matchesAccount;
  });

  const unreadCount = emails.filter(e => !e.isRead).length;

  const handleAddAccount = async () => {
    try {
      await addAccount();
      setShowAccountsDropdown(false);
    } catch (err) {
      console.error('Failed to add account:', err);
    }
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
          {/* Logo and User Info */}
          <div className="p-6 border-b border-border">
            <div className="flex items-center gap-2 mb-4">
              <Mail className="h-6 w-6 text-accent" />
              <span className="text-lg font-semibold text-foreground">Gmail Automation</span>
            </div>
            
            {/* Connected Accounts Section */}
            <div className="relative">
              <button
                onClick={() => setShowAccountsDropdown(!showAccountsDropdown)}
                className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-secondary transition-colors"
              >
                {user?.photoURL ? (
                  <img 
                    src={user.photoURL} 
                    alt={user.displayName || 'User'} 
                    className="w-8 h-8 rounded-full"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent font-medium">
                    {user?.displayName?.charAt(0) || user?.email?.charAt(0) || 'U'}
                  </div>
                )}
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-sm font-medium text-foreground truncate">{user?.displayName || 'User'}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {connectedAccounts.length > 0 
                      ? `${connectedAccounts.length} account${connectedAccounts.length > 1 ? 's' : ''} connected`
                      : user?.email}
                  </p>
                </div>
                <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${showAccountsDropdown ? 'rotate-180' : ''}`} />
              </button>

              {/* Accounts Dropdown */}
              {showAccountsDropdown && (
                <div className="absolute left-0 right-0 mt-2 bg-card border border-border rounded-lg shadow-lg z-50">
                  <div className="p-2">
                    <p className="text-xs font-medium text-muted-foreground px-2 py-1">Connected Accounts</p>
                    
                    {connectedAccounts.map((account) => (
                      <div 
                        key={account.email}
                        className="flex items-center gap-2 p-2 rounded-lg hover:bg-secondary group"
                      >
                        {account.photoURL ? (
                          <img src={account.photoURL} alt={account.displayName} className="w-6 h-6 rounded-full" />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center text-accent text-xs font-medium">
                            {account.displayName.charAt(0)}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm truncate">{account.email}</p>
                        </div>
                        {account.isPrimary && (
                          <span className="text-xs bg-accent/20 text-accent px-1.5 py-0.5 rounded">Primary</span>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeAccount(account.email);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-destructive/10 rounded transition-all"
                        >
                          <X className="h-3 w-3 text-destructive" />
                        </button>
                      </div>
                    ))}

                    <button
                      onClick={handleAddAccount}
                      className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-secondary text-accent mt-1"
                    >
                      <UserPlus className="h-4 w-4" />
                      <span className="text-sm font-medium">Add another account</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Compose Button */}
          <div className="p-4">
            <Button 
              className="w-full gap-2" 
              size="lg"
              onClick={() => {
                setReplyTo('');
                setShowCompose(true);
              }}
            >
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
        <div className="flex-1 overflow-y-auto" onScroll={handleScroll}>
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
              <div className="border-b border-border px-4 py-3 bg-card/30 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Showing <span className="text-foreground font-medium">{filteredEmails.length}</span> of {emails.length} emails
                  {unreadCount > 0 && (
                    <span className="ml-2">(<span className="text-accent">{unreadCount} unread</span>)</span>
                  )}
                </span>
                
                {/* Account Filter */}
                {connectedAccounts.length > 1 && (
                  <select
                    value={selectedAccountFilter}
                    onChange={(e) => setSelectedAccountFilter(e.target.value)}
                    className="text-sm bg-secondary border border-border rounded-lg px-3 py-1.5 text-foreground"
                  >
                    <option value="all">All Accounts</option>
                    {connectedAccounts.map((account) => (
                      <option key={account.email} value={account.email}>
                        {account.email}
                      </option>
                    ))}
                  </select>
                )}
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
                <>
                <div className="divide-y divide-border">
                  {filteredEmails.map((email) => (
                    <div
                      key={email.id}
                      className={`flex items-start gap-4 px-4 py-3 hover:bg-secondary/50 cursor-pointer transition-colors ${
                        !email.isRead ? 'bg-accent/5' : ''
                      }`}
                      onClick={async () => {
                        setSelectedEmail(email);
                        setShowEmailDetail(true);
                        
                        // Mark as read if unread
                        if (!email.isRead && email.accountEmail) {
                          try {
                            const token = await getAccessToken(email.accountEmail);
                            await markMessageAsRead(token, email.id);
                            
                            // Update local state to reflect the read status
                            setEmails(prevEmails => 
                              prevEmails.map(e => 
                                e.id === email.id ? { ...e, isRead: true } : e
                              )
                            );
                            setSelectedEmail({ ...email, isRead: true });
                          } catch (err) {
                            console.error('Failed to mark email as read:', err);
                          }
                        }
                      }}
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
                        
                        {/* Recipient info */}
                        <div className="flex items-center gap-1 mb-1">
                          <span className="text-xs text-muted-foreground">To:</span>
                          <span className="text-xs text-foreground/70 truncate">
                            {email.recipient || email.recipientEmail}
                          </span>
                        </div>
                        
                        <p className={`text-sm truncate mb-1 ${!email.isRead ? 'font-medium text-foreground' : 'text-foreground'}`}>
                          {email.subject}
                        </p>
                        <div className="flex items-center gap-2">
                          <p className="text-xs text-muted-foreground truncate flex-1">
                            {email.preview}
                          </p>
                          {/* Account indicator for multi-account */}
                          {connectedAccounts.length > 1 && email.accountEmail && (
                            <span className="text-xs bg-secondary px-1.5 py-0.5 rounded text-muted-foreground flex-shrink-0">
                              {email.accountEmail.split('@')[0]}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {/* Star indicator */}
                      {email.labelIds.includes('STARRED') && (
                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500 flex-shrink-0" />
                      )}
                    </div>
                  ))}
                </div>
                
                {/* Loading More Indicator */}
                {isLoadingMore && (
                  <div className="flex items-center justify-center py-6 gap-2">
                    <Loader2 className="h-5 w-5 animate-spin text-accent" />
                    <p className="text-sm text-muted-foreground">Loading more emails...</p>
                  </div>
                )}
                
                {/* End of emails indicator */}
                {!hasMoreEmails && emails.length > 0 && (
                  <div className="flex items-center justify-center py-6">
                    <p className="text-sm text-muted-foreground">No more emails to load</p>
                  </div>
                )}
                </>
              )}
            </>
          )}
        </div>
      </main>

      {/* Compose Modal */}
      <ComposeModal 
        isOpen={showCompose} 
        onClose={() => setShowCompose(false)}
        toEmail={replyTo}
      />

      {/* Email Detail */}
      <EmailDetail 
        email={selectedEmail}
        isOpen={showEmailDetail}
        onClose={() => setShowEmailDetail(false)}
        onReply={(toEmail) => {
          setShowEmailDetail(false);
          setReplyTo(toEmail);
          setShowCompose(true);
        }}
      />
    </div>
  );
};

export default Inbox;
