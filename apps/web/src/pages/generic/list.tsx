import { useState } from "react";
import { useList, useNavigation, useCreate } from "@refinedev/core";
import {
  Table,
  Group,
  Button,
  Title,
  Stack,
  Pagination,
  Text,
  LoadingOverlay,
  Modal,
  TextInput,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconPlus } from "@tabler/icons-react";
import { ListToolbar } from "../../components/shared/list-toolbar.js";
import { SortableHeader } from "../../components/shared/sortable-header.js";
import { PlatformLinks } from "../../components/shared/platform-links.js";
import { ListCell } from "../../components/generic/list-cell.js";
import type { EntityDef, FieldDef } from "../../config/entity-registry.js";
import { getResourceName } from "../../config/entity-registry.js";

const PAGE_SIZE = 20;

/** Map of field keys to human-readable header labels. */
const defaultLabels: Record<string, string> = {
  name: "Name",
  image_path: "",
  rating: "Rating",
  archived: "Status",
  created_at: "Added",
  updated_at: "Updated",
  release_date: "Release Date",
  attribute_category: "Category",
  description: "Description",
  url: "URL",
};

/** Fields that support server-side sorting. */
const sortableFields = new Set([
  "name",
  "rating",
  "release_date",
  "created_at",
  "updated_at",
  "attribute_category",
]);

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
  const createExtraFields = getCreateExtraFields(entity);

  // -- State --
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [archiveFilter, setArchiveFilter] = useState("active");
  const [sortField, setSortField] = useState("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

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

  // -- Sorting --
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
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

  // -- Archive filter value --
  const archivedValue =
    archiveFilter === "archived"
      ? true
      : archiveFilter === "active"
        ? false
        : undefined;

  // -- Data fetching --
  const listResult = useList({
    resource,
    pagination: { currentPage: page, pageSize: PAGE_SIZE },
    filters: [
      { field: "search", operator: "contains", value: search },
      { field: "archived", operator: "eq", value: archivedValue },
    ],
    sorters: [{ field: sortField, order: sortOrder }],
  });

  const records = listResult.result.data ?? [];
  const total = listResult.result.total ?? 0;
  const pageCount = Math.ceil(total / PAGE_SIZE);

  // -- Column count for empty state --
  const colCount =
    entity.listColumns.length + (showPlatformLinks ? 1 : 0);

  return (
    <Stack>
      {/* Header */}
      <Group justify="space-between">
        <Title order={3}>{entity.pluralName}</Title>
        <Button leftSection={<IconPlus size={16} />} onClick={openCreate}>
          New
        </Button>
      </Group>

      {/* Toolbar */}
      <ListToolbar
        search={search}
        onSearchChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
        archiveFilter={archiveFilter}
        onArchiveFilterChange={(value) => {
          setArchiveFilter(value);
          setPage(1);
        }}
      />

      {/* Table */}
      <div style={{ position: "relative", minHeight: 200 }}>
        <LoadingOverlay visible={listResult.query.isPending} />
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              {entity.listColumns.map((col) => {
                const label = getFieldLabel(col, entity);

                // Image column has no label, just a narrow header
                if (col === "image_path") {
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
            {records.length === 0 && !listResult.query.isPending && (
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
                    />
                  </Table.Td>
                )}
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </div>

      {/* Pagination */}
      {pageCount > 1 && (
        <Group justify="center" mt="md">
          <Pagination value={page} onChange={setPage} total={pageCount} />
        </Group>
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
