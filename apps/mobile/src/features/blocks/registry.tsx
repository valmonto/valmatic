import { BellRing, CircleCheckBig, FilePlus2, FileText, FolderPlus, KeyRound, LayoutDashboard, ListChecks, Loader, LockKeyhole, LogIn, MailCheck, PanelBottom, Settings, Sparkles, UserPen, UserPlus, WifiOff, type LucideIcon } from 'lucide-react-native';
import { type ComponentType } from 'react';
import { BottomNavBlock } from './blocks/bottom-nav.block';
import { DashboardBlock } from './blocks/dashboard.block';
import { EditProfileBlock } from './blocks/edit-profile.block';
import { EmptyStateBlock } from './blocks/empty-state.block';
import { ErrorStateBlock } from './blocks/error-state.block';
import { ForgotPasswordBlock } from './blocks/forgot-password.block';
import { LoadingStateBlock } from './blocks/loading-state.block';
import { NewRecordBlock } from './blocks/new-record.block';
import { RecordsDetailBlock } from './blocks/records-detail.block';
import { RecordsListBlock } from './blocks/records-list.block';
import { SettingsBlock } from './blocks/settings.block';
import { SuccessStateBlock } from './blocks/success-state.block';
import { NotificationPrimingBlock } from './blocks/notification-priming.block';
import { OnboardingBlock } from './blocks/onboarding.block';
import { OtpVerifyBlock } from './blocks/otp-verify.block';
import { ResetPasswordBlock } from './blocks/reset-password.block';
import { SignInBlock } from './blocks/sign-in.block';
import { SignUpBlock } from './blocks/sign-up.block';

export type BlockEntry = {
  id: string;
  title: string;
  description: string;
  category: string;
  icon: LucideIcon;
  /** Full-screen template rendered by the block detail route. */
  Screen: ComponentType;
};

/**
 * Blocks = ready-made screen templates composed from the UI components — the
 * head-start for real screens (the mobile take on shadcn "blocks").
 */
export const blockEntries: BlockEntry[] = [
  {
    id: 'onboarding',
    title: 'Onboarding intro',
    description: 'Swipeable value slides with dots and Get started',
    category: 'Onboarding',
    icon: Sparkles,
    Screen: OnboardingBlock,
  },
  {
    id: 'notification-priming',
    title: 'Notification priming',
    description: 'Soft-ask screen before the OS permission prompt',
    category: 'Onboarding',
    icon: BellRing,
    Screen: NotificationPrimingBlock,
  },
  {
    id: 'dashboard',
    title: 'Dashboard',
    description: 'Home screen — KPIs, revenue hero, chart and activity',
    category: 'App',
    icon: LayoutDashboard,
    Screen: DashboardBlock,
  },
  {
    id: 'settings',
    title: 'Settings',
    description: 'Grouped preferences with switches and sign-out',
    category: 'App',
    icon: Settings,
    Screen: SettingsBlock,
  },
  {
    id: 'edit-profile',
    title: 'Edit profile',
    description: 'Avatar change + a form of profile fields',
    category: 'App',
    icon: UserPen,
    Screen: EditProfileBlock,
  },
  {
    id: 'records-list',
    title: 'Records list',
    description: 'Searchable, filterable list with a create FAB',
    category: 'App',
    icon: ListChecks,
    Screen: RecordsListBlock,
  },
  {
    id: 'record-detail',
    title: 'Record detail',
    description: 'Hero, quick actions, key-value fields and activity',
    category: 'App',
    icon: FileText,
    Screen: RecordsDetailBlock,
  },
  {
    id: 'new-record',
    title: 'Create form',
    description: 'Inputs, select, date, priority chips and notes',
    category: 'App',
    icon: FilePlus2,
    Screen: NewRecordBlock,
  },
  {
    id: 'empty-state',
    title: 'Empty state',
    description: 'No data yet, with a primary call-to-action',
    category: 'States',
    icon: FolderPlus,
    Screen: EmptyStateBlock,
  },
  {
    id: 'error-state',
    title: 'Error / offline',
    description: 'Reassuring message with a retry action',
    category: 'States',
    icon: WifiOff,
    Screen: ErrorStateBlock,
  },
  {
    id: 'success-state',
    title: 'Success',
    description: 'Confirmation hero with a receipt summary',
    category: 'States',
    icon: CircleCheckBig,
    Screen: SuccessStateBlock,
  },
  {
    id: 'loading-state',
    title: 'Loading',
    description: 'Skeleton placeholders mirroring the screen',
    category: 'States',
    icon: Loader,
    Screen: LoadingStateBlock,
  },
  {
    id: 'bottom-nav',
    title: 'Bottom navigation',
    description: '11 tab-bar styles — classic, pill, FAB, floating, filled…',
    category: 'Navigation',
    icon: PanelBottom,
    Screen: BottomNavBlock,
  },
  {
    id: 'sign-in',
    title: 'Sign in',
    description: 'Email + password with remember-me and SSO',
    category: 'Authentication',
    icon: LogIn,
    Screen: SignInBlock,
  },
  {
    id: 'sign-up',
    title: 'Sign up',
    description: 'Name, email, password with terms consent',
    category: 'Authentication',
    icon: UserPlus,
    Screen: SignUpBlock,
  },
  {
    id: 'forgot-password',
    title: 'Forgot password',
    description: 'Request a password reset link by email',
    category: 'Authentication',
    icon: KeyRound,
    Screen: ForgotPasswordBlock,
  },
  {
    id: 'reset-password',
    title: 'Reset password',
    description: 'Set a new password with confirmation',
    category: 'Authentication',
    icon: LockKeyhole,
    Screen: ResetPasswordBlock,
  },
  {
    id: 'otp-verify',
    title: 'OTP verify',
    description: '6-digit email/2FA code with resend timer',
    category: 'Authentication',
    icon: MailCheck,
    Screen: OtpVerifyBlock,
  },
];
