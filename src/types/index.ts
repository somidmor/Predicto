// ============================================
// PREDICTO - Shared Type Definitions
// ALL DATA IS SESSION-SCOPED
// ============================================

// User Roles
export type UserRole = 'ADMIN' | 'GUEST';

// Session Status
export type SessionStatus = 'OPEN' | 'VOLUNTEERING' | 'SELECTION' | 'BETTING' | 'IN_PROGRESS' | 'RESOLVED';

// Challenge Status
export type ChallengeStatus = 'PENDING' | 'VOLUNTEERING' | 'SELECTION' | 'BETTING' | 'IN_PROGRESS' | 'RESOLVED';

// Transaction Types
export type TransactionType =
  | 'INITIAL_GRANT'
  | 'BET_PLACED'
  | 'BET_WIN'
  | 'VOLUNTEER_LOCK'
  | 'VOLUNTEER_WIN'
  | 'VOLUNTEER_LOSS'
  | 'REFUND';

// Selection Mode for Volunteers
export type SelectionMode = 'MANUAL' | 'RANDOM';

// Language Type
export type Language = 'en' | 'fa';

// ============================================
// PARTICIPANT (Session-Scoped User)
// Each user has a separate profile per session
// ============================================

export interface Participant {
  userId: string;
  firstName: string;
  lastName: string;
  age: number;
  balance: number;
  lockedBalance: number;
  joinedAt: number;
  isVolunteer: boolean;
  isContestant: boolean;
}

// ============================================
// IDENTITY TYPES (LocalStorage)
// ============================================

export interface AdminIdentity {
  sessionId: string;
  hostId: string;
  createdAt: number;
}

export interface GuestIdentity {
  userId: string;
  createdAt: number;
}

// Per-session user identity
export interface SessionUserIdentity {
  sessionId: string;
  userId: string;
  firstName: string;
  lastName: string;
  age: number;
  joinedAt: number;
}

// Cached user profile for localStorage
export interface CachedUserProfile {
  sessionId: string;
  userId: string;
  firstName: string;
  lastName: string;
  age: number;
  balance: number;
  lockedBalance: number;
  isVolunteer: boolean;
  isContestant: boolean;
  cachedAt: number;
}

// ============================================
// SESSION TYPES
// ============================================

export interface Session {
  id: string;
  hostId: string;
  hostName?: string;
  status: SessionStatus;
  createdAt: number;
  currentChallengeId?: string;
}

export interface Challenge {
  id: string;
  sessionId: string;
  name: string;
  description?: string;
  requiredParticipants: number;
  status: ChallengeStatus;
  contestants: string[];
  winnerId?: string;
  createdAt: number;
  resolvedAt?: number;
}

// ============================================
// REALTIME DATABASE TYPES (Live Game State)
// ============================================

export interface VolunteerData {
  userId: string;
  firstName: string;
  lastName: string;
  balanceLocked: number;
  volunteeredAt: number;
}

export interface ParticipantRTDB {
  firstName: string;
  lastName: string;
  balance: number;
  lockedBalance: number;
  isVolunteer: boolean;
  isContestant: boolean;
  joinedAt: number;
}

export interface TimerState {
  endAt: number;
  duration: number;
  startedAt: number;
}

export interface GameState {
  status: SessionStatus;
  challengeId?: string;
  challengeName?: string;
  requiredParticipants?: number;
  timer: TimerState | null;
  volunteers: Record<string, VolunteerData>;
  contestants: string[];
  participants: Record<string, ParticipantRTDB>;
  bets: Record<string, number>;
  betCounts: Record<string, number>;
  odds: Record<string, number>;
  poolTotal: number;
  winnerId?: string;
  bettingLocked: boolean;
  participantCount: number;
}

// ============================================
// BET TYPES
// ============================================

export interface Bet {
  id: string;
  userId: string;
  sessionId: string;
  challengeId: string;
  contestantId: string;
  amount: number;
  oddsAtPlacement: number;
  status: 'PENDING' | 'WON' | 'LOST' | 'REFUNDED';
  payout?: number;
  placedAt: number;
  resolvedAt?: number;
}

// ============================================
// API REQUEST/RESPONSE TYPES
// ============================================

// Create Session
export interface CreateSessionRequest {
  hostName?: string;
}

export interface CreateSessionResponse {
  sessionId: string;
  hostId: string;
}

// Join Session
export interface JoinSessionRequest {
  sessionId: string;
  userId: string;
  firstName: string;
  lastName: string;
  age: number;
}

