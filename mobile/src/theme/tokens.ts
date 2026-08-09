// Quiet Data Ledger tokens — mirror of the web DESIGN.md palette.
export type ThemeColors = {
  ink: string;
  canvas: string;
  linen: string;
  cloud: string;
  charcoal: string;
  ash: string;
  mute: string;
  stone: string;
  hairline: string;
  hairlineSoft: string;
  success: string;
  successBright: string;
  sale: string;
  saleDeep: string;
  info: string;
};

export const lightColors: ThemeColors = {
  ink: "#111111",
  canvas: "#ffffff",
  linen: "#f9f8f5",
  cloud: "#f2f1ec",
  charcoal: "#2b2a27",
  ash: "#4c4b47",
  mute: "#706f69",
  stone: "#9e9d96",
  hairline: "#e3e3dd",
  hairlineSoft: "#ecebe6",
  success: "#1e9e52",
  successBright: "#2fc46b",
  sale: "#d30005",
  saleDeep: "#780700",
  info: "#1151ff",
};

export const darkColors: ThemeColors = {
  ink: "#f2f1ec",
  canvas: "#0d0d0b",
  linen: "#141412",
  cloud: "#1b1a17",
  charcoal: "#c9c7c0",
  ash: "#b3b1aa",
  mute: "#9a9891",
  stone: "#6b6a64",
  hairline: "#2a2a27",
  hairlineSoft: "#22221f",
  success: "#1e9e52",
  successBright: "#2fc46a",
  sale: "#d30005",
  saleDeep: "#780700",
  info: "#1151ff",
};

export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  none: 0,
  sm: 2,
  md: 4,
} as const;
