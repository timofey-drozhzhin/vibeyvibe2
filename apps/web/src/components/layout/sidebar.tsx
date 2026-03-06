import { useNavigate, useLocation } from "react-router";
import { useGetIdentity, useLogout } from "@refinedev/core";
import {
  ActionIcon,
  Avatar,
  Box,
  Group,
  NavLink,
  ScrollArea,
  Skeleton,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import {
  IconMusic,
  IconDna,
  IconTrash,
  IconBrain,
  IconShield,
  IconLayoutDashboard,
  IconLogout,
} from "@tabler/icons-react";

import {
  sections as registrySections,
  entityRegistry,
  getRoutePath,
  standalonePages,
} from "../../config/entity-registry.js";
import type { SectionContext } from "../../config/entity-registry.js";

const sectionIcons: Record<SectionContext, React.ElementType> = {
  "my-music": IconMusic,
  "lab": IconDna,
  "bin": IconTrash,
  "suno": IconBrain,
  "admin": IconShield,
};

interface SidebarSection {
  label: string;
  icon: React.ElementType;
  color: string;
  context: SectionContext;
  defaultPath: string;
}

function buildSidebarSections(userRole?: string): SidebarSection[] {
  return registrySections
    .filter((section) => {
      if (!section.requiredRole) return true;
      return userRole === section.requiredRole;
    })
    .map((section) => {
      const firstEntity = entityRegistry.find(
        (e) => e.context === section.context,
      );
      const firstStandalone = standalonePages.find(
        (p) => p.context === section.context,
      );
      const defaultPath = firstEntity
        ? getRoutePath(firstEntity)
        : firstStandalone?.path ?? `/${section.context}`;

      return {
        label: section.label,
        icon: sectionIcons[section.context],
        color: section.color,
        context: section.context,
        defaultPath,
      };
    });
}

interface Identity {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role?: string;
}

export const Sider = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { data: identity, isLoading: identityLoading } =
    useGetIdentity<Identity>();
  const { mutate: logout } = useLogout();

  const sidebarSections = buildSidebarSections(identity?.role);

  return (
    <Box
      w={220}
      miw={220}
      h="100vh"
      style={{
        position: "sticky",
        top: 0,
        borderRight: "1px solid var(--mantine-color-dark-8)",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "var(--mantine-color-dark-9)",
      }}
    >
      <Box px="md" py="lg">
        <Text
          style={{
            fontFamily: "'Righteous', cursive",
            fontSize: 32,
            lineHeight: 1,
            cursor: "pointer",
          }}
          onClick={() => navigate("/")}
        >
          vibeyvibe
        </Text>
      </Box>

      <ScrollArea flex={1} px="xs">
        <Stack gap={4}>
          <NavLink
            label="Dashboard"
            leftSection={<IconLayoutDashboard size={18} />}
            active={location.pathname === "/"}
            onClick={() => navigate("/")}
            variant="light"
          />

          {sidebarSections.map((section) => {
            const Icon = section.icon;
            const isActive = location.pathname.startsWith(
              `/${section.context}`,
            );

            return (
              <NavLink
                key={section.context}
                label={section.label}
                leftSection={
                  <Icon
                    size={18}
                    color={
                      isActive
                        ? `var(--mantine-color-${section.color}-6)`
                        : undefined
                    }
                  />
                }
                active={isActive}
                onClick={() => navigate(section.defaultPath)}
                variant="light"
              />
            );
          })}
        </Stack>
      </ScrollArea>

      <Box
        px="md"
        py="sm"
        style={{
          borderTop: "1px solid var(--mantine-color-default-border)",
        }}
      >
        {identityLoading ? (
          <Group gap="sm" wrap="nowrap">
            <Skeleton circle height={36} />
            <Box flex={1} style={{ minWidth: 0 }}>
              <Skeleton height={14} width="70%" mb={4} />
              <Skeleton height={12} width="90%" />
            </Box>
          </Group>
        ) : identity ? (
          <Group gap="sm" wrap="nowrap">
            <Avatar
              src={identity.avatar}
              name={identity.name}
              color="initials"
              size={36}
              radius="xl"
            />
            <Box flex={1} style={{ minWidth: 0 }}>
              <Text size="sm" fw={500} truncate>
                {identity.name}
              </Text>
              <Text size="xs" c="dimmed" truncate>
                {identity.email}
              </Text>
            </Box>
            <ActionIcon
              variant="subtle"
              color="gray"
              size="lg"
              onClick={() => logout()}
              title="Logout"
            >
              <IconLogout size={18} />
            </ActionIcon>
          </Group>
        ) : null}
      </Box>
    </Box>
  );
};
