import React, { useState, useEffect } from 'react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { 
  Search, Crown, Flame, Coins, Trophy, 
  ArrowRight, Star, Download, Gift, ShieldCheck, Zap, X, Award, Copy, Check, Share2, AlertTriangle
} from 'lucide-react';
import { getGames, Game, trackEvent, getSettings, AppSettings, trackWebsiteView, trackWebsiteReferralClick, trackBannerClick, createReport, getReports, LinkReport, trackAdEvent } from '../lib/store';
import { AdZone } from '../components/AdZone';
import { InterstitialAd } from '../components/InterstitialAd';
import { StickyAd } from '../components/StickyAd';
import { SEOHead } from '../components/SEOHead';

const renderIcon = (type: string) => {
  switch (type) {
    case 'cards': return <Trophy size={42} strokeWidth={1.5} className="text-amber-400 drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]" />;
    case 'crown': return <Crown size={42} strokeWidth={1.5} className="text-amber-400 drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]" />;
    case 'star': return <Star size={42} strokeWidth={1.5} className="text-amber-400 drop-shadow-[0_0_10px_rgba(245,158,11,0.5)] fill-amber-400/20" />;
    case 'flame': return <Flame size={42} strokeWidth={1.5} className="text-amber-400 drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]" />;
    case 'coins': return <Coins size={42} strokeWidth={1.5} className="text-amber-400 drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]" />;
    case 'shield': return <ShieldCheck size={42} strokeWidth={1.5} className="text-amber-400 drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]" />;
    case 'zap': return <Zap size={42} strokeWidth={1.5} className="text-amber-400 drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]" />;
    default: return <Trophy size={42} strokeWidth={1.5} className="text-amber-400 drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]" />;
  }
};

const filterCategories = ['All', 'Rummy', 'Slots', 'Spin', 'Arcade', 'Games', 'VIP', 'Casino'];

