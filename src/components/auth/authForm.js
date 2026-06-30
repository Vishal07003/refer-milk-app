import { Platform } from 'react-native';

export const PLACEHOLDER_COLOR = '#9CA3AF';

export const INPUT_PY = Platform.OS === 'ios' ? 'py-4' : 'py-3.5';

export const inputClass = `rounded-xl border border-gray-200 px-4 font-sans text-base text-black ${INPUT_PY}`;

export const prefixInputClass = `flex-1 px-4 font-sans text-base text-black ${INPUT_PY}`;

export const authTitleClass = 'font-bold text-2xl text-black';

export const authSubtitleClass = 'mt-3 font-sans text-sm leading-[22px] text-gray-500';

export const authLabelClass = 'mt-7 font-semibold text-sm text-black';

export const authOptionalClass = 'ml-1.5 font-sans text-xs text-gray-400';

export const primaryButtonClass =
  'w-full flex-row items-center justify-center gap-2 rounded-xl bg-brand py-4 active:opacity-90';

export const authButtonClass = `mt-7 ${primaryButtonClass}`;

export const authButtonTextClass = 'font-bold text-base text-white';

export const authLinkClass = 'font-semibold text-sm text-brand';

export const authFooterClass = 'mt-7 px-2 text-center font-sans text-xs leading-5 text-gray-500';

export const prefixBoxClass = 'flex-row items-center border-r border-gray-200 bg-gray-50 px-4 py-4';

export const inputRowClass = 'mt-3 flex-row overflow-hidden rounded-xl border border-gray-200';
