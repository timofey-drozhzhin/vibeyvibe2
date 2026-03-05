import { useState, useRef, useEffect, useCallback } from "react";
import { useInfiniteList, useNavigation, useCreate } from "@refinedev/core";
import {
  Table,
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
  Select,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconPlus, IconHeart, IconHeartFilled, IconCalendar } from "@tabler/icons-react";
import { ListToolbar } from "../../components/shared/list-toolbar.js";
import { SortableHeader } from "../../components/shared/sortable-header.js";
import { PlatformLinks } from "../../components/shared/platform-links.js";
import { ListCell } from "../../components/generic/list-cell.js";
import { useLikeToggle } from "../../hooks/use-like-toggle.js";
import type { EntityDef, FieldDef } from "../../config/entity-registry.js";
import { getResourceName } from "../../config/entity-registry.js";

const PAGE_SIZE = 100;

/** Check if an entity has a release_date field. */
function hasReleaseDate(entity: EntityDef): boolean {
  return entity.fields.some((f) => f.key === "release_date");
}

/** Generate year options from current year down to 1950. */
function getYearOptions(): { label: string; value: string }[] {
  const currentYear = new Date().getFullYear();
  const years: { label: string; value: string }[] = [];
  for (let y = currentYear; y >= 1950; y--) {
    years.push({ label: String(y), value: String(y) });
  }
  return years;
}

/** Map of field keys to human-readable header labels. */
const defaultLabels: Record<string, string> = {
  name: "Name",
  image_path: "",
  rating: "Rating",
  created_at: "Created",
  updated_at: "Updated",
  release_date: "Release Date",
  vibe_category: "Category",
  description: "Description",
  url: "URL",
};

/** Derive sortable fields from the entity's sort presets. */
function getSortableFields(entity: EntityDef): Set<string> {
  if (!entity.sortPresets?.length) return new Set();
  return new Set(entity.sortPresets.map((p) => p.field));
}


