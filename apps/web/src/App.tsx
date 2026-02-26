import { Refine, Authenticated } from "@refinedev/core";
import routerProvider, {
  NavigateToResource,
  CatchAllNavigate,
  DocumentTitleHandler,
  UnsavedChangesNotifier,
} from "@refinedev/react-router";
import { Route, Routes, Outlet } from "react-router";
import { notifications } from "@mantine/notifications";

import { Layout } from "./components/layout/index.js";
import { LoginPage } from "./pages/login.js";
import { DashboardPage } from "./pages/dashboard.js";
import authProvider from "./providers/auth-provider.js";
import dataProvider from "./providers/data-provider.js";

// Entity registry
import {
  entityRegistry,
  sections,
  getResourceName,
  getRoutePath,
  standalonePages,
} from "./config/entity-registry.js";

// Generic entity pages
import { GenericEntityList } from "./pages/generic/list.js";
import { GenericEntityDetail } from "./pages/generic/show.js";

// Standalone pages (not driven by registry)
import { AnatomyImport } from "./pages/anatomy/import.js";

// Mantine-based notification provider for Refine
const notificationProvider = {
  open: ({ message, description, type }: { message: string; description?: string; type: string }) => {
    // Skip success notifications for inline edits — only show errors
    if (type === "success") return;
    notifications.show({
      title: message,
      message: description || "",
      color: type === "error" ? "red" : "blue",
    });
  },
  close: (key: string) => {
    notifications.hide(key);
  },
};

export const App = () => {
  return (
    <Refine
      routerProvider={routerProvider}
      dataProvider={dataProvider}
      authProvider={authProvider}
      notificationProvider={notificationProvider}
      resources={entityRegistry.map((entity) => ({
        name: getResourceName(entity),
        list: getRoutePath(entity),
        show: `${getRoutePath(entity)}/show/:id`,
        meta: {
          label: entity.pluralName,
          parent: entity.context,
        },
      }))}
      options={{
        syncWithLocation: true,
        warnWhenUnsavedChanges: true,
      }}
    >
      <Routes>
        {/* Authenticated routes */}
        <Route
          element={
            <Authenticated key="auth" fallback={<CatchAllNavigate to="/login" />}>
              <Layout>
                <Outlet />
              </Layout>
            </Authenticated>
          }
        >
          <Route index element={<DashboardPage />} />

          {/* Dynamic entity routes from registry */}
          {sections.map((section) => (
            <Route key={section.context} path={section.context}>
              {entityRegistry
                .filter((e) => e.context === section.context)
                .map((entity) => (
                  <Route key={entity.slug} path={entity.slug}>
                    <Route index element={<GenericEntityList entity={entity} />} />
                    <Route path="show/:id" element={<GenericEntityDetail entity={entity} />} />
                  </Route>
                ))}
            </Route>
          ))}

          {/* Standalone pages */}
          <Route path="anatomy">
            <Route path="import" element={<AnatomyImport />} />
          </Route>
        </Route>

        {/* Public routes */}
        <Route
          element={
            <Authenticated key="auth" fallback={<Outlet />}>
              <NavigateToResource resource="my-music/artists" />
            </Authenticated>
          }
        >
          <Route path="/login" element={<LoginPage />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<NavigateToResource resource="my-music/artists" />} />
      </Routes>

      <UnsavedChangesNotifier />
      <DocumentTitleHandler />
    </Refine>
  );
};
