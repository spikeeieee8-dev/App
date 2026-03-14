const gold = "#C9A84C";
const goldLight = "#E2C97E";
const goldDark = "#A07830";
const charcoal = "#1A1A1A";
const charcoalLight = "#2A2A2A";
const charcoalMid = "#333333";
const offWhite = "#F5F0E8";
const cream = "#EDE8DE";
const mutedGray = "#8A8880";
const lightGray = "#D4CFC7";
const errorRed = "#C0392B";
const successGreen = "#27AE60";

export default {
  gold,
  goldLight,
  goldDark,
  charcoal,
  charcoalLight,
  charcoalMid,
  offWhite,
  cream,
  mutedGray,
  lightGray,
  errorRed,
  successGreen,

  light: {
    text: charcoal,
    textSecondary: mutedGray,
    background: offWhite,
    backgroundSecondary: cream,
    card: "#FFFFFF",
    border: lightGray,
    tint: gold,
    tabIconDefault: mutedGray,
    tabIconSelected: gold,
    header: "#FFFFFF",
  },
  dark: {
    text: offWhite,
    textSecondary: mutedGray,
    background: charcoal,
    backgroundSecondary: charcoalLight,
    card: charcoalMid,
    border: "#444444",
    tint: gold,
    tabIconDefault: "#666666",
    tabIconSelected: gold,
    header: charcoal,
  },
};
