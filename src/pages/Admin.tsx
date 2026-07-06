import React, { useState, useEffect } from 'react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { LayoutDashboard, PlusCircle, Settings, LogOut, Link as LinkIcon, Save, Edit, Trash2, Image as ImageIcon, X, Database, BarChart3, ExternalLink, Flame, Trophy, Coins, Star, Upload, Copy, Check, FileText, Crown, Download, AlertTriangle, AlertCircle, MessageSquare, ArrowRight, Lock, Users, UserPlus, ShieldAlert, ShieldCheck, ArrowUp, ArrowDown, Eye, EyeOff, Zap } from 'lucide-react';
import { getGames, saveGames, deleteGame, Game, logoutAdmin, initialGames, getAnalyticsEvents, AnalyticsEvent, AppSettings, getSettings, saveSettings, getReports, updateReportStatus, LinkReport, checkAdminEmailAuthorized, getAdmins, saveAdminDoc, deleteAdminDoc, deleteStorageFile, getUploadedImages, saveUploadedImages, getAdAnalyticsEvents, AdAnalyticsEvent } from '../lib/store';
import { useNavigate } from 'react-router-dom';

import { auth } from '../lib/firebase';
import { updateEmail, updatePassword } from 'firebase/auth';
import { ImageUploader } from '../components/ImageUploader';