export function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [games, setGames] = useState<Game[]>([]);
  const [selectedDetailGame, setSelectedDetailGame] = useState<Game | null>(null);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [copiedAppId, setCopiedAppId] = useState<number | null>(null);
  const [copiedWebsite, setCopiedWebsite] = useState(false);
  const [copiedDetailLink, setCopiedDetailLink] = useState(false);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [sortBy, setSortBy] = useState<'popularity' | 'latest' | 'rating'>('popularity');

  // Interstitial Ad states
  const [interstitialAdOpen, setInterstitialAdOpen] = useState(false);
  const [interstitialPromoGame, setInterstitialPromoGame] = useState<Game | null>(null);
  const [interstitialOnClose, setInterstitialOnClose] = useState<(() => void) | null>(null);
  const [interstitialAdUnit, setInterstitialAdUnit] = useState('details_interstitial');

  // Report states
  const [reports, setReports] = useState<LinkReport[]>([]);
  const [isReporting, setIsReporting] = useState(false);
  const [reportIssueType, setReportIssueType] = useState('Download link not working');
  const [reportComment, setReportComment] = useState('');
  const [reportSuccess, setReportSuccess] = useState(false);
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);

  useEffect(() => {
    getSettings().then(s => setSettings(s)).catch(err => console.error("Error loading settings:", err));
    getGames().then(data => setGames(data)).catch(err => console.error("Error loading games:", err));
    getReports().then(data => setReports(data || [])).catch(err => console.error("Error loading reports:", err));
    trackWebsiteView().catch(err => console.error("Error tracking website view:", err));
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const appIdStr = params.get('app');
    if (appIdStr && games.length > 0) {
      const appId = parseInt(appIdStr, 10);
      const matchedGame = games.find(g => g.id === appId);
      if (matchedGame) {
        setSelectedDetailGame(matchedGame);
      }
    }
  }, [games]);

  const activeBanners = (settings?.homepageBanners || []).filter((banner: any) => {
    if (typeof banner === 'string') return true;
    return !banner?.disabled;
  });

  useEffect(() => {
    if (activeBanners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentBannerIndex(prev => (prev + 1) % activeBanners.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [activeBanners.length]);

  useEffect(() => {
    setIsReporting(false);
    setReportSuccess(false);
    setReportComment('');
  }, [selectedDetailGame]);

  const getBannerUrl = (banner: any): string => {
    if (typeof banner === 'string') return banner;
    return banner?.imageUrl || '';
  };

  const getBannerClickUrl = (banner: any): string => {
    if (typeof banner === 'string') return '';
    return banner?.clickUrl || '';
  };

  const handleBannerClick = async (banner: any) => {
    const imageUrl = getBannerUrl(banner);
    const clickUrl = getBannerClickUrl(banner);
    if (imageUrl) {
      await trackBannerClick(imageUrl);
    }
    if (clickUrl) {
      window.open(clickUrl, '_blank');
    }
  };

  const handleLinkClick = async (game: Game) => {
    const downloadUrl = game.apkUrl || game.link;
    if (!downloadUrl) {
      alert("Download link not available yet.");
      return;
    }

    const proceedWithDownload = async () => {
      const updatedGames = games.map(g => g.id === game.id ? { ...g, downloadClicks: (g.downloadClicks || 0) + 1 } : g);
      setGames(updatedGames);
      await trackEvent(game.id, 'download');
      window.open(downloadUrl, '_blank');
    };

    // Randomly show an Adsterra Social Bar or Popunder (50% probability)
    const triggerAd = Math.random() < 0.50;
    if (triggerAd && games.length > 0) {
      const isPopunder = Math.random() < 0.50;

      if (isPopunder) {
        // Popunder: Open Adsterra link or landing page, then proceed with download immediately
        const popUrl = settings?.websiteReferralUrl || 'https://play777.in';
        try {
          window.open(popUrl, '_blank');
          await trackAdEvent('click', 'download_popunder');
        } catch (e) {
          console.warn('Popunder blocked or failed:', e);
        }
        await proceedWithDownload();
      } else {
        // Social Bar (Interstitial with 5s countdown)
        const otherGames = games.filter(g => g.id !== game.id);
        const chosenPromo = otherGames.length > 0 ? otherGames[Math.floor(Math.random() * otherGames.length)] : games[Math.floor(Math.random() * games.length)];
        
        setInterstitialPromoGame(chosenPromo);
        setInterstitialAdUnit('download_interstitial');
        setInterstitialOnClose(() => () => {
          proceedWithDownload();
        });
        setInterstitialAdOpen(true);
      }
    } else {
      await proceedWithDownload();
    }
  };

  const handleDetailsClick = async (game: Game) => {
    const updatedGames = games.map(g => g.id === game.id ? { ...g, clicks: g.clicks + 1 } : g);
    setGames(updatedGames);
    await trackEvent(game.id, 'view');

    // Details button should always show an interstitial ad first (with 5-second countdown)
    if (games.length > 0) {
      const otherGames = games.filter(g => g.id !== game.id);
      const chosenPromo = otherGames.length > 0 ? otherGames[Math.floor(Math.random() * otherGames.length)] : games[Math.floor(Math.random() * games.length)];
      
      setInterstitialPromoGame(chosenPromo);
      setInterstitialAdUnit('details_interstitial');
      setInterstitialOnClose(() => () => {
        setSelectedDetailGame(game);
      });
      setInterstitialAdOpen(true);
    } else {
      setSelectedDetailGame(game);
    }
  };

  const filteredGames = games
    .filter(game => {
      const matchesSearch = game.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            game.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (game.description || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = activeCategory === 'All' || game.category === activeCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      if (sortBy === 'popularity') {
        const aPopularity = (a.clicks || 0) + (a.downloadClicks || 0);
        const bPopularity = (b.clicks || 0) + (b.downloadClicks || 0);
        return bPopularity - aPopularity;
      }
      if (sortBy === 'rating') {
        const aRating = parseFloat(String(a.rating || '4.8'));
        const bRating = parseFloat(String(b.rating || '4.8'));
        return bRating - aRating;
      }
      // 'latest'
      return b.id - a.id;
    });

  return (
    <div className="min-h-screen bg-[#05130b] text-green-50 font-sans selection:bg-amber-500/30 selection:text-amber-200">
      <SEOHead game={selectedDetailGame} settings={settings} />
      <Navbar />

      <main className="pt-20">
        {/* HOMEPAGE BANNER SLIDESHOW */}
        {activeBanners.length > 0 && (
          <div className="max-w-7xl mx-auto px-4 lg:px-8 pt-6">
            <div className="relative h-44 sm:h-64 md:h-80 w-full overflow-hidden rounded-3xl border border-amber-500/30 shadow-2xl">
              {activeBanners.map((banner, index) => (
                <div
                  key={index}
                  onClick={() => handleBannerClick(banner)}
                  className={`absolute inset-0 transition-opacity duration-1000 cursor-pointer ${
                    index === currentBannerIndex ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                  }`}
                >
                  <img
                    src={getBannerUrl(banner)}
                    className="w-full h-full object-cover"
                    alt={`Campaign Banner ${index + 1}`}
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#05130b] via-transparent to-transparent"></div>
                </div>
              ))}
              
              {/* Dots indicator */}
              {activeBanners.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                  {activeBanners.map((_, i) => (
                    <button
                      key={i}
                      onClick={(e) => { e.stopPropagation(); setCurrentBannerIndex(i); }}
                      className={`w-2 h-2 rounded-full transition-all ${
                        i === currentBannerIndex ? 'bg-amber-400 w-6 animate-pulse' : 'bg-green-100/30 hover:bg-green-100/50'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TOP AD ZONE */}
        {settings?.adsenseEnabled && (
          <div className="max-w-7xl mx-auto px-4 lg:px-8 pt-4">
            <AdZone code={settings.adsenseTopCode} enabled={settings.adsenseEnabled} adUnit="top_banner" />
          </div>
        )}

        {/* HERO HEADER */}
        <section className="relative px-4 py-16 overflow-hidden flex flex-col items-center justify-center text-center bg-[#071c10]/40 border-b border-green-900/30">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-[-30%] left-[20%] w-[50%] h-[50%] bg-green-500/5 rounded-full blur-[120px]"></div>
            <div className="absolute bottom-[-10%] right-[20%] w-[40%] h-[40%] bg-amber-500/5 rounded-full blur-[100px]"></div>
          </div>

          <div className="relative z-10 max-w-4xl mx-auto space-y-6">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
              Premium Gaming <span className="text-transparent bg-clip-text bg-gradient-to-br from-amber-200 via-amber-400 to-amber-600">Marketplace</span>
            </h1>
            
            <p className="text-lg text-green-100/70 max-w-2xl mx-auto">
              Find, compare, and download verified high-reward applications. Official directory for top rummy, slots, and VIP games.
            </p>

            {/* DIRECTORY SEARCH & SORTING */}
            <div className="max-w-3xl mx-auto w-full relative pt-6 flex flex-col md:flex-row gap-4 items-center text-left">
              <div className="flex-1 w-full relative flex items-center bg-[#0a2717] border border-green-800 focus-within:border-amber-500/50 rounded-2xl p-2 shadow-xl transition-all">
                <Search className="text-amber-500 ml-4 mr-2" size={24} />
                <input 
                  type="text" 
                  className="w-full bg-transparent border-none text-lg text-white placeholder-green-100/40 focus:outline-none focus:ring-0 px-2"
                  placeholder="Search for Apps, Rummy, or Slots..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <div className="hidden sm:block px-4 py-2 border-l border-green-800 text-xs font-bold text-green-100/40 uppercase tracking-widest whitespace-nowrap">
                  {filteredGames.length} Results
                </div>
              </div>

              {/* Sort selector */}
              <div className="w-full md:w-64 flex items-center bg-[#0a2717] border border-green-800 focus-within:border-amber-500/50 rounded-2xl px-4 py-3 shadow-xl transition-all">
                <span className="text-xs font-bold text-green-100/40 uppercase tracking-widest mr-2 select-none whitespace-nowrap">Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="w-full bg-transparent border-none text-sm text-amber-400 font-bold focus:outline-none focus:ring-0 cursor-pointer"
                >
                  <option value="popularity" className="bg-[#0a2717] text-white">Popularity</option>
                  <option value="latest" className="bg-[#0a2717] text-white">Latest Apps</option>
                  <option value="rating" className="bg-[#0a2717] text-white">User Rating</option>
                </select>
              </div>
            </div>
            
            {/* CATEGORY FILTERS */}
            <div className="max-w-3xl mx-auto flex flex-wrap justify-center gap-2 pt-4">
              {filterCategories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all ${
                    activeCategory === cat 
                      ? 'bg-amber-500 bg-opacity-20 text-amber-400 border border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                      : 'bg-[#0a2717] text-green-100/60 border border-green-800 hover:border-amber-500/30 hover:text-green-50'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* WEBSITE REFERRAL SYSTEM PANEL */}
            <div className="bg-gradient-to-r from-amber-500/10 via-[#0a2717]/85 to-amber-500/10 border border-amber-500/30 rounded-3xl p-6 max-w-2xl mx-auto shadow-xl mt-8">
              <h3 className="text-lg font-bold text-amber-400 mb-2 flex items-center justify-center gap-2">
                <Crown size={20} className="animate-pulse text-amber-500" /> Share Website & Earn Bonuses!
              </h3>
              <p className="text-xs text-green-100/70 mb-5 leading-relaxed max-w-md mx-auto">
                Invite friends and groups to our premium directory. Earn referral commissions directly by spreading resources!
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3 items-center justify-center">
                {/* Copy website link */}
                <button
                  type="button"
                  id="refer-website-btn"
                  onClick={async () => {
                    const url = settings?.websiteReferralUrl || window.location.origin;
                    await navigator.clipboard.writeText(url);
                    setCopiedWebsite(true);
                    trackWebsiteReferralClick('copy');
                    setTimeout(() => setCopiedWebsite(false), 2000);
                  }}
                  className="w-full sm:w-auto px-5 py-2.5 bg-[#05130b] hover:bg-[#071c10] border border-green-800 hover:border-amber-400 text-xs font-bold text-white rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  {copiedWebsite ? <Check size={14} className="text-green-500" /> : <Copy size={14} className="text-amber-500" />}
                  {copiedWebsite ? 'Link Copied!' : 'Refer Website Link'}
                </button>

                {/* Social Share Group */}
                <div className="flex items-center gap-3 w-full sm:w-auto justify-center">
                  {/* WhatsApp */}
                  <a
                    href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`Hey check out India's ultimate Casino & Rummy Welcome Bonus Directory! Safe, verified games, instant cashout links! Visit: ${settings?.websiteReferralUrl || window.location.origin}`)}`}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => trackWebsiteReferralClick('whatsapp')}
                    className="p-2.5 bg-[#05130b] hover:bg-[#25D366] hover:text-[#05130b] border border-green-800 rounded-xl transition-all text-green-400 hover:border-[#25D366]/50"
                    title="Share on WhatsApp"
                  >
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.717-1.455L0 24zm6.59-4.846c1.66.986 3.284 1.503 4.936 1.504 5.396 0 9.782-4.382 9.785-9.781a9.71 9.71 0 0 0-2.858-6.924 9.716 9.716 0 0 0-6.915-2.854C6.16 3.1 1.777 7.481 1.775 12.88c-.001 1.714.453 3.39 1.313 4.873L2.1 22.135l4.547-1.19c1.558.85 3.326 1.21 4.94 1.21zm10.748-7.986c-.292-.146-1.728-.853-1.995-.951-.267-.099-.463-.146-.659.147-.196.292-.76.952-.93 1.147-.172.196-.344.22-.636.073-.292-.146-1.233-.454-2.35-1.45-1.116-1.002-1.87-2.24-2.088-2.533-.218-.292-.023-.45.124-.597.132-.132.292-.34.439-.512.146-.17.195-.292.292-.487.098-.195.049-.366-.024-.512-.073-.146-.66-1.585-.904-2.17-.238-.574-.479-.496-.659-.506-.17-.008-.365-.01-.56-.01-.196 0-.513.073-.78.366-.268.293-1.025 1.001-1.025 2.44 0 1.439 1.049 2.83 1.195 3.025.147.195 2.064 3.15 4.996 4.414.697.301 1.241.48 1.666.615.7.223 1.338.19 1.843.115.562-.083 1.729-.707 1.974-1.39.245-.683.245-1.268.171-1.39-.073-.122-.267-.195-.559-.34z"/></svg>
                  </a>

                  {/* Telegram */}
                  <a
                    href={`https://t.me/share/url?url=${encodeURIComponent(settings?.websiteReferralUrl || window.location.origin)}&text=${encodeURIComponent(`Check out top premium Rummy/Casino list in India with big sign-up bonuses!`)}`}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => trackWebsiteReferralClick('telegram')}
                    className="p-2.5 bg-[#05130b] hover:bg-[#0088cc] hover:text-[#05130b] border border-green-800 rounded-xl transition-all text-blue-400 hover:border-[#0088cc]/50"
                    title="Share on Telegram"
                  >
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12 .02 C5.34.02 .01 5.35 .01 12.01 C.01 18.67 5.34 24 12 24 C18.66 24 23.99 18.67 23.99 12.01 C23.99 5.35 18.66 .02 12 .02 Z M17.61 8.52 L15.65 17.77 C15.5 18.43 15.11 18.59 14.56 18.28 L11.57 16.08 L10.13 17.47 C9.97 17.63 9.84 17.76 9.53 17.76 L9.74 14.71 L15.29 9.7 C15.53 9.48 15.24 9.36 14.92 9.57 L8.06 13.88 L5.11 12.95 C4.47 12.75 4.46 12.31 5.25 12 L16.8 7.54 C17.33 7.35 17.8 7.67 17.61 8.52 Z"/></svg>
                  </a>

                  {/* Facebook */}
                  <a
                    href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(settings?.websiteReferralUrl || window.location.origin)}`}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => trackWebsiteReferralClick('facebook')}
                    className="p-2.5 bg-[#05130b] hover:bg-[#1877F2] hover:text-[#05130b] border border-green-800 rounded-xl transition-all text-blue-500 hover:border-[#1877F2]/50"
                    title="Share on Facebook"
                  >
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                  </a>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* GAMES DIRECTORY GRID */}
        <section className="py-16 relative z-10 px-4">
          <div className="max-w-7xl mx-auto">
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredGames.length > 0 ? filteredGames.flatMap((game, index) => {
                const elements = [
                  <div key={game.id} className="group bg-gradient-to-b from-[#0a2717] to-[#071c10] border border-green-800 rounded-3xl p-5 hover:border-amber-500/50 transition-all duration-300 relative flex flex-col h-full shadow-lg">
                    
                    {/* Trending Badge Top Edge */}
                    {game.trending && (
                       <div className="absolute top-0 right-5 -translate-y-1/2 z-20 flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-amber-500 to-amber-600 rounded-full text-[#05130b] font-extrabold text-[10px] uppercase shadow-lg shadow-amber-500/20 tracking-wider">
                         <Flame size={12} className="fill-[#05130b] -ml-0.5" /> Trending
                       </div>
                    )}

                    {/* Popularity Badge */}
                    {game.popularityBadge && (
                       <div className="absolute top-0 left-5 -translate-y-1/2 z-20 flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-emerald-600 to-teal-500 rounded-full text-white font-extrabold text-[10px] uppercase shadow-lg shadow-emerald-500/20 tracking-wider border border-emerald-400/20">
                         <Crown size={11} className="text-white fill-white -ml-0.5" /> {game.popularityBadge}
                       </div>
                    )}

                    {/* Logo + Header */}
                    <div className="flex items-center gap-4 mb-5">
                       <div className="w-[85px] h-[85px] shrink-0 rounded-[20px] bg-gradient-to-br from-[#0c311c] to-[#05130b] p-0.5 shadow-inner border border-amber-500/30 group-hover:border-amber-400 transition-colors">
                         <div className="w-full h-full rounded-[18px] flex items-center justify-center bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-opacity-10 relative overflow-hidden">
                           <div className="absolute inset-0 bg-gradient-to-t from-green-900/40 to-transparent"></div>
                           <div className="relative z-10 w-full h-full flex items-center justify-center">
                             {game.logoUrl ? (
                               <img src={game.logoUrl} alt={game.title} className="w-[90%] h-[90%] object-cover rounded-[14px]" referrerPolicy="no-referrer" />
                             ) : (
                               renderIcon(game.iconType)
                             )}
                           </div>
                         </div>
                       </div>
                       <div className="flex flex-col justify-center overflow-hidden">
                         <div className="flex items-center gap-1.5 mb-1.5">
                           <div className="bg-[#05130b] px-2 py-0.5 rounded text-[10px] font-bold text-amber-500 uppercase tracking-wider border border-green-900/80 inline-block w-fit shadow-sm">
                             {game.category}
                           </div>
                           <div className="flex items-center gap-0.5 text-amber-400 text-[10px] font-bold bg-[#05130b] px-1.5 py-0.5 rounded border border-green-900/80 shadow-sm">
                             <Star size={10} className="fill-amber-400 text-amber-400" />
                             <span>{game.rating || '4.8'}</span>
                           </div>
                           {game.withdrawText && (
                             <div className="bg-[#05130b] px-1.5 py-0.5 rounded text-[9px] font-extrabold text-emerald-400 border border-green-900/80 shadow-sm truncate max-w-[100px]" title={game.withdrawText}>
                               {game.withdrawText}
                             </div>
                           )}
                         </div>
                         <h3 className="text-lg font-bold text-white leading-tight truncate group-hover:text-amber-400 transition-colors">
                           {game.title}
                         </h3>
                       </div>
                    </div>

                    {/* Bonus Highlight */}
                    <div className="bg-[#05130b]/60 p-3 rounded-xl border border-green-900/50 mb-3 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                        <Gift size={16} className="text-amber-500" />
                      </div>
                      <div>
                        <p className="text-[10px] text-green-100/50 font-bold uppercase tracking-wider mb-0.5">Welcome Bonus</p>
                        <p className="font-extrabold text-amber-400 text-sm">{game.bonus}</p>
                      </div>
                    </div>

                    {/* Stats display */}
                    <div className="grid grid-cols-2 gap-2 bg-[#05130b]/40 p-2.5 rounded-xl border border-green-950/80 mb-4 text-xs">
                      <div>
                        <p className="text-[9px] text-green-100/30 uppercase tracking-widest font-bold">Downloads</p>
                        <p className="font-extrabold text-white mt-0.5">{game.downloadCount || '100K+'}</p>
                      </div>
                      <div>
                        <p className="text-[9px] text-green-100/30 uppercase tracking-widest font-bold">Total Clicks</p>
                        <p className="font-extrabold text-amber-400 mt-0.5">{game.clicks + (game.downloadClicks || 0)}</p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-auto flex gap-3">
                      <button 
                        onClick={() => handleDetailsClick(game)}
                        className="flex-1 py-3 text-xs font-bold leading-none bg-[#0c311c] hover:bg-amber-500/10 text-green-50 hover:text-amber-400 border border-green-800 hover:border-amber-500/40 rounded-xl transition-all uppercase tracking-wider flex items-center justify-center"
                      >
                        DETAILS
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleLinkClick(game); }}
                        className="flex-1 py-3 text-xs font-bold leading-none bg-gradient-to-t from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-[#092212] rounded-xl transition-all shadow-lg shadow-amber-500/20 uppercase tracking-wider flex items-center justify-center gap-1.5"
                      >
                        <Download size={14} strokeWidth={3} /> {game.buttonText || 'DOWNLOAD'}
                      </button>
                    </div>

                    {/* App Referral Buttons */}
                    <div className="mt-4 pt-3 border-t border-green-900/40 flex items-center justify-between text-xs">
                      <span className="text-[10px] text-green-100/30 font-bold uppercase tracking-wider">Share App:</span>
                      <div className="flex gap-1.5">
                        {/* Copy Link */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const shareUrl = window.location.origin + '?app=' + game.id;
                            navigator.clipboard.writeText(shareUrl);
                            setCopiedAppId(game.id);
                            setTimeout(() => setCopiedAppId(null), 2000);
                            trackWebsiteReferralClick('copy_app');
                          }}
                          className="p-1.5 bg-[#05130b] hover:bg-[#071c10] border border-green-900 rounded-lg text-green-100 hover:text-amber-400 transition-colors"
                          title="Copy App Ref Link"
                        >
                          {copiedAppId === game.id ? <Check size={11} className="text-green-500" /> : <Copy size={11} />}
                        </button>
                        {/* WhatsApp share */}
                        <a
                          href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`Check out ${game.title} & claim ₹${game.bonus} Welcome Bonus! Download here: ${window.location.origin}?app=${game.id}`)}`}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => {
                            e.stopPropagation();
                            trackWebsiteReferralClick('whatsapp_app');
                          }}
                          className="p-1.5 bg-[#05130b] hover:bg-[#25D366] hover:text-[#05130b] border border-green-900 rounded-lg text-green-400 transition-colors"
                          title="Share App on WhatsApp"
                        >
                          <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.717-1.455L0 24zm6.59-4.846c1.66.986 3.284 1.503 4.936 1.504 5.396 0 9.782-4.382 9.785-9.781a9.71 9.71 0 0 0-2.858-6.924 9.716 9.716 0 0 0-6.915-2.854C6.16 3.1 1.777 7.481 1.775 12.88c-.001 1.714.453 3.39 1.313 4.873L2.1 22.135l4.547-1.19c1.558.85 3.326 1.21 4.94 1.21zm10.748-7.986c-.292-.146-1.728-.853-1.995-.951-.267-.099-.463-.146-.659.147-.196.292-.76.952-.93 1.147-.172.196-.344.22-.636.073-.292-.146-1.233-.454-2.35-1.45-1.116-1.002-1.87-2.24-2.088-2.533-.218-.292-.023-.45.124-.597.132-.132.292-.34.439-.512.146-.17.195-.292.292-.487.098-.195.049-.366-.024-.512-.073-.146-.66-1.585-.904-2.17-.238-.574-.479-.496-.659-.506-.17-.008-.365-.01-.56-.01-.196 0-.513.073-.78.366-.268.293-1.025 1.001-1.025 2.44 0 1.439 1.049 2.83 1.195 3.025.147.195 2.064 3.15 4.996 4.414.697.301 1.241.48 1.666.615.7.223 1.338.19 1.843.115.562-.083 1.729-.707 1.974-1.39.245-.683.245-1.268.171-1.39-.073-.122-.267-.195-.559-.34z"/></svg>
                        </a>
                        {/* Telegram share */}
                        <a
                          href={`https://t.me/share/url?url=${encodeURIComponent(`${window.location.origin}?app=${game.id}`)}&text=${encodeURIComponent(`Check out ${game.title} and snap ₹${game.bonus} Signup Bonus!`)}`}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => {
                            e.stopPropagation();
                            trackWebsiteReferralClick('telegram_app');
                          }}
                          className="p-1.5 bg-[#05130b] hover:bg-[#0088cc] hover:text-[#05130b] border border-green-900 rounded-lg text-blue-400 transition-colors"
                          title="Share App on Telegram"
                        >
                          <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24"><path d="M12 .02 C5.34.02 .01 5.35 .01 12.01 C.01 18.67 5.34 24 12 24 C18.66 24 23.99 18.67 23.99 12.01 C23.99 5.35 18.66 .02 12 .02 Z M17.61 8.52 L15.65 17.77 C15.5 18.43 15.11 18.59 14.56 18.28 L11.57 16.08 L10.13 17.47 C9.97 17.63 9.84 17.76 9.53 17.76 L9.74 14.71 L15.29 9.7 C15.53 9.48 15.24 9.36 14.92 9.57 L8.06 13.88 L5.11 12.95 C4.47 12.75 4.46 12.31 5.25 12 L16.8 7.54 C17.33 7.35 17.8 7.67 17.61 8.52 Z"/></svg>
                        </a>
                      </div>
                    </div>

                  </div>
                ];

                // Inject middle ad after every 3 items (index 2, 5, 8...)
                if (settings?.adsenseEnabled && settings.adsenseMiddleCode && (index + 1) % 3 === 0) {
                  elements.push(
                    <div key={`homepage-middle-ad-${index}`} className="col-span-full py-4 text-center">
                      <AdZone code={settings.adsenseMiddleCode} enabled={settings.adsenseEnabled} adUnit="middle_banner" />
                    </div>
                  );
                }

                return elements;
              }) : (
                <div className="col-span-full py-20 text-center flex flex-col items-center justify-center">
                  <Search size={48} className="text-green-800 mb-4" />
                  <h3 className="text-xl font-bold text-white mb-2">No results found</h3>
                  <p className="text-green-100/50">Try adjusting your search query or category filter.</p>
                  <button 
                    onClick={() => { setSearchQuery(''); setActiveCategory('All'); }}
                    className="mt-6 px-6 py-2 bg-[#0a2717] border border-green-800 hover:border-amber-500/50 text-amber-500 rounded-full font-bold transition-all"
                  >
                    Clear Filters
                  </button>
                </div>
              )}
            </div>

          </div>
        </section>

        {/* BOTTOM AD ZONE */}
        {settings?.adsenseEnabled && settings.adsenseBottomCode && (
          <div className="max-w-7xl mx-auto px-4 lg:px-8 pb-10">
            <AdZone code={settings.adsenseBottomCode} enabled={settings.adsenseEnabled} adUnit="footer_banner" />
          </div>
        )}

      </main>

      <Footer />

      {/* App Details Modal Popover */}
      {selectedDetailGame && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-2xl bg-[#071c10] border border-amber-500/35 rounded-3xl overflow-hidden shadow-2xl shadow-amber-500/10 max-h-[90vh] flex flex-col">
            
            {/* Banner Section */}
            <div className="relative h-44 sm:h-56 bg-gradient-to-r from-emerald-950 to-amber-950 shrink-0">
              {selectedDetailGame.bannerUrl ? (
                <img 
                  src={selectedDetailGame.bannerUrl} 
                  alt="" 
                  className="w-full h-full object-cover opacity-80" 
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center opacity-30 select-none bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-500/20 via-emerald-950/40 to-[#071c10]">
                  <Coins size={120} className="text-amber-500/20 rotate-12" />
                </div>
              )}
              {/* Dark overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#071c10] via-black/20 to-transparent"></div>
              
              {/* Close Button overlay */}
              <button 
                onClick={() => setSelectedDetailGame(null)}
                className="absolute top-4 right-4 p-2 bg-[#05130b]/80 hover:bg-amber-500/20 text-green-100 hover:text-amber-400 border border-green-800/40 rounded-full transition-all"
              >
                <X size={18} />
              </button>
            </div>

            {/* Logo Overlap Layout */}
            <div className="px-6 sm:px-8 relative z-10 -mt-12 flex flex-col sm:flex-row items-start sm:items-end gap-4 shrink-0">
              <div className="w-24 h-24 sm:w-28 sm:h-28 shrink-0 rounded-[24px] bg-gradient-to-br from-[#0c311c] to-[#05130b] p-1 shadow-2xl border border-amber-500/40">
                <div className="w-full h-full rounded-[20px] flex items-center justify-center bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-opacity-10 relative overflow-hidden">
                  <div className="relative z-10 w-full h-full flex items-center justify-center">
                    {selectedDetailGame.logoUrl ? (
                      <img src={selectedDetailGame.logoUrl} alt="" className="w-[90%] h-[90%] object-cover rounded-[16px]" referrerPolicy="no-referrer" />
                    ) : (
                      renderIcon(selectedDetailGame.iconType)
                    )}
                  </div>
                </div>
              </div>
              
              <div className="overflow-hidden text-left pb-1">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="bg-[#05130b] px-2.5 py-0.5 rounded-md text-[10px] font-bold text-amber-500 uppercase tracking-widest border border-green-900/60 inline-block shadow">
                    {selectedDetailGame.category}
                  </span>
                  <div className="flex items-center gap-1 text-amber-400 text-xs font-bold bg-[#05130b] px-2 py-0.5 rounded-md border border-green-905">
                    <Star size={11} className="fill-amber-400 text-amber-400" />
                    <span>{selectedDetailGame.rating || '4.9'} rating</span>
                  </div>
                  <div className="bg-[#05130b] px-2 py-0.5 rounded-md text-[10px] font-bold text-emerald-400 uppercase border border-green-905">
                    {selectedDetailGame.downloadCount || '100K+'} Downloads
                  </div>
                  {selectedDetailGame.withdrawText && (
                    <div className="bg-[#05130b] px-2 py-0.5 rounded-md text-[10px] font-bold text-amber-300 uppercase border border-green-905">
                      {selectedDetailGame.withdrawText}
                    </div>
                  )}
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight truncate">
                  {selectedDetailGame.title}
                </h2>
              </div>
            </div>

            {/* Modal Scrollable Content Container */}
            <div className="p-6 sm:p-8 flex-1 overflow-y-auto space-y-6 text-left">
              
              {/* Report warning banner */}
              {!isReporting && (reports.filter(r => r.appId === selectedDetailGame.id && r.status === 'unresolved').length >= 2) && (
                <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-2xl flex items-start gap-3 text-red-200 animate-pulse">
                  <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={20} />
                  <div>
                    <h4 className="font-extrabold text-sm text-red-400">Warning: Multiple User Reports</h4>
                    <p className="text-xs text-red-200/80 leading-relaxed mt-1">
                      This application. has received multiple problem reports from users. Please proceed with caution.
                    </p>
                  </div>
                </div>
              )}

              {isReporting ? (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-bold text-white mb-2">Report a Problem</h2>
                    <p className="text-xs text-green-100/50 leading-relaxed">
                      Please let us know if there is a problem with the links, installer, or description for <span className="text-amber-400 font-bold">{selectedDetailGame.title}</span>.
                    </p>
                  </div>

                  {reportSuccess ? (
                    <div className="bg-green-500/10 border border-green-500/30 p-6 rounded-2xl text-center space-y-4">
                      <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center border border-green-500/30 mx-auto">
                        <Check className="text-green-400" size={24} />
                      </div>
                      <h4 className="font-bold text-white">Report Submitted Successfully</h4>
                      <p className="text-xs text-green-100/70 max-w-sm mx-auto leading-relaxed">
                        Thank you for your report! It has been successfully registered in the database, and our admin team will verify the links and resources for {selectedDetailGame.title} immediately.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setIsReporting(false);
                          setReportSuccess(false);
                          setReportComment('');
                        }}
                        className="px-6 py-2.5 bg-gradient-to-t from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-[#092212] rounded-xl text-xs font-bold uppercase tracking-wider"
                      >
                        Back to App Details
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={async (e) => {
                      e.preventDefault();
                      setIsSubmittingReport(true);
                      try {
                        await createReport(selectedDetailGame.id, selectedDetailGame.title, reportIssueType, reportComment);
                        getReports().then(data => setReports(data || [])).catch(err => console.error("Error reloading reports:", err));
                      } catch (err) {
                        console.error("Error creating report:", err);
                      }
                      setIsSubmittingReport(false);
                      setReportSuccess(true);
                    }} className="space-y-4">
                      
                      <div>
                        <label className="block text-xs font-bold text-green-100/50 uppercase tracking-widest mb-2">Issue Type</label>
                        <select
                          value={reportIssueType}
                          onChange={(e) => setReportIssueType(e.target.value)}
                          className="w-full bg-[#05130b] border border-green-800 rounded-xl p-3 text-sm text-green-100 focus:outline-none focus:border-amber-500/50 cursor-pointer"
                        >
                          <option value="Download link not working">Download link not working</option>
                          <option value="App not opening">App not opening</option>
                          <option value="Wrong referral link">Wrong referral link</option>
                          <option value="Broken page">Broken page</option>
                          <option value="Other issue">Other issue</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-green-100/50 uppercase tracking-widest mb-2">Details or comments (Optional)</label>
                        <textarea
                          rows={4}
                          value={reportComment}
                          onChange={(e) => setReportComment(e.target.value)}
                          placeholder="Describe the issue you are facing..."
                          className="w-full bg-[#05130b] border border-green-800 rounded-xl p-3 text-sm text-green-100 placeholder-green-100/30 focus:outline-none focus:border-amber-500/50 resize-none animate-fade-in"
                        />
                      </div>

                      <div className="flex gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            setIsReporting(false);
                            setReportComment('');
                          }}
                          className="flex-1 py-3 text-xs font-bold text-green-100 hover:text-white uppercase tracking-wider border border-green-850 hover:bg-green-950/20 rounded-xl transition-all"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={isSubmittingReport}
                          className="flex-1 py-3 text-xs font-bold bg-gradient-to-t from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-[#092212] rounded-xl transition-all shadow-lg shadow-amber-500/20 uppercase tracking-wider flex items-center justify-center gap-1.5"
                        >
                          {isSubmittingReport ? 'Submitting...' : 'Submit Report'}
                        </button>
                      </div>

                    </form>
                  )}
                </div>
              ) : (
                <>
                  {/* DETAILS PAGE AD ZONE */}
                  {settings?.adsenseEnabled && settings.adsenseDetailsCode && (
                    <div className="py-2 text-center rounded-xl overflow-hidden bg-[#05130b]/25 border border-green-900/30">
                      <AdZone code={settings.adsenseDetailsCode} enabled={settings.adsenseEnabled} adUnit="details_interstitial" />
                    </div>
                  )}

                  {/* Welcome Bonus card */}
                  <div className="bg-[#05130b]/80 border border-green-900 p-4 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center border border-amber-500/20 shrink-0">
                        <Gift size={20} className="text-amber-400" />
                      </div>
                      <div>
                        <p className="text-[10px] text-green-100/40 font-bold uppercase tracking-wider">EXCLUSIVE SPONSOR BONUS</p>
                        <p className="text-lg font-black text-amber-400">{selectedDetailGame.bonus}</p>
                      </div>
                    </div>
                    {selectedDetailGame.trending && (
                      <div className="flex items-center gap-1 px-3 py-1 bg-amber-500 text-[#05130b] font-black text-[9px] uppercase tracking-wider rounded-xl">
                        <Flame size={10} className="fill-[#05130b]" /> hot
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  <div>
                    <h3 className="text-xs font-bold text-green-100/40 uppercase tracking-widest mb-2 flex items-center gap-2">
                      <Award size={14} className="text-amber-500" /> App Review & Information
                    </h3>
                    <p className="text-sm text-green-100/70 leading-relaxed whitespace-pre-wrap bg-[#05130b]/30 border border-green-950 p-4 rounded-2xl">
                      {selectedDetailGame.description || `Welcome to ${selectedDetailGame.title}. This application is one of the highest-rated platforms in the ${selectedDetailGame.category} category. It provides extremely high reliability, zero lag, smooth rummy/slot tables, instant client-side withdrawals, and high cashback offers. Install today using the link below to unlock your ${selectedDetailGame.bonus} exclusive signup bonus.`}
                    </p>
                  </div>

                  {/* Key Features Bullet points */}
                  <div>
                    <h3 className="text-xs font-bold text-green-100/40 uppercase tracking-widest mb-3 flex items-center gap-2">
                      <ShieldCheck size={14} className="text-amber-500" /> Key Features & Highlights
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {selectedDetailGame.features && selectedDetailGame.features.length > 0 ? (
                        selectedDetailGame.features.map((feat: string, i: number) => (
                          <div key={i} className="flex items-center gap-2.5 bg-[#05130b]/20 p-3 rounded-xl border border-green-950/45 text-xs text-green-100/80">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0"></span>
                            <span className="font-medium">{feat}</span>
                          </div>
                        ))
                      ) : (
                        <>
                          <div className="flex items-center gap-2.5 bg-[#05130b]/20 p-3 rounded-xl border border-green-950/45 text-xs text-green-100/80">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0"></span>
                            <span className="font-medium">24/7 Live Customer Fast Support</span>
                          </div>
                          <div className="flex items-center gap-2.5 bg-[#05130b]/20 p-3 rounded-xl border border-green-950/45 text-xs text-green-100/80">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0"></span>
                            <span className="font-medium">100% Certified Safe Installer Package</span>
                          </div>
                          <div className="flex items-center gap-2.5 bg-[#05130b]/20 p-3 rounded-xl border border-green-950/45 text-xs text-green-100/80">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0"></span>
                            <span className="font-medium">Instant Cashouts via Bank & UPI</span>
                          </div>
                          <div className="flex items-center gap-2.5 bg-[#05130b]/20 p-3 rounded-xl border border-green-950/45 text-xs text-green-100/80">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0"></span>
                            <span className="font-medium">Exciting Weekly Bonus Events & Tournaments</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Website & Referral buttons */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {selectedDetailGame.websiteUrl ? (
                      <button
                        onClick={async () => {
                          const updated = games.map(g => g.id === selectedDetailGame.id ? { ...g, websiteClicks: (g.websiteClicks || 0) + 1 } : g);
                          setGames(updated);
                          await trackEvent(selectedDetailGame.id, 'website_click');
                          window.open(selectedDetailGame.websiteUrl, '_blank');
                        }}
                        className="py-3.5 px-4 bg-[#0c311c]/60 hover:bg-[#0c311c] border border-green-800 text-xs font-bold text-green-50 hover:text-white rounded-xl transition-all flex items-center justify-center gap-1.5 uppercase tracking-wider cursor-pointer"
                      >
                        <ArrowRight size={14} className="text-amber-500 animate-pulse" />
                        <span>Visit Website</span>
                      </button>
                    ) : (
                      <div className="py-3.5 px-4 bg-[#05130b]/20 border border-green-950/45 text-xs font-bold text-green-100/30 rounded-xl text-center select-none flex items-center justify-center">
                        No Website Saved
                      </div>
                    )}

                    {(selectedDetailGame.referralUrl || selectedDetailGame.link) ? (
                      <button
                        onClick={async () => {
                          const targetRef = selectedDetailGame.referralUrl || selectedDetailGame.link;
                          const updated = games.map(g => g.id === selectedDetailGame.id ? { ...g, referralClicks: (g.referralClicks || 0) + 1 } : g);
                          setGames(updated);
                          await trackEvent(selectedDetailGame.id, 'referral_click');
                          window.open(targetRef, '_blank');
                        }}
                        className="py-3.5 px-4 bg-gradient-to-t from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-[#092212] text-xs font-extrabold rounded-xl transition-all flex items-center justify-center gap-1.5 uppercase tracking-wider cursor-pointer"
                      >
                        <Crown size={14} />
                        <span>Referral Link</span>
                      </button>
                    ) : (
                      <div className="py-3.5 px-4 bg-[#05130b]/20 border border-green-950/45 text-xs font-bold text-green-100/30 rounded-xl text-center select-none flex items-center justify-center">
                        No Referral Saved
                      </div>
                    )}
                  </div>

                  {/* Direct Card Referral share row */}
                  <div className="p-4 bg-gradient-to-r from-amber-500/5 via-[#0c311c]/30 to-amber-500/5 rounded-2xl border border-amber-500/15 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-bold text-amber-400">Share & Earn Welcome Bonuses!</p>
                      <p className="text-[10px] text-green-100/50">Invite friends & group chats with this specific installer reference card.</p>
                    </div>
                    <div className="flex items-center gap-2.5 w-full sm:w-auto shrink-0 justify-end">
                      {/* Copy Link */}
                      <button
                        onClick={async () => {
                          const shareUrl = window.location.origin + '?app=' + selectedDetailGame.id;
                          await navigator.clipboard.writeText(shareUrl);
                          setCopiedDetailLink(true);
                          trackWebsiteReferralClick('copy_app_detail');
                          setTimeout(() => setCopiedDetailLink(false), 2000);
                        }}
                        className="px-3.5 py-2 bg-[#05130b] hover:bg-[#071c10] border border-green-800 text-xs font-bold text-green-100 rounded-xl transition-all flex items-center gap-1.5"
                      >
                        {copiedDetailLink ? <Check size={12} className="text-green-400" /> : <Copy size={12} className="text-amber-500" />}
                        <span>{copiedDetailLink ? 'Copied' : 'Copy referral Link'}</span>
                      </button>
                      {/* WhatsApp */}
                      <a
                        href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`Check out ${selectedDetailGame.title} Rummy & Casino App! Signup now and receive an instant Welcome Bonus of ${selectedDetailGame.bonus}! Safe direct link: ${window.location.origin}?app=${selectedDetailGame.id}`)}`}
                        target="_blank"
                        rel="noreferrer"
                        onClick={() => trackWebsiteReferralClick('whatsapp_app_detail')}
                        className="p-2 bg-[#25D366]/10 hover:bg-[#25D366] text-[#25D366] hover:text-[#05130b] border border-[#25D366]/20 rounded-xl transition-all"
                        title="Share App Details on WhatsApp"
                      >
                        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.717-1.455L0 24zm6.59-4.846c1.66.986 3.284 1.503 4.936 1.504 5.396 0 9.782-4.382 9.785-9.781a9.71 9.71 0 0 0-2.858-6.924 9.716 9.716 0 0 0-6.915-2.854C6.16 3.1 1.777 7.481 1.775 12.88c-.001 1.714.453 3.39 1.313 4.873L2.1 22.135l4.547-1.19c1.558.85 3.326 1.21 4.94 1.21zm10.748-7.986c-.292-.146-1.728-.853-1.995-.951-.267-.099-.463-.146-.659.147-.196.292-.76.952-.93 1.147-.172.196-.344.22-.636.073-.292-.146-1.233-.454-2.35-1.45-1.116-1.002-1.87-2.24-2.088-2.533-.218-.292-.023-.45.124-.597.132-.132.292-.34.439-.512.146-.17.195-.292.292-.487.098-.195.049-.366-.024-.512-.073-.146-.66-1.585-.904-2.17-.238-.574-.479-.496-.659-.506-.17-.008-.365-.01-.56-.01-.196 0-.513.073-.78.366-.268.293-1.025 1.001-1.025 2.44 0 1.439 1.049 2.83 1.195 3.025.147.195 2.064 3.15 4.996 4.414.697.301 1.241.48 1.666.615.7.223 1.338.19 1.843.115.562-.083 1.729-.707 1.974-1.39.245-.683.245-1.268.171-1.39-.073-.122-.267-.195-.559-.34z"/></svg>
                      </a>
                      {/* Telegram */}
                      <a
                        href={`https://t.me/share/url?url=${encodeURIComponent(`${window.location.origin}?app=${selectedDetailGame.id}`)}&text=${encodeURIComponent(`Install ${selectedDetailGame.title} and snap ₹${selectedDetailGame.bonus} Signup Bonus!`)}`}
                        target="_blank"
                        rel="noreferrer"
                        onClick={() => trackWebsiteReferralClick('telegram_app_detail')}
                        className="p-2 bg-[#0088cc]/10 hover:bg-[#0088cc] text-[#0088cc] hover:text-[#05130b] border border-[#0088cc]/20 rounded-xl transition-all"
                        title="Share App Details on Telegram"
                      >
                        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12 .02 C5.34.02 .01 5.35 .01 12.01 C.01 18.67 5.34 24 12 24 C18.66 24 23.99 18.67 23.99 12.01 C23.99 5.35 18.66 .02 12 .02 Z M17.61 8.52 L15.65 17.77 C15.5 18.43 15.11 18.59 14.56 18.28 L11.57 16.08 L10.13 17.47 C9.97 17.63 9.84 17.76 9.53 17.76 L9.74 14.71 L15.29 9.7 C15.53 9.48 15.24 9.36 14.92 9.57 L8.06 13.88 L5.11 12.95 C4.47 12.75 4.46 12.31 5.25 12 L16.8 7.54 C17.33 7.35 17.8 7.67 17.61 8.52 Z"/></svg>
                      </a>
                    </div>
                  </div>

                  {/* Additional Casino Trust badges */}
                  <div className="grid grid-cols-2 gap-4 py-2 border-t border-b border-green-900/30">
                    <div className="flex items-center gap-2.5">
                      <ShieldCheck size={18} className="text-green-400 shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-white">100% Secured</p>
                        <p className="text-[10px] text-green-100/40">Verified & certified binary</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Award size={18} className="text-amber-400 shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-white">Instant Withdrawals</p>
                        <p className="text-[10px] text-green-100/40">UPI & Direct Bank Transfer</p>
                      </div>
                    </div>
                  </div>
                </>
              )}

            </div>

            {/* Sticky Actions Footer */}
            <div className="p-6 bg-[#05130b] border-t border-green-900/40 flex gap-3 shrink-0 justify-end">
              {!isReporting && (
                <button 
                  onClick={() => setIsReporting(true)}
                  className="px-4 py-4 text-xs font-bold text-red-500 hover:text-red-400 hover:bg-red-500/10 uppercase tracking-wider border border-red-900/30 rounded-2xl transition-all"
                >
                  Report Problem
                </button>
              )}
              
              <button 
                onClick={() => {
                  if (isReporting) {
                    setIsReporting(false);
                    setReportSuccess(false);
                    setReportComment('');
                  } else {
                    setSelectedDetailGame(null);
                  }
                }}
                className="px-6 py-4 text-xs font-bold text-green-100 hover:text-white uppercase tracking-wider border border-green-850 hover:bg-green-950/20 rounded-2xl transition-all"
              >
                {isReporting ? 'Back to Details' : 'Close'}
              </button>
              
              {!isReporting && (
                <button 
                  onClick={() => {
                    handleLinkClick(selectedDetailGame);
                    setSelectedDetailGame(null);
                  }}
                  className="flex-1 py-4 text-xs font-black bg-gradient-to-t from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-[#092212] rounded-2xl transition-all shadow-xl shadow-amber-500/25 uppercase tracking-widest flex items-center justify-center gap-2"
                >
                  <Download size={16} strokeWidth={3} /> {selectedDetailGame.buttonText || 'DOWNLOAD'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Interstitial Ads system */}
      <InterstitialAd 
        isOpen={interstitialAdOpen}
        onClose={() => {
          setInterstitialAdOpen(false);
          if (interstitialOnClose) {
            interstitialOnClose();
          }
        }}
        code={settings?.adsenseDetailsCode}
        enabled={settings?.adsenseEnabled !== false}
        adUnit={interstitialAdUnit}
      />

      {/* Sticky Banner Ads for Premium Layout */}
      <StickyAd 
        position="left" 
        code={settings?.adsenseMiddleCode} 
        enabled={settings?.adsenseEnabled !== false} 
      />
      <StickyAd 
        position="right" 
        code={settings?.adsenseMiddleCode} 
        enabled={settings?.adsenseEnabled !== false} 
      />
      <StickyAd 
        position="mobile-side" 
        code={settings?.adsenseMiddleCode} 
        enabled={settings?.adsenseEnabled !== false} 
      />
      <StickyAd 
        position="mobile-bottom" 
        code={settings?.adsenseBottomCode} 
        enabled={settings?.adsenseEnabled !== false} 
      />
    </div>
  );
}
