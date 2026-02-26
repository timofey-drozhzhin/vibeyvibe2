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
  IconChevronRight,
  IconLayoutDashboard,
  IconLogout,
  IconFileImport,
} from "@tabler/icons-react";

interface SectionItem {
  label: string;
  icon: React.ElementType;
  to: string;
}

interface Section {
  label: string;
  icon: React.ElementType;
  color: string;
  items: SectionItem[];
}

const sections: Section[] = [
  {
    label: "My Music",
    icon: IconMusic,
    color: "violet",
    items: [
      { label: "Artists", icon: IconMicrophone2, to: "/my-music/artists" },
      { label: "Albums", icon: IconDisc, to: "/my-music/albums" },
      { label: "Songs", icon: IconMusicBolt, to: "/my-music/songs" },
    ],
  },
  {
    label: "Anatomy",
    icon: IconDna,
    color: "teal",
    items: [
      { label: "Songs", icon: IconMusicBolt, to: "/anatomy/songs" },
      { label: "Artists", icon: IconMicrophone2, to: "/anatomy/artists" },
      { label: "Albums", icon: IconDisc, to: "/anatomy/albums" },
      { label: "Attributes", icon: IconAdjustments, to: "/anatomy/attributes" },
      { label: "Import", icon: IconFileImport, to: "/anatomy/import" },
    ],
  },
  {
    label: "Bin",
    icon: IconTrash,
    color: "orange",
    items: [
      { label: "Songs", icon: IconMusicBolt, to: "/bin/songs" },
      { label: "Sources", icon: IconDatabase, to: "/bin/sources" },
    ],
  },
  {
    label: "Suno Studio",
    icon: IconBrain,
    color: "pink",
    items: [
      { label: "Prompts", icon: IconMessageChatbot, to: "/suno/prompts" },
      { label: "Collections", icon: IconFolder, to: "/suno/collections" },
      { label: "Generations", icon: IconSparkles, to: "/suno/generations" },
    ],
  },
];

const SectionGroup = ({ section }: { section: Section }) => {
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
              leftSection={<item.icon size={16} />}
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

          {sections.map((section) => (
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
