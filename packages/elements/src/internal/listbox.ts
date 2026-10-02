/** The shape the listbox elements share: a value with an optional label. */
interface LabelledItem {
  value: string;
  label?: string;
}

/** The text an item shows: its label, else its value. */
export const labelOf = (item: LabelledItem): string => item.label ?? item.value;

/** Keep the items whose text contains the trimmed query, case-insensitively. */
export const defaultFilter = <T extends LabelledItem>(items: T[], query: string): T[] => {
  const q = query.trim().toLowerCase();
  if (!q) return items;
  return items.filter((item) => labelOf(item).toLowerCase().includes(q));
};
