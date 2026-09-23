// Which declaration errors a consumer check is entitled to fail on.
//
// The consumer compiles against the packed packages with `skipLibCheck` off,
// because the declarations this repository ships are the point of the check.
// That setting reaches every dependency's declarations too, and a dependency
// that ships declarations which do not survive `nodenext` resolution is not
// this repository's to fix: it fails no consumer, who has no reason to turn
// the same setting on. So the verdict comes from these lines, not from the
// compiler's exit code.

/** A tsc diagnostic line in a package this repository publishes. */
const OURS = "node_modules/@design-system/";

/** The consumer's own file: it imports every advertised entry point. */
const CONSUMER = "types.ts(";

/**
 * The diagnostic lines this repository answers for.
 *
 * @param {string} output tsc's output, however many lines it holds
 * @returns {string[]} the lines in what we ship, or in the file importing it
 */
export const ourDeclarationErrors = (output) =>
  String(output)
    .split("\n")
    .filter((line) => line.includes(OURS) || line.startsWith(CONSUMER));
