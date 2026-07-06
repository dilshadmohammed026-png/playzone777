import { collection, doc, getDoc, getDocs, setDoc, deleteDoc, updateDoc, addDoc, increment, query, orderBy } from 'firebase/firestore';
import { db, auth } from './firebase';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: any, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export interface Game {
  id: number;
  title: string;
  category: string;
  bonus: string;
  trending: boolean;
  iconType: string;
  link: string;
  logoUrl?: string;
  bannerUrl?: string;
  description?: string;
  buttonText?: string;
  clicks: number;
  downloadClicks?: number;
  websiteClicks?: number;
  referralClicks?: number;
  lastClickTime?: number;
  adminSecret?: string;
  rating?: number | string;
  downloadCount?: string;
  popularityBadge?: string;
  features?: string;
  withdrawText?: string;
  apkUrl?: string;
  websiteUrl?: string;
  referralUrl?: string;
}

export interface AppSettings {
  adsenseEnabled: boolean;
  adsenseTopCode: string;
  adsenseMiddleCode: string;
  adsenseBottomCode: string;
  adsenseDetailsCode: string;
  homepageBanners: any[];
  websiteReferralUrl?: string;
  logoUrl?: string;
  faviconUrl?: string;
  siteName?: string;
  adminEmail?: string;
  adminUsername?: string;
  cloudinaryCloudName?: string;
  cloudinaryUploadPreset?: string;
  
  // SEO fields
  seoWebsiteTitle?: string;
  seoMetaDescription?: string;
  seoMetaKeywords?: string;
  seoCanonicalUrl?: string;
  seoRobotsMeta?: string;
  seoOgTitle?: string;
  seoOgDescription?: string;
  seoOgImage?: string;
  seoTwitterCard?: string;
  seoAuthor?: string;
  seoLanguage?: string;
  seoCountryTarget?: string;
  seoThemeColor?: string;
  seoVerificationGoogle?: string;
  seoVerificationBing?: string;
  seoVerificationYandex?: string;
}

export interface AnalyticsEvent {
  id?: string;
  gameId?: number;
  type: 'view' | 'download' | 'referral' | 'website_view' | 'report' | 'visitor_unique' | 'banner_click' | 'website_click' | 'referral_click';
  platform?: string;
  timestamp: number;
  bannerUrl?: string;
  fingerprint?: string;
}

export const initialGames: Game[] = [
  { id: 1, title: 'ABC Rummy', category: 'Rummy', bonus: '₹51 Bonus', trending: false, iconType: 'cards', link: '', clicks: 0, downloadClicks: 0 },
  { id: 2, title: 'Bingo101', category: 'Games', bonus: '100% Match', trending: false, iconType: 'star', link: '', clicks: 0, downloadClicks: 0 },
  { id: 3, title: 'Boss Rummy', category: 'Rummy', bonus: '₹500 Bonus', trending: true, iconType: 'crown', link: '', clicks: 0, downloadClicks: 0 },
  { id: 4, title: 'Diwa777', category: 'Casino', bonus: '₹111 Bonus', trending: false, iconType: 'flame', link: '', clicks: 0, downloadClicks: 0 },
  { id: 5, title: 'GameRummy', category: 'Rummy', bonus: '₹41 Bonus', trending: false, iconType: 'cards', link: '', clicks: 0, downloadClicks: 0 },
  { id: 6, title: 'Hindi777', category: 'Arcade', bonus: '₹100 Bonus', trending: true, iconType: 'flame', link: '', clicks: 0, downloadClicks: 0 },
];

export const trackEvent = async (gameId: number, type: 'view' | 'download' | 'website_click' | 'referral_click') => {
  try {
    const timestamp = Date.now();
    
    // Add raw event
    await addDoc(collection(db, 'analytics'), {
      gameId,
      type,
      timestamp
    });

    // Determine field to increment
    let field = 'clicks';
    if (type === 'download') {
      field = 'downloadClicks';
    } else if (type === 'website_click') {
      field = 'websiteClicks';
    } else if (type === 'referral_click') {
      field = 'referralClicks';
    }
    
    await updateDoc(doc(db, 'games', String(gameId)), {
      [field]: increment(1),
      lastClickTime: timestamp
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `games/${gameId}`);
  }
};

export const getAnalyticsEvents = async (): Promise<AnalyticsEvent[]> => {
  try {
    const q = query(collection(db, 'analytics'), orderBy('timestamp', 'desc'));
    const querySnapshot = await getDocs(q);
    const events: AnalyticsEvent[] = [];
    querySnapshot.forEach((doc) => {
      events.push({ ...doc.data(), id: doc.id } as AnalyticsEvent);
    });
    return events;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'analytics');
  }
};

