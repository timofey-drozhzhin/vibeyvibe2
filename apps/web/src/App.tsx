import { Refine, Authenticated } from "@refinedev/core";
import routerProvider, {
  NavigateToResource,
  CatchAllNavigate,
  DocumentTitleHandler,
  UnsavedChangesNotifier,
} from "@refinedev/react-router";
import { Route, Routes, Outlet } from "react-router";
import { Title } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  IconMicrophone2,
  IconDisc,
  IconMusicBolt,
  IconDna,
  IconAdjustments,
  IconTrash,
  IconDatabase,
  IconBrain,
  IconMessageChatbot,
  IconFolder,
  IconSparkles,
} from "@tabler/icons-react";

import { Layout } from "./components/layout/index.js";
import { LoginPage } from "./pages/login.js";
import { DashboardPage } from "./pages/dashboard.js";
import authProvider from "./providers/auth-provider.js";
import dataProvider from "./providers/data-provider.js";

// -- Bin page imports --
import { BinSongList } from "./pages/bin/songs/list.js";
import { BinSongCreate } from "./pages/bin/songs/create.js";
import { BinSongEdit } from "./pages/bin/songs/edit.js";
import { BinSongShow } from "./pages/bin/songs/show.js";
import { BinSourceList } from "./pages/bin/sources/list.js";
import { BinSourceCreate } from "./pages/bin/sources/create.js";
import { BinSourceEdit } from "./pages/bin/sources/edit.js";
import { BinSourceShow } from "./pages/bin/sources/show.js";

// Mantine-based notification provider for Refine
const notificationProvider = {
  open: ({ message, description, type }: { message: string; description?: string; type: string }) => {
    notifications.show({
      title: message,
      message: description || "",
      color: type === "success" ? "green" : type === "error" ? "red" : "blue",
    });
  },
  close: (key: string) => {
    notifications.hide(key);
  },
};

// Placeholder component for pages not yet built
const PlaceholderPage = ({ title }: { title: string }) => (
  <Title order={3}>{title}</Title>
);

// -- My Music page imports --
import { ArtistList as MyMusicArtistList } from "./pages/my-music/artists/list.js";
import { ArtistCreate as MyMusicArtistCreate } from "./pages/my-music/artists/create.js";
import { ArtistEdit as MyMusicArtistEdit } from "./pages/my-music/artists/edit.js";
import { ArtistShow as MyMusicArtistShow } from "./pages/my-music/artists/show.js";
import { AlbumList as MyMusicAlbumList } from "./pages/my-music/albums/list.js";
import { AlbumCreate as MyMusicAlbumCreate } from "./pages/my-music/albums/create.js";
import { AlbumEdit as MyMusicAlbumEdit } from "./pages/my-music/albums/edit.js";
import { AlbumShow as MyMusicAlbumShow } from "./pages/my-music/albums/show.js";
import { SongList as MyMusicSongList } from "./pages/my-music/songs/list.js";
import { SongCreate as MyMusicSongCreate } from "./pages/my-music/songs/create.js";
import { SongEdit as MyMusicSongEdit } from "./pages/my-music/songs/edit.js";
import { SongShow as MyMusicSongShow } from "./pages/my-music/songs/show.js";

// -- Anatomy page imports --
import { AnatomySongList } from "./pages/anatomy/songs/list.js";
import { AnatomySongCreate } from "./pages/anatomy/songs/create.js";
import { AnatomySongEdit } from "./pages/anatomy/songs/edit.js";
import { AnatomySongShow } from "./pages/anatomy/songs/show.js";
import { AnatomyArtistList } from "./pages/anatomy/artists/list.js";
import { AnatomyArtistShow } from "./pages/anatomy/artists/show.js";
import { AnatomyAttributeList } from "./pages/anatomy/attributes/list.js";
import { AnatomyAttributeCreate } from "./pages/anatomy/attributes/create.js";
import { AnatomyAttributeEdit } from "./pages/anatomy/attributes/edit.js";

