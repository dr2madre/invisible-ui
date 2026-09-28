<script setup lang="ts">
// The Vue visual page: one frame per component, the same set and the same
// data as the Svelte demos the visual suite shoots on the docs site.
// e2e/visual-vue.spec.ts screenshots each [data-visual] frame. A static
// fixture with no state of its own, so it stays one file.
import { defineComponent, h, markRaw } from "vue";
import {
  Avatar,
  Button,
  Card,
  Checkbox,
  CheckboxGroup,
  EmptyState,
  ErrorState,
  Icon,
  InlineNotification,
  Label,
  Meter,
  Pagination,
  Progress,
  RadioGroup,
  RangeSlider,
  RatingGroup,
  SegmentedControl,
  Select,
  Slider,
  Switch,
  Tag,
  TextField,
} from "@design-system/vue";
import { navIcons } from "./icons";
import portrait from "./portrait.svg";

const nav = navIcons.map(({ value, label, path }) => ({
  value,
  label,
  icon: markRaw(
    defineComponent({
      name: `${label}Icon`,
      setup: () => () => h(Icon, null, () => h("path", { d: path })),
    }),
  ),
}));

const fruits = [
  { value: "apple", label: "Apple" },
  { value: "banana", label: "Banana" },
  { value: "cherry", label: "Cherry", disabled: true },
];

const payments = [
  { value: "card", label: "Credit card" },
  { value: "paypal", label: "PayPal" },
  { value: "transfer", label: "Bank transfer" },
];

const filters = ["Design", "Frontend", "Accessibility", "Docs"];

const degrees = (value: number) => `${value}°`;
</script>

