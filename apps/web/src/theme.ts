import { createTheme, type MantineColorsTuple, type CSSVariablesResolver } from "@mantine/core";

// Suno-matched dark palette
// 0–6: text shades (brightest → dimmest)
// 7–9: surface shades (hover → surface → app bg)
const dark: MantineColorsTuple = [
  "#f7f4ef", // 0 - primary text
  "#c2c2c1", // 1 - secondary text
  "#a3a3a3", // 2 - muted text (subtitles)
  "#8a8a90", // 3 - dim text
  "#7a7a80", // 4 - faint text
  "#727278", // 5 - near-inactive text
  "#6a6a72", // 6 - inactive text (nav items)
  "#252529", // 7 - hover bg
  "#1c1c1f", // 8 - surface bg, borders
  "#101012", // 9 - app bg
];

export const cssVariablesResolver: CSSVariablesResolver = (theme) => ({
  variables: {},
  light: {},
  dark: {
    "--mantine-color-body": theme.colors.dark[9],
    "--mantine-color-default": theme.colors.dark[8],
    "--mantine-color-default-hover": theme.colors.dark[7],
    "--mantine-color-default-border": theme.colors.dark[8],
  },
});

export const theme = createTheme({
  fontFamily: "Poppins, sans-serif",
  headings: { fontFamily: "Poppins, sans-serif" },
  primaryColor: "violet",
  primaryShade: { light: 6, dark: 7 },
  autoContrast: true,
  cursorType: "pointer",
  colors: { dark },
  defaultRadius: "xl",
  components: {
    Button: { defaultProps: { fw: 500 } },
    Card: { defaultProps: { shadow: "none" } },
    Paper: { defaultProps: { shadow: "none" } },
    Modal: { defaultProps: { radius: "lg" } },
    Menu: { defaultProps: { radius: "lg" } },
    Popover: { defaultProps: { radius: "lg" } },
    Notification: { defaultProps: { radius: "lg" } },
    Tooltip: { defaultProps: { radius: "md" } },
    Checkbox: { defaultProps: { radius: "sm" } },
    Textarea: { defaultProps: { variant: "filled", radius: "lg" } },
    TextInput: { defaultProps: { variant: "filled" } },
    PasswordInput: { defaultProps: { variant: "filled" } },
    Select: { defaultProps: { variant: "filled" } },
    Divider: { defaultProps: { color: "dark.7" } },
    Table: { defaultProps: { verticalSpacing: "sm", horizontalSpacing: "md" } },
    Tabs: { defaultProps: { radius: 0 } },
  },
});
