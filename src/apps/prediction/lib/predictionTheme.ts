// Scoped theme tokens for the Prediction app.
// Use these in className strings inside the Prediction app only.

export const predTheme = {
  bg: 'bg-[oklch(0.16_0.025_250)]',
  bgSoft: 'bg-[oklch(0.20_0.03_250)]',
  surface: 'bg-[oklch(0.22_0.03_250)]',
  border: 'border-[oklch(0.32_0.04_250)]',
  text: 'text-[oklch(0.98_0.005_250)]',
  textMuted: 'text-[oklch(0.78_0.02_250)]',
  primary: 'bg-[oklch(0.78_0.20_145)] text-[oklch(0.16_0.025_250)] hover:bg-[oklch(0.84_0.22_145)]',
  primaryText: 'text-[oklch(0.78_0.20_145)]',
  accent: 'bg-[oklch(0.74_0.18_50)] text-[oklch(0.16_0.025_250)] hover:bg-[oklch(0.80_0.20_50)]',
  accentText: 'text-[oklch(0.74_0.18_50)]',
  gold: 'text-[oklch(0.84_0.15_85)]',
  live: 'text-[oklch(0.68_0.22_25)]',
  liveBg: 'bg-[oklch(0.68_0.22_25)] text-white',
  // Page gradient
  pitch: 'bg-[radial-gradient(1200px_500px_at_50%_-10%,oklch(0.30_0.10_145/.25),transparent_60%),radial-gradient(900px_400px_at_90%_10%,oklch(0.40_0.18_50/.18),transparent_60%),oklch(0.14_0.03_250)]',
  radius: 'rounded-[0.875rem]',
  heading: 'font-["Bebas_Neue",sans-serif] tracking-wider',
  body: 'font-["Inter",ui-sans-serif,system-ui]',
};

export const stages: Record<string, string> = {
  group: 'Group',
  round_of_32: 'R32',
  round_of_16: 'R16',
  quarter_final: 'QF',
  semi_final: 'SF',
  third_place: '3rd',
  final: 'Final',
};
