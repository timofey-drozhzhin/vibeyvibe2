import type { PropsWithChildren } from "react";
import { Box } from "@mantine/core";
import { Sider } from "./sidebar.js";

export const Layout = ({ children }: PropsWithChildren) => {
  return (
    <Box style={{ display: "flex", minHeight: "100vh" }}>
      <Sider />
      <Box
        flex={1}
        p="lg"
        style={{
          backgroundColor: "var(--mantine-color-dark-9)",
          overflowY: "auto",
        }}
      >
        {children}
      </Box>
    </Box>
  );
};
