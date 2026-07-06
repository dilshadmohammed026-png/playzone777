import React, { useState, useEffect } from 'react';
import { Search, Menu, X, Crown, Download, Lock, Mail } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { loginAdmin, getSettings, AppSettings, checkAdminEmailAuthorized } from '../lib/store';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../lib/firebase';

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [tapCount, setTapCount] = useState(0);
  const [lastTapTime, setLastTapTime] = useState(0);
  const [showModal, setShowModal] = useState(false);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const [settings, setSettings] = useState<AppSettings | null>(null);

  useEffect(() => {
    getSettings().then(data => {
      setSettings(data);
      if (data) {
        if (data.siteName) {
          document.title = `${data.siteName} - India's Best Gaming App Directory`;
        }
        if (data.faviconUrl) {
          const favicon = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
          if (favicon) {
            favicon.href = data.faviconUrl;
          } else {
            const link = document.createElement('link');
            link.rel = 'icon';
            link.href = data.faviconUrl;
            document.head.appendChild(link);
          }
        }
      }
    });
  }, []);

  const handleLogoClick = (e: React.MouseEvent) => {
    const now = Date.now();
    if (now - lastTapTime > 5000) {
      setTapCount(1);
    } else {
      const newCount = tapCount + 1;
      setTapCount(newCount);
      if (newCount >= 10) {
        setShowModal(true);
        setTapCount(0);
      }
    }
    setLastTapTime(now);
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Please fill in all fields.');
      return;
    }

    const isAuthorized = await checkAdminEmailAuthorized(email);
    if (!isAuthorized) {
      setError('Unauthorized Access');
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);
      loginAdmin('admin123');
      setShowModal(false);
      navigate('/admin');
    } catch (err: any) {
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found') {
        try {
          await createUserWithEmailAndPassword(auth, email, password);
          loginAdmin('admin123');
          setShowModal(false);
          navigate('/admin');
        } catch (createErr: any) {
          if (createErr.code === 'auth/email-already-in-use') {
            setError('Invalid admin credentials.');
          } else {
            setError('Error setting up admin account.');
          }
        }
      } else {
        setError('Invalid admin credentials.');
      }
    }
  };

  const siteName = settings?.siteName || 'Play777Zone';

  return (
    <>
      <nav className="fixed top-0 w-full z-50 bg-[#061e11]/90 backdrop-blur-md border-b border-amber-500/20">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <Link to="/" onClick={handleLogoClick} className="flex items-center gap-2">
              {settings?.logoUrl ? (
                <img src={settings.logoUrl} alt={siteName} className="h-10 object-contain max-w-[180px]" referrerPolicy="no-referrer" />
              ) : (
                <>
                  <div className="relative flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-tr from-green-600 to-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.5)]">
                    <Crown size={20} className="text-white relative z-10" />
                  </div>
                  <span className="text-2xl font-bold bg-gradient-to-r from-amber-200 to-amber-500 bg-clip-text text-transparent uppercase tracking-wider select-none">
                    {siteName.slice(0, 4)}<span className="text-white">{siteName.slice(4)}</span>
                  </span>
                </>
              )}
            </Link>

            {/* Desktop Nav */}
            <div className="hidden lg:flex items-center gap-8">
              <Link to="/" className="text-sm font-semibold text-green-50 hover:text-amber-400 transition-colors uppercase tracking-wider">Directory</Link>
              <Link to="/" className="text-sm font-semibold text-green-50 hover:text-amber-400 transition-colors uppercase tracking-wider">Categories</Link>
            </div>

            <button className="lg:hidden p-2 text-green-100" onClick={() => setIsOpen(!isOpen)}>
              {isOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>

        {isOpen && (
          <div className="lg:hidden bg-[#061e11] border-b border-amber-500/20 px-4 pt-2 pb-6 space-y-4">
            <Link to="/" className="block text-lg font-medium text-green-50 py-2 border-b border-green-900">Directory</Link>
            <Link to="/" className="block text-lg font-medium text-green-50 py-2 border-b border-green-900">Categories</Link>
          </div>
        )}
      </nav>

      {/* Secret Admin Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#071c10] border border-green-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
            <button 
              onClick={() => { setShowModal(false); setError(''); setEmail(''); setPassword(''); }}
              className="absolute top-4 right-4 text-green-100/50 hover:text-white transition-colors z-20"
            >
              <X size={24} />
            </button>
            <div className="absolute top-[-20%] left-[20%] w-[60%] h-[60%] bg-amber-500/10 rounded-full blur-[80px]"></div>

            <div className="relative z-10">
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-green-600 to-amber-500 flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.5)]">
                  <Crown size={32} className="text-white" />
                </div>
              </div>
              
              <h2 className="text-2xl font-bold text-center text-white uppercase tracking-widest mb-2">Admin Access</h2>
              <p className="text-center text-green-100/50 mb-8 text-sm">Restricted Area</p>

              <form onSubmit={handleAdminLogin} className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-green-100/70 uppercase tracking-widest mb-2">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-green-500" size={20} />
                    <input 
                      type="email" 
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setError(''); }}
                      placeholder="admin@example.com"
                      className={`w-full bg-[#05130b] border ${error ? 'border-red-500' : 'border-green-800'} focus:border-amber-500 rounded-xl py-3 pl-10 pr-4 text-white placeholder-green-100/20 focus:outline-none transition-colors`}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-green-100/70 uppercase tracking-widest mb-2">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-green-500" size={20} />
                    <input 
                      type="password" 
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setError(''); }}
                      placeholder="Enter password..."
                      className={`w-full bg-[#05130b] border ${error ? 'border-red-500' : 'border-green-800'} focus:border-amber-500 rounded-xl py-3 pl-10 pr-4 text-white placeholder-green-100/20 focus:outline-none transition-colors`}
                    />
                  </div>
                  {error && <p className="text-red-400 text-xs mt-2 font-medium">{error}</p>}
                </div>

                <button 
                  type="submit"
                  className="w-full py-4 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-[#092212] rounded-xl font-bold uppercase tracking-wider shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2"
                >
                  Sign In
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
