import { useState, useRef, useEffect, useCallback } from "react";
import { useInfiniteList, useNavigation, useCreate } from "@refinedev/core";
import {
  Group,
  Button,
  Title,
  Stack,
  Text,
  LoadingOverlay,
  Modal,
  TextInput,
  Loader,
  Center,
  ActionIcon,
  Tooltip,
  Image,
  Menu,
  Box,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
  IconPlus,
  IconHeart,
  IconHeartFilled,
  IconCalendar,
  IconDots,
  IconEye,
  IconChevronDown,
  IconCheck,
} from "@tabler/icons-react";
import { ListToolbar, pillStyle } from "../../components/shared/list-toolbar.js";
import { PlatformLinks } from "../../components/shared/platform-links.js";
import { RatingDisplay } from "../../components/shared/rating-field.js";
import { CardGrid } from "../../components/generic/card-grid.js";
import { ArtistCardList } from "../../components/generic/artist-card-list.js";
import { SongCardRow } from "../../components/generic/song-card-row.js";
import { useLikeToggle } from "../../hooks/use-like-toggle.js";
import type { EntityDef, FieldDef } from "../../config/entity-registry.js";
import { getResourceName } from "../../config/entity-registry.js";
import { API_URL } from "../../config/constants.js";
import { formatDate } from "../../utils/format-date.js";
import { resolveFkDisplayName } from "../../utils/resolve-fk-display.js";

const PAGE_SIZE = 100;
const THUMB_SIZE = 64;

function hasReleaseDate(entity: EntityDef): boolean {
  return entity.fields.some((f) => f.key === "release_date");
}

function getYearOptions(): { label: string; value: string }[] {
  const currentYear = new Date().getFullYear();
  const years: { label: string; value: string }[] = [];
  for (let y = currentYear; y >= 1950; y--) {
    years.push({ label: String(y), value: String(y) });
  }
  return years;
}

function hasPlatformLinks(entity: EntityDef): boolean {
  const fieldKeys = entity.fields.map((f) => f.key);
  return (
    fieldKeys.includes("spotify_uid") ||
    fieldKeys.includes("apple_music_uid") ||
    fieldKeys.includes("youtube_uid")
  );
}

function getPlatformType(entity: EntityDef): "track" | "album" | "artist" {
  const uidField = entity.fields.find((f) => f.type === "uid" && f.embedType);
  return (uidField?.embedType as "track" | "album" | "artist") ?? "track";
}

function getCreateExtraFields(entity: EntityDef): FieldDef[] {
  return entity.fields.filter((f) => f.createField);
}

function categorizeColumns(entity: EntityDef) {
  const imageCol = entity.listColumns.find((col) => {
    const fd = entity.fields.find((f) => f.key === col);
    return fd?.type === "image";
  });

  const timestampKeys = new Set(["created_at", "updated_at"]);
  const timestampCols = entity.listColumns.filter((col) =>
    timestampKeys.has(col),
  );

  const ratingCol = entity.listColumns.find((col) => {
    const fd = entity.fields.find((f) => f.key === col);
    return fd?.type === "rating";
  });

  const audioCol = entity.listColumns.find((col) => {
    const fd = entity.fields.find((f) => f.key === col);
    return fd?.type === "audio";
  });

  const excludeSet = new Set(
    [imageCol, "name", ratingCol, audioCol, ...timestampCols].filter(
      Boolean,
    ) as string[],
  );
  const metadataCols = entity.listColumns.filter(
    (col) => !excludeSet.has(col),
  );

  return { imageCol, timestampCols, metadataCols, ratingCol };
}

function renderMetadataValue(
  col: string,
  record: any,
  entity: EntityDef,
): string | null {
  const fieldDef = entity.fields.find((f) => f.key === col);
  const value = record[col];

  if (Array.isArray(value) && value.length > 0 && value[0]?.name) {
    return value.map((item: any) => item.name).join(", ");
  }
  if (fieldDef?.type === "date") return formatDate(value);
  if (fieldDef?.type === "fk")
    return resolveFkDisplayName(col, value, record) ?? null;
  if (fieldDef?.type === "url" && value) {
    try {
      return new URL(value).hostname;
    } catch {
      return String(value);
    }
  }
  if (value != null && String(value).trim()) return String(value);
  return null;
}

interface GenericEntityListProps {
  entity: EntityDef;
}

