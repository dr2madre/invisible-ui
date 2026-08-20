<script setup lang="ts">
// End-to-end harness for the Vue adapter. It stays minimal on purpose: the
// browser tests need real Vue components and stable names, not a showcase.
import { ref } from "vue";
import { Button, Popover, TableSet, type TableRow } from "@design-system/vue";

const peopleColumns = [
  { key: "name", header: "Name", sortable: true },
  { key: "city", header: "City" },
];

// The rows arrive later through the button, so the select-all control starts
// disabled over an empty scope and must come alive with the data.
const peopleRows = ref<TableRow[]>([]);
const selectedRowIds = ref<(string | number)[]>([]);

const loadPeople = () => {
  peopleRows.value = [
    { id: 1, name: "Ada", city: "London" },
    { id: 2, name: "Grace", city: "New York" },
    { id: 3, name: "Alan", city: "Manchester" },
    { id: 4, name: "Katherine", city: "Hampton" },
  ];
};
</script>

<template>
  <main>
    <h1>Vue adapter harness</h1>

    <a href="#before">Before</a>

    <Popover>
      <template #trigger>Open popover</template>
      <p>Panel content.</p>
      <Button>Action</Button>
    </Popover>

    <a href="#after">After</a>

    <section class="harness-selection" aria-label="Row selection">
      <Button :on-press="loadPeople">Load people</Button>
      <TableSet
        :columns="peopleColumns"
        :rows="peopleRows"
        caption="People"
        allow-view-toggle
        card-title-key="name"
        selection-mode="multiple"
        :selected-row-ids="selectedRowIds"
        :on-selected-row-ids-change="(ids) => (selectedRowIds = ids)"
        :get-row-label="(row) => String(row.name)"
        :page-size="2"
      />
      <p data-testid="selection-readout">Selected: {{ selectedRowIds.join(", ") || "none" }}</p>
    </section>
  </main>
</template>

<style>
main {
  display: grid;
  gap: 1rem;
  justify-items: start;
  padding: 2rem;
  font-family: system-ui, sans-serif;
}
.harness-selection {
  display: grid;
  gap: 1rem;
  justify-items: start;
  inline-size: 100%;
  max-inline-size: 40rem;
}
</style>
