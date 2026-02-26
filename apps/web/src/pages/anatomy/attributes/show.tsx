import { useShow, useNavigation, useUpdate } from "@refinedev/core";
import {
  Text,
  Table,
  Loader,
  Center,
} from "@mantine/core";
import { EditableField } from "../../../components/shared/editable-field.js";
import { EntityPage, SectionCard } from "../../../components/shared/entity-page.js";

interface AnatomyAttribute {
  id: string;
  name: string;
  category: string | null;
  description: string | null;
  instruction: string | null;
  examples: string | null;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}

export const AnatomyAttributeShow = () => {
  const { query: showQuery } = useShow<AnatomyAttribute>({
    resource: "anatomy/attributes",
  });
  const { list } = useNavigation();
  const { mutateAsync: updateRecord } = useUpdate();

  const record = showQuery?.data?.data;
  const isLoading = showQuery?.isPending;

  const saveField = async (field: string, value: string) => {
    await updateRecord({
      resource: "anatomy/attributes",
      id: record!.id,
      values: { [field]: value || null },
    });
    showQuery.refetch();
  };

  if (isLoading) {
    return (
      <Center py="xl">
        <Loader />
      </Center>
    );
  }

  if (!record) {
    return (
      <Text c="dimmed" ta="center" py="xl">
        Attribute not found.
      </Text>
    );
  }

  return (
    <EntityPage
      title={record.name}
      onBack={() => list("anatomy/attributes")}
      onTitleSave={async (newName) => {
        await updateRecord({
          resource: "anatomy/attributes",
          id: record.id,
          values: { name: newName },
        });
        showQuery.refetch();
      }}
      archived={record.archived}
      onArchiveToggle={async (val) => {
        await updateRecord({
          resource: "anatomy/attributes",
          id: record.id,
          values: { archived: val },
        });
        showQuery.refetch();
      }}
    >
      <SectionCard title="Attribute Details">
        <Table>
          <Table.Tbody>
            <Table.Tr>
              <Table.Td fw={600} w={180}>Category</Table.Td>
              <Table.Td>
                <EditableField
                  value={record.category}
                  onSave={(v) => saveField("category", v)}
                  placeholder="e.g. genre, structure, mood..."
                  emptyText="Click to add"
                />
              </Table.Td>
            </Table.Tr>
            <Table.Tr>
              <Table.Td fw={600} style={{ verticalAlign: "top" }}>Description</Table.Td>
              <Table.Td>
                <EditableField
                  value={record.description}
                  onSave={(v) => saveField("description", v)}
                  placeholder="Describe this attribute..."
                  emptyText="Click to add"
                />
              </Table.Td>
            </Table.Tr>
            <Table.Tr>
              <Table.Td fw={600} style={{ verticalAlign: "top" }}>Instruction</Table.Td>
              <Table.Td>
                <EditableField
                  value={record.instruction}
                  onSave={(v) => saveField("instruction", v)}
                  placeholder="How to analyze this attribute..."
                  emptyText="Click to add"
                />
              </Table.Td>
            </Table.Tr>
            <Table.Tr>
              <Table.Td fw={600} style={{ verticalAlign: "top" }}>Examples</Table.Td>
              <Table.Td>
                <EditableField
                  value={record.examples}
                  onSave={(v) => saveField("examples", v)}
                  placeholder="Example values..."
                  emptyText="Click to add"
                />
              </Table.Td>
            </Table.Tr>
            <Table.Tr>
              <Table.Td fw={600}>Created</Table.Td>
              <Table.Td>{record.createdAt}</Table.Td>
            </Table.Tr>
            <Table.Tr>
              <Table.Td fw={600}>Updated</Table.Td>
              <Table.Td>{record.updatedAt}</Table.Td>
            </Table.Tr>
          </Table.Tbody>
        </Table>
      </SectionCard>
    </EntityPage>
  );
};
