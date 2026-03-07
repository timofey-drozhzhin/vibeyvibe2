import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import { MantineProvider } from "@mantine/core";
import { Notifications } from "@mantine/notifications";

import { App } from "./App";
import { theme, cssVariablesResolver } from "./theme";

import "@mantine/core/styles.css";
import "@mantine/dates/styles.css";
import "@mantine/notifications/styles.css";

const root = document.getElementById("root")!;

createRoot(root).render(
  <BrowserRouter>
    <MantineProvider theme={theme} defaultColorScheme="dark" cssVariablesResolver={cssVariablesResolver}>
      <Notifications position="top-right" />
      <App />
    </MantineProvider>
  </BrowserRouter>,
);
