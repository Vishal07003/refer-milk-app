/**
 * Refer Milk Design System — Global Colors & Theme Tokens
 * Unified palette for both Customer and Delivery Partner apps.
 *
 * NOTE: All original colors in `c` are 100% preserved to guarantee backwards compatibility.
 * New structured tokens are declared with clear semantic names.
 */

import { fonts } from './fonts';

// -------------------------------------------------------------
// 1. BASE PALETTE DEFINITIONS (Raw Swatches)
// -------------------------------------------------------------
export const swatches = {
  // Whites & Neutrals (Light Surfaces & Backgrounds)
  white: '#FFFFFF',
  pureWhite: '#FFFFFF',
  bgMint: '#F8FAF9',
  bgMuted: '#F1F5F2',
  bgSubtle: '#F9FBFA',
  bgSlate: '#F8FAFC',
  bgLight: '#F1F5F9',
  bgCoolGray: '#EEF2F0',

  // Dark Neutrals & Typography (Slate / Zinc scale)
  slate900: '#0F172A', // Main high-contrast headers
  slate800: '#1E293B',
  slate700: '#334155',
  slate600: '#475569',
  slate500: '#64748B', // Medium captions & subtitles
  slate400: '#94A3B8', // Placeholder & chevron icons
  slate300: '#CBD5E1', // Subtle divider
  slate200: '#E2E8F0', // Card outline & borders
  slate100: '#F1F5F9',

  // Classic Ink Scale (Legacy)
  ink900: '#111827',
  ink800: '#1F2937',
  ink700: '#374151',
  ink500: '#6B7280',
  ink300: '#9CA3AF',
  ink200: '#E5E7EB',
  ink100: '#F3F4F6',

  // Forest & Farm Green Scale (Brand Primary)
  emerald950: '#064E3B', // Deepest emerald (avatar, dark badges)
  emerald900: '#14532D', // Deep forest
  emerald800: '#166534', // Stitch primary brand green
  emerald700: '#15803D',
  emerald600: '#16A34A',
  emerald500: '#22C55E', // Vibrant status dot
  emerald200: '#A7F3D0', // Mint glow text
  emerald150: '#BBF7D0', // Mint border
  emerald100: '#DCFCE7', // Soft green pill background
  emerald50: '#F0FDF4',  // Lightest mint surface

  // Rich Leaf Green Scale (Hero & Contrast)
  forestGreen: '#1B5E20', // Hero card background
  brandClassic: '#2D5A36', // Original classic brand
  brandDarkest: '#1A3D2E',
  brandSoftTint: '#E8F2EA',
  brandVibrant: '#3D7A4A',
  mintSoftTint: '#C7EAD4',

  // Amber / Golden Yellow (Warnings, Pending, Notice)
  amber900: '#78350F',
  amber800: '#92400E',
  amber700: '#B45309', // Paused warning text
  amber500: '#F59E0B',
  amber400: '#FBBF24',
  amber100: '#FEF3C7', // Paused / alert soft pill
  amber50: '#FFFBEB',

  // Red Scale (Errors, Danger, Unread badges, Logout)
  red700: '#B91C1C',
  red600: '#DC2626', // Badge counter & error buttons
  red500: '#EF4444',
  red100: '#FEE2E2', // Soft red pill & border
  red50: '#FEF2F2',

  // Blue & Indigo Scale (Cash slips, Receipts, Info)
  indigo900: '#312E81',
  indigo700: '#4338CA', // Cash slips icon & COD notice
  indigo600: '#4F46E5',
  indigo100: '#EEF2FF', // Cash slips soft tile
  blue600: '#2563EB',
  blue100: '#DBEAFE',

  // Coral & Accents
  coral500: '#FF6B4A',
};

