/**
 * Where an element mounts an overlay it builds outside its own subtree.
 *
 * A modal `<dialog>` sits in the top layer and makes the rest of the page
 * inert, so an overlay appended to `document.body` would render under the
 * dialog and ignore the pointer. Inside an open dialog the overlay mounts in
 * that dialog instead; elsewhere it mounts in the body.
 */
export function overlayRoot(host: Element): HTMLElement {
  return host.closest<HTMLElement>("dialog[open]") ?? host.ownerDocument.body;
}