export const getGames = async (): Promise<Game[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, 'games'));
    const games: Game[] = [];
    querySnapshot.forEach((doc) => {
      games.push({ ...doc.data(), id: Number(doc.id) } as Game);
    });

    if (games.length === 0) {
      console.log("No games found in Firestore. Seeding default games automatically...");
      await saveGames(initialGames);
      return initialGames;
    }

    return games.sort((a, b) => b.id - a.id);
  } catch (error) {
    console.error("Firestore getGames error:", error);
    return initialGames;
  }
};

export const saveGames = async (games: Game[]) => {
  try {
    const promises = games.map(game => {
      const gameId = String(game.id);
      const { id, ...data } = game;
      const cleanData: any = { ...data };
      
      if (cleanData.logoUrl === undefined) {
        delete cleanData.logoUrl;
      }
      if (cleanData.link === undefined) {
        cleanData.link = '';
      }

      return setDoc(doc(db, 'games', gameId), cleanData);
    });
    await Promise.all(promises);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'games');
  }
};

export const deleteGame = async (id: number) => {
  try {
    await deleteDoc(doc(db, 'games', String(id)));
  } catch(error) {
    handleFirestoreError(error, OperationType.DELETE, `games/${id}`);
  }
};

export const checkAuth = (): boolean => {
  // Purely Firebase Auth backed
  return auth.currentUser !== null;
};

export const getAdminSecret = (): string => {
  return '';
};

export const loginAdmin = (password: string) => {
  // Purely Firebase Auth backed
};

export const logoutAdmin = () => {
  auth.signOut().catch(console.error);
};

export const trackWebsiteReferralClick = async (platform: string) => {
  try {
    await addDoc(collection(db, 'analytics'), {
      type: 'referral',
      platform,
      timestamp: Date.now()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'analytics');
  }
};

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

export const trackWebsiteView = async () => {
  try {
    const now = Date.now();
    
    const sessionKey = 'website_view_tracked';
    if (!sessionStorage.getItem(sessionKey)) {
      await addDoc(collection(db, 'analytics'), {
        type: 'website_view',
        timestamp: now
      });
      sessionStorage.setItem(sessionKey, 'true');
    }

    let ip = 'unknown-ip';
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1500);
      const res = await fetch('https://api.ipify.org?format=json', { signal: controller.signal });
      clearTimeout(timeoutId);
      const data = await res.json();
      ip = data.ip;
    } catch (e) {
      // ignore
    }

    const fingerprintStr = [
      navigator.userAgent,
      navigator.language,
      screen.width + 'x' + screen.height,
      new Date().getTimezoneOffset(),
      navigator.hardwareConcurrency || '',
    ].join('|');

    let localUuid = localStorage.getItem('visitor_uuid');
    if (!localUuid) {
      localUuid = 'usr_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now().toString(36);
      localStorage.setItem('visitor_uuid', localUuid);
    }

    const rawFingerprint = `${ip}::${fingerprintStr}::${localUuid}`;
    const fingerprintId = simpleHash(rawFingerprint);

    const localLastUnique = localStorage.getItem('last_unique_visit_time');
    let shouldLogUnique = true;
    if (localLastUnique) {
      if (now - parseInt(localLastUnique, 10) < 24 * 60 * 60 * 1000) {
        shouldLogUnique = false;
      }
    }

    if (shouldLogUnique) {
      try {
        const userDocRef = doc(db, 'analytics', `user_${fingerprintId}`);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          const lastVisitTimestamp = userDocSnap.data().lastVisitTimestamp;
          if (now - lastVisitTimestamp < 24 * 60 * 60 * 1000) {
            shouldLogUnique = false;
            localStorage.setItem('last_unique_visit_time', String(lastVisitTimestamp));
          }
        }
      } catch (e) {
        // Fallback
      }
    }

    if (shouldLogUnique) {
      try {
        await setDoc(doc(db, 'analytics', `user_${fingerprintId}`), {
          lastVisitTimestamp: now,
          ip,
          userAgent: navigator.userAgent
        });
      } catch (err) {
        // Fallback
      }

      await addDoc(collection(db, 'analytics'), {
        type: 'visitor_unique',
        timestamp: now,
        fingerprint: fingerprintId
      });

      localStorage.setItem('last_unique_visit_time', String(now));
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'analytics');
  }
};

