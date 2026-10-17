---
"@invisible-ui/core": minor
"@invisible-ui/elements": minor
"@invisible-ui/react": minor
"@invisible-ui/svelte": minor
"@invisible-ui/vue": minor
---

The core gains `uploadDropArea.acceptsFile(file, accept)` and
`uploadDropArea.splitFiles(files, { accept, multiple })`: the `accept`
attribute's format (extensions, media types and type families, without
case), and the split into the files an upload area takes and the ones it
leaves out, with the reason, `type` or `count`. The Flutter adapter answers
the same shared vectors.

Every Upload Drop Area filters picked and dropped files the same way. The
files it leaves out never reach `onFiles` (the `files` event in Elements) and
never join the form; they are reported to the new `onRejected` callback (the
`reject` event, with `detail.rejected`, in Elements) and named in an alert
under the area, with the hazard glyph, that the file input points at through
`aria-describedby`. A single-file area takes the first file that passes and
names the others. Dropped files the area takes still become the input's
files, so they submit and a form reset clears them. The filter is a
convenience: the app still validates what it receives.

React's drop filter, which dropped rejected files silently, gives way to the
core one, and React no longer has a local `acceptsFile`. In Vue the area
renders the message beside its label, so its attributes now go on the label
by hand.
