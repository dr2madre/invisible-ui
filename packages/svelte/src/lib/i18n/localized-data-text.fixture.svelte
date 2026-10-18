<script lang="ts">
  import LocaleProvider from "./LocaleProvider.svelte";
  import AvatarGroup from "../avatar-group/AvatarGroup.svelte";
  import Calendar from "../calendar/Calendar.svelte";
  import Carousel from "../carousel/Carousel.svelte";
  import CodeBlock from "../code-block/CodeBlock.svelte";
  import LoginForm from "../login-form/LoginForm.svelte";
  import TableSet from "../table/TableSet.svelte";
  import type { TableRow } from "../table/Table.svelte";

  interface Props {
    rows?: TableRow[];
    filtersActive?: boolean;
  }

  const people: TableRow[] = [
    { id: 1, name: "Ada" },
    { id: 2, name: "Grace" },
    { id: 3, name: "Alan" },
  ];

  let { rows = people, filtersActive = false }: Props = $props();

  // A catalog override a product would give: every text these components
  // used to write in English.
  const messages = {
    "avatarGroup.more": { one: "altro {count}", other: "altri {count}" },
    "codeBlock.copyText": "Copia",
    "codeBlock.copiedText": "Copiato",
    "codeBlock.label": "Codice",
    "codeBlock.labelLanguage": "Codice: {language}",
    "codeBlock.sample": "Esempio di codice",
    "codeBlock.sampleLanguage": "Esempio di codice, {language}",
    "carousel.goTo": "Vai alla slide {index}",
    "carousel.slide": "{index} di {count}",
    "carousel.roleDescription": "carosello",
    "carousel.slideRoleDescription": "diapositiva",
    "table.view": "Vista",
    "table.viewTable": "Tabella",
    "table.viewCards": "Schede",
    "table.results": { one: "{count} risultato", other: "{count} risultati" },
    "calendar.events": { one: "{count} evento", other: "{count} eventi" },
    "calendar.rangeStart": "inizio intervallo",
    "calendar.rangeEnd": "fine intervallo",
    "loginForm.email": "Indirizzo e-mail",
    "loginForm.emailPlaceholder": "tu@esempio.it",
    "loginForm.password": "Parola chiave",
    "loginForm.divider": "oppure",
    "loginForm.provider": "Continua con {name}",
  };
</script>

<LocaleProvider locale="it" {messages}>
  <AvatarGroup
    label="Squadra"
    max={2}
    items={[{ name: "Ada" }, { name: "Grace" }, { name: "Alan" }, { name: "Edsger" }]}
  />
  <CodeBlock language="ts" code="const a = 1;" />
  <Carousel label="Mete" items={[{ title: "Uno" }, { title: "Due" }]} />
  <TableSet
    columns={[{ key: "name", header: "Nome", sortable: true }]}
    {rows}
    {filtersActive}
    totalRowCount={3}
    allowViewToggle
    title="Persone"
    caption="Persone"
  />
  <Calendar
    mode="range"
    rangeStart="2026-06-10"
    rangeEnd="2026-06-14"
    focusedDate="2026-06-10"
    events={[{ date: "2026-06-10", label: "Riunione" }]}
    locale="it"
  />
  <LoginForm providers={[{ id: "g", label: "Google" }]} />
</LocaleProvider>
