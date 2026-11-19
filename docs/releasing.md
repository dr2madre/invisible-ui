# Publishing the alpha packages

Invisible UI publishes five public npm packages together under the `alpha`
dist-tag:

- `@nozcadesign/invisible-ui-core`
- `@nozcadesign/invisible-ui-svelte`
- `@nozcadesign/invisible-ui-vue`
- `@nozcadesign/invisible-ui-react`
- `@nozcadesign/invisible-ui-elements`

They remain prereleases until the manual accessibility programme and API
candidate review are complete. Do not assign these versions to npm's `latest`
tag.

## One-time npm setup

1. Create or sign in to an npm account and enable two-factor authentication.
2. Confirm that the publishing account is an owner or maintainer of the
   `nozcadesign` npm organisation.
3. Authenticate the local npm client with `npm login` and complete the
   interactive two-factor challenge.

Never commit an npm token or place it in a project `.npmrc`.

## First alpha release

1. From a clean release branch based on `main`, run `pnpm changeset version`.
2. Review the generated versions and changelogs. The versions must remain
   prereleases such as `0.1.0-alpha.1`.
3. Run `pnpm release:check`. It runs the full non-browser gate, builds all five
   packages, installs their tarballs in external consumers and performs a
   dry-run publish.
4. Commit and merge the version changes, then run `pnpm release` from that exact
   commit. Complete any interactive two-factor challenge. The command publishes
   with the `alpha` dist-tag.
5. Verify each package with
   `npm view @nozcadesign/invisible-ui-PACKAGE dist-tags` and install it in a
   clean application using `@alpha`.

Example:

```sh
pnpm add @nozcadesign/invisible-ui-elements@alpha
pnpm add @nozcadesign/invisible-ui-react@alpha
```

## Optional future automation

If GitHub-hosted Actions become available, configure npm trusted publishing
separately for all five packages:

- provider: GitHub Actions
- GitHub owner: `dr2madre`
- repository: `invisible-ui`
- workflow filename: `release.yml`
- allowed actions: publish and dist-tag management

GitHub-hosted runners and the workflow's `id-token: write` permission provide
short-lived OIDC credentials and npm provenance. Do not add a long-lived npm
token merely to automate a release that can be published interactively.

## Rollback and correction

npm versions are immutable. Never try to overwrite a faulty version. Publish a
new alpha patch, move the `alpha` dist-tag to it, and deprecate the faulty
version with a message that names the replacement. Do not unpublish a version
unless it exposes a secret or creates another exceptional security problem.
