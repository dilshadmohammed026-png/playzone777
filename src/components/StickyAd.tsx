import React, { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { trackAdEvent } from '../lib/store';

interface StickyAdProps {
  code?: string;
  enabled?: boolean;
  position: 'left' | 'right' | 'mobile-side' | 'mobile-bottom';
}

export function StickyAd({ code, enabled = true, position }: StickyAdProps) {
  const [isVisible, setIsVisible] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const outerRef = useRef<HTMLDivElement>(null);
  const [hasImpressed, setHasImpressed] = useState(false);
  const [isAdVisible, setIsAdVisible] = useState(false);
  const adUnit = `sticky_${position}`;

  // Lazy loading using IntersectionObserver
  useEffect(() => {
    if (!enabled || !isVisible || !outerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsAdVisible(true);
            if (!hasImpressed) {
              setHasImpressed(true);
              trackAdEvent('impression', adUnit);
            }
          }
        });
      },
      { threshold: 0.1 }
    );

    observer.observe(outerRef.current);
    return () => observer.disconnect();
  }, [enabled, isVisible, adUnit, hasImpressed]);

  // Inject and execute custom ad script safely
  useEffect(() => {
    if (!enabled || !isVisible || !isAdVisible || !containerRef.current) return;

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
          console.warn('Script execution in StickyAd failed:', scriptErr);
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
      console.error('Error rendering sticky ad:', err);
    }
  }, [enabled, isVisible, isAdVisible, code]);

  // Click tracking
  useEffect(() => {
    if (!enabled || !isVisible || !isAdVisible || !containerRef.current) return;

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
  }, [enabled, isVisible, isAdVisible, adUnit]);

  function getDefaultResponsiveAdHtml() {
    // Highly polished native fallback designs based on position
    if (position === 'mobile-bottom') {
      return `
        <a href="#" onclick="window.open('https://play777.in', '_blank'); return false;" class="flex items-center gap-3 w-full h-full text-left px-3 text-white">
          <div class="w-10 h-10 rounded-lg bg-amber-500 flex items-center justify-center shrink-0 font-extrabold text-black text-sm">777</div>
          <div class="flex-1 min-w-0">
            <h4 class="text-xs font-black tracking-wide text-amber-400 uppercase truncate">CLAIM FREE SPIN OFFER</h4>
            <p class="text-[10px] text-green-100/60 truncate font-sans">Win up to ₹50,000 real cash back instantly!</p>
          </div>
          <div class="px-3 py-1 bg-green-500 hover:bg-green-400 text-[#041108] font-black text-[9px] uppercase tracking-wider rounded-md shrink-0 font-mono">
            PLAY NOW
          </div>
        </a>
      `;
    }

    if (position === 'mobile-side') {
      return `
        <a href="#" onclick="window.open('https://play777.in', '_blank'); return false;" class="flex flex-col items-center justify-between h-full text-center p-1.5 text-white">
          <div class="text-[8px] font-black tracking-widest text-amber-400 uppercase leading-none mt-1 font-mono">HOT AD</div>
          <div class="w-10 h-10 rounded-lg bg-gradient-to-tr from-green-600 to-emerald-400 flex items-center justify-center my-2 font-black text-black">777</div>
          <div class="text-[9px] font-extrabold text-green-100 leading-tight font-sans">FREE CASH</div>
          <div class="mt-1 px-1.5 py-0.5 bg-amber-500 text-[#041108] text-[8px] font-black uppercase rounded font-mono">GO</div>
        </a>
      `;
    }

    // Left/Right side banners
    return `
      <a href="#" onclick="window.open('https://play777.in', '_blank'); return false;" class="flex flex-col items-center justify-between h-full text-center p-4 text-white">
        <div class="flex flex-col items-center">
          <span class="px-2 py-0.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[9px] font-bold uppercase tracking-wider rounded font-mono">SPONSORED</span>
          <div class="w-20 h-20 rounded-2xl bg-gradient-to-br from-green-600 to-[#041308] border border-green-500/20 flex items-center justify-center mt-6 shadow-lg shadow-green-950/40 relative overflow-hidden group">
            <div class="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.2)_0%,transparent_70%)]"></div>
            <span class="font-black text-xl text-amber-400 tracking-tighter drop-shadow-lg font-mono">PLAY777</span>
          </div>
          <h4 class="text-sm font-black text-white mt-5 tracking-wide leading-snug font-sans">INDIA'S BEST GAME PORTAL</h4>
          <p class="text-[10px] text-green-100/50 mt-2 font-mono">100% VERIFIED CASHBACKS</p>
        </div>
        
        <div class="flex flex-col items-center gap-4 w-full">
          <p class="text-[11px] text-green-400 font-extrabold uppercase bg-green-950/40 border border-green-900/30 px-2 py-1 rounded w-full font-mono">
            ₹50,000 WELCOME
          </p>
          <button class="w-full py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-[#041108] font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-md shadow-amber-500/15 font-mono">
            PLAY NOW
          </button>
        </div>
      </a>
    `;
  }

  if (!enabled || !isVisible) return null;

  // Render sticky containers depending on layout requirement
  if (position === 'left') {
    return (
      <div 
        ref={outerRef}
        className="fixed left-4 top-28 w-44 h-[620px] hidden xl:flex flex-col bg-gradient-to-b from-[#041208]/90 to-[#020a04]/95 border border-green-900/30 rounded-2xl z-[40] shadow-2xl overflow-hidden group animate-fade-in-left"
      >
        <button 
          onClick={() => setIsVisible(false)}
          className="absolute top-2 right-2 p-1 text-green-100/40 hover:text-white bg-green-950/40 hover:bg-green-950/80 rounded-full transition-colors z-50 border border-green-900/40 cursor-pointer"
          title="Close Ad"
        >
          <X size={12} />
        </button>
        <div className="absolute top-2 left-2 text-[7px] font-bold tracking-widest text-green-100/30 uppercase font-mono">
          ADVERT
        </div>
        <div ref={containerRef} className="w-full h-full" />
      </div>
    );
  }

  if (position === 'right') {
    return (
      <div 
        ref={outerRef}
        className="fixed right-4 top-28 w-44 h-[620px] hidden xl:flex flex-col bg-gradient-to-b from-[#041208]/90 to-[#020a04]/95 border border-green-900/30 rounded-2xl z-[40] shadow-2xl overflow-hidden group animate-fade-in-right"
      >
        <button 
          onClick={() => setIsVisible(false)}
          className="absolute top-2 right-2 p-1 text-green-100/40 hover:text-white bg-green-950/40 hover:bg-green-950/80 rounded-full transition-colors z-50 border border-green-900/40 cursor-pointer"
          title="Close Ad"
        >
          <X size={12} />
        </button>
        <div className="absolute top-2 left-2 text-[7px] font-bold tracking-widest text-green-100/30 uppercase font-mono">
          ADVERT
        </div>
        <div ref={containerRef} className="w-full h-full" />
      </div>
    );
  }

  if (position === 'mobile-side') {
    return (
      <div 
        ref={outerRef}
        className="fixed left-1 bottom-20 w-24 h-48 md:hidden flex flex-col bg-[#041208]/95 border border-green-900/30 rounded-xl z-[40] shadow-2xl overflow-hidden animate-bounce-subtle"
      >
        <button 
          onClick={() => setIsVisible(false)}
          className="absolute top-1 right-1 p-0.5 text-green-100/40 hover:text-white bg-green-950/60 rounded-full transition-colors z-50 cursor-pointer"
        >
          <X size={10} />
        </button>
        <div ref={containerRef} className="w-full h-full" />
      </div>
    );
  }

  if (position === 'mobile-bottom') {
    return (
      <div 
        ref={outerRef}
        className="fixed bottom-0 left-0 right-0 h-16 md:hidden flex items-center bg-[#020904]/98 border-t border-green-900/40 z-[50] shadow-2xl animate-slide-up overflow-hidden"
      >
        <button 
          onClick={() => setIsVisible(false)}
          className="absolute top-1 right-2 p-0.5 text-green-100/40 hover:text-white bg-green-950/60 rounded-full transition-colors z-50 cursor-pointer"
        >
          <X size={10} />
        </button>
        <div ref={containerRef} className="w-full h-full flex items-center" />
      </div>
    );
  }

  return null;
}
