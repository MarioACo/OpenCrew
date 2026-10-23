# Contributing to OpenCrew

Thank you for helping make open-source contribution workflows friendlier.

## Good contributions

- Add or improve a locale in `src/messages.js`.
- Add a deterministic policy helper with tests.
- Improve setup examples for a real project workflow.
- Report a GitHub API edge case with a reproducible payload.
- Improve accessibility and documentation.

## Development

1. Fork and clone the repository.
2. Run `npm install`.
3. Create a focused branch.
4. Add tests for behavior changes.
5. Run `npm run check`.
6. Open a pull request that references an issue.

OpenCrew does not use AI to judge contributor intent or code quality. New policies must be explainable from repository metadata and produce an actionable result.

## Security boundary

Handlers for `pull_request_target` must never check out, import, or execute files from the pull request branch. See [`SECURITY.md`](SECURITY.md) for private reporting.