export interface JoinSessionResponse {
  success: boolean;
  participant: Participant;
  isReturning: boolean;
}

// Get Participant
export interface GetParticipantRequest {
  sessionId: string;
  userId: string;
}

export interface GetParticipantResponse {
  participant: Participant | null;
}

// Volunteer
export interface VolunteerRequest {
  sessionId: string;
  userId: string;
}

export interface VolunteerResponse {
  success: boolean;
  lockedAmount: number;
}

// Select Contestants
export interface SelectContestantsRequest {
  sessionId: string;
  mode: SelectionMode;
  selectedIds?: string[]; // For manual selection
  count?: number; // For random selection
}

export interface SelectContestantsResponse {
  success: boolean;
  contestants: string[];
  refundedCount: number;
}

// Place Bet
export interface PlaceBetRequest {
  sessionId: string;
  userId: string;
  contestantId: string;
  amount: number;
}

export interface PlaceBetResponse {
  success: boolean;
  betId: string;
  oddsAtPlacement: number;
  newBalance: number;
}

// Resolve Challenge
export interface ResolveChallengeRequest {
  sessionId: string;
  winnerId: string;
}

export interface ResolveChallengeResponse {
  success: boolean;
  winningCoefficient: number;
  totalPayouts: number;
  winnersCount: number;
}

// Reset Session
export interface ResetSessionRequest {
  sessionId: string;
}

export interface ResetSessionResponse {
  success: boolean;
}

// ============================================
// UI STATE TYPES
// ============================================

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message?: string;
  duration?: number;
}

export interface ModalState {
  isOpen: boolean;
  type: 'volunteer' | 'bet' | 'result' | 'confirm' | null;
  data?: unknown;
}

// ============================================
// TRANSLATION TYPES
// ============================================