function getFieldLabel(fieldKey: string, entity: EntityDef): string {
  if (defaultLabels[fieldKey] !== undefined) return defaultLabels[fieldKey];
  const fieldDef = entity.fields.find((f) => f.key === fieldKey);
  if (fieldDef) return fieldDef.label;
  // Fallback: convert snake_case to Title Case
  return fieldKey
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Check if the entity has platform UID fields for the actions column. */
function hasPlatformLinks(entity: EntityDef): boolean {
  const fieldKeys = entity.fields.map((f) => f.key);
  return (
    fieldKeys.includes("spotify_uid") ||
    fieldKeys.includes("apple_music_uid") ||
    fieldKeys.includes("youtube_uid")
  );
}

/** Determine the platform link type from entity UID fields. */
function getPlatformType(entity: EntityDef): "track" | "album" | "artist" {
  const uidField = entity.fields.find((f) => f.type === "uid" && f.embedType);
  return (uidField?.embedType as "track" | "album" | "artist") ?? "track";
}

/** Get the create fields from the entity definition (fields with createField: true). */
function getCreateExtraFields(entity: EntityDef): FieldDef[] {
  return entity.fields.filter((f) => f.createField);
}

interface GenericEntityListProps {
  entity: EntityDef;
}

export const GenericEntityList = ({ entity }: GenericEntityListProps) => {
  const resource = getResourceName(entity);
  const showPlatformLinks = hasPlatformLinks(entity);
  const platformType = getPlatformType(entity);
  const createExtraFields = getCreateExtraFields(entity);
  const sortableFields = getSortableFields(entity);
  const showYearFilter = hasReleaseDate(entity);

  // Derive sort preset options from entity config
  const sortPresetOptions = entity.sortPresets?.map((p) => ({
    label: p.label,
    value: `${p.field}:${p.order}`,
  })) ?? [];

  // -- State --
  const [search, setSearch] = useState("");
  const [archiveFilter, setArchiveFilter] = useState("active");
  const [likedFilter, setLikedFilter] = useState(false);
  const [releaseYear, setReleaseYear] = useState<string | null>(null);
  const [sortField, setSortField] = useState("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [activeSortPreset, setActiveSortPreset] = useState<string | null>(() => {
    if (!entity.sortPresets) return null;
    const defaultComposite = "created_at:desc";
    return sortPresetOptions.find((p) => p.value === defaultComposite)
      ? defaultComposite
      : null;
  });

  // -- Create modal state --
  const [createOpened, { open: openCreate, close: closeCreate }] =
    useDisclosure(false);
  const [newName, setNewName] = useState("");
  const [createExtraValues, setCreateExtraValues] = useState<
    Record<string, string>
  >({});

  // -- Hooks --
  const { show } = useNavigation();
  const { mutate: createRecord, mutation: createMutation } = useCreate();
  const { toggle: toggleLike } = useLikeToggle(() => query.refetch());

  // -- Sorting --
  const handleSort = (field: string) => {
    let newOrder: "asc" | "desc";
    if (sortField === field) {
      newOrder = sortOrder === "asc" ? "desc" : "asc";
    } else {
      newOrder = "asc";
    }
    setSortField(field);
    setSortOrder(newOrder);

    // Sync preset selection if the new sort matches a preset
    const composite = `${field}:${newOrder}`;
    const match = sortPresetOptions.find((p) => p.value === composite);
    setActiveSortPreset(match ? match.value : null);
  };

  const handleSortPresetChange = (value: string | null) => {
    if (!value) return;
    setActiveSortPreset(value);
    const [field, order] = value.split(":");
    setSortField(field);
    setSortOrder(order as "asc" | "desc");
  };

  // -- Create --
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

  // -- Archive filter --
  const archiveFilters = [
    { field: "archived" as const, operator: "eq" as const, value: archiveFilter === "archived" },
  ];

  // -- Data fetching (infinite scroll) --
  const { query, result } = useInfiniteList({
    resource,
    pagination: { pageSize: PAGE_SIZE },
    filters: [
      { field: "search", operator: "contains", value: search },
      ...archiveFilters,
      ...(likedFilter ? [{ field: "liked" as const, operator: "eq" as const, value: "true" }] : []),
      ...(releaseYear ? [{ field: "release_year" as const, operator: "eq" as const, value: releaseYear }] : []),
    ],
    sorters: [{ field: sortField, order: sortOrder }],
  });

  // Flatten all pages into a single array
  const records = result.data?.pages.flatMap((p) => p.data) ?? [];
  const total = result.data?.pages[0]?.total ?? 0;
  const isInitialLoading = query.isLoading;

  // -- Infinite scroll sentinel --
  const sentinelRef = useRef<HTMLDivElement>(null);

  const handleIntersect = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      if (entry.isIntersecting && result.hasNextPage && !query.isFetchingNextPage) {
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

  // -- Column count for empty state (+ 1 for like column) --
  const colCount =
    entity.listColumns.length + 1 + (showPlatformLinks ? 1 : 0);

  return (
    <Stack>
      {/* Header */}
      <Group justify="space-between">
        <Group gap="sm" align="baseline">
          <Title order={3}>{entity.pluralName}</Title>
          {!isInitialLoading && total > 0 && (
            <Text size="sm" c="dimmed">{total}</Text>
          )}
        </Group>
        <Button leftSection={<IconPlus size={16} />} onClick={openCreate}>
          New
        </Button>
      </Group>

      {/* Toolbar */}
      <ListToolbar
        search={search}
        onSearchChange={setSearch}
        archiveFilter={archiveFilter}
        onArchiveFilterChange={setArchiveFilter}
        sortPresets={sortPresetOptions.length > 0 ? sortPresetOptions : undefined}
        activeSortPreset={activeSortPreset}
        onSortPresetChange={handleSortPresetChange}
      >
        {showYearFilter && (
          <Select
            placeholder="Release Year"
            leftSection={<IconCalendar size={16} />}
            data={getYearOptions()}
            value={releaseYear}
            onChange={setReleaseYear}
            clearable
            searchable
            size="sm"
            w={120}
          />
        )}
        <Tooltip label={likedFilter ? "Show all" : "Show liked only"}>
          <ActionIcon
            variant={likedFilter ? "filled" : "subtle"}
            color="red"
            onClick={() => setLikedFilter((v) => !v)}
            size="lg"
          >
            {likedFilter ? <IconHeartFilled size={18} /> : <IconHeart size={18} />}
          </ActionIcon>
        </Tooltip>
      </ListToolbar>

      {/* Table */}
      <div style={{ position: "relative", minHeight: 200 }}>
        <LoadingOverlay visible={isInitialLoading} />
        <Table>
          <Table.Thead>
            <Table.Tr>
              <Table.Th w={40} />
              {entity.listColumns.map((col) => {
                const label = getFieldLabel(col, entity);

                // Image columns get a narrow header with no label
                const colDef = entity.fields.find((f) => f.key === col);
                if (colDef?.type === "image") {
                  return <Table.Th key={col} w={50} />;
                }

                // Sortable columns use SortableHeader
                if (sortableFields.has(col)) {
                  return (
                    <SortableHeader
                      key={col}
                      field={col}
                      label={label}
                      currentSort={sortField}
                      currentOrder={sortOrder}
                      onSort={handleSort}
                    />
                  );
                }

                // Non-sortable columns
                return <Table.Th key={col}>{label}</Table.Th>;
              })}
              {showPlatformLinks && <Table.Th>Actions</Table.Th>}
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {records.length === 0 && !isInitialLoading && (
              <Table.Tr>
                <Table.Td colSpan={colCount}>
                  <Text c="dimmed" ta="center" py="md">
                    No {entity.pluralName.toLowerCase()} found.
                  </Text>
                </Table.Td>
              </Table.Tr>
            )}
            {records.map((record: any) => (
              <Table.Tr key={record.id}>
                <Table.Td>
                  <ActionIcon
                    variant="subtle"
                    color={record.liked ? "red" : "gray"}
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleLike(resource, record.id);
                    }}
                  >
                    {record.liked ? <IconHeartFilled size={16} /> : <IconHeart size={16} />}
                  </ActionIcon>
                </Table.Td>
                {entity.listColumns.map((col) => (
                    <Table.Td key={col}>
                      <ListCell
                        fieldKey={col}
                        value={record[col]}
                        entity={entity}
                        record={record}
                      />
                    </Table.Td>
                ))}
                {showPlatformLinks && (
                  <Table.Td>
                    <PlatformLinks
                      spotifyId={record.spotify_uid}
                      appleMusicId={record.apple_music_uid}
                      youtubeId={record.youtube_uid}
                      type={platformType}
                    />
                  </Table.Td>
                )}
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
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
