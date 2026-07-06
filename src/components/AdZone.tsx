import React, { useEffect, useRef, useState } from 'react';
import { trackAdEvent } from '../lib/store';

interface AdZoneProps {
  code?: string;
  enabled?: boolean;
  adUnit: string;
}

export function AdZone({ code, enabled = true, adUnit }: AdZoneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const outerRef = useRef<HTMLDivElement>(null);
  const [hasImpressed, setHasImpressed] = useState(false);
  const [isAdVisible, setIsAdVisible] = useState(false);

  // Lazy loading using IntersectionObserver
  useEffect(() => {
    if (!enabled || !code || !code.trim() || !outerRef.current) return;

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
  }, [enabled, code, adUnit, hasImpressed]);

  // Inject and evaluate code when visible
  useEffect(() => {
    if (!enabled || !code || !code.trim() || !isAdVisible || !containerRef.current) return;

    try {
      containerRef.current.innerHTML = code;
      
      // Find and run any script tags inside the injected HTML safely
      const scripts = containerRef.current.querySelectorAll('script');
      scripts.forEach(oldScript => {
        try {
          const newScript = document.createElement('script');
          
          // Copy all script attributes
          Array.from(oldScript.attributes).forEach((attr: any) => {
            newScript.setAttribute(attr.name, attr.value);
          });
          
          // Set script inner content
          newScript.appendChild(document.createTextNode(oldScript.innerHTML));
          
          // Replace script block to force browser evaluation safely
          if (oldScript.parentNode) {
            oldScript.parentNode.replaceChild(newScript, oldScript);
          }
        } catch (scriptErr) {
          console.warn('Isolated script tag error in AdZone:', scriptErr);
        }
      });

      // Trigger Google Adsense placement push event if applicable
      if (code.includes('adsbygoogle')) {
        try {
          const win = window as any;
          win.adsbygoogle = win.adsbygoogle || [];
          win.adsbygoogle.push({});
        } catch (_) {
          // Silent catch in case of multiple ad pushes or adblockers
        }
      }
    } catch (e) {
      console.error('Error rendering AdZone spot:', e);
    }
  }, [code, enabled, isAdVisible]);

  // Tracking clicks (including iframes via window blur)
  useEffect(() => {
    if (!enabled || !isAdVisible || !containerRef.current) return;

    const container = containerRef.current;

    const handleContainerClick = (e: MouseEvent) => {
      // Direct clicks on our custom links / standard buttons
      trackAdEvent('click', adUnit);
    };

    container.addEventListener('click', handleContainerClick);

    // Track iframe clicks by listening to window blur
    const handleWindowBlur = () => {
      setTimeout(() => {
        if (document.activeElement && document.activeElement.tagName === 'IFRAME') {
          // Check if active iframe is inside this container
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
  }, [enabled, isAdVisible, adUnit]);

  if (!enabled || !code || !code.trim()) {
    return null;
  }

  return (
    <div 
      ref={outerRef}
      className="w-full flex flex-col items-center justify-center py-5 px-4 my-6 bg-gradient-to-b from-[#041208]/80 to-[#020a04]/90 border border-green-900/30 rounded-2xl shadow-inner max-w-full overflow-hidden relative"
    >
      <div className="absolute top-1.5 right-4 text-[8px] md:text-[9px] font-black tracking-[0.2em] text-green-100/25 uppercase font-mono select-none">
        Sponsored Advertisement
      </div>
      <div 
        ref={containerRef} 
        className="w-full max-w-full flex justify-center items-center overflow-x-auto min-h-[90px] mt-2.5"
        id={`adslot-${adUnit}`}
      />
    </div>
  );
}
