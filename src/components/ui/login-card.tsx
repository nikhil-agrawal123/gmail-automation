import * as React from 'react';
import { useState } from 'react';
import { Mail } from 'lucide-react';
import { AppInput } from './app-input';
import { useNavigate } from 'react-router-dom';

const GmailIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
    <path fill="currentColor" d="M20 18h-2V9.25L12 13L6 9.25V18H4V6h1.2l6.8 4.25L18.8 6H20m0-2H4c-1.11 0-2 .89-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2"/>
  </svg>
);

const OutlookIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
    <path fill="currentColor" d="M7.88 12.04q0 .45-.11.87q-.1.41-.33.74q-.22.33-.58.52q-.37.2-.87.2t-.85-.2q-.35-.21-.57-.55q-.22-.33-.33-.75q-.1-.42-.1-.86t.1-.87q.1-.43.34-.76q.22-.34.59-.54q.36-.2.87-.2t.86.2q.35.21.57.55q.22.34.31.77q.1.43.1.88M24 12v9.38q0 .46-.33.8q-.33.32-.8.32H7.13q-.46 0-.8-.33q-.32-.33-.32-.8V18H1q-.41 0-.7-.3q-.3-.29-.3-.7V7q0-.41.3-.7Q.58 6 1 6h6.5V2.55q0-.44.3-.75q.3-.3.75-.3H23.2q.45 0 .78.3q.32.3.32.75V12m-8.27.32q0-.63-.17-1.16q-.17-.54-.5-.93t-.82-.6q-.48-.21-1.11-.21q-.62 0-1.11.21q-.48.22-.81.6q-.33.4-.5.93q-.17.53-.17 1.16t.18 1.16q.17.53.5.93q.33.4.81.6q.48.21 1.1.21q.63 0 1.11-.21q.49-.2.82-.6q.33-.4.5-.93t.17-1.16m.17-5.13H7.53v10.13h8.37z"/>
  </svg>
);

interface LoginCardProps {
  onLoginSuccess?: () => void;
}

const LoginCard = ({ onLoginSuccess }: LoginCardProps) => {
  const navigate = useNavigate();
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  const handleMouseMove = (e: React.MouseEvent) => {
    const leftSection = e.currentTarget.getBoundingClientRect();
    setMousePosition({
      x: e.clientX - leftSection.left,
      y: e.clientY - leftSection.top
    });
  };

  const handleLogin = (provider: 'gmail' | 'outlook') => {
    // In a real app, this would trigger OAuth flow
    console.log(`Logging in with ${provider}`);
    if (onLoginSuccess) {
      onLoginSuccess();
    } else {
      navigate('/inbox');
    }
  };

  const socialProviders = [
    {
      icon: <GmailIcon />,
      name: 'Gmail',
      onClick: () => handleLogin('gmail'),
      hoverColor: 'group-hover:text-gmail',
      bgColor: 'group-hover:bg-gmail/10',
    },
    {
      icon: <OutlookIcon />,
      name: 'Outlook',
      onClick: () => handleLogin('outlook'),
      hoverColor: 'group-hover:text-outlook',
      bgColor: 'group-hover:bg-outlook/10',
    },
  ];

  return (
    <div className="h-screen w-full bg-background flex items-center justify-center p-4">
      <div className="card-glass w-full max-w-[900px] flex justify-between min-h-[550px] overflow-hidden glow-effect">
        <div
          className="w-full lg:w-1/2 px-6 lg:px-12 py-10 relative overflow-hidden"
          onMouseMove={handleMouseMove}
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
        >
          {/* Animated glow background */}
          <div
            className={`absolute pointer-events-none w-[400px] h-[400px] bg-gradient-to-r from-purple-500/20 via-blue-500/20 to-pink-500/20 rounded-full blur-3xl transition-opacity duration-300 ${
              isHovering ? 'opacity-100' : 'opacity-0'
            }`}
            style={{
              transform: `translate(${mousePosition.x - 200}px, ${mousePosition.y - 200}px)`,
              transition: 'transform 0.15s ease-out'
            }}
          />

          <div className="relative z-10 h-full flex flex-col justify-center">
            <form className="text-center space-y-6" onSubmit={(e) => e.preventDefault()}>
              {/* Header */}
              <div className="space-y-4 mb-8">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <Mail className="h-8 w-8 text-accent" />
                  <span className="text-xl font-semibold text-foreground">MailFlow</span>
                </div>
                <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                  Welcome back
                </h1>
                <p className="text-muted-foreground text-sm">
                  Connect your email to get started
                </p>
              </div>

              {/* OAuth Buttons */}
              <div className="space-y-3">
                {socialProviders.map((provider, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={provider.onClick}
                    className={`group w-full h-12 rounded-lg flex items-center justify-center gap-3 border-2 border-border bg-secondary/50 transition-all duration-300 hover:border-accent/30 ${provider.bgColor}`}
                  >
                    <span className={`text-foreground transition-colors duration-300 ${provider.hoverColor}`}>
                      {provider.icon}
                    </span>
                    <span className="text-foreground font-medium">
                      Continue with {provider.name}
                    </span>
                  </button>
                ))}
              </div>

              {/* Divider */}
              <div className="flex items-center gap-4 my-6">
                <div className="flex-1 h-px bg-border" />
                <span className="text-muted-foreground text-xs uppercase tracking-wider">
                  or sign in with email
                </span>
                <div className="flex-1 h-px bg-border" />
              </div>

              {/* Email/Password Form */}
              <div className="space-y-4">
                <AppInput placeholder="Email address" type="email" />
                <AppInput placeholder="Password" type="password" />
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="rounded border-border bg-secondary" />
                  <span className="text-muted-foreground">Remember me</span>
                </label>
                <a href="#" className="text-accent hover:text-accent/80 transition-colors">
                  Forgot password?
                </a>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="group relative w-full h-12 overflow-hidden rounded-lg bg-primary text-primary-foreground font-semibold transition-all duration-300 hover:shadow-lg hover:shadow-accent/20"
              >
                <span className="relative z-10">Sign In</span>
                <div className="absolute inset-0 flex h-full w-full justify-center [transform:skew(-13deg)_translateX(-100%)] group-hover:duration-1000 group-hover:[transform:skew(-13deg)_translateX(100%)]">
                  <div className="relative h-full w-10 bg-white/20" />
                </div>
              </button>

              <p className="text-muted-foreground text-sm">
                Don't have an account?{' '}
                <a href="#" className="text-accent hover:text-accent/80 transition-colors">
                  Sign up
                </a>
              </p>
            </form>
          </div>
        </div>

        {/* Right side - Image */}
        <div className="hidden lg:block w-1/2 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-accent/20 via-purple-500/10 to-pink-500/10" />
          <img
            src="https://images.unsplash.com/photo-1557200134-90327ee9fafa?w=800&auto=format&fit=crop&q=80"
            alt="Email automation illustration"
            className="w-full h-full object-cover opacity-40"
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
            <div className="animate-float">
              <Mail className="h-16 w-16 text-accent mb-4" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Automate Your Inbox
            </h2>
            <p className="text-muted-foreground max-w-[250px]">
              Connect Gmail or Outlook and let AI handle your emails intelligently.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export { LoginCard };
