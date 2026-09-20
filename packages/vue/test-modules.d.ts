// The scroll-lock test imports its module twice, once with a `?copy` query,
// to get a second instance with its own state. Vite resolves the query to the
// same file; TypeScript needs to be told the same.
declare module "*scroll-lock?copy" {
  export const lockScroll: (typeof import("./src/internal/scroll-lock"))["lockScroll"];
}
