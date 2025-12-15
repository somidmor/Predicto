// ============================================
// PREDICTO - Internationalization (i18n)
// Bilingual support: English & Farsi (Persian)
// ============================================

import { getLanguage, setLanguage } from '../services/storageService';
import type { Language } from '../services/storageService';

// ============================================
// Translation Dictionaries
// ============================================

const translations = {
  en: {
    // Common
    'app.name': 'Predicto',
    'app.tagline': 'Real-time Event Betting',
    'common.loading': 'Loading...',
    'common.error': 'An error occurred',
    'common.success': 'Success!',
    'common.cancel': 'Cancel',
    'common.confirm': 'Confirm',
    'common.close': 'Close',
    'common.save': 'Save',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.back': 'Back',
    'common.next': 'Next',
    'common.submit': 'Submit',
    'common.or': 'or',

    // Currency
    'currency.name': 'Anars',
    'currency.symbol': '🍎',

    // Home Page
    'home.title': 'Welcome to Predicto',
    'home.subtitle': 'The ultimate real-time betting experience',
    'home.createSession': 'Create Session',
    'home.joinSession': 'Join Session',
    'home.enterCode': 'Enter session code',
    'home.hostName': 'Your name (optional)',

    // Join Page
    'join.title': 'Join the Game',
    'join.sessionCode': 'Session Code',
    'join.firstName': 'First Name',
    'join.lastName': 'Last Name',
    'join.age': 'Age',
    'join.submit': 'Join Session',
    'join.starterBalance': 'You will receive {amount} Anars to start!',
    'join.invalidCode': 'Invalid session code',
    'join.sessionNotFound': 'Session not found',

    // Admin Dashboard
    'admin.title': 'Admin Dashboard',
    'admin.sessionCode': 'Session Code',
    'admin.shareCode': 'Share this code with players',
    'admin.participants': 'Participants',
    'admin.challenges': 'Challenges',
    'admin.createChallenge': 'Create Challenge',
    'admin.startVolunteering': 'Start Volunteering',
    'admin.selectContestants': 'Select Contestants',
    'admin.startBetting': 'Start Betting',
    'admin.closeBetting': 'Close Betting',
    'admin.declareWinner': 'Declare Winner',
    'admin.endSession': 'End Session',

    // Challenge Management
    'challenge.name': 'Challenge Name',
    'challenge.description': 'Description (optional)',
    'challenge.participants': 'Required Participants',
    'challenge.create': 'Create Challenge',
    'challenge.edit': 'Edit Challenge',
    'challenge.delete': 'Delete Challenge',

    // Volunteering
    'volunteer.title': 'Volunteer Phase',
    'volunteer.description': 'Risk it all for glory!',
    'volunteer.warning': 'WARNING: You must bet 100% of your balance',
    'volunteer.yourBalance': 'Your Balance',
    'volunteer.button': 'Volunteer (All-In)',
    'volunteer.waiting': 'Waiting for selection...',
    'volunteer.selected': 'You have been selected!',
    'volunteer.notSelected': 'Not selected - balance refunded',
    'volunteer.count': '{count} volunteers',
    'volunteer.selectManual': 'Manual Selection',
    'volunteer.selectRandom': 'Random Selection',

    // Betting
    'betting.title': 'Place Your Bets',
    'betting.timeLeft': 'Time Left',
    'betting.totalPool': 'Total Pool',
    'betting.odds': 'Odds',
    'betting.yourBet': 'Your Bet',
    'betting.potentialWin': 'Potential Win',
    'betting.placeBet': 'Place Bet',
    'betting.minBet': 'Minimum bet: {amount}',
    'betting.maxBet': 'Maximum: {amount}',
    'betting.closed': 'Betting Closed',
    'betting.noBalance': 'Insufficient balance',

    // Results
    'result.title': 'Results',
    'result.winner': 'Winner',
    'result.youWon': 'You Won!',
    'result.youLost': 'Better luck next time',
    'result.payout': 'Payout',
    'result.newBalance': 'New Balance',

    // Player View
    'player.balance': 'Balance',
    'player.locked': 'Locked',
    'player.waiting': 'Waiting for host...',
    'player.leaveSession': 'Leave Session',

    // Errors
    'error.generic': 'Something went wrong',
    'error.network': 'Network error. Please try again.',
    'error.sessionFull': 'Session is full',
    'error.sessionClosed': 'Session has ended',
    'error.insufficientBalance': 'Insufficient balance',
    'error.alreadyVolunteered': 'You have already volunteered',
    'error.bettingClosed': 'Betting is closed',
  },

  fa: {
    // Common
    'app.name': 'پردیکتو',
    'app.tagline': 'شرط‌بندی زنده رویدادها',
    'common.loading': 'در حال بارگذاری...',
    'common.error': 'خطایی رخ داد',
    'common.success': 'موفقیت!',
    'common.cancel': 'انصراف',
    'common.confirm': 'تأیید',
    'common.close': 'بستن',
    'common.save': 'ذخیره',
    'common.delete': 'حذف',
    'common.edit': 'ویرایش',
    'common.back': 'بازگشت',
    'common.next': 'بعدی',
    'common.submit': 'ارسال',
    'common.or': 'یا',

    // Currency
    'currency.name': 'انار',
    'currency.symbol': '🍎',

    // Home Page
    'home.title': 'به پردیکتو خوش آمدید',
    'home.subtitle': 'بهترین تجربه شرط‌بندی زنده',
    'home.createSession': 'ایجاد جلسه',
    'home.joinSession': 'پیوستن به جلسه',
    'home.enterCode': 'کد جلسه را وارد کنید',
    'home.hostName': 'نام شما (اختیاری)',

    // Join Page
    'join.title': 'به بازی بپیوندید',
    'join.sessionCode': 'کد جلسه',
    'join.firstName': 'نام',
    'join.lastName': 'نام خانوادگی',
    'join.age': 'سن',
    'join.submit': 'پیوستن به جلسه',
    'join.starterBalance': 'شما {amount} انار برای شروع دریافت خواهید کرد!',
    'join.invalidCode': 'کد جلسه نامعتبر',
    'join.sessionNotFound': 'جلسه پیدا نشد',

    // Admin Dashboard
    'admin.title': 'پنل مدیریت',
    'admin.sessionCode': 'کد جلسه',
    'admin.shareCode': 'این کد را با بازیکنان به اشتراک بگذارید',
    'admin.participants': 'شرکت‌کنندگان',
    'admin.challenges': 'چالش‌ها',
    'admin.createChallenge': 'ایجاد چالش',
    'admin.startVolunteering': 'شروع داوطلب‌شدن',
    'admin.selectContestants': 'انتخاب شرکت‌کنندگان',
    'admin.startBetting': 'شروع شرط‌بندی',
    'admin.closeBetting': 'بستن شرط‌بندی',
    'admin.declareWinner': 'اعلام برنده',
    'admin.endSession': 'پایان جلسه',

    // Challenge Management
    'challenge.name': 'نام چالش',
    'challenge.description': 'توضیحات (اختیاری)',
    'challenge.participants': 'تعداد شرکت‌کنندگان مورد نیاز',
    'challenge.create': 'ایجاد چالش',
    'challenge.edit': 'ویرایش چالش',
    'challenge.delete': 'حذف چالش',

    // Volunteering
    'volunteer.title': 'مرحله داوطلب‌شدن',
    'volunteer.description': 'همه چیز را برای افتخار به خطر بینداز!',
    'volunteer.warning': 'هشدار: باید ۱۰۰٪ موجودی خود را شرط ببندید',
    'volunteer.yourBalance': 'موجودی شما',
    'volunteer.button': 'داوطلب شدن (همه‌چیز)',
    'volunteer.waiting': 'در انتظار انتخاب...',
    'volunteer.selected': 'شما انتخاب شدید!',
    'volunteer.notSelected': 'انتخاب نشدید - موجودی برگردانده شد',
    'volunteer.count': '{count} داوطلب',
    'volunteer.selectManual': 'انتخاب دستی',
    'volunteer.selectRandom': 'انتخاب تصادفی',

    // Betting
    'betting.title': 'شرط‌های خود را ببندید',
    'betting.timeLeft': 'زمان باقی‌مانده',
    'betting.totalPool': 'مجموع استخر',
    'betting.odds': 'ضریب',
    'betting.yourBet': 'شرط شما',
    'betting.potentialWin': 'برد احتمالی',
    'betting.placeBet': 'ثبت شرط',
    'betting.minBet': 'حداقل شرط: {amount}',
    'betting.maxBet': 'حداکثر: {amount}',
    'betting.closed': 'شرط‌بندی بسته شد',
    'betting.noBalance': 'موجودی ناکافی',

    // Results
    'result.title': 'نتایج',
    'result.winner': 'برنده',
    'result.youWon': 'شما بردید!',
    'result.youLost': 'دفعه بعد بیشتر شانس بیاورید',
    'result.payout': 'پرداخت',
    'result.newBalance': 'موجودی جدید',

    // Player View
    'player.balance': 'موجودی',
    'player.locked': 'قفل شده',
    'player.waiting': 'در انتظار میزبان...',
    'player.leaveSession': 'خروج از جلسه',

    // Errors
    'error.generic': 'مشکلی پیش آمد',
    'error.network': 'خطای شبکه. لطفاً دوباره تلاش کنید.',
    'error.sessionFull': 'جلسه پر است',
    'error.sessionClosed': 'جلسه پایان یافته است',
    'error.insufficientBalance': 'موجودی ناکافی',
    'error.alreadyVolunteered': 'شما قبلاً داوطلب شده‌اید',
    'error.bettingClosed': 'شرط‌بندی بسته است',
  },
} as const;

