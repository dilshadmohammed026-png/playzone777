import React, { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { trackAdEvent } from '../lib/store';

interface InterstitialAdProps {
  isOpen: boolean;
  onClose: () => void;
  code?: string;
  enabled?: boolean;
  adUnit?: string;
}

export function InterstitialAd({ 
  isOpen, 
  onClose, 
  code, 
  enabled = true,
  adUnit = 'details_interstitial'
}: InterstitialAdProps) {
  const [secondsLeft, setSecondsLeft] = useState(5);
  const [canSkip, setCanSkip] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Reset countdown states
    setSecondsLeft(5);
    setCanSkip(false);

    // Track impression when the interstitial opens
    trackAdEvent('impression', adUnit);

    // Prevent body scroll when ad is open
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setCanSkip(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(interval);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, adUnit]);

  // Inject and execute custom ad script safely
  useEffect(() => {
    if (!isOpen || !containerRef.current) return;

    const adHtml = code && code.trim() ? code : getDefaultResponsiveAdHtml();

    try {
      containerRef.current.innerHTML = adHtml;
      
      const scripts = containerRef.current.querySelectorAll('script');
      scripts.forEach(oldScript => {
        try {
          const newScript = document.createElement('script');
          
          Array.from(oldScript.attributes).forEach((attr: any) => {
            newScript.setAttribute(attr.name, attr.value);
          });
          
          newScript.appendChild(document.createTextNode(oldScript.innerHTML));
          
          if (oldScript.parentNode) {
            oldScript.parentNode.replaceChild(newScript, oldScript);
          }
        } catch (scriptErr) {
          console.warn('Script execution in InterstitialAd failed:', scriptErr);
        }
      });

      // Push to Google Adsense if requested
      if (adHtml.includes('adsbygoogle')) {
        try {
          const win = window as any;
          win.adsbygoogle = win.adsbygoogle || [];
          win.adsbygoogle.push({});
        } catch (_) {
          // Silent catch in case of duplicate push
        }
      }
    } catch (err) {
      console.error('Error rendering interstitial ad content:', err);
    }
  }, [isOpen, code]);

  // Click tracking
  useEffect(() => {
    if (!isOpen || !containerRef.current) return;

    const container = containerRef.current;

    const handleContainerClick = () => {
      trackAdEvent('click', adUnit);
    };

    container.addEventListener('click', handleContainerClick);

    const handleWindowBlur = () => {
      setTimeout(() => {
        if (document.activeElement && document.activeElement.tagName === 'IFRAME') {
          if (container.contains(document.activeElement)) {
            trackAdEvent('click', adUnit);
          }
        }
      }, 100);
    };

    window.addEventListener('blur', handleWindowBlur);

    return () => {
      container.removeEventListener('click', handleContainerClick);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [isOpen, adUnit]);

  if (!isOpen) return null;

  function getDefaultResponsiveAdHtml() {
    return `
      <div class="w-full text-center py-8 px-6 bg-gradient-to-br from-[#0c2a18] to-[#041208] border border-green-800/40 rounded-2xl flex flex-col items-center justify-center min-h-[250px] shadow-2xl relative overflow-hidden">
        <div class="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.08)_0%,transparent_70%)] pointer-events-none"></div>
        <div class="flex items-center justify-center w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 mb-4 animate-bounce">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-zap"><path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/></svg>
        </div>
        <h3 class="text-white text-base md:text-lg font-black tracking-wide uppercase mb-1 font-sans">Play777 Sponsored Network</h3>
        <p class="text-green-400 text-xs font-bold uppercase tracking-widest mb-3 font-mono">Premium Rewards & Verified Cashbacks</p>
        <p class="text-green-100/60 text-xs md:text-sm max-w-md leading-relaxed font-medium mb-5 font-sans">
          Join India's premium gaming network. Claim up to ₹50,000 daily welcome cashbacks and guaranteed instant fast withdrawals!
        </p>
        <a href="#" onclick="window.open('https://play777.in', '_blank'); return false;" class="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-[#041108] font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-amber-500/20 font-mono">
          Claim Welcome Offer
        </a>
      </div>
    `;
  }

  const handleSkip = () => {
    if (canSkip) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#020905]/95 backdrop-blur-md overflow-y-auto p-4 md:p-6 animate-fade-in">
      {/* Background ambient lighting effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-green-500/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Main Container */}
      <div className="relative w-full max-w-xl bg-gradient-to-b from-[#071c10] to-[#030e07] border border-green-800/40 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(16,185,129,0.15)] flex flex-col my-auto">
        
        {/* Top Header Controls */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-green-900/30 bg-[#041208]/80">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
            <span className="text-[10px] md:text-xs font-black tracking-widest text-amber-400 uppercase font-mono">
              Sponsored Advertisement
            </span>
          </div>

          {/* Countdown or Skip Button */}
          <div>
            {canSkip ? (
              <button
                type="button"
                onClick={handleSkip}
                className="px-5 py-2 text-xs md:text-sm font-black tracking-wider bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-[#041108] rounded-full transition-all duration-300 shadow-lg shadow-amber-500/20 active:scale-95 flex items-center gap-1.5 cursor-pointer font-mono"
              >
                CLOSE AD <X size={15} strokeWidth={2.5} />
              </button>
            ) : (
              <div className="px-5 py-2 text-xs md:text-sm font-bold bg-[#05130a] text-green-100/60 rounded-full border border-green-900/40 font-mono">
                Close in <span className="text-amber-400 font-black text-sm">{secondsLeft}s</span>
              </div>
            )}
          </div>
        </div>

        {/* Ad Space Area */}
        <div className="flex-1 p-6 md:p-8 flex flex-col justify-center items-center min-h-[300px]">
          <div 
            ref={containerRef} 
            className="w-full max-w-full flex justify-center items-center overflow-x-auto"
            id={`interstitial-${adUnit}-slot`}
          />
        </div>

        {/* Footer info strip */}
        <div className="px-6 py-3 border-t border-green-900/20 bg-[#030904]/90 text-[9px] text-green-100/20 text-center font-bold uppercase tracking-wider font-mono">
          ADVERTISEMENT | VERIFIED SAFE ADS | PRESS CLOSE TO CONTINUE
        </div>

      </div>
    </div>
  );
}
