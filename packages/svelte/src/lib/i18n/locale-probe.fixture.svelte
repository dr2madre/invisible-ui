<script lang="ts">
  import { getI18n } from "./create-i18n";

  const { locale, dir } = getI18n();
</script>

<output data-dir={$dir}>{$locale}</output>
