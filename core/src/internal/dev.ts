/**
 * True in development builds: the bundler replaces `import.meta.env.DEV`, and
 * the test runner sets it. A build that defines nothing counts as production.
 */
export const DEV: boolean = (import.meta as { env?: { DEV?: boolean } }).env?.DEV === true;
