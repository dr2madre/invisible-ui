<script setup lang="ts">
import {
  Button,
  Calendar,
  Combobox,
  Dialog,
  InlineNotification,
  LocaleProvider,
  NotificationRegion,
  Switch,
  TextField,
  createNotifier,
  type ComboboxOption,
} from "@design-system/vue";
import { computed, ref, watchEffect } from "vue";

const notifier = createNotifier();

const theme = ref<"light" | "dark">("light");
const name = ref("");
const email = ref("");
const project = ref<string | null>(null);
const updates = ref(true);
const selectedDate = ref<string | null>("2026-08-12");
const dialogOpen = ref(false);

const projects: ComboboxOption[] = [
  { value: "aurora", label: "Aurora redesign" },
  { value: "atlas", label: "Atlas mobile app" },
  { value: "northstar", label: "Northstar research" },
  { value: "orbit", label: "Orbit design system" },
];

const events = [
  { date: "2026-08-05", label: "Design critique", tone: "primary" as const },
  { date: "2026-08-12", label: "Vue adapter review", tone: "success" as const },
  { date: "2026-08-19", label: "Release planning", tone: "warning" as const },
];

const selection = computed(() => {
  const projectLabel = projects.find((item) => item.value === project.value)?.label;
  return [projectLabel, selectedDate.value].filter(Boolean).join(" · ") || "Nothing selected yet";
});

watchEffect(() => {
  document.documentElement.dataset.theme = theme.value;
});

const toggleTheme = () => {
  theme.value = theme.value === "light" ? "dark" : "light";
};

const submit = () => {
  notifier.success("Preferences saved", {
    text: `${name.value || "Your profile"} is ready for ${selection.value}.`,
    duration: 5000,
  });
};

const confirmInvite = () => {
  dialogOpen.value = false;
  notifier.info("Invitation prepared", {
    text: email.value ? `A preview was created for ${email.value}.` : "Add an email to send it.",
    duration: 5000,
  });
};
</script>

<template>
  <LocaleProvider locale="en" dir="ltr">
    <main class="shell">
      <header class="hero">
        <div>
          <p class="eyebrow">Invisible UI × Vue</p>
          <h1>One core, native Vue ergonomics.</h1>
          <p class="lede">
            A runnable workspace app using the complete Vue adapter directly: components,
            <code>v-model</code>, localization, dialogs and notifications.
          </p>
        </div>

        <Button variant="ghost" :on-press="toggleTheme">
          Use {{ theme === "light" ? "dark" : "light" }} theme
        </Button>
      </header>

      <InlineNotification
        status="info"
        title="Native adapter"
        description="These controls come from @design-system/vue—not from the custom-elements package."
      />

      <div class="demo-grid">
        <section class="panel" aria-labelledby="profile-heading">
          <div class="panel__heading">
            <p class="step">01</p>
            <div>
              <h2 id="profile-heading">Reactive form</h2>
              <p>Controlled values bind through Vue’s standard model syntax.</p>
            </div>
          </div>

          <form class="form" @submit.prevent="submit">
            <TextField
              v-model="name"
              label="Name"
              name="name"
              placeholder="Ada Lovelace"
              description="Used in the saved notification."
              required
            />
            <TextField
              v-model="email"
              label="Email"
              name="email"
              type="email"
              placeholder="ada@example.com"
            />
            <Combobox
              v-model="project"
              label="Project"
              name="project"
              :items="projects"
              placeholder="Search projects…"
              width="fill"
            />
            <Switch v-model="updates" label="Send weekly updates" name="updates" />

            <div class="actions">
              <Button type="submit" variant="primary">Save preferences</Button>
              <Dialog
                v-model:open="dialogOpen"
                title="Invite a collaborator"
                trigger="Preview invitation"
                description="Review the current recipient before continuing."
                footer-close
              >
                <p>
                  Recipient: <strong>{{ email || "No email entered" }}</strong>
                </p>
                <p>Project: {{ selection }}</p>

                <template #footer>
                  <Button variant="primary" :on-press="confirmInvite">Prepare invite</Button>
                </template>
              </Dialog>
            </div>
          </form>
        </section>

        <section class="panel panel--calendar" aria-labelledby="calendar-heading">
          <div class="panel__heading">
            <p class="step">02</p>
            <div>
              <h2 id="calendar-heading">Keyboard-ready calendar</h2>
              <p>Arrow through the date grid or select a day with a pointer.</p>
            </div>
          </div>

          <Calendar
            v-model="selectedDate"
            focused-date="2026-08-12"
            locale="en-GB"
            label="Project milestone date"
            :events="events"
          />

          <p class="selection" aria-live="polite">{{ selection }}</p>
        </section>
      </div>
    </main>

    <NotificationRegion :notifier="notifier" placement="bottom-end" />
  </LocaleProvider>
</template>
