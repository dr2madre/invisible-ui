/** What the accept filter reads of a file: a `File` qualifies. */
export interface UploadFileInfo {
  /** The file name, with its extension. */
  name: string;
  /** The media type, such as `image/png`; empty when the platform did not say. */
  type: string;
}

/** Why an upload area left a file out. */
export type UploadRejectReason =
  /** Its type is not in the accept list. */
  | "type"
  /** The area takes one file and another came first. */
  | "count";

/** A file an upload area left out, and why. */
export interface UploadRejection<F extends UploadFileInfo = File> {
  file: F;
  reason: UploadRejectReason;
}

/**
 * Whether a file matches an `accept` list, the format of the file input's
 * `accept` attribute: comma-separated extensions (`.pdf`), media types
 * (`application/pdf`) and type families (`image/*`), without case. An empty
 * or missing list accepts every file. A file with no type matches by
 * extension only. This is a convenience filter, not validation: the app
 * still checks what it receives.
 */
export function acceptsFile(file: UploadFileInfo, accept: string | null | undefined): boolean {
  const tokens = (accept ?? "")
    .split(",")
    .map((token) => token.trim().toLowerCase())
    .filter(Boolean);
  if (tokens.length === 0) return true;
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();
  return tokens.some((token) => {
    if (token.startsWith(".")) return name.endsWith(token);
    if (!type) return false;
    return token.endsWith("/*") ? type.startsWith(token.slice(0, -1)) : type === token;
  });
}

/**
 * Split picked or dropped files into the ones an area takes and the ones it
 * leaves out: the type must match `accept`, and without `multiple` only the
 * first matching file is taken.
 */
export function splitFiles<F extends UploadFileInfo>(
  files: Iterable<F>,
  { accept, multiple = false }: { accept?: string | null; multiple?: boolean } = {},
): { accepted: F[]; rejected: UploadRejection<F>[] } {
  const accepted: F[] = [];
  const rejected: UploadRejection<F>[] = [];
  for (const file of files) {
    if (!acceptsFile(file, accept)) rejected.push({ file, reason: "type" });
    else if (!multiple && accepted.length > 0) rejected.push({ file, reason: "count" });
    else accepted.push(file);
  }
  return { accepted, rejected };
}
