import { useCustom } from "@refinedev/core";
import { useNavigate } from "react-router";
import {
  Card,
  SimpleGrid,
  Text,
  Title,
  Stack,
  Group,
  Button,
  Skeleton,
} from "@mantine/core";
import {
  IconMusic,
  IconDna,
  IconTrash,
  IconBrain,
  IconMicrophone2,
  IconDisc,
  IconMusicBolt,
  IconMessageChatbot,
  IconFolder,
  IconSparkles,
} from "@tabler/icons-react";

interface DashboardStats {
  myMusic: { songs: number; artists: number; albums: number };
  lab: { songs: number; artists: number };
  bin: { songs: number };
  suno: { prompts: number; collections: number; generations: number };
}

export const DashboardPage = () => {
  const navigate = useNavigate();

  const { query, result } = useCustom<DashboardStats>({
    url: "/api/dashboard/stats",
    method: "get",
  });

  const stats = result.data;
  const loading = query.isPending;

  return (
    <Stack gap="lg">
      <Group justify="space-between">
        <Title order={2}>Dashboard</Title>
      </Group>

      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
        {/* My Music */}
        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Stack gap="sm">
            <Group>
              <IconMusic
                size={28}
                color="var(--mantine-color-violet-6)"
              />
              <Title order={4}>My Music</Title>
            </Group>
            <Text size="sm" c="dimmed">
              Manage your artists, albums, and songs.
            </Text>
            {loading ? (
              <Skeleton height={20} />
            ) : (
              <Group gap="lg">
                <Group gap={4}>
                  <IconMicrophone2 size={14} />
                  <Text size="sm">{stats?.myMusic?.artists ?? 0} artists</Text>
                </Group>
                <Group gap={4}>
                  <IconDisc size={14} />
                  <Text size="sm">{stats?.myMusic?.albums ?? 0} albums</Text>
                </Group>
                <Group gap={4}>
                  <IconMusicBolt size={14} />
                  <Text size="sm">{stats?.myMusic?.songs ?? 0} songs</Text>
                </Group>
              </Group>
            )}
            <Group gap="xs" mt="xs">
              <Button
                size="xs"
                variant="light"

                onClick={() => navigate("/my-music/artists")}
              >
                Artists
              </Button>
              <Button
                size="xs"
                variant="light"

                onClick={() => navigate("/my-music/songs")}
              >
                Songs
              </Button>
            </Group>
          </Stack>
        </Card>

        {/* Lab */}
        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Stack gap="sm">
            <Group>
              <IconDna
                size={28}
                color="var(--mantine-color-teal-6)"
              />
              <Title order={4}>Lab</Title>
            </Group>
            <Text size="sm" c="dimmed">
              Reverse-engineer popular music by profiling songs.
            </Text>
            {loading ? (
              <Skeleton height={20} />
            ) : (
              <Group gap="lg">
                <Group gap={4}>
                  <IconMusicBolt size={14} />
                  <Text size="sm">
                    {stats?.lab?.songs ?? 0} songs
                  </Text>
                </Group>
                <Group gap={4}>
                  <IconMicrophone2 size={14} />
                  <Text size="sm">
                    {stats?.lab?.artists ?? 0} artists
                  </Text>
                </Group>
              </Group>
            )}
            <Group gap="xs" mt="xs">
              <Button
                size="xs"
                variant="light"
                color="teal"

                onClick={() => navigate("/lab/songs")}
              >
                Songs
              </Button>
            </Group>
          </Stack>
        </Card>

        {/* Bin */}
        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Stack gap="sm">
            <Group>
              <IconTrash
                size={28}
                color="var(--mantine-color-orange-6)"
              />
              <Title order={4}>Bin</Title>
            </Group>
            <Text size="sm" c="dimmed">
              Non-copyrighted music vault for remixing.
            </Text>
            {loading ? (
              <Skeleton height={20} />
            ) : (
              <Group gap="lg">
                <Group gap={4}>
                  <IconMusicBolt size={14} />
                  <Text size="sm">{stats?.bin?.songs ?? 0} songs</Text>
                </Group>
              </Group>
            )}
            <Group gap="xs" mt="xs">
              <Button
                size="xs"
                variant="light"
                color="orange"

                onClick={() => navigate("/bin/songs")}
              >
                Songs
              </Button>
            </Group>
          </Stack>
        </Card>

        {/* Suno Studio */}
        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Stack gap="sm">
            <Group>
              <IconBrain
                size={28}
                color="var(--mantine-color-pink-6)"
              />
              <Title order={4}>Suno Studio</Title>
            </Group>
            <Text size="sm" c="dimmed">
              Craft prompts, manage collections, track generations.
            </Text>
            {loading ? (
              <Skeleton height={20} />
            ) : (
              <Group gap="lg">
                <Group gap={4}>
                  <IconMessageChatbot size={14} />
                  <Text size="sm">
                    {stats?.suno?.prompts ?? 0} prompts
                  </Text>
                </Group>
                <Group gap={4}>
                  <IconFolder size={14} />
                  <Text size="sm">
                    {stats?.suno?.collections ?? 0} collections
                  </Text>
                </Group>
                <Group gap={4}>
                  <IconSparkles size={14} />
                  <Text size="sm">
                    {stats?.suno?.generations ?? 0} generations
                  </Text>
                </Group>
              </Group>
            )}
            <Group gap="xs" mt="xs">
              <Button
                size="xs"
                variant="light"
                color="pink"

                onClick={() => navigate("/suno/prompts")}
              >
                Prompts
              </Button>
            </Group>
          </Stack>
        </Card>
      </SimpleGrid>
    </Stack>
  );
};
