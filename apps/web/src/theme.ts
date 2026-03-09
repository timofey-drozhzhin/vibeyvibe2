import { createTheme, type MantineColorsTuple } from "@mantine/core";
import tabClasses from "./components/layout/tabs.module.css";

// Custom dark palette
// 0–6: text shades (brightest → dimmest)
// 7–9: surface shades (hover → surface → app bg)
const dark: MantineColorsTuple = [
  "#f0f1f2", // 0 - primary text
  "#d9dbdf", // 1 - secondary text
  "#b6b9c2", // 2 - muted text (subtitles)
  "#979ba8", // 3 - dim text
  "#797e8d", // 4 - faint text
  "#5a5e6b", // 5 - near-inactive text
  "#434550", // 6 - inactive text (nav items)
  "#31323a", // 7 - hover bg
  "#212329", // 8 - surface bg, borders
  "#0c0d10", // 9 - app bg
];

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

export const theme = createTheme({
  colors: { dark, darkShifted },
  primaryColor: "violet",
  primaryShade: { light: 6, dark: 7 },
  components: {
    Popover: { defaultProps: { withinPortal: false } },
    Select: { defaultProps: { comboboxProps: { withinPortal: false }, checkIconPosition: "right" } },
    Menu: { defaultProps: { withinPortal: false } },
    Tooltip: { defaultProps: { withinPortal: false } },
  },
});