export const trackBannerClick = async (bannerUrl: string) => {
  try {
    await addDoc(collection(db, 'analytics'), {
      type: 'banner_click',
      bannerUrl,
      timestamp: Date.now()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'analytics');
  }
};

export const getSettings = async (): Promise<AppSettings> => {
  try {
    const docRef = doc(db, 'analytics', 'settings_config');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        adsenseEnabled: !!data.adsenseEnabled,
        adsenseTopCode: data.adsenseTopCode || '',
        adsenseMiddleCode: data.adsenseMiddleCode || '',
        adsenseBottomCode: data.adsenseBottomCode || '',
        adsenseDetailsCode: data.adsenseDetailsCode || '',
        homepageBanners: data.homepageBanners || [],
        websiteReferralUrl: data.websiteReferralUrl || '',
        logoUrl: data.logoUrl || '',
        faviconUrl: data.faviconUrl || '',
        siteName: data.siteName || 'Play777Zone',
        adminEmail: data.adminEmail || 'dilshadmohammed887@gmail.com',
        adminUsername: data.adminUsername || 'admin',
        cloudinaryCloudName: data.cloudinaryCloudName || 'dkafy9b8g',
        cloudinaryUploadPreset: data.cloudinaryUploadPreset || 'unsigned_preset'
      };
    } else {
      const defaultSettings: AppSettings = {
        adsenseEnabled: false,
        adsenseTopCode: '',
        adsenseMiddleCode: '',
        adsenseBottomCode: '',
        adsenseDetailsCode: '',
        homepageBanners: [],
        websiteReferralUrl: '',
        logoUrl: '',
        faviconUrl: '',
        siteName: 'Play777Zone',
        adminEmail: 'dilshadmohammed887@gmail.com',
        adminUsername: 'admin',
        cloudinaryCloudName: 'dkafy9b8g',
        cloudinaryUploadPreset: 'unsigned_preset'
      };
      await setDoc(docRef, defaultSettings);
      return defaultSettings;
    }
  } catch (error) {
    console.error("Firestore getSettings error:", error);
    return {
      adsenseEnabled: false,
      adsenseTopCode: '',
      adsenseMiddleCode: '',
      adsenseBottomCode: '',
      adsenseDetailsCode: '',
      homepageBanners: [],
      websiteReferralUrl: '',
      logoUrl: '',
      faviconUrl: '',
      siteName: 'Play777Zone',
      adminEmail: 'dilshadmohammed887@gmail.com',
      adminUsername: 'admin',
      cloudinaryCloudName: 'dkafy9b8g',
      cloudinaryUploadPreset: 'unsigned_preset'
    };
  }
};

export const saveSettings = async (settings: AppSettings) => {
  try {
    const docRef = doc(db, 'analytics', 'settings_config');
    await setDoc(docRef, settings);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('settings-updated'));
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'analytics/settings_config');
  }
};

export const getUploadedImages = async (): Promise<string[]> => {
  try {
    const docRef = doc(db, 'analytics', 'image_assets');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data().images || [];
    }
  } catch (error) {
    console.error("Error getting uploaded images:", error);
  }
  return [];
};

export const saveUploadedImages = async (images: string[]) => {
  try {
    const docRef = doc(db, 'analytics', 'image_assets');
    await setDoc(docRef, { images });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'analytics/image_assets');
  }
};

export const deleteStorageFile = async (url: string) => {
  // Firebase Storage is completely removed. We can safely log that we bypassed this.
  console.log('Bypassed file deletion as Firebase Storage is removed:', url);
};

