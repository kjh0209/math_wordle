/** Mobile color constants — mirrors the web Tailwind palette */
export const Colors = {
  // Background layers
  gameBg: "#080e1c",
  gameSurface: "#0f1729",
  gameCard: "#131f35",
  gameBorder: "#1e2d4a",

  // Text
  gameText: "#e8eeff",
  gameTextMuted: "#8899bb",
  gameMuted: "#4a5a7a",

  // Tile feedback
  tileCorrect: "#22c55e",
  tilePresent: "#eab308",
  tileAbsent: "#2d3a52",
  tileEmpty: "#0f1729",
  tileActive: "#1a2744",

  // Keypad
  keyDefault: "#1e2d4a",
  keyHover: "#263554",
  keyAction: "#2d3f63",

  // Brand
  brand: "#6366f1",
  brandDark: "#4f46e5",

  // Status
  success: "#22c55e",
  error: "#ef4444",
  warning: "#eab308",
} as const;
