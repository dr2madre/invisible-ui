# Publishing the alpha packages

Invisible UI publishes five public npm packages together under the `alpha`
dist-tag:

- `@invisible-ui/core`
- `@invisible-ui/svelte`
- `@invisible-ui/vue`
- `@invisible-ui/react`
- `@invisible-ui/elements`

They remain prereleases until the manual accessibility programme and API
candidate review are complete. Do not assign these versions to npm's `latest`
tag.

## One-time npm setup

1. Create or sign in to an npm account and enable two-factor authentication.
2. Create the `invisible-ui` npm organisation using the public-packages plan.
3. Confirm that the publishing account can write packages in that scope.
4. Create a short-lived granular token with write access to the scope and add it
   to the GitHub repository as `NPM_TOKEN`. It is needed only to bootstrap the
   first publication because npm cannot configure a trusted publisher for a
   package that does not exist yet.
5. Enable GitHub Actions to create pull requests in the repository settings.

Never commit an npm token or place it in a project `.npmrc`.

## First alpha release

1. Run the **Release** workflow manually. With pending changesets it opens a
   `Version Packages` pull request and does not publish.
2. Review and merge that pull request. The versions must remain prereleases such
   as `0.1.0-alpha.1`.
3. Run the **Release** workflow again. It runs the full non-browser gate, builds
   all five packages, installs their tarballs in external consumers, performs a
   dry-run publish and publishes them with the `alpha` dist-tag.
4. Verify each package with `npm view @invisible-ui/PACKAGE dist-tags` and install
   it in a clean application using `@alpha`.

Example:

```sh
pnpm add @invisible-ui/elements@alpha
pnpm add @invisible-ui/react@alpha
```

## Replace the bootstrap token

After the first release, configure npm trusted publishing separately for all
five packages:

- provider: GitHub Actions
- GitHub owner: `dr2madre`
- repository: `invisible-ui`
- workflow filename: `release.yml`
- allowed actions: publish and dist-tag management

Run one release through trusted publishing, then delete the `NPM_TOKEN` secret
and revoke the bootstrap token on npm. GitHub-hosted runners and the workflow's
`id-token: write` permission provide short-lived OIDC credentials and npm
provenance.

## Rollback and correction

npm versions are immutable. Never try to overwrite a faulty version. Publish a
new alpha patch, move the `alpha` dist-tag to it, and deprecate the faulty
version with a message that names the replacement. Do not unpublish a version
unless it exposes a secret or creates another exceptional security problem.
