import { createTheme, type MantineColorsTuple } from "@mantine/core";

// Custom dark palette: near-black surfaces matching Suno aesthetic
const dark: MantineColorsTuple = [
  "#C9C9C9", // 0 - brightest text
  "#b8b8b8", // 1 - secondary/muted text
  "#828282", // 2 - tertiary text, subtle elements
  "#2a2a2a", // 3 - borders (subtle dark-on-dark)
  "#232323", // 4 - slightly more prominent borders
  "#1a1a1a", // 5 - hover bg, subtle surfaces
  "#141414", // 6 - component backgrounds (Card, Input, Modal)
  "#0a0a0a", // 7 - body/page background (near-black)
  "#050505", // 8 - deepest surfaces (sidebar, dropdowns)
  "#000000", // 9 - absolute black
];

export const theme = createTheme({
  fontFamily: "Poppins, sans-serif",
  headings: {
    fontFamily: "Poppins, sans-serif",
  },
  primaryColor: "violet",
  colors: {
    dark,
  },
  defaultRadius: "lg",
  components: {
    Button: {
      defaultProps: {
        radius: "xl",
      },
    },
    ActionIcon: {
      defaultProps: {
        radius: "xl",
      },
    },
    Badge: {
      defaultProps: {
        radius: "xl",
      },
    },
    Card: {
      defaultProps: {
        shadow: "none",
      },
    },
    Modal: {
      defaultProps: {
        radius: "lg",
      },
    },
    TextInput: {
      defaultProps: {
        radius: "md",
      },
    },
    PasswordInput: {
      defaultProps: {
        radius: "md",
      },
    },
    Select: {
      defaultProps: {
        radius: "md",
      },
    },
    Textarea: {
      defaultProps: {
        radius: "md",
      },
    },
    Pagination: {
      defaultProps: {
        radius: "xl",
      },
    },
    SegmentedControl: {
      defaultProps: {
        radius: "xl",
      },
    },
    NavLink: {
      styles: {
        root: {
          borderRadius: "var(--mantine-radius-md)",
        },
      },
    },
    Table: {
      defaultProps: {
        verticalSpacing: "sm",
        horizontalSpacing: "md",
      },
    },
    Tooltip: {
      defaultProps: {
        radius: "md",
      },
    },
    Notification: {
      defaultProps: {
        radius: "lg",
      },
    },
  },
});
