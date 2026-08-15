<script setup lang="ts">
// End-to-end harness for the Vue adapter. It stays minimal on purpose: the
// browser tests need real Vue components and stable names, not a showcase.
import { Button, Popover } from "@design-system/vue";
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
</style>
