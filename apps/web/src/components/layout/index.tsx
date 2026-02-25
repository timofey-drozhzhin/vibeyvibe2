import type { PropsWithChildren } from "react";
import { Box } from "@mantine/core";
import { Sider } from "./sidebar.js";

export const Layout = ({ children }: PropsWithChildren) => {
  return (
    <Box style={{ display: "flex", minHeight: "100vh" }}>
      <Sider />
      <Box flex={1} p="md">
        {children}
      </Box>
    </Box>
  );
};