export type TranslationKey =
  | 'Predicto'
  | 'Real-time Event Betting'
  | 'Loading...'
  | 'An error occurred'
  | 'Success!'
  | 'Cancel'
  | 'Confirm'
  | 'Close'
  | 'Save'
  | 'Delete'
  | 'Edit'
  | 'Create'
  | 'Join'
  | 'Leave'
  | 'Back'
  | 'Next'
  | 'Submit'
  | 'Session not found'
  | 'Create Session'
  | 'Join Session'
  | 'Session ID'
  | 'Enter Session ID'
  | 'Host Name'
  | 'Enter your name'
  | 'First Name'
  | 'Last Name'
  | 'Age'
  | 'Join Game'
  | 'Create Game'
  | 'Scan QR Code'
  | 'Share this code'
  | 'Participants'
  | 'Challenges'
  | 'Create Challenge'
  | 'Challenge Name'
  | 'Description'
  | 'Required Participants'
  | 'Start Volunteer Phase'
  | 'Select Contestants'
  | 'Start Betting'
  | 'Close Betting'
  | 'Declare Winner'
  | 'New Round'
  | 'Volunteers'
  | 'Contestants'
  | 'Betting'
  | 'Results'
  | 'Your Balance'
  | 'Locked Balance'
  | 'Available Balance'
  | 'Volunteer'
  | 'All-In Required'
  | 'Place Bet'
  | 'Bet Amount'
  | 'Current Odds'
  | 'Potential Win'
  | 'Total Pool'
  | 'Winner'
  | 'You Won!'
  | 'You Lost'
  | 'Payout'
  | 'Waiting for host...'
  | 'Volunteering Open'
  | 'Betting Open'
  | 'In Progress'
  | 'Round Complete'
  | 'Manual Selection'
  | 'Random Selection'
  | 'Select'
  | 'Refund'
  | 'Time Remaining'
  | 'No challenges yet'
  | 'No volunteers yet'
  | 'No bets yet'
  | 'Waiting for more participants'
  | 'Ready to start'
  | 'session.created'
  | 'session.joined'
  | 'volunteer.success'
  | 'volunteer.refunded'
  | 'bet.placed'
  | 'bet.won'
  | 'bet.lost'
  | 'challenge.created'
  | 'challenge.resolved'
  | 'error.session_not_found'
  | 'error.insufficient_balance'
  | 'error.already_volunteered'
  | 'error.betting_closed'
  | 'error.invalid_amount'
  | 'Open'
  | 'Pending'
  | 'In Progress'
  | 'Resolved'
  | 'Status'
  | 'Created'
  | 'Actions'
  | 'Anars'
  | 'per session'
  | 'Real-time'
  | 'Live Updates'
  | 'Session Code'
  | 'Copy Code'
  | 'Code Copied!'
  | 'QR Code'
  | 'Returning Player'
  | 'Welcome back!'
  | 'New Player'
  | 'Starting Balance'
  | 'Player joined'
  | 'players online'
  | 'Contestant'
  | 'Spectator'
  | 'Your Role'
  | 'Risk it all!'
  | 'Bet on contestants'
  | 'coefficient'
  | 'Admin Dashboard'
  | 'Player View'
  | 'Game Controls'
  | 'Participant List'
  | 'Real-time Odds'
  | 'Betting is open'
  | 'Betting is closed'
  | 'Select a winner'
  | 'No active challenge'
  | 'Start a challenge'
  | 'پردیکتو'
  | 'شرط‌بندی رویداد زنده'
  | 'در حال بارگذاری...'
  | 'خطایی رخ داد'
  | 'موفقیت!'
  | 'لغو'
  | 'تایید'
  | 'بستن'
  | 'ذخیره'
  | 'حذف'
  | 'ویرایش'
  | 'ایجاد'
  | 'پیوستن'
  | 'خروج'
  | 'برگشت'
  | 'بعدی'
  | 'ارسال'
  | 'جلسه یافت نشد'
  | 'ایجاد جلسه'
  | 'پیوستن به جلسه'
  | 'کد جلسه'
  | 'کد جلسه را وارد کنید'
  | 'نام میزبان'
  | 'نام خود را وارد کنید'
  | 'نام'
  | 'نام خانوادگی'
  | 'سن'
  | 'ورود به بازی'
  | 'ایجاد بازی'
  | 'اسکن کد QR'
  | 'این کد را به اشتراک بگذارید'
  | 'شرکت‌کنندگان'
  | 'چالش‌ها'
  | 'ایجاد چالش'
  | 'نام چالش'
  | 'توضیحات'
  | 'تعداد شرکت‌کنندگان مورد نیاز'
  | 'شروع مرحله داوطلبی'
  | 'انتخاب رقبا'
  | 'شروع شرط‌بندی'
  | 'بستن شرط‌بندی'
  | 'اعلام برنده'
  | 'دور جدید'
  | 'داوطلبان'
  | 'رقبا'
  | 'شرط‌بندی'
  | 'نتایج'
  | 'موجودی شما'
  | 'موجودی قفل شده'
  | 'موجودی قابل برداشت'
  | 'داوطلب شدن'
  | 'همه سرمایه لازم است'
  | 'ثبت شرط'
  | 'مبلغ شرط'
  | 'ضرایب فعلی'
  | 'سود احتمالی'
  | 'کل استخر'
  | 'برنده'
  | 'شما بردید!'
  | 'شما باختید'
  | 'پرداخت'
  | 'در انتظار میزبان...'
  | 'داوطلبی باز است'
  | 'شرط‌بندی باز است'
  | 'در حال انجام'
  | 'دور تمام شد'
  | 'انتخاب دستی'
  | 'انتخاب تصادفی'
  | 'انتخاب'
  | 'بازپرداخت'
  | 'زمان باقیمانده'
  | 'هنوز چالشی نیست'
  | 'هنوز داوطلبی نیست'
  | 'هنوز شرطی نیست'
  | 'در انتظار شرکت‌کنندگان بیشتر'
  | 'آماده شروع'
  | 'جلسه.ایجاد_شد'
  | 'جلسه.پیوستید'
  | 'داوطلب.موفقیت'
  | 'داوطلب.بازپرداخت'
  | 'شرط.ثبت_شد'
  | 'شرط.بردید'
  | 'شرط.باختید'
  | 'چالش.ایجاد_شد'
  | 'چالش.حل_شد'
  | 'خطا.جلسه_یافت_نشد'
  | 'خطا.موجودی_کافی_نیست'
  | 'خطا.قبلا_داوطلب_شدید'
  | 'خطا.شرط‌بندی_بسته_است'
  | 'خطا.مبلغ_نامعتبر';

// ============================================
// CONSTANTS
// ============================================

export const INITIAL_BALANCE = 100;
export const MIN_BET_AMOUNT = 1;
export const VOLUNTEER_MULTIPLIER = 3; // Winner gets 3x their locked balance
export const DEFAULT_BETTING_DURATION = 60; // seconds
export const MIN_CONTESTANTS = 2;
export const MAX_CONTESTANTS = 10;