export const checkAdminEmailAuthorized = async (email: string): Promise<boolean> => {
  const cleanEmail = email.trim().toLowerCase();
  if (cleanEmail === 'dilshadmohammed1d@gmail.com' || cleanEmail === 'dilshadmohammed887@gmail.com') {
    return true;
  }
  try {
    const config = await getSettings();
    if (config?.adminEmail && cleanEmail === config.adminEmail.trim().toLowerCase()) {
      return true;
    }
    const adminDocRef = doc(db, 'admins', cleanEmail);
    const adminDocSnap = await getDoc(adminDocRef);
    if (adminDocSnap.exists()) {
      const data = adminDocSnap.data();
      return !data.disabled;
    }
  } catch (error) {
    console.error("Error checking admin authorization:", error);
  }
  return false;
};

export const getAdmins = async (): Promise<any[]> => {
  try {
    const q = query(collection(db, 'admins'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    const adminsList: any[] = [];
    querySnapshot.forEach((doc) => {
      adminsList.push({ ...doc.data(), email: doc.id });
    });
    return adminsList;
  } catch (error) {
    console.error("Error getting admins list:", error);
    return [];
  }
};

export const saveAdminDoc = async (email: string, username: string, passwordHashOrPlain: string, disabled: boolean) => {
  try {
    const cleanEmail = email.trim().toLowerCase();
    const docRef = doc(db, 'admins', cleanEmail);
    await setDoc(docRef, {
      email: cleanEmail,
      username: username.trim(),
      password: passwordHashOrPlain,
      disabled,
      createdAt: Date.now()
    }, { merge: true });
  } catch (error) {
    console.error("Error saving admin document:", error);
    throw error;
  }
};

export const deleteAdminDoc = async (email: string) => {
  try {
    const cleanEmail = email.trim().toLowerCase();
    const docRef = doc(db, 'admins', cleanEmail);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Error deleting admin document:", error);
    throw error;
  }
};

export interface LinkReport {
  id?: string;
  appId: number;
  appTitle: string;
  issueType: string;
  comment: string;
  createdAt: number;
  status: 'unresolved' | 'resolved';
}

export const createReport = async (appId: number, appTitle: string, issueType: string, comment: string) => {
  try {
    const timestamp = Date.now();
    await addDoc(collection(db, 'reports'), {
      appId,
      appTitle,
      issueType,
      comment,
      createdAt: timestamp,
      status: 'unresolved'
    });

    await addDoc(collection(db, 'analytics'), {
      gameId: appId,
      type: 'report',
      timestamp
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'reports');
  }
};

export const getReports = async (): Promise<LinkReport[]> => {
  try {
    const q = query(collection(db, 'reports'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    const reports: LinkReport[] = [];
    querySnapshot.forEach((doc) => {
      reports.push({ ...doc.data(), id: doc.id } as LinkReport);
    });
    return reports;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'reports');
  }
};

export const updateReportStatus = async (reportId: string, status: 'unresolved' | 'resolved') => {
  try {
    const docRef = doc(db, 'reports', reportId);
    await updateDoc(docRef, { status });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `reports/${reportId}`);
  }
};

export interface AdAnalyticsEvent {
  id?: string;
  type: 'impression' | 'click';
  adUnit: string;
  timestamp: number;
  platform: 'desktop' | 'mobile';
}

export const trackAdEvent = async (type: 'impression' | 'click', adUnit: string, platform?: 'desktop' | 'mobile') => {
  try {
    const defaultPlatform = platform || (typeof window !== 'undefined' && window.innerWidth >= 1280 ? 'desktop' : 'mobile');
    await addDoc(collection(db, 'ad_analytics'), {
      type,
      adUnit,
      timestamp: Date.now(),
      platform: defaultPlatform
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'ad_analytics');
  }
};

export const getAdAnalyticsEvents = async (): Promise<AdAnalyticsEvent[]> => {
  try {
    const q = query(collection(db, 'ad_analytics'), orderBy('timestamp', 'desc'));
    const querySnapshot = await getDocs(q);
    const events: AdAnalyticsEvent[] = [];
    querySnapshot.forEach((doc) => {
      events.push({ ...doc.data(), id: doc.id } as AdAnalyticsEvent);
    });
    return events;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'ad_analytics');
  }
};