export const GenericEntityList = ({ entity }: GenericEntityListProps) => {
  const resource = getResourceName(entity);
  const showPlatformLinks = hasPlatformLinks(entity);
  const platformType = getPlatformType(entity);
  const createExtraFields = getCreateExtraFields(entity);
  const showYearFilter = hasReleaseDate(entity);
  const { imageCol, timestampCols, metadataCols, ratingCol } =
    categorizeColumns(entity);
  const listLayout = entity.listLayout ?? "card-row";

  const sortPresetOptions =
    entity.sortPresets?.map((p) => ({
      label: p.label,
      value: `${p.field}:${p.order}`,
    })) ?? [];

  const [search, setSearch] = useState("");
  const [archiveFilter, setArchiveFilter] = useState("active");
  const [likedFilter, setLikedFilter] = useState(false);
  const [releaseYear, setReleaseYear] = useState<string | null>(null);
  const [sortField, setSortField] = useState("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [activeSortPreset, setActiveSortPreset] = useState<string | null>(
    () => {
      if (!entity.sortPresets) return null;
      const defaultComposite = "created_at:desc";
      return sortPresetOptions.find((p) => p.value === defaultComposite)
        ? defaultComposite
        : null;
    },
  );

  const [createOpened, { open: openCreate, close: closeCreate }] =
    useDisclosure(false);
  const [newName, setNewName] = useState("");
  const [createExtraValues, setCreateExtraValues] = useState<
    Record<string, string>
  >({});

  const { show } = useNavigation();
  const { mutate: createRecord, mutation: createMutation } = useCreate();
  const { toggle: toggleLike } = useLikeToggle(() => query.refetch());

  const handleSortPresetChange = (value: string | null) => {
    if (!value) return;
    setActiveSortPreset(value);
    const [field, order] = value.split(":");
    setSortField(field);
    setSortOrder(order as "asc" | "desc");
  };

  const handleCreate = () => {
    const values: Record<string, any> = { name: newName };
    for (const field of createExtraFields) {
      if (createExtraValues[field.key]) {
        values[field.key] = createExtraValues[field.key];
      }
    }
    createRecord(
      { resource, values },
      {
        onSuccess: (data) => {
          closeCreate();
          setNewName("");
          setCreateExtraValues({});
          show(resource, data.data.id!);
        },
      },
    );
  };

  const { query, result } = useInfiniteList({
    resource,
    pagination: { pageSize: PAGE_SIZE },
    filters: [
      { field: "search", operator: "contains", value: search },
      {
        field: "archived",
        operator: "eq",
        value: archiveFilter === "archived",
      },
      ...(likedFilter
        ? [
            {
              field: "liked" as const,
              operator: "eq" as const,
              value: "true",
            },
          ]
        : []),
      ...(releaseYear
        ? [
            {
              field: "release_year" as const,
              operator: "eq" as const,
              value: releaseYear,
            },
          ]
        : []),
    ],
    sorters: [{ field: sortField, order: sortOrder }],
  });

  const records = result.data?.pages.flatMap((p) => p.data) ?? [];
  const total = result.data?.pages[0]?.total ?? 0;
  const isInitialLoading = query.isLoading;

  const sentinelRef = useRef<HTMLDivElement>(null);

  const handleIntersect = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      if (
        entry.isIntersecting &&
        result.hasNextPage &&
        !query.isFetchingNextPage
      ) {
        query.fetchNextPage();
      }
    },
    [result.hasNextPage, query.isFetchingNextPage, query.fetchNextPage],
  );

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(handleIntersect, {
      rootMargin: "200px",
    });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [handleIntersect]);

  // Year filter options (pre-computed)
  const yearOptions = showYearFilter ? getYearOptions() : [];

  return (
    <Stack gap="lg">
      {/* Header */}
      <Group justify="space-between">
        <Group gap="sm" align="baseline">
          <Title order={1} fw={600} fz={30} c="white">{entity.pluralName}</Title>
          {!isInitialLoading && total > 0 && (
            <Text size="sm" c="dimmed">
              {total}
            </Text>
          )}
        </Group>
        <Button leftSection={<IconPlus size={16} />} onClick={openCreate}>
          New
        </Button>
      </Group>

      {/* Toolbar — pill-style filter buttons */}
      <ListToolbar
        search={search}
        onSearchChange={setSearch}
        archiveFilter={archiveFilter}
        onArchiveFilterChange={setArchiveFilter}
        sortPresets={
          sortPresetOptions.length > 0 ? sortPresetOptions : undefined
        }
        activeSortPreset={activeSortPreset}
        onSortPresetChange={handleSortPresetChange}
      >
        {/* Year filter pill dropdown */}
        {showYearFilter && (
          <Menu
            position="bottom-start"
            withArrow={false}
            styles={{ dropdown: { maxHeight: 300, overflowY: "auto" } }}
          >
            <Menu.Target>
              <Button
                variant="default"
                size="sm"
                leftSection={<IconCalendar size={14} />}
                rightSection={<IconChevronDown size={12} />}
                style={pillStyle}
              >
                {releaseYear ?? "Year"}
              </Button>
            </Menu.Target>
            <Menu.Dropdown>
              {releaseYear && (
                <>
                  <Menu.Item onClick={() => setReleaseYear(null)}>
                    All Years
                  </Menu.Item>
                  <Menu.Divider />
                </>
              )}
              {yearOptions.slice(0, 30).map((opt) => (
                <Menu.Item
                  key={opt.value}
                  onClick={() => setReleaseYear(opt.value)}
                  rightSection={
                    releaseYear === opt.value ? (
                      <IconCheck size={14} />
                    ) : null
                  }
                >
                  {opt.label}
                </Menu.Item>
              ))}
            </Menu.Dropdown>
          </Menu>
        )}

        {/* Liked toggle — icon-only circle */}
        <ActionIcon
          variant={likedFilter ? "filled" : "default"}
          color={likedFilter ? "red" : "gray"}
          size={40}
          radius="xl"
          onClick={() => setLikedFilter((v) => !v)}
          style={
            likedFilter
              ? undefined
              : {
                  backgroundColor: "transparent",
                  border: "1px solid rgba(255,255,255,0.12)",
                }
          }
        >
          {likedFilter ? (
            <IconHeartFilled size={18} />
          ) : (
            <IconHeart size={18} />
          )}
        </ActionIcon>
      </ListToolbar>

      {/* Record list */}
      <div style={{ position: "relative", minHeight: 200 }}>
        <LoadingOverlay visible={isInitialLoading} />

        {records.length === 0 && !isInitialLoading && (
          <Text c="dimmed" ta="center" py="xl">
            No {entity.pluralName.toLowerCase()} found.
          </Text>
        )}

        {listLayout === "artist-card" ? (
          <ArtistCardList
            records={records}
            resource={resource}
            imageCol={imageCol}
            showPlatformLinks={showPlatformLinks}
            platformType={platformType}
            onNavigate={(res, id) => show(res, id)}
            onToggleLike={(res, id) => toggleLike(res, id)}
          />
        ) : listLayout === "card-grid" ? (
          <CardGrid
            records={records}
            resource={resource}
            imageCol={imageCol}
            showPlatformLinks={showPlatformLinks}
            platformType={platformType}
            onNavigate={(res, id) => show(res, id)}
            onToggleLike={(res, id) => toggleLike(res, id)}
          />
        ) : listLayout === "song-row" ? (
          <SongCardRow
            records={records}
            resource={resource}
            onNavigate={(res, id) => show(res, id)}
            onToggleLike={(res, id) => toggleLike(res, id)}
          />
        ) : (
        <Stack gap={0}>
          {records.map((record: any) => (
            <Box
              key={record.id}
              className="card-row"
              onClick={() => show(resource, record.id)}
              style={{ cursor: "pointer" }}
            >
              <Group wrap="nowrap" gap="md" py={10} px="xs">
                {/* Square thumbnail */}
                {imageCol && (
                  <Box
                    style={{
                      width: THUMB_SIZE,
                      height: THUMB_SIZE,
                      flexShrink: 0,
                      borderRadius: "var(--mantine-radius-sm)",
                      overflow: "hidden",
                      background: "var(--mantine-color-dark-5)",
                    }}
                  >
                    {record[imageCol] ? (
                      <Image
                        src={`${API_URL}/api/storage/${record[imageCol]}`}
                        w={THUMB_SIZE}
                        h={THUMB_SIZE}
                        fit="cover"
                      />
                    ) : (
                      <Center h={THUMB_SIZE}>
                        <Text size="xs" c="dimmed">
                          No img
                        </Text>
                      </Center>
                    )}
                  </Box>
                )}

                {/* Content area */}
                <Box style={{ flex: 1, minWidth: 0, overflow: "hidden" }}>
                  {/* Row 1: Name  Artists  Release date */}
                  <Group gap="sm" wrap="nowrap">
                    <Text
                      fw={600}
                      size="sm"
                      style={{ whiteSpace: "nowrap" }}
                    >
                      {record.name || ""}
                    </Text>
                    {metadataCols.map((col) => {
                      const rendered = renderMetadataValue(
                        col,
                        record,
                        entity,
                      );
                      if (!rendered) return null;
                      return (
                        <Text
                          key={col}
                          size="xs"
                          c="dimmed"
                          style={{ whiteSpace: "nowrap" }}
                        >
                          {rendered}
                        </Text>
                      );
                    })}
                  </Group>

                  {/* Row 2: Action icons */}
                  <Group gap={6} mt={4}>
                    <ActionIcon
                      variant="subtle"
                      color={record.liked ? "red" : "gray"}
                      size="xs"
                      onClick={(e: React.MouseEvent) => {
                        e.stopPropagation();
                        toggleLike(resource, record.id);
                      }}
                    >
                      {record.liked ? (
                        <IconHeartFilled size={14} />
                      ) : (
                        <IconHeart size={14} />
                      )}
                    </ActionIcon>
                    {showPlatformLinks && (
                      <Box
                        onClick={(e: React.MouseEvent) => e.stopPropagation()}
                      >
                        <PlatformLinks
                          spotifyId={record.spotify_uid}
                          appleMusicId={record.apple_music_uid}
                          youtubeId={record.youtube_uid}
                          type={platformType}
                          size={14}
                        />
                      </Box>
                    )}
                    {ratingCol && (
                      <Box
                        onClick={(e: React.MouseEvent) => e.stopPropagation()}
                      >
                        <RatingDisplay value={record[ratingCol] ?? 0} />
                      </Box>
                    )}
                  </Group>
                </Box>

                {/* Right: timestamp + (...) menu */}
                <Group gap="lg" wrap="nowrap" style={{ flexShrink: 0 }}>
                  {timestampCols.map((col) => (
                    <Text
                      key={col}
                      size="xs"
                      c="dimmed"
                      style={{ whiteSpace: "nowrap" }}
                    >
                      {formatDate(record[col])}
                    </Text>
                  ))}
                  <Menu position="bottom-end" withArrow={false}>
                    <Menu.Target>
                      <ActionIcon
                        variant="filled"
                        className="dots-menu"
                        size={40}
                        radius="xl"
                        style={{ backgroundColor: "rgb(37, 37, 41)", border: "none" }}
                        onClick={(e: React.MouseEvent) => e.stopPropagation()}
                      >
                        <IconDots size={16} />
                      </ActionIcon>
                    </Menu.Target>
                    <Menu.Dropdown>
                      <Menu.Item
                        leftSection={<IconEye size={14} />}
                        onClick={(e: React.MouseEvent) => {
                          e.stopPropagation();
                          show(resource, record.id);
                        }}
                      >
                        View Details
                      </Menu.Item>
                    </Menu.Dropdown>
                  </Menu>
                </Group>
              </Group>
            </Box>
          ))}
        </Stack>
        )}
      </div>

      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} />
      {query.isFetchingNextPage && (
        <Center py="md">
          <Loader size="sm" />
        </Center>
      )}

      {/* Create Modal */}
      <Modal
        opened={createOpened}
        onClose={closeCreate}
        title={`New ${entity.name}`}
      >
        <Stack gap="md">
          <TextInput
            label="Name"
            required
            value={newName}
            onChange={(e) => setNewName(e.currentTarget.value)}
            placeholder={`${entity.name} name`}
            onKeyDown={(e) => {
              if (e.key === "Enter" && newName.trim()) handleCreate();
            }}
          />
          {createExtraFields.map((field) => (
            <TextInput
              key={field.key}
              label={field.label}
              required={field.createRequired}
              value={createExtraValues[field.key] ?? ""}
              onChange={(e) =>
                setCreateExtraValues((prev) => ({
                  ...prev,
                  [field.key]: e.currentTarget.value,
                }))
              }
              placeholder={field.placeholder}
            />
          ))}
          <Group justify="flex-end">
            <Button variant="subtle" onClick={closeCreate}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              loading={createMutation.isPending}
              disabled={!newName.trim()}
            >
              Create
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
};
