<script lang="ts">
  import Checkbox from "./checkbox/Checkbox.svelte";
  import type { CheckedState } from "./checkbox/create-checkbox";
  import CheckboxGroup from "./checkbox-group/CheckboxGroup.svelte";
  import Radio from "./radio/Radio.svelte";
  import RadioGroup from "./radio-group/RadioGroup.svelte";
  import RatingGroup from "./rating-group/RatingGroup.svelte";
  import SegmentedControl from "./segmented-control/SegmentedControl.svelte";
  import Select from "./select/Select.svelte";
  import Slider from "./slider/Slider.svelte";
  import Switch from "./switch/Switch.svelte";
  import TextField from "./text-field/TextField.svelte";
  import ToggleButton from "./toggle-button/ToggleButton.svelte";

  // Controlled parents in their plainest form: whatever a control reports
  // comes straight back down as its prop. Through the callbacks, not bind:
  // most controls never assign their own prop, so a binding carries nothing.
  let text = "Ada";
  let checked: CheckedState = false;
  let on = true;
  let pressed = false;
  let slider = 30;
  let selected: string | null = "pear";
  let radio: string | null = "a";
  let boxes: string[] = ["a"];
  let sortedBoxes: string[] = ["b"];
  let segment: string | null = "a";
  let stars: number | null = 2;
  let lone = true;

  const fruit = [
    { value: "apple", label: "Apple" },
    { value: "pear", label: "Pear" },
  ];
  const ab = [{ value: "a" }, { value: "b" }];
</script>

<form data-testid="echo-form">
  <TextField label="Text" name="text" value={text} onValueChange={(v) => (text = v)} />
  <Checkbox label="Check" name="check" {checked} onCheckedChange={(v) => (checked = v)} />
  <Switch label="Switch" name="switch" checked={on} onCheckedChange={(v) => (on = v)} />
  <ToggleButton label="Toggle" name="toggle" {pressed} onPressedChange={(v) => (pressed = v)}
    >Toggle</ToggleButton
  >
  <Slider
    label="Slide"
    name="slide"
    value={slider}
    onValueChange={(v) => (slider = v)}
    min={0}
    max={100}
  />
  <Select
    label="Fruit"
    name="fruit"
    value={selected}
    items={fruit}
    onValueChange={(v) => (selected = v)}
  />
  <RadioGroup
    label="Group"
    name="group"
    value={radio}
    items={ab}
    onValueChange={(v) => (radio = v)}
  />
  <CheckboxGroup
    label="Boxes"
    name="boxes"
    value={boxes}
    items={ab}
    onValueChange={(v) => (boxes = v)}
  />
  <SegmentedControl
    label="Segment"
    name="segment"
    value={segment}
    items={ab}
    onValueChange={(v) => (segment = v)}
  />
  <RatingGroup label="Stars" name="stars" value={stars} onValueChange={(v) => (stars = v)} />
  <Radio name="lone" value="x" checked={lone} label="Lone X" onChange={() => (lone = true)} />
  <Radio name="lone" value="y" checked={!lone} label="Lone Y" onChange={() => (lone = false)} />
</form>

<!-- A normalizing parent: it echoes the reported selection back sorted, which
     is ordinary and must still count as a give-back. -->
<form data-testid="sorted-echo-form">
  <CheckboxGroup
    label="Sorted"
    name="sorted"
    value={sortedBoxes}
    items={ab}
    onValueChange={(next) => (sortedBoxes = [...next].sort())}
  />
</form>
