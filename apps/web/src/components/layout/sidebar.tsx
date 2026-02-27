import { useState } from "react";
import { useNavigate, useLocation } from "react-router";
import { useGetIdentity, useLogout } from "@refinedev/core";
import {
  ActionIcon,
  Avatar,
  Box,
  Collapse,
  Group,
  NavLink,
  ScrollArea,
  Skeleton,
  Stack,
  Text,
  Title,
  UnstyledButton,
} from "@mantine/core";
import {
  IconMusic,
  IconDna,
  IconTrash,
  IconBrain,
  IconChevronRight,
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

// Map section contexts to their header icons
const sectionIcons: Record<SectionContext, React.ElementType> = {
  "my-music": IconMusic,
  "lab": IconDna,
  "bin": IconTrash,
  "suno": IconBrain,
};

interface SidebarItem {
  label: string;
  to: string;
}

interface SidebarSection {
  label: string;
  icon: React.ElementType;
  color: string;
  items: SidebarItem[];
}

// Build sidebar sections from the entity registry
const sidebarSections: SidebarSection[] = registrySections.map((section) => ({
  label: section.label,
  icon: sectionIcons[section.context],
  color: section.color,
  items: [
    ...entityRegistry
      .filter((e) => e.context === section.context)
      .map((e) => ({
        label: e.pluralName,
        to: getRoutePath(e),
      })),
    ...standalonePages
      .filter((p) => p.context === section.context)
      .map((p) => ({
        label: p.label,
        to: p.path,
      })),
  ],
}));

const SectionGroup = ({ section }: { section: SidebarSection }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const isActive = section.items.some((item) =>
    location.pathname.startsWith(item.to),
  );
  const [opened, setOpened] = useState(isActive);

  return (
    <Box>
      <UnstyledButton
        onClick={() => setOpened((o) => !o)}
        w="100%"
        px="md"
        py="xs"
      >
        <Group justify="space-between">
          <Group gap="xs">
            <section.icon
              size={18}
              color={`var(--mantine-color-${section.color}-6)`}
            />
            <Text size="sm" fw={600}>
              {section.label}
            </Text>
          </Group>
          <IconChevronRight
            size={14}
            style={{
              transform: opened ? "rotate(90deg)" : "none",
              transition: "transform 200ms ease",
            }}
          />
        </Group>
      </UnstyledButton>

      <Collapse in={opened}>
        <Stack gap={0} pl="md">
          {section.items.map((item) => (
            <NavLink
              key={item.to}
              label={item.label}
              active={location.pathname.startsWith(item.to)}
              onClick={() => navigate(item.to)}
              variant="light"
            />
          ))}
        </Stack>
      </Collapse>
    </Box>
  );
};

interface Identity {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export const Sider = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { data: identity, isLoading: identityLoading } =
    useGetIdentity<Identity>();
  const { mutate: logout } = useLogout();

  return (
    <Box
      w={260}
      h="100vh"
      style={{
        borderRight: "1px solid var(--mantine-color-default-border)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Box px="md" py="lg">
        <Title
          order={3}
          style={{
            fontFamily: "'Righteous', cursive",
            cursor: "pointer",
          }}
          onClick={() => navigate("/")}
        >
          vibeyvibe
        </Title>
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

          {sidebarSections.map((section) => (
            <SectionGroup key={section.label} section={section} />
          ))}
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
