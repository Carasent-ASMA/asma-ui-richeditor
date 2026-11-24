# Workflow notes

## Current workflows

- `pull-request.yml` — runs `pnpm build` and then `pnpm test` (including the ASMA-9047 `dist/style.css` guard) on every pull request.
- `publish.yml` — publishes the package on pushes to `master`.

## Retired

`azure-pipeline-pull-request-validation.yaml` was deleted in ASMA-9048. It was an Azure DevOps pull-request validation pipeline (`trigger: none`) using Node 16 and yarn; its only PR gate checked that a `.changeset/*.md` file exists. It never ran the test suite, so it did not enforce the ASMA-9047 `dist/style.css` guard.

It is replaced by `.github/workflows/pull-request.yml`.

The changeset-existence check was deliberately not ported. `azure-pipeline.yaml` continues to handle changesets on master.