<template>
  <main class="visual-page">
    <section class="visual-frame" data-visual="button">
      <div class="visual-row">
        <Button>Default</Button>
        <Button variant="primary">Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="danger">Destructive</Button>
        <Button variant="ghost">Ghost</Button>
        <Button disabled>Disabled</Button>
      </div>
    </section>

    <section class="visual-frame" data-visual="empty-state">
      <div class="visual-stack visual-stack--fill visual-stack--loose">
        <EmptyState
          title="No projects yet"
          description="Create your first project to get started."
          action-label="Add a project"
        />
        <EmptyState
          title="No results for “tofu”"
          description="Check the spelling or try a broader search."
          :actions="[{ label: 'Clear search' }, { label: 'Browse all recipes' }]"
        >
          <template #illustration>
            <svg
              viewBox="0 0 24 24"
              width="72"
              height="72"
              fill="none"
              stroke="var(--ds-color-text-secondary)"
              stroke-width="1.25"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
              <path d="M8 13c.9-1.2 2-1.8 3-1.8s2.1.6 3 1.8" transform="rotate(180 11 12)" />
            </svg>
          </template>
        </EmptyState>
        <div class="visual-panel">
          <EmptyState
            size="sm"
            title="No favorites yet"
            :actions="[
              { label: 'Browse components' },
              { label: 'Learn more', href: 'https://en.wikipedia.org/wiki/Bookmark_(digital)' },
            ]"
          >
            <p class="visual-note">Star any component and it appears here.</p>
          </EmptyState>
        </div>
      </div>
    </section>

    <section class="visual-frame" data-visual="error-state">
      <div class="visual-stack visual-stack--fill visual-stack--loose">
        <ErrorState
          title="Couldn't connect to the server"
          description="An unknown error occurred."
          action-label="Refresh"
        />
        <ErrorState
          status="neutral"
          title="Page not found"
          description="The page you're looking for doesn't exist or was moved."
          action-label="Go to homepage"
        >
          <template #icon>
            <svg
              viewBox="0 0 24 24"
              width="3.5rem"
              height="3.5rem"
              fill="none"
              stroke="var(--ds-color-text-secondary)"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
              <line x1="8" y1="11" x2="14" y2="11" />
            </svg>
          </template>
        </ErrorState>
      </div>
    </section>

    <section class="visual-frame" data-visual="tag">
      <div class="visual-tags">
        <div class="visual-row">
          <Tag status="neutral">Draft</Tag>
          <Tag status="info">In review</Tag>
          <Tag status="success">Published</Tag>
          <Tag status="warning">Needs work</Tag>
          <Tag status="danger">
            <template #icon>
              <Icon>
                <path
                  d="M18 11V6a2 2 0 0 0-2-2 2 2 0 0 0-2 2 2 2 0 0 0-2-2 2 2 0 0 0-2 2v0a2 2 0 0 0-2-2 2 2 0 0 0-2 2v8"
                />
                <path d="M14 10V4a2 2 0 0 0-2-2 2 2 0 0 0-2 2v2" />
                <path d="M10 10.5V6a2 2 0 0 0-2-2 2 2 0 0 0-2 2v8a8 8 0 0 0 16 0v-3" />
              </Icon>
            </template>
            Blocked
          </Tag>
        </div>
        <div class="visual-row visual-tags__removable">
          <Tag
            v-for="filter in filters"
            :key="filter"
            status="selected"
            removable
            :remove-label="`Remove ${filter}`"
          >
            {{ filter }}
          </Tag>
        </div>
      </div>
    </section>

    <section class="visual-frame" data-visual="card">
      <div class="visual-cards">
        <Card
          variant="dashboard"
          title="Monthly revenue"
          value="€48,200"
          change="+12.5%"
          trend="up"
        />
        <Card
          title="Spring collection"
          description="Fresh arrivals for the new season, hand-picked by our team."
        >
          <template #media>
            <div class="visual-card-media" aria-hidden="true"></div>
          </template>
          <template #tags>
            <Tag status="success">New</Tag>
            <Tag status="info">Limited</Tag>
          </template>
          <template #actions>
            <Button variant="ghost"><span class="visual-link-text">Details</span></Button>
            <Button variant="primary">Shop now</Button>
          </template>
        </Card>
      </div>
    </section>

    <section class="visual-frame" data-visual="inline-notification">
      <div class="visual-stack visual-stack--fill visual-stack--notes">
        <InlineNotification
          status="success"
          title="Saved"
          description="Your changes have been saved."
        />
        <InlineNotification
          status="danger"
          title="Payment failed"
          description="Try a different card."
          closable
        />
        <InlineNotification
          icon-shape="round"
          icon-box="tint"
          status="warning"
          title="Storage almost full"
          description="You are using 90% of your space — the round chip variant."
        />
        <InlineNotification
          status="info"
          title="Update available"
          description="A new version of the app is ready to install."
          href="#"
          link-text="See what's new"
        />
        <InlineNotification
          plain
          status="info"
          title="Heads up"
          description="This sits on the page with no surface — just the colored icon chip."
        />
      </div>
    </section>

    <section class="visual-frame" data-visual="checkbox">
      <div class="visual-stack visual-stack--tight">
        <Checkbox label="Accept terms" checked />
        <Checkbox label="Subscribe to the newsletter" />
        <Checkbox label="Select all" checked="indeterminate" />
      </div>
    </section>

    <section class="visual-frame" data-visual="checkbox-group">
      <CheckboxGroup
        label="Notifications"
        :value="['email']"
        :items="[
          { value: 'email', label: 'Email' },
          { value: 'sms', label: 'SMS' },
          { value: 'push', label: 'Push', disabled: true },
        ]"
      />
    </section>

    <section class="visual-frame" data-visual="switch">
      <div class="visual-stack visual-stack--tight">
        <Switch label="Wi-Fi" checked />
        <Switch label="Bluetooth" />
        <Switch label="Airplane mode" disabled />
        <Switch label="Notifications" on-off checked />
        <Switch label="Auto-update" on-off />
      </div>
    </section>

    <section class="visual-frame" data-visual="radio-group">
      <RadioGroup
        label="Size"
        value="medium"
        :items="[{ value: 'small' }, { value: 'medium' }, { value: 'large' }]"
      />
    </section>

    <section class="visual-frame" data-visual="segmented-control">
      <div class="visual-segmented">
        <section>
          <p class="visual-caption">Bar (text)</p>
          <SegmentedControl
            label="View"
            value="list"
            :items="[
              { value: 'list', label: 'List' },
              { value: 'board', label: 'Board' },
              { value: 'calendar', label: 'Calendar' },
            ]"
          />
        </section>
        <section>
          <p class="visual-caption">Toolbar — icons only</p>
          <SegmentedControl label="Tools" icon-only value="home" :items="nav" />
        </section>
        <section>
          <p class="visual-caption">Bottom bar (mobile)</p>
          <div class="visual-bottombar">
            <SegmentedControl label="Sections" stacked value="home" :items="nav" />
          </div>
        </section>
        <section>
          <p class="visual-caption">Vertical — compact (label under icon)</p>
          <SegmentedControl
            label="Sections"
            orientation="vertical"
            stacked
            value="home"
            :items="nav"
          />
        </section>
        <section>
          <p class="visual-caption">Vertical — icons only</p>
          <SegmentedControl
            label="Sections"
            orientation="vertical"
            icon-only
            value="home"
            :items="nav"
          />
        </section>
      </div>
    </section>

    <section class="visual-frame" data-visual="slider">
      <div class="visual-stack visual-stack--narrow">
        <Slider :value="40" :min="0" :max="100" :step="5" label="Volume" show-value show-range />
        <Slider :value="60" :min="0" :max="100" label="Volume" show-value>
          <template #icon>
            <Icon>
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
            </Icon>
          </template>
        </Slider>
        <Slider :value="2" :min="0" :max="5" :step="1" label="Rating" ticks show-value show-range />
      </div>
    </section>

    <section class="visual-frame" data-visual="range-slider">
      <div class="visual-range">
        <RangeSlider
          :value="[20, 80]"
          :min="0"
          :max="100"
          :step="5"
          label="Price range"
          :thumb-labels="['Minimum price', 'Maximum price']"
          show-value
          show-range
        />
        <RangeSlider
          :value="[30, 70]"
          :min="0"
          :max="100"
          :min-distance="20"
          label="Temperature range"
          :thumb-labels="['Lowest temperature', 'Highest temperature']"
          :format="degrees"
          show-value
        />
        <RangeSlider
          :value="[2, 4]"
          :min="0"
          :max="5"
          :step="1"
          label="Rating range"
          :thumb-labels="['Lowest rating', 'Highest rating']"
          ticks
          show-value
          show-range
        >
          <template #icon>
            <Icon>
              <polygon
                points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
              />
            </Icon>
          </template>
        </RangeSlider>
        <RangeSlider
          :value="[30, 70]"
          :step="10"
          orientation="vertical"
          label="Volume range"
          :thumb-labels="['Minimum volume', 'Maximum volume']"
          ticks
          show-value
        />
        <div dir="rtl">
          <RangeSlider
            :value="[20, 80]"
            label="Budget range"
            :thumb-labels="['Minimum budget', 'Maximum budget']"
            show-value
            show-range
          />
        </div>
        <div class="visual-range__switch">
          <RangeSlider
            :value="[40, 60]"
            label="Brightness range"
            :thumb-labels="['Minimum brightness', 'Maximum brightness']"
          />
          <button type="button">Switch to vertical</button>
        </div>
      </div>
    </section>

    <section class="visual-frame" data-visual="rating-group">
      <RatingGroup :value="3" :max="5" label="Rating" />
    </section>

    <section class="visual-frame" data-visual="progress">
      <div class="visual-progress">
        <section>
          <p class="visual-progress__caption">Step completion — driven by the user</p>
          <div class="visual-progress__group">
            <Progress :value="0" :max="4" label="Onboarding steps" />
            <div class="visual-row">
              <Button>Complete “Account”</Button>
              <Button variant="ghost" disabled>Reset</Button>
            </div>
            <p class="visual-progress__note visual-progress__note--flush">0 of 4 steps completed</p>
          </div>
        </section>
        <section>
          <p class="visual-progress__caption">
            Gamification and analytics — a value against a reference
          </p>
          <div class="visual-progress__group visual-progress__group--loose">
            <div>
              <Progress :value="7" :max="10" label="Achievements unlocked" />
              <p class="visual-progress__note">7 of 10 achievements</p>
            </div>
            <div>
              <Progress :value="82" label="Profile completeness" />
              <p class="visual-progress__note">82% profile complete</p>
            </div>
          </div>
        </section>
        <section>
          <p class="visual-progress__caption">Circle — the same value as a ring</p>
          <div class="visual-progress__circles">
            <Progress shape="circle" :value="68" show-value label="Yearly goal" />
            <Progress shape="circle" :value="0" show-value label="Onboarding" />
          </div>
        </section>
      </div>
    </section>

    <section class="visual-frame" data-visual="meter">
      <div class="visual-meters">
        <Meter :value="72" label="Disk usage" :low="25" :high="80" />
        <Meter :value="92" label="Memory" :low="25" :high="80" />
        <Meter :value="12" label="Battery" :low="25" :high="80" />
      </div>
    </section>

    <section class="visual-frame" data-visual="text-field">
      <div class="visual-stack">
        <TextField
          label="Email"
          type="email"
          placeholder="you@example.com"
          description="We'll never share it."
        />
        <TextField label="Email" type="email" placeholder="you@example.com">
          <template #left>
            <Icon>
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <path d="m22 7-10 5L2 7" />
            </Icon>
          </template>
        </TextField>
        <TextField
          label="Email"
          type="email"
          value="not-an-email"
          error="Enter a valid email address."
        />
        <TextField
          label="Username"
          type="text"
          value="ada_lovelace"
          success="This username is available."
        />
      </div>
    </section>

    <section class="visual-frame" data-visual="select">
      <div class="visual-stack visual-stack--fill">
        <Select label="Fruit" value="banana" placeholder="Select a fruit…" :items="fruits" />
        <Select label="Team" width="fill" placeholder="Assign to…" :items="fruits" />
        <Select label="Country" width="fixed" placeholder="Choose a country…" :items="fruits" />
        <Select
          label="Payment method"
          required
          error="Choose a payment method to continue"
          placeholder="Choose…"
          :items="payments"
        />
      </div>
    </section>

    <section class="visual-frame" data-visual="pagination">
      <Pagination :page="3" :page-count="10" />
    </section>

    <section class="visual-frame" data-visual="avatar">
      <Avatar name="Ada Lovelace" />
      <Avatar name="Grace Hopper" :src="portrait" />
      <Avatar name="Alan Turing" shape="square" />
      <Avatar name="Ada Lovelace" size="lg" />
    </section>

    <section class="visual-frame" data-visual="label">
      <div class="visual-stack visual-stack--label">
        <Label for="visual-name" required>Full name</Label>
        <input
          id="visual-name"
          class="visual-native-input"
          type="text"
          placeholder="Ada Lovelace"
        />
      </div>
    </section>
  </main>
</template>
