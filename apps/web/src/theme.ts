import {
  createTheme,
  type MantineColorsTuple,
  Button,
  Modal,
  Menu,
} from "@mantine/core";

/* ==========================================================================
   Design Tokens
   ========================================================================== */

/**
 * Custom dark palette — the visual foundation of the app.
 * Shades 0–6: text (brightest → dimmest)
 * Shades 7–9: surfaces (hover → surface → app background)
 */
const dark: MantineColorsTuple = [
  "#f0f1f2", // 0 — primary text
  "#d9dbdf", // 1 — secondary text
  "#b6b9c2", // 2 — muted text (subtitles)
  "#979ba8", // 3 — dim text
  "#797e8d", // 4 — faint text
  "#5a5e6b", // 5 — near-inactive text
  "#434550", // 6 — inactive text (nav items)
  "#31323a", // 7 — hover backgrounds
  "#212329", // 8 — surface backgrounds, borders
  "#0c0d10", // 9 — app background
];

/**
 * Shifted palette — one shade lighter than `dark`.
 * Applied inside Paper/Card via CSS variable remapping so nested surfaces
 * automatically appear lighter without manual color overrides.
 */
const darkShifted: MantineColorsTuple = [
  "#ffffff",
  "#f0f1f2",
  "#d9dbdf",
  "#b6b9c2",
  "#979ba8",
  "#797e8d",
  "#5a5e6b",
  "#434550",
  "#31323a",
  "#212329",
];

/* ==========================================================================
   Theme
   ========================================================================== */

export const theme = createTheme({
  /* ---- Palette ---- */
  colors: { dark, darkShifted },
  primaryColor: "violet",
  primaryShade: { light: 6, dark: 7 },

  /* ---- Typography ---- */
  fontFamily: "'Poppins', sans-serif",
  headings: { fontFamily: "'Poppins', sans-serif" },

  /* ---- Shape ---- */
  defaultRadius: "xl",

  /* ---- Component Defaults ----
     Structural / behavioral defaults that apply to every instance.
     Color-scheme-specific overrides stay in global.css.
     --------------------------------------------------------------- */
  components: {
    /* Portal behavior — keep dropdowns in normal flow for stacking context */
    Popover: { defaultProps: { withinPortal: false } },
    Select: {
      defaultProps: {
        comboboxProps: { withinPortal: false },
        checkIconPosition: "right",
      },
    },
    Tooltip: { defaultProps: { withinPortal: false } },

    /* Menu — portal behavior + dropdown structure */
    Menu: Menu.extend({
      defaultProps: { withinPortal: false },
      styles: {
        dropdown: { padding: 0, border: "none", overflow: "hidden" },
      },
    }),

    /* Button — normal weight (the app uses size/variant/color per-context) */
    Button: Button.extend({
      styles: { root: { fontWeight: "normal" } },
    }),

    /* Modal — always centered */
    Modal: Modal.extend({
      defaultProps: { centered: true },
    }),
  },
});
