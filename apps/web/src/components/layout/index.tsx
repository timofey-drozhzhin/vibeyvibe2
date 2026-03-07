import type { PropsWithChildren } from "react";
import { useNavigate, useLocation } from "react-router";
import { Box, Tabs, Title } from "@mantine/core";
import { Sider } from "./sidebar.js";

import {
  sections as registrySections,
  entityRegistry,
  getRoutePath,
  standalonePages,
} from "../../config/entity-registry.js";
import type { SectionContext } from "../../config/entity-registry.js";

function getSectionTabs(context: SectionContext) {
  const entities = entityRegistry
    .filter((e) => e.context === context)
    .map((e) => ({
      label: e.pluralName,
      path: getRoutePath(e),
      slug: e.slug,
    }));

  const standalone = standalonePages
    .filter((p) => p.context === context)
    .map((p) => ({
      label: p.label,
      path: p.path,
      slug: p.path.split("/").pop() ?? p.path,
    }));

  return [...entities, ...standalone];
}

function detectSection(pathname: string) {
  for (const section of registrySections) {
    if (pathname.startsWith(`/${section.context}`)) {
      return section;
    }
  }
  return null;
}

function detectActiveTab(pathname: string, tabs: { path: string }[]) {
  for (const tab of tabs) {
    if (pathname.startsWith(tab.path)) {
      return tab.path;
    }
  }
  return tabs[0]?.path ?? null;
}

export const Layout = ({ children }: PropsWithChildren) => {
  const navigate = useNavigate();
  const location = useLocation();

  const section = detectSection(location.pathname);
  const tabs = section ? getSectionTabs(section.context) : [];
  const activeTab = section ? detectActiveTab(location.pathname, tabs) : null;

  return (
    <Box style={{ display: "flex", minHeight: "100vh" }}>
      <Sider />
      <Box
        flex={1}
        style={{
          backgroundColor: "var(--mantine-color-dark-9)",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {section && tabs.length > 0 && (
          <Box
            px="lg"
            pt="lg"
            style={{
              borderBottom: "1px solid var(--mantine-color-dark-8)",
            }}
          >
            <Title order={2} fw={600} mb="md">
              {section.label}
            </Title>
            <Tabs
              value={activeTab}
              onChange={(value) => {
                if (value) navigate(value);
              }}
              variant="default"
            >
              <Tabs.List>
                {tabs.map((tab) => (
                  <Tabs.Tab
                    key={tab.path}
                    value={tab.path}
                    c={activeTab === tab.path ? "dark.0" : "dark.3"}
                  >
                    {tab.label}
                  </Tabs.Tab>
                ))}
              </Tabs.List>
            </Tabs>
          </Box>
        )}
        <Box flex={1} p="lg">
          {children}
        </Box>
      </Box>
    </Box>
  );
};