// -------------------------------------------------------------
// 2. UNIFIED GLOBAL COLORS (New Structured Architecture)
// -------------------------------------------------------------
export const appColors = {
  // Backgrounds
  background: swatches.bgMint,
  surface: swatches.white,
  surfaceMuted: swatches.bgMuted,
  surfaceSubtle: swatches.bgSubtle,
  surfaceCard: swatches.white,
  surfaceElevated: swatches.white,

  // Brand Greens
  primary: swatches.emerald800,        // #166534
  primaryDark: swatches.emerald950,    // #064E3B
  primaryDeep: swatches.forestGreen,   // #1B5E20 (Hero)
  primaryLight: swatches.emerald100,   // #DCFCE7
  primaryBorder: swatches.emerald150,  // #BBF7D0
  primaryTextLight: swatches.emerald200, // #A7F3D0

  // Neutral Text
  textPrimary: swatches.slate900,      // #0F172A
  textSecondary: swatches.slate600,    // #475569
  textMuted: swatches.slate500,        // #64748B
  textSubtle: swatches.slate400,       // #94A3B8
  textInverse: swatches.white,

  // Borders & Dividers
  border: swatches.slate200,           // #E2E8F0
  borderLight: swatches.bgCoolGray,    // #EEF2F0
  borderSubtle: swatches.slate100,     // #F1F5F9

  // Semantic Status Tones
  success: swatches.emerald800,
  successBg: swatches.emerald100,
  successBorder: swatches.emerald150,
  successDot: swatches.emerald500,

  warning: swatches.amber700,
  warningBg: swatches.amber100,
  warningBorder: swatches.amber400,

  danger: swatches.red600,
  dangerBg: swatches.red100,
  dangerBorder: swatches.red100,

  info: swatches.indigo700,
  infoBg: swatches.indigo100,
  infoBorder: swatches.blue100,

  // Delivery Partner Specific Tokens
  delivery: {
    heroBg: swatches.forestGreen,
    badgeOnline: swatches.emerald500,
    badgeOffline: swatches.slate400,
    cashCollect: swatches.emerald800,
    cashUnsettled: swatches.amber700,
    slotBadge: swatches.emerald100,
    routeCard: swatches.white,
    handoverAlert: swatches.amber100,
    statTileBg: swatches.bgLight,
  },

  // Customer Specific Tokens
  customer: {
    heroBg: swatches.forestGreen,
    pillBg: swatches.emerald100,
    pillText: swatches.emerald800,
    cartBarBg: swatches.emerald950,
    cartBarButton: swatches.emerald800,
    qtyControlBg: swatches.emerald100,
    avatarBg: swatches.emerald950,
    codNoticeBg: swatches.indigo100,
    codNoticeText: swatches.slate800,
  },
};

// -------------------------------------------------------------
// 3. LEGACY COMPATIBILITY OBJECT `c` (DO NOT REMOVE OR OVERWRITE)
// -------------------------------------------------------------
export const c = {
  // Original legacy tokens
  bg: swatches.bgMint,
  surface: swatches.white,
  surfaceMuted: swatches.bgMuted,
  surfaceSubtle: swatches.bgSubtle,
  ink: swatches.ink900,
  inkSecondary: swatches.ink700,
  inkMuted: swatches.ink500,
  brand: swatches.brandClassic,
  brandDark: swatches.brandDarkest,
  brandLight: swatches.brandSoftTint,
  brandGlow: swatches.brandVibrant,
  mint: swatches.mintSoftTint,
  mintSoft: swatches.emerald50,
  coral: swatches.coral500,
  amber: swatches.amber500,
  amberLight: swatches.amber100,
  red: swatches.red500,
  redLight: swatches.red100,
  blue: swatches.blue600,
  blueLight: swatches.blue100,
  border: swatches.ink200,
  borderLight: swatches.ink100,

  // New non-conflicting additions with new distinct names
  forestGreen: swatches.forestGreen,
  emeraldDark: swatches.emerald950,
  emeraldBrand: swatches.emerald800,
  emeraldLight: swatches.emerald100,
  slateDark: swatches.slate900,
  slateMuted: swatches.slate500,
  slateBorder: swatches.slate200,
  indigoDark: swatches.indigo700,
  indigoLight: swatches.indigo100,
};

// -------------------------------------------------------------
// 4. RADII & SHADOWS
// -------------------------------------------------------------
export const radius = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 22,
  xxl: 28,
  pill: 999,
};

export const shadow = {
  none: {},
  soft: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  float: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
  medium: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
};

// -------------------------------------------------------------
// 5. UNIFIED THEME EXPORT
// -------------------------------------------------------------
export const theme = {
  colors: appColors,
  c, // Backwards compatible access
  swatches,
  fonts,
  radius,
  shadow,
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    base: 16,
    lg: 20,
    xl: 24,
    xxl: 32,
  },
};

export default theme;
