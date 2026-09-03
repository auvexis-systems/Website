# STRATO Production Deployment

The Auvexis Systems website is deployed through the GitHub Actions workflow:

`.github/workflows/deploy-strato.yml`

## Safety model

A push to `main` does **not** deploy the website.

Production deployment only starts when a user manually runs the workflow and selects:

- `deploy-production`
- confirmation text exactly: `DEPLOY AUVEXIS`

The workflow then:

1. installs dependencies,
2. runs TypeScript typecheck,
3. performs a clean production build,
4. uploads the build as a GitHub artifact,
5. downloads the current STRATO webroot as a backup,
6. stores the backup as a GitHub Actions artifact,
7. mirrors `dist/` to STRATO over SFTP,
8. runs live HTTP checks.

A `validate-only` run performs build/typecheck without touching STRATO.

## Required GitHub Actions secrets

Configure these in:

Repository → Settings → Secrets and variables → Actions

Required repository secrets:

- `STRATO_HOST`
- `STRATO_USER`
- `STRATO_PASSWORD`
- `STRATO_REMOTE_PATH`

The current workflow uses SFTP port 22.

Do not commit STRATO credentials to the repository.

## Production environment

The deploy job uses the GitHub environment named:

`production`

For an additional approval layer, configure protection rules for that environment in GitHub repository settings if available for the account/repository.

## Important remote-path rule

`STRATO_REMOTE_PATH` must point to the exact webroot used by `auvexissystems.de`.

Do not guess this value. Confirm it in STRATO before the first production run.

The deploy uses `--delete`, so files in the configured remote path that are not present in the built `dist/` directory will be removed after the backup is successfully captured.

## First production deployment

Before the first production deploy:

1. confirm the STRATO SFTP login,
2. confirm the exact domain webroot,
3. configure the four GitHub secrets,
4. run the workflow once with `validate-only`,
5. inspect the successful build,
6. only then run `deploy-production`.

## Rollback

Every production run captures the previous webroot as an artifact named:

`auvexis-live-backup-<run-id>`

If rollback is required, download that backup and restore its contents to the same STRATO webroot.

## Worker rule

AI workers may prepare, test, commit and push website changes.

They must not trigger a production deployment without explicit owner approval.