export function Admin() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [games, setGames] = useState<Game[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  const [reports, setReports] = useState<LinkReport[]>([]);
  const [adEvents, setAdEvents] = useState<AdAnalyticsEvent[]>([]);

  const [selectedBannerBase64, setSelectedBannerBase64] = useState('');
  const [newBannerClickUrl, setNewBannerClickUrl] = useState('');

  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const [adminFormEmail, setAdminFormEmail] = useState('');
  const [adminFormUsername, setAdminFormUsername] = useState('');
  const [adminFormPassword, setAdminFormPassword] = useState('');
  const [isSavingAdminAcc, setIsSavingAdminAcc] = useState(false);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (user) => {
      if (user) {
         const isAuthorized = await checkAdminEmailAuthorized(user.email || '');
         if (!isAuthorized) {
            auth.signOut();
            logoutAdmin();
            navigate('/');
         }
      } else {
         // Force redirect if auth is not present on administrative area
         logoutAdmin();
         navigate('/admin/login');
      }
    });
    return () => unsub();
  }, [navigate]);

  // Selected game for editing
  const [editingGame, setEditingGame] = useState<Game | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);

  // Multi-Admin Management States
  const [adminsList, setAdminsList] = useState<any[]>([]);
  const [isSavingAdmin, setIsSavingAdmin] = useState(false);
  const [isEditingAdmin, setIsEditingAdmin] = useState(false);
  const [editingAdminEmail, setEditingAdminEmail] = useState('');
  const [multiAdminFormEmail, setMultiAdminFormEmail] = useState('');
  const [multiAdminFormUsername, setMultiAdminFormUsername] = useState('');
  const [multiAdminFormPassword, setMultiAdminFormPassword] = useState('');
  const [multiAdminFormStatus, setMultiAdminFormStatus] = useState('active');

  const [migrationStatus, setMigrationStatus] = useState<{ message: string, type: 'success' | 'error' | '' }>({ message: '', type: '' });

  const fetchGames = async () => {
    setLoading(true);
    try {
      const data = await getGames();
      setGames(data);
      const events = await getAnalyticsEvents();
      setAnalytics(events);
      const adEventsData = await getAdAnalyticsEvents();
      setAdEvents(adEventsData || []);
      const config = await getSettings();
      setSettings(config);
      if (config) {
        setAdminFormEmail(config.adminEmail || 'dilshadmohammed887@gmail.com');
        setAdminFormUsername(config.adminUsername || 'admin');
      }
      const adminDocs = await getAdmins();
      setAdminsList(adminDocs || []);
      const images = await getUploadedImages();
      setUploadedImages(images || []);
    } catch (err) {
      console.error("Error loading admin configurations:", err);
    }
    try {
      const rpts = await getReports();
      setReports(rpts || []);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };


  useEffect(() => {
    fetchGames();
  }, []);

  const handleLogout = () => {
    logoutAdmin();
    navigate('/');
  };

  const handleLinkUpdate = async (id: number, link: string) => {
    const updatedGame = games.find(g => g.id === id);
    if (!updatedGame) return;
    
    const updated = { ...updatedGame, link };
    setGames(games.map(g => g.id === id ? updated : g));
    await saveGames([updated]);
  };

  const handleDelete = async (id: number) => {
    const gameToDelete = games.find(g => g.id === id);
    if (gameToDelete) {
      if (gameToDelete.logoUrl) {
        try {
          await deleteStorageFile(gameToDelete.logoUrl);
        } catch (err) {
          console.error("Failed to delete game logo:", err);
        }
      }
      if (gameToDelete.bannerUrl) {
        try {
          await deleteStorageFile(gameToDelete.bannerUrl);
        } catch (err) {
          console.error("Failed to delete game banner:", err);
        }
      }
    }
    setGames(games.filter(g => g.id !== id));
    await deleteGame(id);
  };

  const handleMarkFixed = async (reportId: string) => {
    if (!reportId) return;
    try {
      await updateReportStatus(reportId, 'resolved');
      setReports(reports.map(r => r.id === reportId ? { ...r, status: 'resolved' } : r));
    } catch (e) {
      console.error("Error marking report as fixed:", e);
    }
  };

  const saveEditedGame = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingGame) {
      if (isAddingNew) {
        // Find max id
        const nextId = games.length > 0 ? Math.max(...games.map(g => g.id)) + 1 : 1;
        const newGame = { ...editingGame, id: nextId, clicks: 0 };
        setGames([newGame, ...games]); // Add to top
        await saveGames([newGame]);
      } else {
        setGames(games.map(g => g.id === editingGame.id ? editingGame : g));
        await saveGames([editingGame]);
      }
      setEditingGame(null);
      setIsAddingNew(false);
    }
  };

  const handleMigrateData = async () => {
    setLoading(true);
    setMigrationStatus({ message: 'Migrating data...', type: '' });
    try {
      const localGames = localStorage.getItem('games');
      const gamesToUpload = localGames ? JSON.parse(localGames) : initialGames;
      await saveGames(gamesToUpload);
      await fetchGames();
      setMigrationStatus({ message: 'Migration complete! You are now using Firebase.', type: 'success' });
    } catch (error: any) {
      setMigrationStatus({ message: 'Migration failed: ' + error.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const totalClicks = games.reduce((acc, g) => acc + g.clicks, 0);
  const totalDownloadClicks = games.reduce((acc, g) => acc + (g.downloadClicks || 0), 0);
  const missingLinks = games.filter(g => !g.link).length;

  const getAnalyticsStats = () => {
    const now = Date.now();
    const dayAgo = now - 24 * 60 * 60 * 1000;
    const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
    const monthAgo = now - 30 * 24 * 60 * 60 * 1000;

    const dailyClicks = analytics.filter(e => e.timestamp >= dayAgo).length;
    const weeklyClicks = analytics.filter(e => e.timestamp >= weekAgo).length;
    const monthlyClicks = analytics.filter(e => e.timestamp >= monthAgo).length;

    const topClicked = [...games].sort((a, b) => b.clicks - a.clicks).slice(0, 10);
    const topDownloaded = [...games].sort((a, b) => (b.downloadClicks || 0) - (a.downloadClicks || 0)).slice(0, 10);

    // Referral platforms tracking
    const websiteViews = analytics.filter(e => e.type === 'website_view').length;
    
    // Website referrals
    const refCopy = analytics.filter(e => e.type === 'referral' && e.platform === 'copy').length;
    const refWhatsApp = analytics.filter(e => e.type === 'referral' && e.platform === 'whatsapp').length;
    const refTelegram = analytics.filter(e => e.type === 'referral' && e.platform === 'telegram').length;
    const refFacebook = analytics.filter(e => e.type === 'referral' && e.platform === 'facebook').length;
    
    // App referrals
    const appCopy = analytics.filter(e => e.type === 'referral' && e.platform === 'copy_app').length;
    const appWhatsApp = analytics.filter(e => e.type === 'referral' && e.platform === 'whatsapp_app').length;
    const appTelegram = analytics.filter(e => e.type === 'referral' && e.platform === 'telegram_app').length;
    
    const appDetailCopy = analytics.filter(e => e.type === 'referral' && e.platform === 'copy_app_detail').length;
    const appDetailWhatsApp = analytics.filter(e => e.type === 'referral' && e.platform === 'whatsapp_app_detail').length;
    const appDetailTelegram = analytics.filter(e => e.type === 'referral' && e.platform === 'telegram_app_detail').length;

    const totalReferrals = refCopy + refWhatsApp + refTelegram + refFacebook + appCopy + appWhatsApp + appTelegram + appDetailCopy + appDetailWhatsApp + appDetailTelegram;

    const totalVisitors = analytics.filter(e => e.type === 'website_view').length;
    const uniqueVisitors = analytics.filter(e => e.type === 'visitor_unique').length;
    const detailClicks = analytics.filter(e => e.type === 'view').length;
    const downloadClicksCount = analytics.filter(e => e.type === 'download').length;
    const bannerClicks = analytics.filter(e => e.type === 'banner_click').length;
    const shareClicks = analytics.filter(e => e.type === 'referral').length;

    return { 
      dailyClicks, 
      weeklyClicks, 
      monthlyClicks, 
      topClicked, 
      topDownloaded,
      websiteViews,
      totalReferrals,
      refCopy,
      refWhatsApp,
      refTelegram,
      refFacebook,
      appCopy,
      appWhatsApp,
      appTelegram,
      appDetailCopy,
      appDetailWhatsApp,
      appDetailTelegram,
      totalVisitors,
      uniqueVisitors,
      detailClicks,
      downloadClicksCount,
      bannerClicks,
      shareClicks
    };
  };

  const stats = getAnalyticsStats();

  return (
    <div className="min-h-screen bg-[#05130b] text-green-50 font-sans flex flex-col">
      <Navbar />

      <main className="flex-1 flex flex-col md:flex-row pt-20">
        {/* Sidebar */}
        <aside className="w-full md:w-64 bg-[#071c10] border-r border-green-900/50 flex flex-col pt-6 pb-6">
          <div className="px-6 mb-8">
            <p className="text-xs font-bold text-green-100/40 uppercase tracking-widest mb-4">Management</p>
            <nav className="space-y-2">
              <button 
                onClick={() => window.open('/', '_blank')}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl font-medium transition-colors bg-[#0a2717] text-green-50 border border-green-800 hover:border-amber-500/50 hover:text-amber-400 mb-4"
              >
                <div className="flex items-center gap-3">
                  <ExternalLink size={18} /> Go To Website
                </div>
              </button>
              <button 
                onClick={() => { setActiveTab('dashboard'); setEditingGame(null); setIsAddingNew(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${
                  activeTab === 'dashboard' 
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' 
                    : 'text-green-100/70 hover:text-green-50 hover:bg-[#0a2717]'
                }`}
              >
                <LayoutDashboard size={18} /> Dashboard
              </button>
              <button 
                onClick={() => { setActiveTab('analytics'); setEditingGame(null); setIsAddingNew(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${
                  activeTab === 'analytics' 
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' 
                    : 'text-green-100/70 hover:text-green-50 hover:bg-[#0a2717]'
                }`}
              >
                <BarChart3 size={18} /> Analytics
              </button>
              <button 
                onClick={() => { setActiveTab('links'); setEditingGame(null); setIsAddingNew(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${
                  activeTab === 'links' 
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' 
                    : 'text-green-100/70 hover:text-green-50 hover:bg-[#0a2717]'
                }`}
              >
                <LinkIcon size={18} /> Edit Apps
              </button>
              <button 
                onClick={() => { setActiveTab('reports'); setEditingGame(null); setIsAddingNew(false); }}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-medium transition-colors ${
                  activeTab === 'reports' 
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' 
                    : 'text-green-100/70 hover:text-green-50 hover:bg-[#0a2717]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <AlertTriangle size={18} /> Link Reports
                </div>
                {reports.filter(r => r.status === 'unresolved').length > 0 && (
                  <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">
                    {reports.filter(r => r.status === 'unresolved').length}
                  </span>
                )}
              </button>
              <button 
                onClick={() => { setActiveTab('images'); setEditingGame(null); setIsAddingNew(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${
                  activeTab === 'images' 
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' 
                    : 'text-green-100/70 hover:text-green-50 hover:bg-[#0a2717]'
                }`}
              >
                <Upload size={18} /> Upload Images
              </button>
              <button 
                onClick={() => { setActiveTab('settings'); setEditingGame(null); setIsAddingNew(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${
                  activeTab === 'settings' 
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' 
                    : 'text-green-100/70 hover:text-green-50 hover:bg-[#0a2717]'
                }`}
              >
                <Settings size={18} /> AdSense & Banners
              </button>
              <button 
                onClick={() => { setActiveTab('ad_analytics'); setEditingGame(null); setIsAddingNew(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${
                  activeTab === 'ad_analytics' 
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' 
                    : 'text-green-100/70 hover:text-green-50 hover:bg-[#0a2717]'
                }`}
              >
                <Zap size={18} className="text-amber-500" /> Adsterra Performance
              </button>
              <button 
                onClick={() => { setActiveTab('seo'); setEditingGame(null); setIsAddingNew(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${
                  activeTab === 'seo' 
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' 
                    : 'text-green-100/70 hover:text-green-50 hover:bg-[#0a2717]'
                }`}
              >
                <FileText size={18} className="text-amber-500" /> SEO & Google Console
              </button>
            </nav>
          </div>

          <div className="mt-auto px-6">
            <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl font-medium transition-colors">
              <LogOut size={18} /> Logout
            </button>
          </div>
        </aside>

        {/* Content */}
        <div className="flex-1 p-6 md:p-10 overflow-auto">
          {activeTab === 'dashboard' ? (
            <>
              <header className="mb-10">
                <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Admin Dashboard</h1>
                <p className="text-green-100/60">Manage your casino directory listings, categories, and featured bonuses.</p>
              </header>

              {/* Stats Cards Dashboard */}
              <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-10">
                <div className="bg-[#071c10] border border-green-800 p-5 rounded-2xl shadow-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-[10px] font-bold text-green-100/50 uppercase tracking-wider">Total Visitors</h3>
                    <BarChart3 className="text-green-400" size={16} />
                  </div>
                  <p className="text-2xl font-extrabold text-white">{stats.totalVisitors}</p>
                  <p className="text-[10px] text-green-100/40 mt-1">Total page views</p>
                </div>
                <div className="bg-[#071c10] border border-green-800 p-5 rounded-2xl shadow-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-[10px] font-bold text-green-100/50 uppercase tracking-wider">Unique Visitors</h3>
                    <BarChart3 className="text-green-400" size={16} />
                  </div>
                  <p className="text-2xl font-extrabold text-[#22c55e]">{stats.uniqueVisitors}</p>
                  <p className="text-[10px] text-green-100/40 mt-1">24 Hr unique limit</p>
                </div>
                <div className="bg-[#071c10] border border-green-800 p-5 rounded-2xl shadow-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-[10px] font-bold text-green-100/50 uppercase tracking-wider">Detail Clicks</h3>
                    <Flame className="text-amber-500" size={16} />
                  </div>
                  <p className="text-2xl font-extrabold text-white">{stats.detailClicks}</p>
                  <p className="text-[10px] text-green-100/40 mt-1">Total popup views</p>
                </div>
                <div className="bg-[#071c10] border border-green-800 p-5 rounded-2xl shadow-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-[10px] font-bold text-green-100/50 uppercase tracking-wider">Download Clicks</h3>
                    <Download className="text-amber-400" size={16} />
                  </div>
                  <p className="text-2xl font-extrabold text-amber-400">{stats.downloadClicksCount}</p>
                  <p className="text-[10px] text-green-100/40 mt-1">Download buttons</p>
                </div>
                <div className="bg-[#071c10] border border-green-800 p-5 rounded-2xl shadow-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-[10px] font-bold text-green-100/50 uppercase tracking-wider">Banner Clicks</h3>
                    <ImageIcon className="text-amber-500" size={16} />
                  </div>
                  <p className="text-2xl font-extrabold text-white">{stats.bannerClicks}</p>
                  <p className="text-[10px] text-green-100/40 mt-1">Slideshow banner</p>
                </div>
                <div className="bg-[#071c10] border border-green-800 p-5 rounded-2xl shadow-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-[10px] font-bold text-green-100/50 uppercase tracking-wider">Share Clicks</h3>
                    <Crown className="text-amber-500" size={16} />
                  </div>
                  <p className="text-2xl font-extrabold text-amber-500">{stats.shareClicks}</p>
                  <p className="text-[10px] text-green-100/40 mt-1">Direct refer shares</p>
                </div>
              </div>

              {/* Clicks Per App Grid */}
              <div className="bg-[#071c10] border border-green-800 rounded-2xl p-6 mb-10 shadow-lg">
                <h2 className="text-lg font-bold text-white mb-4">Clicks Per App</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[300px] overflow-y-auto pr-2">
                  {[...games].sort((a,b) => b.clicks - a.clicks).map(g => (
                    <div key={g.id} className="bg-[#05130b] border border-green-900/60 p-4 rounded-xl flex items-center justify-between hover:border-amber-500/30 transition-all">
                      <div className="flex items-center gap-3 overflow-hidden">
                        {g.logoUrl ? (
                          <img src={g.logoUrl} className="w-10 h-10 rounded border border-green-800 object-cover shrink-0" alt="" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="w-10 h-10 rounded bg-[#071c10] border border-green-800 flex items-center justify-center shrink-0">
                            <ImageIcon size={16} className="text-green-100/30" />
                          </div>
                        )}
                        <div className="truncate">
                          <p className="font-bold text-sm text-white truncate">{g.title}</p>
                          <p className="text-xs text-green-100/40">{g.category}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0 ml-2">
                        <p className="font-extrabold text-amber-400 text-sm">{g.clicks + (g.downloadClicks || 0)}</p>
                        <p className="text-[10px] text-green-100/30">Tot Clicks</p>
                      </div>
                    </div>
                  ))}
                  {games.length === 0 && (
                    <div className="col-span-full py-6 text-center text-green-100/40 text-sm">
                      No apps tracking statistics yet.
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-[#061e11] border border-green-900 rounded-2xl p-8 text-center flex flex-col items-center justify-center min-h-[200px]">
                 <Database size={48} className="text-amber-500 mb-4" />
                 <h2 className="text-xl font-bold mb-2">Connected to Firebase</h2>
                 <p className="text-green-100/50 max-w-md">Data is persisting in Firebase Cloud Firestore. Switch to the "Edit Apps" tab to manage your affiliate URLs, edit bonuses, upload logos/banners, or add new apps.</p>
              </div>
            </>
          ) : activeTab === 'analytics' ? (
             <>
               <header className="mb-10">
                 <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Analytics</h1>
                 <p className="text-green-100/60 font-medium">Real-time performance metrics tracking total downloads, app card clicks, direct referral shares, and user engagement levels.</p>
               </header>

               <div className="grid grid-cols-2 lg:grid-cols-6 gap-6 mb-10">
                 <div className="bg-[#071c10] border border-green-800 p-6 rounded-2xl shadow-lg">
                   <h3 className="text-xs font-bold text-green-100/50 uppercase tracking-wider mb-1">Total Visitors</h3>
                   <p className="text-2xl font-extrabold text-white">{stats.totalVisitors}</p>
                 </div>
                 <div className="bg-[#071c10] border border-green-800 p-6 rounded-2xl shadow-lg">
                   <h3 className="text-xs font-bold text-green-100/50 uppercase tracking-wider mb-1">Unique Visitors</h3>
                   <p className="text-2xl font-extrabold text-[#22c55e]">{stats.uniqueVisitors}</p>
                 </div>
                 <div className="bg-[#071c10] border border-green-800 p-6 rounded-2xl shadow-lg">
                   <h3 className="text-xs font-bold text-green-100/50 uppercase tracking-wider mb-1">Detail Clicks</h3>
                   <p className="text-2xl font-extrabold text-white">{stats.detailClicks}</p>
                 </div>
                 <div className="bg-[#071c10] border border-green-800 p-6 rounded-2xl shadow-lg">
                   <h3 className="text-xs font-bold text-green-100/50 uppercase tracking-wider mb-1">Download Clicks</h3>
                   <p className="text-2xl font-extrabold text-amber-500">{stats.downloadClicksCount}</p>
                 </div>
                 <div className="bg-[#071c10] border border-green-800 p-6 rounded-2xl shadow-lg">
                   <h3 className="text-xs font-bold text-green-100/50 uppercase tracking-wider mb-1">Banner Clicks</h3>
                   <p className="text-2xl font-extrabold text-white">{stats.bannerClicks}</p>
                 </div>
                 <div className="bg-[#071c10] border border-green-800 p-6 rounded-2xl shadow-lg">
                   <h3 className="text-xs font-bold text-green-100/50 uppercase tracking-wider mb-1">Share Clicks</h3>
                   <p className="text-2xl font-extrabold text-amber-500">{stats.shareClicks}</p>
                 </div>
               </div>

               <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
                  <div className="bg-[#071c10] border border-green-800 rounded-2xl p-6 shadow-lg">
                     <h3 className="text-lg font-bold text-white mb-6">Top 10 Most Clicked Apps</h3>
                     <div className="space-y-4">
                        {stats.topClicked.map((app, index) => (
                           <div key={app.id} className="flex items-center justify-between border-b border-green-900/50 pb-4 last:border-0 last:pb-0">
                               <div className="flex items-center gap-3">
                                   <div className="w-8 h-8 rounded-full bg-green-900/40 text-green-400 flex items-center justify-center font-bold text-xs">{index + 1}</div>
                                   <div>
                                       <p className="font-bold text-white">{app.title}</p>
                                   </div>
                               </div>
                               <div className="text-right">
                                   <p className="font-bold text-green-50">{app.clicks}</p>
                                   <p className="text-xs text-green-100/40">clicks</p>
                               </div>
                           </div>
                        ))}
                     </div>
                  </div>

                  <div className="bg-[#071c10] border border-green-800 rounded-2xl p-6 shadow-lg">
                     <h3 className="text-lg font-bold text-white mb-6">Top 10 Most Downloaded</h3>
                     <div className="space-y-4">
                        {stats.topDownloaded.map((app, index) => (
                           <div key={app.id} className="flex items-center justify-between border-b border-amber-900/30 pb-4 last:border-0 last:pb-0">
                               <div className="flex items-center gap-3">
                                   <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs">{index + 1}</div>
                                   <div>
                                       <p className="font-bold text-white">{app.title}</p>
                                   </div>
                               </div>
                               <div className="text-right">
                                   <p className="font-bold text-amber-400">{app.downloadClicks || 0}</p>
                                   <p className="text-xs text-green-100/40">downloads</p>
                               </div>
                           </div>
                        ))}
                     </div>
                  </div>
               </div>

               <div className="bg-[#071c10] border border-green-800 rounded-2xl overflow-hidden shadow-lg overflow-x-auto">
                 <div className="min-w-[700px]">
                   <div className="grid grid-cols-12 gap-4 p-4 border-b border-green-800 bg-[#061e11] text-xs font-bold text-green-100/50 uppercase tracking-wider">
                     <div className="col-span-4">App Name</div>
                     <div className="col-span-2 text-center">Total Clicks</div>
                     <div className="col-span-3 text-center">Get App Clicks</div>
                     <div className="col-span-3 text-right">Last Click Time</div>
                   </div>
                   
                   <div className="divide-y divide-green-900">
                     {games.map(listing => (
                        <div key={listing.id} className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-[#0a2717] transition-colors">
                            <div className="col-span-4 font-bold text-white">
                               {listing.title}
                            </div>
                            <div className="col-span-2 text-center font-bold text-green-100">{listing.clicks}</div>
                            <div className="col-span-3 text-center font-bold text-amber-400">{listing.downloadClicks || 0}</div>
                            <div className="col-span-3 text-right text-sm text-green-100/60">
                               {listing.lastClickTime ? new Date(listing.lastClickTime).toLocaleString() : 'Never'}
                            </div>
                        </div>
                     ))}
                   </div>
                 </div>
               </div>
             </>
          ) : activeTab === 'images' ? (
            <>
              <header className="mb-10">
                <h1 className="text-3xl font-bold tracking-tight text-white mb-2">General Images Upload</h1>
                <p className="text-green-100/60">Upload screenshots, logos, banner images, or anything else you'd like to use in your listings. These are converted to highly optimized Base64 strings, perfectly suited for free, serverless databases with zero hosting costs.</p>
              </header>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Image Upload Input */}
                <div className="lg:col-span-1 bg-[#071c10] border border-green-800 p-6 rounded-2xl h-fit">
                  <h3 className="text-lg font-bold text-white mb-4">Upload New Image</h3>
                  <ImageUploader 
                    label="Drop or Click to Upload"
                    value=""
                    aspectRatio="rect"
                    onChange={async (url) => {
                      if (url) {
                        const newList = [url, ...uploadedImages];
                        setUploadedImages(newList);
                        await saveUploadedImages(newList);
                      }
                    }}
                    description="Supports png, jpg, jpeg. Resized & compressed automatically."
                  />
                  <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-400">
                    Once uploaded, you can copy the image data as a Base64 string and paste it into the Logo URL or Banner URL input field of any app listing!
                  </div>
                </div>

                {/* Uploaded Images Gallery */}
                <div className="lg:col-span-2 bg-[#071c10] border border-green-800 p-6 rounded-2xl">
                  <h3 className="text-lg font-bold text-white mb-6">Your Image Assets Library</h3>
                  
                  {uploadedImages.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {uploadedImages.map((img, i) => (
                        <div key={i} className="bg-[#05130b] border border-green-900 rounded-xl overflow-hidden p-3 relative flex flex-col justify-between">
                          <img src={img} alt="Asset" className="max-h-32 object-contain mx-auto rounded border border-green-900 bg-noise mb-3" referrerPolicy="no-referrer" />
                          
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(img);
                                setCopiedIndex(i);
                                setTimeout(() => setCopiedIndex(null), 2000);
                              }}
                              className="flex-1 py-1.5 text-xs font-bold leading-none bg-amber-500 hover:bg-amber-400 text-[#092212] rounded-lg transition-all flex items-center justify-center gap-1"
                            >
                              {copiedIndex === i ? (
                                <><Check size={12} /> Copied!</>
                              ) : (
                                <><Copy size={12} /> Copy Image URL</>
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={async () => {
                                if (confirm("Are you sure you want to delete this asset?")) {
                                  try {
                                    await deleteStorageFile(img);
                                  } catch (err) {
                                    console.error("Storage delete failed:", err);
                                  }
                                  const newList = uploadedImages.filter((_, iIdx) => iIdx !== i);
                                  setUploadedImages(newList);
                                  await saveUploadedImages(newList);
                                }
                              }}
                              className="p-1 px-2.5 text-xs font-bold bg-red-500 hover:bg-red-400 text-white rounded-lg transition-all"
                              title="Delete Asset"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-20 border-2 border-dashed border-green-900 rounded-xl">
                      <ImageIcon className="text-green-100/20 mx-auto mb-4" size={48} />
                      <p className="text-sm text-green-100/50">Your image assets library is empty. Upload your first general asset in the sidebar container.</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : activeTab === 'settings' ? (
             <>
               <header className="mb-10">
                 <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Website Configuration & Branding</h1>
                 <p className="text-green-100/60 font-medium">Manage your website dynamic branding, administrator account, Google AdSense ads, and homepage slideshow banners.</p>
               </header>

               <div className="space-y-8">
                 {/* Row 1: Branding & Admin Account */}
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Website Branding Manager */}
                    <div className="bg-[#071c10] border border-green-800 p-6 rounded-2xl shadow-lg relative h-fit">
                      <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                        <Crown className="text-amber-500" size={18} /> Website Branding Manager
                      </h3>
                      <p className="text-green-100/50 text-xs mb-6">Customize your website title name, dynamic navigation logo, and browser bookmark icon.</p>
                      
                      {settings ? (
                        <div className="space-y-4">
                          <div>
                            <label className="block text-xs font-bold text-green-100/60 uppercase tracking-wider mb-1.5">Website Display Name</label>
                            <input 
                              type="text"
                              value={settings.siteName || ''}
                              onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                              placeholder="e.g. Play777Zone"
                              className="w-full bg-[#05130b] border border-green-900 rounded-xl p-3 text-xs text-green-50 focus:border-amber-500/50 outline-none"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-green-100/60 uppercase tracking-wider mb-1.5">Website Logo</label>
                            <ImageUploader 
                              label="Drop or Click to Upload Logo"
                              description="Recommended: horizontal transparent PNG (e.g. 180x40 px)"
                              aspectRatio="rect"
                              value={settings.logoUrl}
                              onChange={async (url) => {
                                const updated = { ...settings, logoUrl: url };
                                setSettings(updated);
                                try {
                                  await saveSettings(updated);
                                } catch (e) {
                                  console.error("Failed to auto-save website logo:", e);
                                }
                              }}
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-green-100/60 uppercase tracking-wider mb-1.5">Website Favicon</label>
                            <ImageUploader 
                              label="Drop or Click to Upload Favicon"
                              description="Recommended: small square PNG/ICO (e.g. 32x32 px)"
                              aspectRatio="square"
                              value={settings.faviconUrl}
                              onChange={async (url) => {
                                const updated = { ...settings, faviconUrl: url };
                                setSettings(updated);
                                try {
                                  await saveSettings(updated);
                                } catch (e) {
                                  console.error("Failed to auto-save website favicon:", e);
                                }
                              }}
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-bold text-green-100/60 uppercase tracking-wider mb-1.5">Cloudinary Cloud Name</label>
                              <input 
                                type="text"
                                value={settings.cloudinaryCloudName || ''}
                                onChange={(e) => setSettings({ ...settings, cloudinaryCloudName: e.target.value })}
                                placeholder="e.g. dkafy9b8g"
                                className="w-full bg-[#05130b] border border-green-900 rounded-xl p-3 text-xs text-green-50 focus:border-amber-500/50 outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-green-100/60 uppercase tracking-wider mb-1.5">Cloudinary Upload Preset</label>
                              <input 
                                type="text"
                                value={settings.cloudinaryUploadPreset || ''}
                                onChange={(e) => setSettings({ ...settings, cloudinaryUploadPreset: e.target.value })}
                                placeholder="e.g. unsigned_preset"
                                className="w-full bg-[#05130b] border border-green-900 rounded-xl p-3 text-xs text-green-50 focus:border-amber-500/50 outline-none"
                              />
                            </div>
                          </div>
                          
                          <button
                            type="button"
                            onClick={async () => {
                              setIsSavingSettings(true);
                              try {
                                await saveSettings(settings);
                                alert("Website branding configuration saved successfully!");
                              } catch (e) {
                                alert("Failed to save branding. Please try again.");
                              } finally {
                                setIsSavingSettings(false);
                              }
                            }}
                            disabled={isSavingSettings}
                            className="w-full py-3 bg-gradient-to-t from-amber-600 to-amber-500 text-[#05130b] hover:from-amber-500 hover:to-amber-400 font-extrabold rounded-xl text-xs uppercase tracking-wider transition-all shadow-md mt-2"
                          >
                            {isSavingSettings ? 'Saving Branding...' : 'Save Branding Config'}
                          </button>
                        </div>
                      ) : (
                        <div className="py-12 text-center text-sm text-green-100/40">Loading settings...</div>
                      )}
                    </div>

                    {/* Column 2: Administrator & Multi-Admin Section */}
                    <div className="space-y-8">
                      {/* Administrator Account Manager */}
                      <div className="bg-[#071c10] border border-green-800 p-6 rounded-2xl shadow-lg relative h-fit">
                        <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                          <Lock className="text-amber-500" size={18} /> Administrator Account
                        </h3>
                        <p className="text-green-100/50 text-xs mb-6">Modify the master administrator login email address, custom username, and password.</p>
                        
                        <div className="space-y-4">
                          <div>
                            <label className="block text-xs font-bold text-green-100/60 uppercase tracking-wider mb-1.5">Admin Login Email</label>
                            <input 
                              type="email"
                              value={adminFormEmail}
                              onChange={(e) => setAdminFormEmail(e.target.value)}
                              placeholder="dilshadmohammed887@gmail.com"
                              className="w-full bg-[#05130b] border border-green-900 rounded-xl p-3 text-xs text-green-50 focus:border-amber-500/50 outline-none"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-green-100/60 uppercase tracking-wider mb-1.5">Admin Username</label>
                            <input 
                              type="text"
                              value={adminFormUsername}
                              onChange={(e) => setAdminFormUsername(e.target.value)}
                              placeholder="admin"
                              className="w-full bg-[#05130b] border border-green-900 rounded-xl p-3 text-xs text-green-50 focus:border-amber-500/50 outline-none"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-green-100/60 uppercase tracking-wider mb-1.5">New Account Password</label>
                            <input 
                              type="password"
                              value={adminFormPassword}
                              onChange={(e) => setAdminFormPassword(e.target.value)}
                              placeholder="••••••••"
                              className="w-full bg-[#05130b] border border-green-900 rounded-xl p-3 text-xs text-green-50 focus:border-amber-500/50 outline-none"
                            />
                            <p className="text-[10px] text-green-100/40 mt-1">Leave empty to keep your existing secure password.</p>
                          </div>

                          <button
                            type="button"
                            onClick={async () => {
                              if (!adminFormEmail.trim()) {
                                alert("Please enter a valid administrator email address.");
                                return;
                              }
                              setIsSavingAdminAcc(true);
                              try {
                                // 1. Save config to Firestore
                                const updatedSettings = {
                                  ...settings!,
                                  adminEmail: adminFormEmail.trim(),
                                  adminUsername: adminFormUsername.trim()
                                };
                                await saveSettings(updatedSettings);
                                setSettings(updatedSettings);

                                // 2. Update Firebase Auth user
                                const user = auth.currentUser;
                                if (user) {
                                  if (user.email !== adminFormEmail.trim()) {
                                    try {
                                      await updateEmail(user, adminFormEmail.trim());
                                    } catch (emailErr: any) {
                                      console.warn("Could not update auth email (requires recent login).", emailErr);
                                    }
                                  }
                                  if (adminFormPassword.trim()) {
                                    try {
                                      await updatePassword(user, adminFormPassword.trim());
                                    } catch (passErr: any) {
                                      console.warn("Could not update auth password (requires recent login).", passErr);
                                    }
                                  }
                                }

                                alert("Administrator account credentials updated and saved successfully!");
                                setAdminFormPassword('');
                              } catch (e: any) {
                                alert("Failed to update administrator account: " + e.message);
                              } finally {
                                setIsSavingAdminAcc(false);
                              }
                            }}
                            disabled={isSavingAdminAcc || !settings}
                            className="w-full py-3 bg-gradient-to-t from-emerald-600 to-emerald-500 text-white hover:from-emerald-500 hover:to-emerald-400 font-extrabold rounded-xl text-xs uppercase tracking-wider transition-all shadow-md mt-2"
                          >
                            {isSavingAdminAcc ? 'Saving Credentials...' : 'Update Account Credentials'}
                          </button>
                        </div>
                      </div>

                      {/* Multi-Admin Management Card */}
                      <div className="bg-[#071c10] border border-green-800 p-6 rounded-2xl shadow-lg relative h-fit">
                        <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                          <Users className="text-amber-500" size={18} /> Manage Administrators
                        </h3>
                        <p className="text-green-100/50 text-xs mb-6">Create, edit, delete, or disable secondary administrator accounts.</p>
                        
                        {/* Form */}
                        <div className="bg-[#05130b] border border-green-900/60 p-4 rounded-xl mb-6 space-y-4">
                          <h4 className="text-xs font-bold text-amber-500 uppercase tracking-widest flex items-center gap-1.5">
                            <UserPlus size={14} /> {isEditingAdmin ? 'Edit Administrator' : 'Add New Administrator'}
                          </h4>
                          
                          <div>
                            <label className="block text-[10px] font-bold text-green-100/60 uppercase mb-1">Email Address</label>
                            <input 
                              type="email"
                              value={multiAdminFormEmail}
                              onChange={(e) => setMultiAdminFormEmail(e.target.value)}
                              disabled={isEditingAdmin}
                              placeholder="admin2@play777zone.com"
                              className="w-full bg-[#071c10] border border-green-900 rounded-lg p-2.5 text-xs text-green-50 outline-none focus:border-amber-500/40 disabled:opacity-50"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-green-100/60 uppercase mb-1">Username</label>
                            <input 
                              type="text"
                              value={multiAdminFormUsername}
                              onChange={(e) => setMultiAdminFormUsername(e.target.value)}
                              placeholder="john_doe"
                              className="w-full bg-[#071c10] border border-green-900 rounded-lg p-2.5 text-xs text-green-50 outline-none focus:border-amber-500/40"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-green-100/60 uppercase mb-1">
                              {isEditingAdmin ? 'New Password (Leave blank to keep current)' : 'Password'}
                            </label>
                            <input 
                              type="password"
                              value={multiAdminFormPassword}
                              onChange={(e) => setMultiAdminFormPassword(e.target.value)}
                              placeholder={isEditingAdmin ? '••••••••' : 'Enter account password...'}
                              className="w-full bg-[#071c10] border border-green-900 rounded-lg p-2.5 text-xs text-green-50 outline-none focus:border-amber-500/40"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-green-100/60 uppercase mb-1">Status</label>
                            <select
                              value={multiAdminFormStatus}
                              onChange={(e) => setMultiAdminFormStatus(e.target.value)}
                              className="w-full bg-[#071c10] border border-green-900 rounded-lg p-2.5 text-xs text-green-50 outline-none focus:border-amber-500/40"
                            >
                              <option value="active">Active</option>
                              <option value="disabled">Disabled</option>
                            </select>
                          </div>

                          <div className="flex gap-2 pt-2">
                            {isEditingAdmin && (
                              <button
                                type="button"
                                onClick={() => {
                                  setIsEditingAdmin(false);
                                  setEditingAdminEmail('');
                                  setMultiAdminFormEmail('');
                                  setMultiAdminFormUsername('');
                                  setMultiAdminFormPassword('');
                                  setMultiAdminFormStatus('active');
                                }}
                                className="px-4 py-2 bg-green-900/40 text-green-100/70 hover:bg-green-900/60 font-bold rounded-lg text-xs uppercase tracking-wider transition-colors shrink-0"
                              >
                                Cancel
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={async () => {
                                const emailVal = multiAdminFormEmail.trim().toLowerCase();
                                const userVal = multiAdminFormUsername.trim();
                                const passVal = multiAdminFormPassword.trim();

                                if (!emailVal) {
                                  alert("Please enter a valid email address.");
                                  return;
                                }
                                if (!userVal) {
                                  alert("Please enter a custom username.");
                                  return;
                                }
                                if (!isEditingAdmin && !passVal) {
                                  alert("Please enter a login password.");
                                  return;
                                }

                                setIsSavingAdmin(true);
                                try {
                                  if (isEditingAdmin) {
                                    // Update existing admin
                                    const existing = adminsList.find(a => a.email === editingAdminEmail);
                                    const passwordToSave = passVal ? passVal : (existing?.password || '');
                                    
                                    await saveAdminDoc(editingAdminEmail, userVal, passwordToSave, multiAdminFormStatus === 'disabled');
                                    
                                    // Keep Firebase Auth password updated securely using old password fallback helper
                                    if (passVal && existing?.password) {
                                      try {
                                        // Dynamically update the credentials inside Firebase Auth
                                        const tempAppName = "TempAdminUpdateApp_" + Date.now();
                                        const { initializeApp, deleteApp } = await import('firebase/app');
                                        const { getAuth, signInWithEmailAndPassword, updatePassword, createUserWithEmailAndPassword } = await import('firebase/auth');
                                        const firebaseConfig = await import('../../firebase-applet-config.json');
                                        const tempApp = initializeApp(firebaseConfig.default, tempAppName);
                                        const tempAuth = getAuth(tempApp);
                                        try {
                                          await signInWithEmailAndPassword(tempAuth, editingAdminEmail, existing.password);
                                          if (tempAuth.currentUser) {
                                            await updatePassword(tempAuth.currentUser, passVal);
                                          }
                                        } catch (authErr) {
                                          console.warn("Could not sign-in to temp auth to update password. Attempting self-healing signup.", authErr);
                                          try {
                                            await createUserWithEmailAndPassword(tempAuth, editingAdminEmail, passVal);
                                          } catch (signupErr) {
                                            console.error("Self-healing signup also failed:", signupErr);
                                          }
                                        }
                                        await deleteApp(tempApp);
                                      } catch (secErr) {
                                        console.error("Secondary Auth password adjustment failed:", secErr);
                                      }
                                    }

                                    alert("Administrator updated successfully!");
                                  } else {
                                    // Create new admin
                                    // 1. Create in Firebase Auth using temporary app instance
                                    try {
                                      const tempAppName = "TempAdminCreateApp_" + Date.now();
                                      const { initializeApp, deleteApp } = await import('firebase/app');
                                      const { getAuth, createUserWithEmailAndPassword } = await import('firebase/auth');
                                      const firebaseConfig = await import('../../firebase-applet-config.json');
                                      const tempApp = initializeApp(firebaseConfig.default, tempAppName);
                                      const tempAuth = getAuth(tempApp);
                                      await createUserWithEmailAndPassword(tempAuth, emailVal, passVal);
                                      await deleteApp(tempApp);
                                    } catch (authErr: any) {
                                      if (authErr.code !== 'auth/email-already-in-use') {
                                        console.warn("Error registering in Firebase Auth via temp app. Fallback will auto-register on first sign-in:", authErr.message);
                                      }
                                    }

                                    // 2. Save document to Firestore
                                    await saveAdminDoc(emailVal, userVal, passVal, multiAdminFormStatus === 'disabled');
                                    alert("New administrator added successfully!");
                                  }

                                  // Reset form & reload list
                                  setIsEditingAdmin(false);
                                  setEditingAdminEmail('');
                                  setMultiAdminFormEmail('');
                                  setMultiAdminFormUsername('');
                                  setMultiAdminFormPassword('');
                                  setMultiAdminFormStatus('active');
                                  
                                  const updatedList = await getAdmins();
                                  setAdminsList(updatedList || []);
                                } catch (e: any) {
                                  alert("Failed to save administrator: " + e.message);
                                } finally {
                                  setIsSavingAdmin(false);
                                }
                              }}
                              disabled={isSavingAdmin}
                              className="w-full py-2 bg-gradient-to-t from-amber-600 to-amber-500 text-[#05130b] hover:from-amber-500 hover:to-amber-400 font-extrabold rounded-lg text-xs uppercase tracking-wider transition-colors shadow-md flex items-center justify-center gap-1.5"
                            >
                              {isSavingAdmin ? 'Saving Admin...' : isEditingAdmin ? 'Update Administrator' : 'Add Administrator'}
                            </button>
                          </div>
                        </div>

                        {/* List */}
                        <div className="space-y-3">
                          <h4 className="text-xs font-bold text-green-100/60 uppercase tracking-widest">Registered Admins ({adminsList.length})</h4>
                          {adminsList.length === 0 ? (
                            <p className="text-xs text-green-100/30 italic py-2">No secondary administrators configured yet.</p>
                          ) : (
                            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                              {adminsList.map((admin) => (
                                <div key={admin.email} className={`bg-[#05130b] border ${admin.disabled ? 'border-red-950/40 bg-red-950/5' : 'border-green-900/40'} p-3 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors`}>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <p className="text-xs text-white font-bold">{admin.username}</p>
                                      {admin.disabled ? (
                                        <span className="text-[9px] font-extrabold bg-red-500/10 text-red-400 border border-red-500/20 rounded-full px-2 py-0.5 uppercase tracking-wide flex items-center gap-1">
                                          <ShieldAlert size={10} /> Disabled
                                        </span>
                                      ) : (
                                        <span className="text-[9px] font-extrabold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full px-2 py-0.5 uppercase tracking-wide flex items-center gap-1">
                                          <ShieldCheck size={10} /> Active
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-[10px] text-green-100/40 truncate mt-0.5">{admin.email}</p>
                                  </div>

                                  <div className="flex items-center gap-2 sm:self-center">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setIsEditingAdmin(true);
                                        setEditingAdminEmail(admin.email);
                                        setMultiAdminFormEmail(admin.email);
                                        setMultiAdminFormUsername(admin.username || '');
                                        setMultiAdminFormPassword(''); // Let them leave it blank to keep current
                                        setMultiAdminFormStatus(admin.disabled ? 'disabled' : 'active');
                                      }}
                                      className="p-1.5 text-green-400 hover:text-green-300 hover:bg-green-500/10 rounded-lg transition-colors"
                                      title="Edit Admin"
                                    >
                                      <Edit size={14} />
                                    </button>

                                    <button
                                      type="button"
                                      onClick={async () => {
                                        const newStatus = !admin.disabled;
                                        if (confirm(`Are you sure you want to ${newStatus ? 'disable' : 'enable'} the admin account for "${admin.username}"?`)) {
                                          try {
                                            await saveAdminDoc(admin.email, admin.username, admin.password, newStatus);
                                            const updatedList = await getAdmins();
                                            setAdminsList(updatedList || []);
                                          } catch (e: any) {
                                            alert("Failed to toggle admin state: " + e.message);
                                          }
                                        }
                                      }}
                                      className={`p-1.5 rounded-lg transition-colors ${admin.disabled ? 'text-amber-500 hover:bg-amber-500/10' : 'text-red-500 hover:bg-red-500/10'}`}
                                      title={admin.disabled ? 'Enable Admin' : 'Disable Admin'}
                                    >
                                      {admin.disabled ? <ShieldCheck size={14} /> : <ShieldAlert size={14} />}
                                    </button>

                                    <button
                                      type="button"
                                      onClick={async () => {
                                        if (confirm(`CRITICAL WARNING: Are you sure you want to completely DELETE the admin account for "${admin.username}"? This action cannot be undone.`)) {
                                          try {
                                            // 1. Delete from Firebase Auth if password exists
                                            if (admin.password) {
                                              try {
                                                const tempAppName = "TempAdminDeleteApp_" + Date.now();
                                                const { initializeApp, deleteApp } = await import('firebase/app');
                                                const { getAuth, signInWithEmailAndPassword } = await import('firebase/auth');
                                                const firebaseConfig = await import('../../firebase-applet-config.json');
                                                const tempApp = initializeApp(firebaseConfig.default, tempAppName);
                                                const tempAuth = getAuth(tempApp);
                                                await signInWithEmailAndPassword(tempAuth, admin.email, admin.password);
                                                if (tempAuth.currentUser) {
                                                  await tempAuth.currentUser.delete();
                                                }
                                                await deleteApp(tempApp);
                                              } catch (authErr) {
                                                console.warn("Could not delete from auth via temp app:", authErr);
                                              }
                                            }

                                            // 2. Delete from Firestore
                                            await deleteAdminDoc(admin.email);
                                            alert("Administrator account completely deleted.");

                                            const updatedList = await getAdmins();
                                            setAdminsList(updatedList || []);
                                          } catch (e: any) {
                                            alert("Failed to delete admin: " + e.message);
                                          }
                                        }
                                      }}
                                      className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                                      title="Delete Admin"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                 </div>

                 {/* Row 2: AdSense & Carousel Banners */}
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                   {/* AdSense configuration column */}
                   <div className="bg-[#071c10] border border-green-800 p-6 rounded-2xl shadow-lg relative h-fit">
                      <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <Settings className="text-amber-500" size={18} /> AdSense Code Manager
                      </h3>
                      
                      {settings ? (
                        <div className="space-y-4">
                          <div className="bg-[#05130b] p-4 rounded-xl border border-green-900/50">
                            <label className="flex items-center gap-2.5 text-xs font-bold text-green-100/80 uppercase tracking-wider cursor-pointer">
                              <input 
                                type="checkbox" 
                                checked={settings.adsenseEnabled}
                                onChange={(e) => setSettings({ ...settings, adsenseEnabled: e.target.checked })}
                                className="accent-amber-500 rounded w-4 h-4 cursor-pointer"
                              />
                              <span>Enable Google AdSense Ads</span>
                            </label>
                            <p className="text-[10px] text-green-100/40 mt-1.5 ml-6">Toggle ads display globally across the entire directory website.</p>
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-green-100/60 uppercase tracking-wider mb-1.5">Global Website Referral Base URL (Optional)</label>
                            <input 
                              type="text"
                              value={settings.websiteReferralUrl || ''}
                              onChange={(e) => setSettings({ ...settings, websiteReferralUrl: e.target.value })}
                              placeholder="e.g. https://yourreferraldomain.com"
                              className="w-full bg-[#05130b] border border-green-900 rounded-xl p-3 text-xs text-green-50 focus:border-amber-500/50 outline-none"
                            />
                            <p className="text-[10px] text-green-100/40 mt-1">If left blank, defaults to current address: {window.location.origin}</p>
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-green-100/60 uppercase tracking-wider mb-1.5">Top Banner Ad Code</label>
                            <textarea 
                              rows={3}
                              value={settings.adsenseTopCode}
                              onChange={(e) => setSettings({ ...settings, adsenseTopCode: e.target.value })}
                              placeholder="Paste AdSense HTML/JS snippet here"
                              className="w-full bg-[#05130b] border border-green-900 rounded-xl p-3 text-xs text-green-50 focus:border-amber-500/50 outline-none font-mono"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-green-100/60 uppercase tracking-wider mb-1.5">Middle Ad Code</label>
                            <textarea 
                              rows={3}
                              value={settings.adsenseMiddleCode}
                              onChange={(e) => setSettings({ ...settings, adsenseMiddleCode: e.target.value })}
                              placeholder="Paste AdSense HTML/JS snippet here"
                              className="w-full bg-[#05130b] border border-green-900 rounded-xl p-3 text-xs text-green-50 focus:border-amber-500/50 outline-none font-mono"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-green-100/60 uppercase tracking-wider mb-1.5">Bottom Footer Ad Code</label>
                            <textarea 
                              rows={3}
                              value={settings.adsenseBottomCode}
                              onChange={(e) => setSettings({ ...settings, adsenseBottomCode: e.target.value })}
                              placeholder="Paste AdSense HTML/JS snippet here"
                              className="w-full bg-[#05130b] border border-green-900 rounded-xl p-3 text-xs text-green-50 focus:border-amber-500/50 outline-none font-mono"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-green-100/60 uppercase tracking-wider mb-1.5">App Details Overlay Ad Code</label>
                            <textarea 
                              rows={3}
                              value={settings.adsenseDetailsCode}
                              onChange={(e) => setSettings({ ...settings, adsenseDetailsCode: e.target.value })}
                              placeholder="Paste AdSense HTML/JS snippet here"
                              className="w-full bg-[#05130b] border border-green-900 rounded-xl p-3 text-xs text-green-50 focus:border-amber-500/50 outline-none font-mono"
                            />
                          </div>

                          <button
                            type="button"
                            onClick={async () => {
                              setIsSavingSettings(true);
                              try {
                                await saveSettings(settings);
                                alert("Settings saved successfully to Firestore!");
                              } catch (e) {
                                alert("Failed to save settings. Please try again.");
                              } finally {
                                setIsSavingSettings(false);
                              }
                            }}
                            disabled={isSavingSettings}
                            className="w-full py-3.5 bg-gradient-to-t from-amber-600 to-amber-500 disabled:opacity-50 text-[#05130b] hover:from-amber-500 hover:to-amber-400 font-extrabold rounded-xl text-xs uppercase tracking-wider transition-all shadow-md mt-4"
                          >
                            {isSavingSettings ? 'Saving Settings...' : 'Save AdSense Settings'}
                          </button>
                        </div>
                      ) : (
                        <div className="py-12 text-center text-sm text-green-100/40">Loading settings...</div>
                      )}
                   </div>

                   {/* Banners slider manager column */}
                   <div className="bg-[#071c10] border border-green-800 p-6 rounded-2xl shadow-lg flex flex-col justify-between h-fit">
                      <div>
                        <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                          <ImageIcon className="text-amber-500" size={18} /> Homepage Banner Manager
                        </h3>
                        <p className="text-green-100/50 text-xs mb-6">Upload decorative landscape banners displayed inside the carousel slideshow at the top of your homepage.</p>
                        
                        <div className="space-y-6">
                          <div>
                            <label className="block text-xs font-bold text-green-100/60 uppercase tracking-wider mb-2">Upload Slide Banner Image</label>
                            <ImageUploader 
                              label="Drop or Click to Upload Banner"
                              description="High-resolution landscape (e.g. 1200x400 px) recommended"
                              aspectRatio="rect"
                              value={selectedBannerBase64}
                              onChange={(url) => setSelectedBannerBase64(url)}
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-green-100/60 uppercase tracking-wider mb-1.5">Click URL Redirect (Optional)</label>
                            <input 
                              type="text"
                              value={newBannerClickUrl}
                              onChange={(e) => setNewBannerClickUrl(e.target.value)}
                              placeholder="e.g. https://yourcasinoapp.com/signup"
                              className="w-full bg-[#05130b] border border-green-900 rounded-xl p-3 text-xs text-green-50 focus:border-amber-500/50 outline-none"
                            />
                            <p className="text-[10px] text-green-100/40 mt-1">If set, clicking the banner will open this custom page, app or affiliate link inside a new window.</p>
                          </div>

                          <button
                            type="button"
                            onClick={async () => {
                              if (!selectedBannerBase64) {
                                alert("Please select or drop a banner image first.");
                                return;
                              }
                              if (settings) {
                                const newSlide = { imageUrl: selectedBannerBase64, clickUrl: newBannerClickUrl };
                                const newBanners = [...settings.homepageBanners, newSlide];
                                const updated = { ...settings, homepageBanners: newBanners };
                                setSettings(updated);
                                setIsSavingSettings(true);
                                try {
                                  await saveSettings(updated);
                                  alert("Banner slide added and saved successfully!");
                                  setSelectedBannerBase64('');
                                  setNewBannerClickUrl('');
                                } catch (e) {
                                  alert("Failed to save banner settings. Please try again.");
                                } finally {
                                  setIsSavingSettings(false);
                                }
                              }
                            }}
                            disabled={isSavingSettings || !selectedBannerBase64}
                            className="w-full py-3 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-[#05130b] font-extrabold rounded-xl text-xs uppercase tracking-wider transition-all"
                          >
                            Add Banner Slide
                          </button>

                          {settings && settings.homepageBanners.length > 0 && (
                            <div className="mt-6 border-t border-green-900/45 pt-6">
                              <h4 className="text-xs font-bold text-amber-500 uppercase tracking-widest mb-3">Live Slide Banners ({settings.homepageBanners.length})</h4>
                              <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                                {settings.homepageBanners.map((slide, sIdx) => {
                                  const bannerUrl = typeof slide === 'string' ? slide : slide?.imageUrl || '';
                                  const bannerClickUrl = typeof slide === 'string' ? '' : slide?.clickUrl || '';
                                  const isDisabled = typeof slide === 'string' ? false : !!slide?.disabled;
                                  return (
                                    <div key={sIdx} className="bg-[#05130b] border border-green-905 p-3 rounded-xl relative flex items-center justify-between gap-3">
                                      <div className="flex items-center gap-3 overflow-hidden">
                                        <img src={bannerUrl} className={`w-16 h-8 rounded object-cover border border-green-850 shrink-0 ${isDisabled ? 'opacity-40 grayscale' : ''}`} alt="" referrerPolicy="no-referrer" />
                                        <div className="truncate">
                                          <p className={`text-xs font-bold truncate ${isDisabled ? 'text-green-100/30 line-through' : 'text-white'}`}>
                                            Banner Slide #{sIdx + 1} {isDisabled && <span className="text-[9px] bg-red-950 text-red-400 px-1 py-0.5 rounded ml-1 font-normal border border-red-900/30">Disabled</span>}
                                          </p>
                                          <p className="text-[10px] text-green-100/40 truncate">
                                            {bannerClickUrl ? `Redirect: ${bannerClickUrl}` : 'Home top slot slider'}
                                          </p>
                                        </div>
                                      </div>
                                      
                                      <div className="flex items-center gap-1.5 shrink-0">
                                        {/* Reordering Controls */}
                                        {sIdx > 0 && (
                                          <button
                                            type="button"
                                            onClick={async () => {
                                              const list = [...settings.homepageBanners];
                                              const temp = list[sIdx];
                                              list[sIdx] = list[sIdx - 1];
                                              list[sIdx - 1] = temp;
                                              const updated = { ...settings, homepageBanners: list };
                                              setSettings(updated);
                                              setIsSavingSettings(true);
                                              try {
                                                await saveSettings(updated);
                                              } catch (e) {
                                                console.error("Failed to reorder banner:", e);
                                              } finally {
                                                setIsSavingSettings(false);
                                              }
                                            }}
                                            className="p-1.5 text-green-100/50 hover:text-amber-400 hover:bg-green-500/10 rounded transition-colors"
                                            title="Move Up"
                                          >
                                            <ArrowUp size={13} />
                                          </button>
                                        )}
                                        {sIdx < settings.homepageBanners.length - 1 && (
                                          <button
                                            type="button"
                                            onClick={async () => {
                                              const list = [...settings.homepageBanners];
                                              const temp = list[sIdx];
                                              list[sIdx] = list[sIdx + 1];
                                              list[sIdx + 1] = temp;
                                              const updated = { ...settings, homepageBanners: list };
                                              setSettings(updated);
                                              setIsSavingSettings(true);
                                              try {
                                                await saveSettings(updated);
                                              } catch (e) {
                                                console.error("Failed to reorder banner:", e);
                                              } finally {
                                                setIsSavingSettings(false);
                                              }
                                            }}
                                            className="p-1.5 text-green-100/50 hover:text-amber-400 hover:bg-green-500/10 rounded transition-colors"
                                            title="Move Down"
                                          >
                                            <ArrowDown size={13} />
                                          </button>
                                        )}

                                        {/* Toggle Active/Disabled Status */}
                                        <button
                                          type="button"
                                          onClick={async () => {
                                            const list = [...settings.homepageBanners];
                                            const current = list[sIdx];
                                            const updatedSlide = typeof current === 'string' 
                                              ? { imageUrl: current, clickUrl: '', disabled: true }
                                              : { ...current, disabled: !current.disabled };
                                            list[sIdx] = updatedSlide;
                                            const updated = { ...settings, homepageBanners: list };
                                            setSettings(updated);
                                            setIsSavingSettings(true);
                                            try {
                                              await saveSettings(updated);
                                            } catch (e) {
                                              console.error("Failed to toggle banner status:", e);
                                            } finally {
                                              setIsSavingSettings(false);
                                            }
                                          }}
                                          className={`p-1.5 rounded-lg transition-colors ${
                                            isDisabled 
                                              ? 'text-red-400 hover:bg-red-500/10' 
                                              : 'text-green-400 hover:bg-green-500/10'
                                          }`}
                                          title={isDisabled ? "Enable Slide Banner" : "Disable Slide Banner"}
                                        >
                                          {isDisabled ? <EyeOff size={14} /> : <Eye size={14} />}
                                        </button>

                                        {/* Delete Button */}
                                        <button
                                          type="button"
                                          onClick={async () => {
                                            if (confirm("Are you sure you want to delete this banner slide?")) {
                                              const targetBanner = settings.homepageBanners[sIdx];
                                              const targetUrl = typeof targetBanner === 'string' ? targetBanner : targetBanner?.imageUrl || '';
                                              setIsSavingSettings(true);
                                              try {
                                                if (targetUrl) {
                                                  await deleteStorageFile(targetUrl);
                                                }
                                                const newBanners = settings.homepageBanners.filter((_, idx) => idx !== sIdx);
                                                const updated = { ...settings, homepageBanners: newBanners };
                                                setSettings(updated);
                                                await saveSettings(updated);
                                                alert("Banner deleted successfully!");
                                              } catch(e) {
                                                console.error("Error deleting banner slide:", e);
                                              } finally {
                                                setIsSavingSettings(false);
                                              }
                                            }
                                          }}
                                          className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg shrink-0 transition-colors"
                                          title="Delete Slide"
                                        >
                                          <Trash2 size={14} />
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                          
                          {(!settings || settings.homepageBanners.length === 0) && (
                            <div className="text-center py-10 rounded-xl border-2 border-dashed border-green-900/60 text-green-100/40 text-xs">
                              No custom slide banners uploaded. Utilizing default gradient slots.
                            </div>
                          )}
                        </div>
                      </div>
                   </div>
                 </div>
               </div>
             </>
          ) : activeTab === 'ad_analytics' ? (
            <>
              {/* Ad Performance Dashboard Panel */}
              <header className="mb-10">
                <h1 className="text-3xl font-bold tracking-tight text-white mb-2 font-sans font-sans font-sans">Adsterra Ad Performance</h1>
                <p className="text-green-100/60 font-medium font-sans">Monitor live impressions, click engagement, CTR rates, and estimated publisher revenue statistics.</p>
              </header>

              {/* Metrics Row */}
              {(() => {
                const totalImps = adEvents.filter(e => e.type === 'impression').length;
                const totalClks = adEvents.filter(e => e.type === 'click').length;
                const ctrVal = totalImps > 0 ? (totalClks / totalImps) * 100 : 0;
                // Estimated publisher earning based on CPM/CPC model: 0.15 INR per Impression + 1.50 INR per click
                const estRevenue = (totalImps * 0.15) + (totalClks * 1.50);

                // Group statistics by ad unit
                const units = [
                  { id: 'top_banner', name: 'Homepage Top Banner', type: 'Native Banner' },
                  { id: 'middle_banner', name: 'Middle App Card Banner', type: '300x250 Banner' },
                  { id: 'sticky_sidebar', name: 'Sticky Desktop Sidebars', type: '160x600 Banner' },
                  { id: 'sticky_bottom', name: 'Sticky Bottom Footer Banner', type: '320x50 Banner' },
                  { id: 'footer_banner', name: 'Footer Static Banner', type: '320x50 Banner' },
                  { id: 'details_interstitial', name: 'Details Button Interstitial', type: 'Social Bar / Interstitial' },
                  { id: 'download_interstitial', name: 'Download Button Social Bar', type: 'Social Bar / Popunder' },
                  { id: 'download_popunder', name: 'Download Button Popunder', type: 'Popunder ad' },
                ];

                const groupedData = units.map(u => {
                  const imps = adEvents.filter(e => e.adUnit === u.id && e.type === 'impression').length;
                  const clks = adEvents.filter(e => e.adUnit === u.id && e.type === 'click').length;
                  const uCtr = imps > 0 ? (clks / imps) * 100 : 0;
                  const uRev = (imps * 0.15) + (clks * 1.50);
                  return { ...u, imps, clks, ctr: uCtr, rev: uRev };
                });

                // Top Performing Unit
                const topUnit = [...groupedData].sort((a, b) => b.rev - a.rev)[0];

                return (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                      <div className="bg-[#071c10] border border-green-900/60 p-5 rounded-2xl shadow-lg relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-amber-500 font-sans"></div>
                        <p className="text-xs font-bold text-green-100/50 uppercase tracking-wider mb-1 font-sans">Ad Impressions</p>
                        <p className="text-3xl font-extrabold text-white font-sans">{totalImps.toLocaleString()}</p>
                        <p className="text-[10px] text-green-100/30 mt-1 font-sans">Live tracked views</p>
                      </div>
                      <div className="bg-[#071c10] border border-green-900/60 p-5 rounded-2xl shadow-lg relative overflow-hidden font-sans">
                        <div className="absolute top-0 left-0 w-full h-1 bg-green-500"></div>
                        <p className="text-xs font-bold text-green-100/50 uppercase tracking-wider mb-1">Ad Clicks</p>
                        <p className="text-3xl font-extrabold text-white">{totalClks.toLocaleString()}</p>
                        <p className="text-[10px] text-green-100/30 mt-1">Direct link clicks & redirects</p>
                      </div>
                      <div className="bg-[#071c10] border border-green-900/60 p-5 rounded-2xl shadow-lg relative overflow-hidden font-sans">
                        <div className="absolute top-0 left-0 w-full h-1 bg-blue-500"></div>
                        <p className="text-xs font-bold text-green-100/50 uppercase tracking-wider mb-1">Overall CTR</p>
                        <p className="text-3xl font-extrabold text-white">{ctrVal.toFixed(2)}%</p>
                        <p className="text-[10px] text-green-100/30 mt-1">Click-Through-Rate average</p>
                      </div>
                      <div className="bg-[#071c10] border border-green-900/60 p-5 rounded-2xl shadow-lg relative overflow-hidden font-sans">
                        <div className="absolute top-0 left-0 w-full h-1 bg-yellow-500 animate-pulse"></div>
                        <p className="text-xs font-bold text-green-100/50 uppercase tracking-wider mb-1">Publisher Revenue</p>
                        <p className="text-3xl font-extrabold text-amber-400">₹{estRevenue.toFixed(2)}</p>
                        <p className="text-[10px] text-amber-500/50 mt-1 font-bold">Estimated Earnings</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                      {/* Table list of ad units */}
                      <div className="lg:col-span-2 bg-[#071c10] border border-green-800 p-6 rounded-2xl shadow-xl">
                        <h3 className="text-lg font-bold text-white mb-2">Performance by Ad Unit</h3>
                        <p className="text-xs text-green-100/50 mb-6 font-sans">Detailed performance overview across individual layout placements.</p>

                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs text-green-100/80">
                            <thead>
                              <tr className="border-b border-green-900 text-green-100/40 uppercase tracking-wider font-bold">
                                <th className="pb-3 pl-2">Ad Unit Name</th>
                                <th className="pb-3">Type</th>
                                <th className="pb-3 text-center">Impressions</th>
                                <th className="pb-3 text-center">Clicks</th>
                                <th className="pb-3 text-center">CTR</th>
                                <th className="pb-3 text-right pr-2">Est. Revenue</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-green-900/40">
                              {groupedData.map(unit => (
                                <tr key={unit.id} className="hover:bg-[#05130b]/50 transition-colors">
                                  <td className="py-3 pl-2 font-bold text-white">{unit.name}</td>
                                  <td className="py-3 text-green-100/50">{unit.type}</td>
                                  <td className="py-3 text-center font-mono">{unit.imps}</td>
                                  <td className="py-3 text-center font-mono">{unit.clks}</td>
                                  <td className="py-3 text-center font-mono font-semibold text-green-400">{unit.ctr.toFixed(2)}%</td>
                                  <td className="py-3 text-right pr-2 font-bold text-amber-400">₹{unit.rev.toFixed(2)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Sidebar stats panel */}
                      <div className="space-y-6">
                        <div className="bg-[#071c10] border border-green-800 p-6 rounded-2xl shadow-xl font-sans">
                          <h3 className="text-base font-bold text-white mb-2">Insights & Optimization</h3>
                          <p className="text-green-100/50 text-xs mb-6">Automated analysis of current ad network settings.</p>

                          <div className="space-y-4">
                            <div className="bg-[#05130b] border border-green-905 p-4 rounded-xl">
                              <span className="text-[10px] font-black uppercase tracking-widest text-amber-500 block mb-1">Top Performing Unit</span>
                              <p className="text-sm font-bold text-white">{topUnit && topUnit.imps > 0 ? topUnit.name : 'No traffic recorded yet'}</p>
                              {topUnit && topUnit.imps > 0 && (
                                <p className="text-[10px] text-green-100/40 mt-1 font-sans">Generated ₹{topUnit.rev.toFixed(2)} with a CTR of {topUnit.ctr.toFixed(2)}%.</p>
                              )}
                            </div>

                            <div className="bg-[#05130b] border border-green-905 p-4 rounded-xl font-sans">
                              <span className="text-[10px] font-black uppercase tracking-widest text-green-400 block mb-1">Traffic Distribution</span>
                              <div className="flex justify-between text-xs mt-2 text-white">
                                <span>Desktop Ads:</span>
                                <span className="font-bold">{adEvents.filter(e => e.platform === 'desktop').length}</span>
                              </div>
                              <div className="flex justify-between text-xs mt-1 text-white font-sans">
                                <span>Mobile Ads:</span>
                                <span className="font-bold">{adEvents.filter(e => e.platform === 'mobile').length}</span>
                              </div>
                            </div>

                            <div className="bg-[#05130b] border border-green-905 p-4 rounded-xl font-sans">
                              <span className="text-[10px] font-black uppercase tracking-widest text-blue-400 block mb-1">Placements Lazy Loading</span>
                              <p className="text-xs text-green-100/70 mt-1 leading-relaxed">
                                Lazy Loading is actively running using modern <code className="text-amber-500 font-mono">IntersectionObserver</code>. Ads are loaded on-demand when scrolled into viewport.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                );
              })()}
            </>
          ) : activeTab === 'seo' ? (
            <>
              {/* SEO MANAGER CONTENT */}
              {(() => {
                if (!settings) return <div className="text-center py-20 text-white">Loading Settings...</div>;

                // Calculate SEO Score
                let score = 0;
                const scoreItems = [
                  { field: settings.seoWebsiteTitle, points: 15, name: 'Website Title' },
                  { field: settings.seoMetaDescription, points: 15, name: 'Meta Description' },
                  { field: settings.seoMetaKeywords, points: 10, name: 'Meta Keywords' },
                  { field: settings.seoCanonicalUrl, points: 10, name: 'Canonical URL' },
                  { field: settings.seoRobotsMeta, points: 5, name: 'Robots Meta' },
                  { field: settings.seoOgTitle, points: 5, name: 'Open Graph Title' },
                  { field: settings.seoOgDescription, points: 5, name: 'Open Graph Description' },
                  { field: settings.seoOgImage, points: 5, name: 'Open Graph Image' },
                  { field: settings.seoTwitterCard, points: 5, name: 'Twitter Card Style' },
                  { field: settings.seoAuthor, points: 5, name: 'Author Name' },
                  { field: settings.seoLanguage, points: 5, name: 'Language' },
                  { field: settings.seoCountryTarget, points: 5, name: 'Country Target' },
                  { field: settings.seoThemeColor, points: 5, name: 'Theme Color' },
                  { field: settings.seoVerificationGoogle, points: 5, name: 'Google Search Console Verification' },
                ];

                scoreItems.forEach(item => {
                  if (item.field && item.field.trim().length > 0) {
                    score += item.points;
                  }
                });

                const missingItems = scoreItems.filter(item => !item.field || item.field.trim().length === 0);

                const handleAutoFix = () => {
                  setSettings({
                    ...settings,
                    seoWebsiteTitle: settings.seoWebsiteTitle || "Play Zone 777 - Curated Premium APK Catalog",
                    seoMetaDescription: settings.seoMetaDescription || "Free safe download of verified high bonus slots, rummy and VIP club game applications.",
                    seoMetaKeywords: settings.seoMetaKeywords || "rummy apk, slots games, signup bonus, casino, play777",
                    seoCanonicalUrl: settings.seoCanonicalUrl || window.location.origin,
                    seoRobotsMeta: settings.seoRobotsMeta || "index, follow",
                    seoOgTitle: settings.seoOgTitle || "Play Zone 777 - Download Best Rummy Apps",
                    seoOgDescription: settings.seoOgDescription || "Direct APK installers, tested safe, signup welcomes ready.",
                    seoTwitterCard: settings.seoTwitterCard || "summary_large_image",
                    seoAuthor: settings.seoAuthor || "Play Zone 777 Team",
                    seoLanguage: settings.seoLanguage || "en",
                    seoCountryTarget: settings.seoCountryTarget || "IN",
                    seoThemeColor: settings.seoThemeColor || "#05130b",
                    seoVerificationGoogle: settings.seoVerificationGoogle || "gsc-verification-placeholder-code"
                  });
                  alert("Auto-filled missing SEO items with premium default configurations. Click 'Save SEO Settings' to persist!");
                };

                const handleDownloadXmlSitemap = () => {
                  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
                  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
                  xml += `  <url>\n    <loc>${window.location.origin}/</loc>\n    <changefreq>daily</changefreq>\n    <priority>1.0</priority>\n  </url>\n`;
                  
                  const categories = ['Rummy', 'Slots', 'Spin', 'Arcade', 'Games', 'VIP', 'Casino', 'Betting'];
                  categories.forEach(cat => {
                    xml += `  <url>\n    <loc>${window.location.origin}/?category=${cat}</loc>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
                  });

                  games.forEach(g => {
                    const slug = g.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
                    xml += `  <url>\n    <loc>${window.location.origin}/?app=${slug}</loc>\n    <changefreq>daily</changefreq>\n    <priority>0.9</priority>\n  </url>\n`;
                  });
                  xml += `</urlset>`;
                  downloadFile(xml, 'sitemap.xml', 'application/xml');
                };

                const handleDownloadImageSitemap = () => {
                  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
                  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n`;
                  games.forEach(g => {
                    const slug = g.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
                    if (g.logoUrl || g.bannerUrl) {
                      xml += `  <url>\n    <loc>${window.location.origin}/?app=${slug}</loc>\n`;
                      if (g.logoUrl) {
                        xml += `    <image:image>\n      <image:loc>${g.logoUrl}</image:loc>\n      <image:title>${g.title} Logo</image:title>\n    </image:image>\n`;
                      }
                      if (g.bannerUrl) {
                        xml += `    <image:image>\n      <image:loc>${g.bannerUrl}</image:loc>\n      <image:title>${g.title} Banner</image:title>\n    </image:image>\n`;
                      }
                      xml += `  </url>\n`;
                    }
                  });
                  xml += `</urlset>`;
                  downloadFile(xml, 'image-sitemap.xml', 'application/xml');
                };

                const handleDownloadRobotsTxt = () => {
                  const txt = `User-agent: *\nAllow: /\n\nSitemap: ${window.location.origin}/sitemap.xml\n`;
                  downloadFile(txt, 'robots.txt', 'text/plain');
                };

                const downloadFile = (content: string, filename: string, mimeType: string) => {
                  const blob = new Blob([content], { type: mimeType });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = filename;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  URL.revokeObjectURL(url);
                };

                return (
                  <>
                    <header className="mb-10 font-sans">
                      <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Professional SEO & Console Manager</h1>
                      <p className="text-green-100/60 font-medium">Configure tags, preview dynamically generated schemas, download sitemaps, and manage search indexing.</p>
                    </header>

                    {/* SEO Audit & Score banner */}
                    <div className="bg-[#071c10] border border-green-800 p-6 rounded-2xl shadow-xl mb-10 grid grid-cols-1 md:grid-cols-4 gap-6 items-center font-sans">
                      <div className="text-center md:border-r border-green-900/60 py-2">
                        <span className="text-xs font-bold text-green-100/50 uppercase tracking-widest block mb-1">SEO Audit Score</span>
                        <span className={`text-6xl font-black ${score >= 90 ? 'text-green-400' : score >= 70 ? 'text-amber-400' : 'text-red-400'}`}>{score}</span>
                        <span className="text-xs font-bold text-green-100/40 block mt-1">/ 100 maximum</span>
                      </div>

                      <div className="md:col-span-2 py-1 px-2">
                        <h4 className="text-sm font-bold text-white mb-1.5">SEO Health: {score >= 90 ? 'Excellent' : score >= 70 ? 'Needs Optimization' : 'Poor Configuration'}</h4>
                        <p className="text-xs text-green-100/60 leading-relaxed mb-3">
                          {missingItems.length > 0 
                            ? `Your portal is missing ${missingItems.length} optimization tags. Improving these will increase ranking visibility across search results.`
                            : "Excellent! Your application contains all essential search engine optimizations and social sharing tags."}
                        </p>
                        <div className="flex gap-2 flex-wrap">
                          {missingItems.slice(0, 4).map((m, i) => (
                            <span key={i} className="bg-red-500/10 text-red-400 border border-red-500/20 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                              Missing: {m.name}
                            </span>
                          ))}
                          {missingItems.length > 4 && (
                            <span className="bg-red-500/10 text-red-400 border border-red-500/20 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                              + {missingItems.length - 4} more
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col gap-2.5">
                        {missingItems.length > 0 && (
                          <button 
                            onClick={handleAutoFix}
                            className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-[#05130b] text-xs font-extrabold uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5"
                          >
                            <Zap size={14} /> Fix Missing Tags
                          </button>
                        )}
                        <button 
                          onClick={async () => {
                            setIsSavingSettings(true);
                            try {
                              await saveSettings(settings);
                              alert("SEO Settings persisted successfully!");
                            } catch(e) {
                              alert("Failed to save SEO Settings");
                            } finally {
                              setIsSavingSettings(false);
                            }
                          }}
                          disabled={isSavingSettings}
                          className="w-full py-2.5 bg-[#05130b] border border-green-800 hover:border-green-700 text-white text-xs font-extrabold uppercase tracking-wider rounded-xl transition-all"
                        >
                          {isSavingSettings ? 'Saving...' : 'Save SEO Settings'}
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                      {/* General SEO Forms */}
                      <div className="lg:col-span-2 bg-[#071c10] border border-green-800 p-6 rounded-2xl shadow-xl space-y-6 font-sans">
                        <h3 className="text-lg font-bold text-white mb-2 border-b border-green-900 pb-2">SEO Meta Configuration</h3>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-xs font-bold text-green-100/60 uppercase tracking-wider mb-2">Global Website Title</label>
                            <input 
                              type="text"
                              value={settings.seoWebsiteTitle || ''}
                              onChange={(e) => setSettings({ ...settings, seoWebsiteTitle: e.target.value })}
                              placeholder="e.g. Play Zone 777 - Top Premium Rummy Apk Directory"
                              className="w-full bg-[#05130b] border border-green-900 rounded-xl p-3 text-xs text-green-50 focus:border-amber-500/50 outline-none"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-green-100/60 uppercase tracking-wider mb-2">Canonical Base URL</label>
                            <input 
                              type="text"
                              value={settings.seoCanonicalUrl || ''}
                              onChange={(e) => setSettings({ ...settings, seoCanonicalUrl: e.target.value })}
                              placeholder="e.g. https://play777.in"
                              className="w-full bg-[#05130b] border border-green-900 rounded-xl p-3 text-xs text-green-50 focus:border-amber-500/50 outline-none"
                            />
                          </div>

                          <div className="sm:col-span-2">
                            <label className="block text-xs font-bold text-green-100/60 uppercase tracking-wider mb-2">Meta Description</label>
                            <textarea 
                              rows={2}
                              value={settings.seoMetaDescription || ''}
                              onChange={(e) => setSettings({ ...settings, seoMetaDescription: e.target.value })}
                              placeholder="Enter 150-160 character description of your website listing contents..."
                              className="w-full bg-[#05130b] border border-green-900 rounded-xl p-3 text-xs text-green-50 focus:border-amber-500/50 outline-none"
                            />
                          </div>

                          <div className="sm:col-span-2">
                            <label className="block text-xs font-bold text-green-100/60 uppercase tracking-wider mb-2">Meta Keywords (comma separated)</label>
                            <input 
                              type="text"
                              value={settings.seoMetaKeywords || ''}
                              onChange={(e) => setSettings({ ...settings, seoMetaKeywords: e.target.value })}
                              placeholder="rummy bonus, slots games, signup bonus, casino, play777"
                              className="w-full bg-[#05130b] border border-green-900 rounded-xl p-3 text-xs text-green-50 focus:border-amber-500/50 outline-none"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-green-100/60 uppercase tracking-wider mb-2">Robots Meta tag</label>
                            <select 
                              value={settings.seoRobotsMeta || 'index, follow'}
                              onChange={(e) => setSettings({ ...settings, seoRobotsMeta: e.target.value })}
                              className="w-full bg-[#05130b] border border-green-900 rounded-xl p-3 text-xs text-green-50 focus:border-amber-500/50 outline-none"
                            >
                              <option value="index, follow">index, follow (Standard)</option>
                              <option value="noindex, nofollow">noindex, nofollow (Private)</option>
                              <option value="index, nofollow">index, nofollow</option>
                              <option value="noindex, follow">noindex, follow</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-green-100/60 uppercase tracking-wider mb-2">Author Name</label>
                            <input 
                              type="text"
                              value={settings.seoAuthor || ''}
                              onChange={(e) => setSettings({ ...settings, seoAuthor: e.target.value })}
                              placeholder="e.g. Play Zone Team"
                              className="w-full bg-[#05130b] border border-green-900 rounded-xl p-3 text-xs text-green-50 focus:border-amber-500/50 outline-none"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-green-100/60 uppercase tracking-wider mb-2">Target Language</label>
                            <input 
                              type="text"
                              value={settings.seoLanguage || 'en'}
                              onChange={(e) => setSettings({ ...settings, seoLanguage: e.target.value })}
                              placeholder="e.g. en, hi"
                              className="w-full bg-[#05130b] border border-green-900 rounded-xl p-3 text-xs text-green-50 focus:border-amber-500/50 outline-none"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-green-100/60 uppercase tracking-wider mb-2">Target Country</label>
                            <input 
                              type="text"
                              value={settings.seoCountryTarget || 'IN'}
                              onChange={(e) => setSettings({ ...settings, seoCountryTarget: e.target.value })}
                              placeholder="e.g. IN, US"
                              className="w-full bg-[#05130b] border border-green-900 rounded-xl p-3 text-xs text-green-50 focus:border-amber-500/50 outline-none"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-green-100/60 uppercase tracking-wider mb-2">Mobile Theme Color</label>
                            <input 
                              type="text"
                              value={settings.seoThemeColor || '#05130b'}
                              onChange={(e) => setSettings({ ...settings, seoThemeColor: e.target.value })}
                              placeholder="e.g. #05130b"
                              className="w-full bg-[#05130b] border border-green-900 rounded-xl p-3 text-xs text-green-50 focus:border-amber-500/50 outline-none font-mono"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-green-100/60 uppercase tracking-wider mb-2">Custom Favicon URL</label>
                            <input 
                              type="text"
                              value={settings.faviconUrl || ''}
                              onChange={(e) => setSettings({ ...settings, faviconUrl: e.target.value })}
                              placeholder="URL to favicon .ico or png file"
                              className="w-full bg-[#05130b] border border-green-900 rounded-xl p-3 text-xs text-green-50 focus:border-amber-500/50 outline-none"
                            />
                          </div>
                        </div>

                        <h3 className="text-lg font-bold text-white pt-4 border-b border-green-900 pb-2">Social Graph Configurations</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-xs font-bold text-green-100/60 uppercase tracking-wider mb-2">Open Graph Title</label>
                            <input 
                              type="text"
                              value={settings.seoOgTitle || ''}
                              onChange={(e) => setSettings({ ...settings, seoOgTitle: e.target.value })}
                              placeholder="e.g. Play Zone 777 - Rummy, Casino and Slots Downloads"
                              className="w-full bg-[#05130b] border border-green-900 rounded-xl p-3 text-xs text-green-50 focus:border-amber-500/50 outline-none"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-green-100/60 uppercase tracking-wider mb-2">Twitter Card Style</label>
                            <select 
                              value={settings.seoTwitterCard || 'summary_large_image'}
                              onChange={(e) => setSettings({ ...settings, seoTwitterCard: e.target.value })}
                              className="w-full bg-[#05130b] border border-green-900 rounded-xl p-3 text-xs text-green-50 focus:border-amber-500/50 outline-none"
                            >
                              <option value="summary">Summary</option>
                              <option value="summary_large_image">Summary with Large Image</option>
                              <option value="app">App-specific Card</option>
                            </select>
                          </div>

                          <div className="sm:col-span-2">
                            <label className="block text-xs font-bold text-green-100/60 uppercase tracking-wider mb-2">Open Graph Description</label>
                            <textarea 
                              rows={2}
                              value={settings.seoOgDescription || ''}
                              onChange={(e) => setSettings({ ...settings, seoOgDescription: e.target.value })}
                              placeholder="Enter shared post social description..."
                              className="w-full bg-[#05130b] border border-green-900 rounded-xl p-3 text-xs text-green-50 focus:border-amber-500/50 outline-none"
                            />
                          </div>

                          <div className="sm:col-span-2">
                            <label className="block text-xs font-bold text-green-100/60 uppercase tracking-wider mb-2">Social Sharing Image (OG:Image) URL</label>
                            <input 
                              type="text"
                              value={settings.seoOgImage || ''}
                              onChange={(e) => setSettings({ ...settings, seoOgImage: e.target.value })}
                              placeholder="e.g. https://yourdomain.com/social-share.jpg"
                              className="w-full bg-[#05130b] border border-green-900 rounded-xl p-3 text-xs text-green-50 focus:border-amber-500/50 outline-none"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Sitemaps, Console Verification & submission shortcuts */}
                      <div className="space-y-6 font-sans">
                        {/* Sitemaps Panel */}
                        <div className="bg-[#071c10] border border-green-800 p-6 rounded-2xl shadow-xl">
                          <h3 className="text-base font-bold text-white mb-2 font-sans font-sans font-sans">Sitemap Generation Engine</h3>
                          <p className="text-green-100/50 text-xs mb-4">Dynamically build sitemaps based on the database app listings.</p>

                          <div className="space-y-3">
                            <button 
                              onClick={handleDownloadXmlSitemap}
                              className="w-full py-2.5 bg-[#05130b] hover:bg-green-950 border border-green-900 hover:border-green-700 text-xs font-bold text-white uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2"
                            >
                              <Download size={14} className="text-amber-500" /> Download XML Sitemap
                            </button>
                            <button 
                              onClick={handleDownloadImageSitemap}
                              className="w-full py-2.5 bg-[#05130b] hover:bg-green-950 border border-green-900 hover:border-green-700 text-xs font-bold text-white uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2"
                            >
                              <Download size={14} className="text-amber-500" /> Download Image Sitemap
                            </button>
                            <button 
                              onClick={handleDownloadRobotsTxt}
                              className="w-full py-2.5 bg-[#05130b] hover:bg-green-950 border border-green-900 hover:border-green-700 text-xs font-bold text-white uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2"
                            >
                              <Download size={14} className="text-amber-500" /> Download robots.txt
                            </button>
                          </div>
                        </div>

                        {/* Verification Codes Panel */}
                        <div className="bg-[#071c10] border border-green-800 p-6 rounded-2xl shadow-xl">
                          <h3 className="text-base font-bold text-white mb-2 font-sans">Search Verification Codes</h3>
                          <p className="text-green-100/50 text-xs mb-4">Paste verification meta content snippets provided by the search consoles.</p>

                          <div className="space-y-4">
                            <div>
                              <label className="block text-[10px] font-bold text-green-100/50 uppercase tracking-widest mb-1.5">Google Search Console</label>
                              <input 
                                type="text"
                                value={settings.seoVerificationGoogle || ''}
                                onChange={(e) => setSettings({ ...settings, seoVerificationGoogle: e.target.value })}
                                placeholder="e.g. wI0-S44..."
                                className="w-full bg-[#05130b] border border-green-900 rounded-xl p-3 text-xs text-green-50 focus:border-amber-500/50 outline-none font-mono"
                              />
                            </div>

                            <div>
                              <label className="block text-[10px] font-bold text-green-100/50 uppercase tracking-widest mb-1.5">Bing Webmaster</label>
                              <input 
                                type="text"
                                value={settings.seoVerificationBing || ''}
                                onChange={(e) => setSettings({ ...settings, seoVerificationBing: e.target.value })}
                                placeholder="e.g. D10F82A..."
                                className="w-full bg-[#05130b] border border-green-900 rounded-xl p-3 text-xs text-green-50 focus:border-amber-500/50 outline-none font-mono"
                              />
                            </div>

                            <div>
                              <label className="block text-[10px] font-bold text-green-100/50 uppercase tracking-widest mb-1.5">Yandex Webmaster</label>
                              <input 
                                type="text"
                                value={settings.seoVerificationYandex || ''}
                                onChange={(e) => setSettings({ ...settings, seoVerificationYandex: e.target.value })}
                                placeholder="e.g. 5d820fb..."
                                className="w-full bg-[#05130b] border border-green-900 rounded-xl p-3 text-xs text-green-50 focus:border-amber-500/50 outline-none font-mono"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Console Shortcuts Panel */}
                        <div className="bg-[#071c10] border border-green-800 p-6 rounded-2xl shadow-xl">
                          <h3 className="text-base font-bold text-white mb-2">Google Indexing Shortcuts</h3>
                          <p className="text-green-100/50 text-xs mb-4">Direct submission links to index pages and register sitemaps.</p>

                          <div className="space-y-3 font-sans">
                            <a 
                              href="https://search.google.com/search-console"
                              target="_blank"
                              rel="noreferrer"
                              className="w-full py-2.5 bg-[#0a2717] hover:bg-green-900/60 border border-green-800 text-xs font-bold text-amber-500 hover:text-amber-400 uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5"
                            >
                              <ExternalLink size={14} /> Open Search Console
                            </a>
                            <button 
                              onClick={() => {
                                const siteUrl = settings.seoCanonicalUrl || window.location.origin;
                                window.open(`https://www.google.com/ping?sitemap=${encodeURIComponent(`${siteUrl}/sitemap.xml`)}`, '_blank');
                                alert("Triggered Google Sitemap Indexing Ping query in a new tab!");
                              }}
                              className="w-full py-2.5 bg-[#0a2717] hover:bg-green-900/60 border border-green-800 text-xs font-bold text-amber-500 hover:text-amber-400 uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5"
                            >
                              <Zap size={14} /> Submit Sitemap Ping
                            </button>
                            <button 
                              onClick={() => {
                                const siteUrl = settings.seoCanonicalUrl || window.location.origin;
                                alert(`Instant Indexing Shortcut Instructions:\n\n1. Copy your sitemap address: ${siteUrl}/sitemap.xml\n2. Open Google Search Console -> Sitemaps\n3. Paste the address and click Submit.`);
                              }}
                              className="w-full py-2.5 bg-[#0a2717] hover:bg-green-900/60 border border-green-800 text-xs font-bold text-amber-500 hover:text-amber-400 uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5"
                            >
                              <FileText size={14} /> Get Sitemap Address
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                );
              })()}
            </>
          ) : activeTab === 'reports' ? (
            <>
              {/* Reports Dashboard Panel */}
              <header className="mb-10">
                <h1 className="text-3xl font-bold tracking-tight text-white mb-2">User Feedback & Link Reports</h1>
                <p className="text-green-100/60 font-medium font-sans">Monitor broken referral links, download issues, and overall user feedback reporting stats.</p>
              </header>

              {/* Reports Statistics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                <div className="bg-[#071c10] border border-green-900/60 p-5 rounded-2xl shadow-lg relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-green-500/30"></div>
                  <p className="text-xs font-bold text-green-100/50 uppercase tracking-wider mb-1">Total Reports</p>
                  <p className="text-3xl font-extrabold text-white">{reports.length}</p>
                  <p className="text-[10px] text-green-100/30 mt-1">Submitted in total</p>
                </div>

                <div className="bg-[#071c10] border border-green-900/60 p-5 rounded-2xl shadow-lg relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-red-500/40"></div>
                  <p className="text-xs font-bold text-green-100/50 uppercase tracking-wider mb-1">Unresolved Reports</p>
                  <div className="flex items-center gap-2">
                    <p className="text-3xl font-extrabold text-red-400">{reports.filter(r => r.status === 'unresolved').length}</p>
                    {reports.filter(r => r.status === 'unresolved').length > 0 && (
                      <span className="bg-red-500/10 text-red-400 border border-red-500/20 text-[10px] px-1.5 py-0.5 rounded-md font-bold animate-pulse">Needs attention</span>
                    )}
                  </div>
                  <p className="text-[10px] text-green-100/30 mt-1">Active reported link issues</p>
                </div>

                <div className="bg-[#071c10] border border-green-900/60 p-5 rounded-2xl shadow-lg relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-amber-500/40"></div>
                  <p className="text-xs font-bold text-green-100/50 uppercase tracking-wider mb-1">Apps with Active Issues</p>
                  <p className="text-3xl font-extrabold text-amber-400">
                    {Array.from(new Set(reports.filter(r => r.status === 'unresolved').map(r => r.appId))).length}
                  </p>
                  <p className="text-[10px] text-green-100/30 mt-1">Distinct apps with open reports</p>
                </div>

                <div className="bg-[#071c10] border border-green-900/60 p-5 rounded-2xl shadow-lg relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500/40"></div>
                  <p className="text-xs font-bold text-green-100/50 uppercase tracking-wider mb-1">Resolved Issues</p>
                  <p className="text-3xl font-extrabold text-emerald-400">{reports.filter(r => r.status === 'resolved').length}</p>
                  <p className="text-[10px] text-green-100/30 mt-1">Successfully marked fixed by admin</p>
                </div>
              </div>

              {/* Reports List and App Breakdown Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Reports Feed */}
                <div className="lg:col-span-2 bg-[#071c10] border border-green-800 p-6 rounded-2xl shadow-xl flex flex-col min-h-[400px]">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h3 className="text-lg font-bold text-white">Latest Problem Reports</h3>
                      <p className="text-green-100/50 text-xs">Real-time alerts submitted by visitors on individual apps.</p>
                    </div>
                  </div>

                  <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
                    {reports.map((rpt) => {
                      const appUnresolvedCount = reports.filter(r => r.appId === rpt.appId && r.status === 'unresolved').length;
                      return (
                        <div key={rpt.id} className={`p-4 rounded-xl border transition-all ${
                          rpt.status === 'resolved' 
                            ? 'bg-[#05130b]/40 border-green-900/30 opacity-70' 
                            : appUnresolvedCount >= 2 
                              ? 'bg-red-500/5 border-red-500/30 animate-pulse' 
                              : 'bg-[#092515]/60 border-green-950 hover:border-green-900'
                        }`}>
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-2">
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="font-bold text-white text-sm shrink-0">{rpt.appTitle}</h4>
                                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                                  rpt.status === 'resolved' 
                                    ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                                    : 'bg-red-500/20 text-red-400 border border-red-500/30'
                                }`}>
                                  {rpt.status}
                                </span>
                                {rpt.status === 'unresolved' && appUnresolvedCount >= 2 && (
                                  <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md flex items-center gap-1 shrink-0">
                                    <AlertTriangle size={10} /> Multiple Reports ({appUnresolvedCount})
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-green-100/40 mt-0.5">
                                Submitted on {new Date(rpt.createdAt).toLocaleString()}
                              </p>
                            </div>

                            {rpt.status === 'unresolved' && (
                              <button
                                onClick={() => handleMarkFixed(rpt.id!)}
                                className="px-3.5 py-1.5 text-xs font-bold bg-amber-500 text-[#05130b] hover:bg-amber-400 rounded-lg shadow-md transition-all uppercase tracking-wider shrink-0"
                              >
                                Mark Fixed
                              </button>
                            )}
                          </div>

                          <div className="bg-[#05130b]/85 border border-green-905 p-3 rounded-xl mt-3">
                            <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest block mb-1">Issue Type</span>
                            <p className="text-xs text-white font-medium">{rpt.issueType}</p>
                          </div>

                          {rpt.comment && (
                            <div className="mt-3 pl-3 border-l-2 border-green-900/60">
                              <span className="text-[10px] font-semibold text-green-100/40 uppercase block">Details</span>
                              <p className="text-xs text-green-100/70 italic mt-1 leading-relaxed">"{rpt.comment}"</p>
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {reports.length === 0 && (
                      <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-green-100/40">
                        <MessageSquare size={36} className="text-green-900/50 mb-3" />
                        <p className="text-sm font-medium">No reports submitted yet.</p>
                        <p className="text-xs text-green-100/30 mt-1">Excellent! All download referral links are fully functional.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Reports Sidebar (Reports by App Summary) */}
                <div className="space-y-6">
                  <div className="bg-[#071c10] border border-green-800 p-6 rounded-2xl shadow-xl">
                    <h3 className="text-lg font-bold text-white mb-2">Reports by App</h3>
                    <p className="text-green-100/50 text-xs mb-6">Total number of open / unresolved complaints per app.</p>

                    <div className="space-y-3">
                      {games.map(game => {
                        const appUnresolved = reports.filter(r => r.appId === game.id && r.status === 'unresolved');
                        const totalAppReports = reports.filter(r => r.appId === game.id).length;
                        
                        if (totalAppReports === 0) return null;

                        return (
                          <div key={game.id} className="flex items-center justify-between p-3 rounded-xl bg-[#05130b] border border-green-905">
                            <div className="overflow-hidden pr-3">
                              <p className="text-xs font-bold text-white truncate">{game.title}</p>
                              <p className="text-[10px] text-green-100/40 mt-0.5">Category: {game.category}</p>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              {appUnresolved.length >= 2 && (
                                <AlertCircle size={14} className="text-red-500 animate-bounce" title="Received multiple unresolved reports!" />
                              )}
                              <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                                appUnresolved.length > 0 ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'
                              }`}>
                                {appUnresolved.length} unresolved ({totalAppReports} total)
                              </span>
                            </div>
                          </div>
                        );
                      })}

                      {reports.length === 0 && (
                        <div className="text-center py-6 text-green-100/40 text-xs">
                          No active complaints found.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <header className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight text-white mb-2">App Management</h1>
                  <p className="text-green-100/60">Update affiliate and download links, change bonuses, and add new apps.</p>
                </div>
                <button 
                  onClick={() => {
                    setIsAddingNew(true);
                    setEditingGame({ 
                      id: 0, 
                      title: '', 
                      category: 'Rummy', 
                      bonus: '', 
                      trending: false, 
                      iconType: 'cards', 
                      link: '', 
                      clicks: 0, 
                      logoUrl: '',
                      bannerUrl: '',
                      description: '',
                      buttonText: '',
                      apkUrl: '',
                      websiteUrl: '',
                      referralUrl: '',
                      withdrawText: '',
                      rating: ''
                    });
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-[#092212] rounded-xl font-bold transition-all shadow-lg shadow-amber-500/20"
                >
                  <PlusCircle size={18} /> Add App
                </button>
              </header>

              {editingGame ? (
                /* EDIT/ADD FORM */
                <form onSubmit={saveEditedGame} className="bg-[#071c10] border border-amber-500/50 rounded-2xl p-6 shadow-xl relative overflow-hidden mb-8">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 to-amber-300"></div>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-white">{isAddingNew ? 'Add New App' : `Editing: ${editingGame.title}`}</h2>
                    <button type="button" onClick={() => { setEditingGame(null); setIsAddingNew(false); }} className="p-2 hover:bg-[#0a2717] rounded-full text-green-100/60 hover:text-white transition-colors">
                      <X size={20} />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-bold text-green-100/50 uppercase tracking-wider mb-2">App Title / Name</label>
                      <input 
                        required
                        type="text" 
                        value={editingGame.title}
                        onChange={(e) => setEditingGame({...editingGame, title: e.target.value})}
                        className="w-full bg-[#05130b] border border-green-800 focus:border-amber-500/50 focus:ring-0 rounded-lg px-4 py-3 text-sm text-white placeholder-green-100/20"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-green-100/50 uppercase tracking-wider mb-2">Category</label>
                      <select 
                        value={editingGame.category}
                        onChange={(e) => setEditingGame({...editingGame, category: e.target.value})}
                        className="w-full bg-[#05130b] border border-green-800 focus:border-amber-500/50 focus:ring-0 rounded-lg px-4 py-3 text-sm text-white"
                      >
                        <option value="Rummy">Rummy</option>
                        <option value="Slots">Slots</option>
                        <option value="Spin">Spin</option>
                        <option value="Arcade">Arcade</option>
                        <option value="Games">Games</option>
                        <option value="VIP">VIP</option>
                        <option value="Casino">Casino</option>
                        <option value="Betting">Betting</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-green-100/50 uppercase tracking-wider mb-2">Welcome Bonus Text</label>
                      <input 
                        required
                        type="text" 
                        value={editingGame.bonus}
                        placeholder="e.g. ₹500 Bonus"
                        onChange={(e) => setEditingGame({...editingGame, bonus: e.target.value})}
                        className="w-full bg-[#05130b] border border-green-800 focus:border-amber-500/50 focus:ring-0 rounded-lg px-4 py-3 text-sm text-white placeholder-green-100/20"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-green-100/50 uppercase tracking-wider mb-2">Change Button Text</label>
                      <input 
                        type="text" 
                        value={editingGame.buttonText || ''}
                        placeholder="e.g. Get App, Play Now, Download (default is 'Get App')"
                        onChange={(e) => setEditingGame({...editingGame, buttonText: e.target.value})}
                        className="w-full bg-[#05130b] border border-green-800 focus:border-amber-500/50 focus:ring-0 rounded-lg px-4 py-3 text-sm text-white placeholder-green-100/20"
                      />
                    </div>
                    
                    <div className="md:col-span-2">
                       <label className="block text-xs font-bold text-green-100/50 uppercase tracking-wider mb-2">Referral / Affiliate Link</label>
                       <div className="relative">
                         <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-green-100/40" size={16} />
                         <input 
                           required
                           type="text" 
                           value={editingGame.link}
                           placeholder="https://..."
                           onChange={(e) => setEditingGame({...editingGame, link: e.target.value})}
                           className="w-full bg-[#05130b] border border-green-800 focus:border-amber-500/50 focus:ring-0 rounded-lg pl-10 pr-4 py-3 text-sm text-white placeholder-green-100/20"
                         />
                       </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-green-100/50 uppercase tracking-wider mb-2">APK URL (Direct Download Link)</label>
                      <input 
                        type="text" 
                        value={editingGame.apkUrl || ''}
                        placeholder="e.g. https://yourserver.com/app.apk"
                        onChange={(e) => setEditingGame({...editingGame, apkUrl: e.target.value})}
                        className="w-full bg-[#05130b] border border-green-800 focus:border-amber-500/50 focus:ring-0 rounded-lg px-4 py-3 text-sm text-white placeholder-green-100/20"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-green-100/50 uppercase tracking-wider mb-2">Website URL</label>
                      <input 
                        type="text" 
                        value={editingGame.websiteUrl || ''}
                        placeholder="e.g. https://brandwebsite.com"
                        onChange={(e) => setEditingGame({...editingGame, websiteUrl: e.target.value})}
                        className="w-full bg-[#05130b] border border-green-800 focus:border-amber-500/50 focus:ring-0 rounded-lg px-4 py-3 text-sm text-white placeholder-green-100/20"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-green-100/50 uppercase tracking-wider mb-2">Referral URL</label>
                      <input 
                        type="text" 
                        value={editingGame.referralUrl || ''}
                        placeholder="e.g. https://casinoaffiliatelink.com/ref"
                        onChange={(e) => setEditingGame({...editingGame, referralUrl: e.target.value})}
                        className="w-full bg-[#05130b] border border-green-800 focus:border-amber-500/50 focus:ring-0 rounded-lg px-4 py-3 text-sm text-white placeholder-green-100/20"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-green-100/50 uppercase tracking-wider mb-2">Withdraw Info</label>
                      <input 
                        type="text" 
                        value={editingGame.withdrawText || ''}
                        placeholder="e.g. Min ₹100, Instant Withdraw"
                        onChange={(e) => setEditingGame({...editingGame, withdrawText: e.target.value})}
                        className="w-full bg-[#05130b] border border-green-800 focus:border-amber-500/50 focus:ring-0 rounded-lg px-4 py-3 text-sm text-white placeholder-green-100/20"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-green-100/50 uppercase tracking-wider mb-2">Rating</label>
                      <input 
                        type="text" 
                        value={editingGame.rating || ''}
                        placeholder="e.g. 4.8"
                        onChange={(e) => setEditingGame({...editingGame, rating: e.target.value})}
                        className="w-full bg-[#05130b] border border-green-800 focus:border-amber-500/50 focus:ring-0 rounded-lg px-4 py-3 text-sm text-white placeholder-green-100/20"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-green-100/50 uppercase tracking-wider mb-2">App Description</label>
                      <textarea
                        rows={3}
                        value={editingGame.description || ''}
                        placeholder="Provide detailed description or reviews for this application..."
                        onChange={(e) => setEditingGame({...editingGame, description: e.target.value})}
                        className="w-full bg-[#05130b] border border-green-800 focus:border-amber-500/50 focus:ring-0 rounded-lg px-4 py-3 text-sm text-white placeholder-green-100/20"
                      ></textarea>
                    </div>

                    {/* Logo Upload Section */}
                    <div>
                      <ImageUploader 
                        label="Upload App Logo / Icon"
                        value={editingGame.logoUrl || ''}
                        aspectRatio="square"
                        onChange={(val) => setEditingGame({...editingGame, logoUrl: val})}
                        description="Drag and drop or choose file to set the listing logo instantly."
                      />
                      <div className="mt-2">
                        <label className="block text-[10px] font-bold text-green-100/30 uppercase tracking-wider mb-1">Logo URL Pastelink (Alternative)</label>
                        <input 
                          type="text" 
                          value={editingGame.logoUrl || ''}
                          placeholder="Or paste direct image link here"
                          onChange={(e) => setEditingGame({...editingGame, logoUrl: e.target.value})}
                          className="w-full bg-[#05130b] border border-green-800 focus:border-amber-500/50 focus:ring-0 rounded-lg px-3 py-1.5 text-xs text-white placeholder-green-100/20"
                        />
                      </div>
                    </div>

                    {/* Banner Image Upload Section */}
                    <div>
                      <ImageUploader 
                        label="Upload Banner Image"
                        value={editingGame.bannerUrl || ''}
                        aspectRatio="rect"
                        onChange={(val) => setEditingGame({...editingGame, bannerUrl: val})}
                        description="Drag and drop or choose file for the detail banner (1000x400 recommendations)."
                      />
                      <div className="mt-2">
                        <label className="block text-[10px] font-bold text-green-100/30 uppercase tracking-wider mb-1">Banner URL Pastelink (Alternative)</label>
                        <input 
                          type="text" 
                          value={editingGame.bannerUrl || ''}
                          placeholder="Or paste direct image link here"
                          onChange={(e) => setEditingGame({...editingGame, bannerUrl: e.target.value})}
                          className="w-full bg-[#05130b] border border-green-800 focus:border-amber-500/50 focus:ring-0 rounded-lg px-3 py-1.5 text-xs text-white placeholder-green-100/20"
                        />
                      </div>
                    </div>

                    <div className="md:col-span-2 text-amber-300 font-bold bg-amber-500/10 border border-amber-500/30 p-4 rounded-xl flex items-center justify-between">
                       <span>Make this app Trending?</span>
                       <input 
                          type="checkbox"
                          checked={editingGame.trending}
                          onChange={(e) => setEditingGame({...editingGame, trending: e.target.checked})}
                          className="w-5 h-5 bg-[#05130b] border-green-800 rounded checked:bg-amber-500 focus:ring-0 focus:ring-offset-0"
                       />
                    </div>
                  </div>

                  <div className="mt-8 flex justify-end gap-4">
                     <button type="button" onClick={() => { setEditingGame(null); setIsAddingNew(false); }} className="px-6 py-2.5 rounded-xl text-green-50 hover:bg-[#0a2717] font-bold transition-all border border-transparent">
                       Cancel
                     </button>
                     <button type="submit" className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-[#092212] rounded-xl font-bold transition-all flex items-center gap-2 shadow-lg shadow-amber-500/20">
                       <Save size={18} /> {isAddingNew ? 'Create App' : 'Save Changes'}
                     </button>
                  </div>
                </form>
              ) : null}

              {/* LISTINGS TABLE */}
              <div className="bg-[#071c10] border border-green-800 rounded-2xl overflow-hidden shadow-lg overflow-x-auto">
                <div className="min-w-[700px]">
                  <div className="grid grid-cols-12 gap-4 p-4 border-b border-green-800 bg-[#061e11] text-xs font-bold text-green-100/50 uppercase tracking-wider">
                    <div className="col-span-3">App Name</div>
                    <div className="col-span-5">Referral Link</div>
                    <div className="col-span-2 text-center">Bonus</div>
                    <div className="col-span-2 text-right">Actions</div>
                  </div>
                  
                  <div className="divide-y divide-green-900">
                    {games.map(listing => (
                      <div key={listing.id} className={`grid grid-cols-12 gap-4 p-4 items-center transition-colors ${editingGame?.id === listing.id ? 'bg-[#0a2717]' : 'hover:bg-[#0a2717]'}`}>
                        <div className="col-span-3 font-bold text-white flex items-center gap-2">
                          {listing.logoUrl ? (
                            <img src={listing.logoUrl} className="w-8 h-8 rounded border border-green-800 object-cover" alt="logo" referrerPolicy="no-referrer" />
                          ) : (
                            <div className="w-8 h-8 rounded border border-green-800 bg-[#05130b] flex items-center justify-center shrink-0">
                              <ImageIcon size={14} className="text-green-100/30" />
                            </div>
                          )}
                          <span className="truncate">{listing.title}</span>
                        </div>
                        <div className="col-span-5">
                          <input 
                            type="text" 
                            value={listing.link}
                            onChange={(e) => handleLinkUpdate(listing.id, e.target.value)}
                            placeholder="Paste your referral link here..."
                            className="w-full bg-[#05130b] border border-green-800 focus:border-amber-500/50 focus:ring-0 rounded-lg px-3 py-2 text-sm text-green-50 placeholder-green-100/20"
                          />
                        </div>
                        <div className="col-span-2 text-center text-sm font-medium text-amber-400 truncate px-2">{listing.bonus}</div>
                        <div className="col-span-2 flex justify-end gap-1">
                          <button 
                            onClick={() => { setEditingGame(listing); setIsAddingNew(false); }}
                            className="p-2 text-amber-500 hover:text-amber-400 hover:bg-amber-500/10 rounded border border-transparent hover:border-amber-500/30 transition-all"
                            title="Edit full details"
                          >
                            <Edit size={16} />
                          </button>
                          <button 
                            onClick={() => handleDelete(listing.id)}
                            className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded border border-transparent hover:border-red-500/30 transition-all"
                            title="Delete App"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                    
                    {games.length === 0 && (
                      <div className="p-8 text-center text-green-100/40 text-sm">
                        No apps found. Click "Add App" to create one.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
