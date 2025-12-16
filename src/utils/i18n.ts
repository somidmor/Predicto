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
    'app.tagline': 'Yalda Night Fortune & Destiny',
    'common.loading': 'Gazing into the night...',
    'common.error': 'The stars are misaligned',
    'common.success': 'Destiny Awaits!',
    'common.cancel': 'Retreat',
    'common.confirm': 'Seal Fate',
    'common.close': 'Close',
    'common.save': 'Preserve',
    'common.delete': 'Banish',
    'common.edit': 'Rewrite',
    'common.back': 'Return',
    'common.next': 'Next',
    'common.submit': 'Prophesize',
    'common.or': 'or',

    // Currency
    'currency.name': 'Anars',
    'currency.symbol': '🍎',

    // Home Page
    'home.title': 'Welcome to Yalda Night',
    'home.subtitle': 'Celebrate the longest night with fortune and friends',
    'home.createSession': 'Host Gathering',
    'home.joinSession': 'Join Gathering',
    'home.enterCode': 'Enter gathering code',
    'home.hostName': 'Your Name (optional)',

    // Join Page
    'join.title': 'Join the Celebration',
    'join.sessionCode': 'Gathering Code',
    'join.firstName': 'First Name',
    'join.lastName': 'Last Name',
    'join.age': 'Age',
    'join.submit': 'Enter the Circle',
    'join.starterBalance': 'You receive {amount} Anars for the night!',
    'join.invalidCode': 'Invalid gathering code',
    'join.sessionNotFound': 'Gathering not found',

    // Admin Dashboard
    'admin.title': 'Divan-e Hafez (Admin)',
    'admin.sessionCode': 'Gathering Code',
    'admin.shareCode': 'Share this code with guests',
    'admin.participants': 'Guests',
    'admin.challenges': 'Prophecies',
    'admin.createChallenge': 'Create Prophecy',
    'admin.startVolunteering': 'Seek Volunteers',
    'admin.selectContestants': 'Select Chosen Ones',
    'admin.startBetting': 'Open Predictions',
    'admin.closeBetting': 'Seal Predictions',
    'admin.declareWinner': 'Reveal Destiny',
    'admin.endSession': 'End the Night',

    // Challenge Management
    'challenge.name': 'Prophecy Name',
    'challenge.description': 'Description (optional)',
    'challenge.participants': 'Required Chosen Ones',
    'challenge.create': 'Weave Prophecy',
    'challenge.edit': 'Alter Prophecy',
    'challenge.delete': 'Forget Prophecy',

    // Volunteering
    'volunteer.title': 'The Chosen Ones',
    'volunteer.description': 'Risk it all for Glory!',
    'volunteer.warning': 'WARNING: You must pledge 100% of your Anars',
    'volunteer.yourBalance': 'Your Anars',
    'volunteer.button': 'Risk it all for Glory',
    'volunteer.waiting': 'Awaiting destiny...',
    'volunteer.selected': 'Destiny has chosen you!',
    'volunteer.notSelected': 'Not this time - Anars returned',
    'volunteer.count': '{count} brave souls',
    'volunteer.selectManual': 'Divine Selection',
    'volunteer.selectRandom': 'Wheel of Fortune',

    // Betting (Prediction)
    'betting.title': 'Cast Your Predictions',
    'betting.timeLeft': 'Time to Sunrise',
    'betting.totalPool': 'Total Fortune',
    'betting.odds': 'Fortune Score',
    'betting.yourBet': 'Your Pledge',
    'betting.potentialWin': 'Potential Bounty',
    'betting.placeBet': 'Predict',
    'betting.minBet': 'Min pledge: {amount}',
    'betting.maxBet': 'Max: {amount}',
    'betting.closed': 'Predictions Sealed',
    'betting.noBalance': 'Not enough Anars',

    // Results
    'result.title': 'Destiny Revealed',
    'result.winner': 'The Chosen One',
    'result.youWon': 'Fortune Smiles Upon You!',
    'result.youLost': 'The Winter is Cold...',
    'result.payout': 'Bounty',
    'result.newBalance': 'New Fortune',

    // Player View
    'player.balance': 'Anars',
    'player.locked': 'Locked in Fate',
    'player.waiting': 'Awaiting the Host...',
    'player.leaveSession': 'Leave Gathering',

    // Errors
    'error.generic': 'The stars are not right',
    'error.network': 'Connection lost to the spirits',
    'error.sessionFull': 'Gathering is full',
    'error.sessionClosed': 'The night has ended',
    'error.insufficientBalance': 'Not enough Anars',
    'error.alreadyVolunteered': 'You have already stepped forward',
    'error.bettingClosed': 'The window of fate is closed',
  },

  fa: {
    // Common
    'app.name': 'پردیکتو',
    'app.tagline': 'فال و تماشای شب یلدا',
    'common.loading': 'در حال نظاره...',
    'common.error': 'ستارگان ناهمگونند',
    'common.success': 'بخت یار بود!',
    'common.cancel': 'انصراف',
    'common.confirm': 'مهر سرنوشت',
    'common.close': 'بستن',
    'common.save': 'ثبت در تاریخ',
    'common.delete': 'فراموشی',
    'common.edit': 'بازنویسی',
    'common.back': 'بازگشت',
    'common.next': 'بعدی',
    'common.submit': 'پیشگویی',
    'common.or': 'یا',

    // Currency
    'currency.name': 'انار',
    'currency.symbol': '🍎',

    // Home Page
    'home.title': 'به جشن شب یلدا خوش آمدید',
    'home.subtitle': 'طولانی‌ترین شب سال را با شادی و هیجان جشن بگیرید',
    'home.createSession': 'میزبانی دورهمی',
    'home.joinSession': 'پیوستن به دورهمی',
    'home.enterCode': 'کد دورهمی را وارد کنید',
    'home.hostName': 'نام شما (اختیاری)',

    // Join Page
    'join.title': 'به جمع ما بپیوندید',
    'join.sessionCode': 'کد دورهمی',
    'join.firstName': 'نام',
    'join.lastName': 'نام خانوادگی',
    'join.age': 'سن',
    'join.submit': 'ورود به مجلس',
    'join.starterBalance': 'شما {amount} انار هدیه گرفتید!',
    'join.invalidCode': 'کد نامعتبر است',
    'join.sessionNotFound': 'دورهمی پیدا نشد',

    // Admin Dashboard
    'admin.title': 'دیوان حافظ (مدیر)',
    'admin.sessionCode': 'کد دورهمی',
    'admin.shareCode': 'این کد را به مهمانان بدهید',
    'admin.participants': 'مهمانان',
    'admin.challenges': 'اتفاقات',
    'admin.createChallenge': 'ثبت اتفاق جدید',
    'admin.startVolunteering': 'درخواست داوطلب',
    'admin.selectContestants': 'انتخاب برگزیدگان',
    'admin.startBetting': 'آغاز پیش‌بینی',
    'admin.closeBetting': 'پایان پیش‌بینی',
    'admin.declareWinner': 'اعلام حکم سرنوشت',
    'admin.endSession': 'پایان شب‌نشینی',

    // Challenge Management
    'challenge.name': 'عنوان ماجرا',
    'challenge.description': 'توضیحات (اختیاری)',
    'challenge.participants': 'تعداد برگزیدگان لازم',
    'challenge.create': 'ثبت ماجرا',
    'challenge.edit': 'ویرایش ماجرا',
    'challenge.delete': 'حذف ماجرا',

    // Volunteering
    'volunteer.title': 'مرحله دلاوری',
    'volunteer.description': 'همه چیز برای افتخار!',
    'volunteer.warning': 'هشدار: باید تمام انارهای خود را گرو بگذارید',
    'volunteer.yourBalance': 'انارهای شما',
    'volunteer.button': 'همه چیز برای افتخار (اعلام آمادگی)',
    'volunteer.waiting': 'در انتظار حکم سرنوشت...',
    'volunteer.selected': 'قرعه به نام شما افتاد!',
    'volunteer.notSelected': 'قرعه به نامتان نیفتاد - بازگشت انارها',
    'volunteer.count': '{count} دلاور',
    'volunteer.selectManual': 'انتخاب دستی',
    'volunteer.selectRandom': 'چرخ گردون',

    // Betting
    'betting.title': 'پیش‌بینی کنید',
    'betting.timeLeft': 'زمان تا طلوع',
    'betting.totalPool': 'مجموع انارها',
    'betting.odds': 'امتیاز بخت',
    'betting.yourBet': 'سهم شما',
    'betting.potentialWin': 'انار احتمالی',
    'betting.placeBet': 'ثبت حدس',
    'betting.minBet': 'حداقل: {amount}',
    'betting.maxBet': 'حداکثر: {amount}',
    'betting.closed': 'مهلت تمام شد',
    'betting.noBalance': 'انار کافی ندارید',

    // Results
    'result.title': 'حکم سرنوشت',
    'result.winner': 'برگزیده',
    'result.youWon': 'بخت با شما یار بود!',
    'result.youLost': 'زمستان سردی است...',
    'result.payout': 'دریافتی',
    'result.newBalance': 'موجودی جدید',

    // Player View
    'player.balance': 'انار',
    'player.locked': 'در گرو بخت',
    'player.waiting': 'در انتظار میزبان...',
    'player.leaveSession': 'خروج از مجلس',

    // Errors
    'error.generic': 'گره در کار افتاد',
    'error.network': 'ارتباط با عالم غیب قطع شد',
    'error.sessionFull': 'مجلس پر شد',
    'error.sessionClosed': 'شب‌نشینی تمام شد',
    'error.insufficientBalance': 'انار کم آوردید',
    'error.alreadyVolunteered': 'شما قبلاً اعلام آمادگی کرده‌اید',
    'error.bettingClosed': 'دفتر سرنوشت بسته شد',
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

