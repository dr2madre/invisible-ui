<script setup lang="ts">
// End-to-end harness for the Vue adapter. It stays minimal on purpose: the
// browser tests need real Vue components and stable names, not a showcase.
import { computed, ref } from "vue";
import {
  Button,
  MultiSelect,
  NumberField,
  Popover,
  TableSet,
  TextField,
  type TableRow,
} from "@design-system/vue";

const peopleColumns = [
  { key: "name", header: "Name", sortable: true },
  { key: "city", header: "City" },
];

// The rows arrive later through the button, so the select-all control starts
// disabled over an empty scope and must come alive with the data.
const peopleRows = ref<TableRow[]>([]);
const selectedRowIds = ref<(string | number)[]>([]);
const cityFilter = ref("");

const filteredRows = computed(() =>
  peopleRows.value.filter((row) =>
    String(row.city).toLowerCase().includes(cityFilter.value.trim().toLowerCase()),
  ),
);

const skillItems = [
  { value: "svelte", label: "Svelte" },
  { value: "vue", label: "Vue" },
  { value: "react", label: "React" },
  { value: "reflex", label: "Reflex", disabled: true },
  { value: "elements", label: "Elements" },
];
const skillValues = ref<string[]>(["vue"]);
const submittedSkills = ref("none");

const onSkillsSubmit = (event: Event) => {
  event.preventDefault();
  submittedSkills.value =
    new FormData(event.currentTarget as HTMLFormElement).getAll("skills").join(", ") || "none";
};

const price = ref<number | null>(1234.5);
const committedPrice = ref("none");
const submittedPrice = ref("none");
const wheelValue = ref<number | null>(3);

const onPriceSubmit = (event: Event) => {
  event.preventDefault();
  submittedPrice.value =
    String(new FormData(event.currentTarget as HTMLFormElement).get("price") ?? "") || "empty";
};

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
        :rows="filteredRows"
        caption="People"
        :filters-active="cityFilter.trim() !== ''"
        :total-row-count="peopleRows.length"
        :filter-revision="cityFilter.trim().toLowerCase()"
        :on-clear-filters="() => (cityFilter = '')"
        allow-view-toggle
        card-title-key="name"
        selection-mode="multiple"
        :selected-row-ids="selectedRowIds"
        :on-selected-row-ids-change="(ids) => (selectedRowIds = ids)"
        :get-row-label="(row) => String(row.name)"
        :page-size="2"
      >
        <template #toolbar>
          <TextField
            label="Filter by city"
            placeholder="Filter by city"
            :model-value="cityFilter"
            :on-value-change="(next) => (cityFilter = next)"
          />
        </template>
      </TableSet>
      <p data-testid="selection-readout">Selected: {{ selectedRowIds.join(", ") || "none" }}</p>
    </section>

    <section class="harness-number-field" aria-label="Number field">
      <form data-testid="price-form" @submit="onPriceSubmit">
        <NumberField
          label="Price"
          :value="price"
          locale="it-IT"
          :min="0"
          :step="0.5"
          name="price"
          :on-value-change="(next) => (price = next)"
          :on-value-commit="(next) => (committedPrice = next === null ? 'null' : String(next))"
        />
        <NumberField
          label="Wheel amount"
          :value="wheelValue"
          change-on-wheel
          :on-value-change="(next) => (wheelValue = next)"
        />
        <NumberField label="Plain amount" :value="3" />
        <Button type="submit">Submit price</Button>
        <button type="reset">Reset price</button>
        <p data-testid="price-committed">Committed: {{ committedPrice }}</p>
        <p data-testid="price-submitted">Submitted: {{ submittedPrice }}</p>
      </form>
    </section>

    <section class="harness-multi-select" aria-label="Multi select">
      <form data-testid="skills-form" @submit="onSkillsSubmit">
        <MultiSelect
          label="Skills"
          :items="skillItems"
          :values="skillValues"
          name="skills"
          remove-on-backspace
          :on-values-change="(next) => (skillValues = next)"
        />
        <Button type="submit">Submit skills</Button>
        <p data-testid="skills-readout">Submitted: {{ submittedSkills }}</p>
      </form>
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
.harness-number-field form {
  display: grid;
  gap: 1rem;
  justify-items: start;
}
.harness-multi-select form {
  display: grid;
  gap: 1rem;
  justify-items: start;
  inline-size: 100%;
  max-inline-size: 24rem;
}
.harness-selection {
  display: grid;
  gap: 1rem;
  justify-items: start;
  inline-size: 100%;
  max-inline-size: 40rem;
}
</style>