type TranslationKey = keyof typeof translations.en;

// ============================================
// Translation Function
// ============================================

let currentLanguage: Language = getLanguage();

export function t(key: TranslationKey, params?: Record<string, string | number>): string {
  const dict = translations[currentLanguage];
  let text: string = dict[key] || translations.en[key] || key;

  // Replace parameters
  if (params) {
    Object.entries(params).forEach(([paramKey, value]) => {
      text = text.replace(`{${paramKey}}`, String(value));
    });
  }

  return text;
}

// ============================================
// Language Management
// ============================================

export function getCurrentLanguage(): Language {
  return currentLanguage;
}

export function switchLanguage(language: Language): void {
  currentLanguage = language;
  setLanguage(language);
}

export function toggleLanguage(): Language {
  const newLang = currentLanguage === 'en' ? 'fa' : 'en';
  switchLanguage(newLang);
  return newLang;
}

export function isRTL(): boolean {
  return currentLanguage === 'fa';
}

// ============================================
// Initialize on Load
// ============================================

export function initializeI18n(): void {
  currentLanguage = getLanguage();
  document.documentElement.dir = isRTL() ? 'rtl' : 'ltr';
  document.documentElement.lang = currentLanguage;
}

// ============================================
// Number Formatting
// ============================================

export function formatNumber(value: number): string {
  if (currentLanguage === 'fa') {
    // Convert to Persian numerals
    const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    return value.toString().replace(/\d/g, (d) => persianDigits[parseInt(d)]);
  }
  return value.toLocaleString('en-US');
}

export function formatCurrency(amount: number): string {
  const formatted = formatNumber(amount);
  const symbol = t('currency.symbol');
  
  if (isRTL()) {
    return `${formatted} ${symbol}`;
  }
  return `${symbol} ${formatted}`;
}

// ============================================
// Time Formatting
// ============================================

export function formatTimer(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const formatted = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  
  if (currentLanguage === 'fa') {
    const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    return formatted.replace(/\d/g, (d) => persianDigits[parseInt(d)]);
  }
  
  return formatted;
}

export function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (currentLanguage === 'fa') {
    if (seconds < 60) return 'همین الان';
    if (minutes < 60) return `${formatNumber(minutes)} دقیقه پیش`;
    if (hours < 24) return `${formatNumber(hours)} ساعت پیش`;
    return new Date(timestamp).toLocaleDateString('fa-IR');
  }

  if (seconds < 60) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return new Date(timestamp).toLocaleDateString('en-US');
}