// -- Bin pages imported above --

// -- Suno page imports --
import { SunoPromptList } from "./pages/suno/prompts/list.js";
import { SunoPromptCreate } from "./pages/suno/prompts/create.js";
import { SunoPromptEdit } from "./pages/suno/prompts/edit.js";
import { SunoPromptShow } from "./pages/suno/prompts/show.js";
import { SunoCollectionList } from "./pages/suno/collections/list.js";
import { SunoCollectionCreate } from "./pages/suno/collections/create.js";
import { SunoCollectionEdit } from "./pages/suno/collections/edit.js";
import { SunoCollectionShow } from "./pages/suno/collections/show.js";
import { SunoGenerationList } from "./pages/suno/generations/list.js";
import { SunoGenerationShow } from "./pages/suno/generations/show.js";

export const App = () => {
  return (
    <Refine
      routerProvider={routerProvider}
      dataProvider={dataProvider}
      authProvider={authProvider}
      notificationProvider={notificationProvider}
      resources={[
        // ---- My Music ----
        {
          name: "my-music/artists",
          list: "/my-music/artists",
          create: "/my-music/artists/create",
          edit: "/my-music/artists/edit/:id",
          show: "/my-music/artists/show/:id",
          meta: {
            label: "Artists",
            parent: "my-music",
            icon: <IconMicrophone2 size={18} />,
          },
        },
        {
          name: "my-music/albums",
          list: "/my-music/albums",
          create: "/my-music/albums/create",
          edit: "/my-music/albums/edit/:id",
          show: "/my-music/albums/show/:id",
          meta: {
            label: "Albums",
            parent: "my-music",
            icon: <IconDisc size={18} />,
          },
        },
        {
          name: "my-music/songs",
          list: "/my-music/songs",
          create: "/my-music/songs/create",
          edit: "/my-music/songs/edit/:id",
          show: "/my-music/songs/show/:id",
          meta: {
            label: "Songs",
            parent: "my-music",
            icon: <IconMusicBolt size={18} />,
          },
        },

        // ---- Anatomy ----
        {
          name: "anatomy/songs",
          list: "/anatomy/songs",
          create: "/anatomy/songs/create",
          edit: "/anatomy/songs/edit/:id",
          show: "/anatomy/songs/show/:id",
          meta: {
            label: "Songs",
            parent: "anatomy",
            icon: <IconMusicBolt size={18} />,
          },
        },
        {
          name: "anatomy/artists",
          list: "/anatomy/artists",
          show: "/anatomy/artists/show/:id",
          meta: {
            label: "Artists",
            parent: "anatomy",
            icon: <IconMicrophone2 size={18} />,
          },
        },
        {
          name: "anatomy/attributes",
          list: "/anatomy/attributes",
          create: "/anatomy/attributes/create",
          edit: "/anatomy/attributes/edit/:id",
          meta: {
            label: "Attributes",
            parent: "anatomy",
            icon: <IconAdjustments size={18} />,
          },
        },

        // ---- Bin ----
        {
          name: "bin/songs",
          list: "/bin/songs",
          create: "/bin/songs/create",
          edit: "/bin/songs/edit/:id",
          show: "/bin/songs/show/:id",
          meta: {
            label: "Songs",
            parent: "bin",
            icon: <IconMusicBolt size={18} />,
          },
        },
        {
          name: "bin/sources",
          list: "/bin/sources",
          create: "/bin/sources/create",
          edit: "/bin/sources/edit/:id",
          show: "/bin/sources/show/:id",
          meta: {
            label: "Sources",
            parent: "bin",
            icon: <IconDatabase size={18} />,
          },
        },

        // ---- Suno Studio ----
        {
          name: "suno/prompts",
          list: "/suno/prompts",
          create: "/suno/prompts/create",
          edit: "/suno/prompts/edit/:id",
          show: "/suno/prompts/show/:id",
          meta: {
            label: "Prompts",
            parent: "suno",
            icon: <IconMessageChatbot size={18} />,
          },
        },
        {
          name: "suno/collections",
          list: "/suno/collections",
          create: "/suno/collections/create",
          edit: "/suno/collections/edit/:id",
          show: "/suno/collections/show/:id",
          meta: {
            label: "Collections",
            parent: "suno",
            icon: <IconFolder size={18} />,
          },
        },
        {
          name: "suno/generations",
          list: "/suno/generations",
          show: "/suno/generations/show/:id",
          meta: {
            label: "Generations",
            parent: "suno",
            icon: <IconSparkles size={18} />,
          },
        },
      ]}
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

          {/* My Music */}
          <Route path="my-music">
            <Route path="artists">
              <Route index element={<MyMusicArtistList />} />
              <Route path="create" element={<MyMusicArtistCreate />} />
              <Route path="edit/:id" element={<MyMusicArtistEdit />} />
              <Route path="show/:id" element={<MyMusicArtistShow />} />
            </Route>
            <Route path="albums">
              <Route index element={<MyMusicAlbumList />} />
              <Route path="create" element={<MyMusicAlbumCreate />} />
              <Route path="edit/:id" element={<MyMusicAlbumEdit />} />
              <Route path="show/:id" element={<MyMusicAlbumShow />} />
            </Route>
            <Route path="songs">
              <Route index element={<MyMusicSongList />} />
              <Route path="create" element={<MyMusicSongCreate />} />
              <Route path="edit/:id" element={<MyMusicSongEdit />} />
              <Route path="show/:id" element={<MyMusicSongShow />} />
            </Route>
          </Route>

          {/* Anatomy */}
          <Route path="anatomy">
            <Route path="songs">
              <Route index element={<AnatomySongList />} />
              <Route path="create" element={<AnatomySongCreate />} />
              <Route path="edit/:id" element={<AnatomySongEdit />} />
              <Route path="show/:id" element={<AnatomySongShow />} />
            </Route>
            <Route path="artists">
              <Route index element={<AnatomyArtistList />} />
              <Route path="show/:id" element={<AnatomyArtistShow />} />
            </Route>
            <Route path="attributes">
              <Route index element={<AnatomyAttributeList />} />
              <Route path="create" element={<AnatomyAttributeCreate />} />
              <Route path="edit/:id" element={<AnatomyAttributeEdit />} />
            </Route>
          </Route>

          {/* Bin */}
          <Route path="bin">
            <Route path="songs">
              <Route index element={<BinSongList />} />
              <Route path="create" element={<BinSongCreate />} />
              <Route path="edit/:id" element={<BinSongEdit />} />
              <Route path="show/:id" element={<BinSongShow />} />
            </Route>
            <Route path="sources">
              <Route index element={<BinSourceList />} />
              <Route path="create" element={<BinSourceCreate />} />
              <Route path="edit/:id" element={<BinSourceEdit />} />
              <Route path="show/:id" element={<BinSourceShow />} />
            </Route>
          </Route>

          {/* Suno Studio */}
          <Route path="suno">
            <Route path="prompts">
              <Route index element={<SunoPromptList />} />
              <Route path="create" element={<SunoPromptCreate />} />
              <Route path="edit/:id" element={<SunoPromptEdit />} />
              <Route path="show/:id" element={<SunoPromptShow />} />
            </Route>
            <Route path="collections">
              <Route index element={<SunoCollectionList />} />
              <Route path="create" element={<SunoCollectionCreate />} />
              <Route path="edit/:id" element={<SunoCollectionEdit />} />
              <Route path="show/:id" element={<SunoCollectionShow />} />
            </Route>
            <Route path="generations">
              <Route index element={<SunoGenerationList />} />
              <Route path="show/:id" element={<SunoGenerationShow />} />
            </Route>
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
