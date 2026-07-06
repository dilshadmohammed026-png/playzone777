import React, { useState, useEffect } from 'react';
import { Crown, ShieldCheck } from 'lucide-react';
import { getSettings, AppSettings } from '../lib/store';
import { AdZone } from './AdZone';

export function Footer() {
  const [settings, setSettings] = useState<AppSettings | null>(null);

  useEffect(() => {
    getSettings().then(s => setSettings(s));
  }, []);

  const siteName = settings?.siteName || 'Play777Zone';

  return (
    <footer className="bg-[#030d07] border-t border-amber-900/30 pt-16 pb-8 text-green-100/70">
      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        {settings?.adsbygoogle || settings?.adsenseEnabled ? (
          <div className="w-full flex justify-center mb-8">
            <AdZone code={settings.adsenseBottomCode} enabled={settings.adsenseEnabled} adUnit="footer_banner" />
          </div>
        ) : null}

        <div className="flex flex-col md:flex-row justify-between items-center gap-8 mb-8 pb-8 border-b border-green-900/30">
          <div className="flex items-center gap-2">
            {settings?.logoUrl ? (
              <img src={settings.logoUrl} alt={siteName} className="h-8 object-contain max-w-[160px]" referrerPolicy="no-referrer" />
            ) : (
              <>
                <Crown size={28} className="text-amber-500" />
                <span className="text-2xl font-bold bg-gradient-to-r from-amber-200 to-amber-500 bg-clip-text text-transparent uppercase tracking-wider">
                  {siteName}
                </span>
              </>
            )}
          </div>
          <div className="flex gap-6 text-sm font-medium">
            <a href="#" className="hover:text-amber-400">Terms of Service</a>
            <a href="#" className="hover:text-amber-400">Privacy Policy</a>
            <a href="#" className="hover:text-amber-400">Responsible Gaming</a>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left mb-8 text-sm">
          <div>
            <h4 className="text-white font-bold mb-4 uppercase tracking-wider">About Us</h4>
            <p>India's largest directory for VIP casino bonuses, rummy platforms, and premium gaming sites. Updated daily.</p>
          </div>
          <div className="flex flex-col items-center">
            <ShieldCheck size={40} className="text-green-500 mb-2 opacity-50 animate-pulse" />
            <p className="font-semibold text-green-100/50">100% Verified Platforms</p>
          </div>
          <div className="md:text-right">
            <p>18+ Only. Gaming involves financial risk and may be addictive. Please play responsibly.</p>
          </div>
        </div>
        
        <div className="text-center text-xs text-green-900/60 font-semibold">
          &copy; {new Date().getFullYear()} {siteName}. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
