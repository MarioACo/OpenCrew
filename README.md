# OpenCrew

[Documentación en español](docs/README.es.md)

OpenCrew is a transparent GitHub Action for welcoming, assigning, and guiding open-source contributors.

It combines the repetitive contributor workflow that maintainers otherwise rebuild with several bots:

- `/claim` and `/unclaim` issue commands;
- one active beginner issue per contributor (configurable);
- automatic release after inactivity;
- first-pull-request welcomes;
- pull request checks for issue references, base branches, and required sections;
- English and Spanish messages;
- deterministic rules with no AI and no contributor code execution.

> OpenCrew is in early development. Use the `v0.1.0` preview release or pin a
> full commit SHA when testing it in a security-sensitive repository.

## How it works

OpenCrew reacts to GitHub metadata events. It never checks out or executes pull request code, including when used with `pull_request_target`.

1. Copy [`examples/opencrew.yml`](examples/opencrew.yml) to `.github/opencrew.yml`.
2. Copy [`examples/workflow.yml`](examples/workflow.yml) to `.github/workflows/opencrew.yml`.
3. Adjust the workflow permissions and policy for your project.

The example uses the `MarioACo/OpenCrew@v0.1.0` preview release.
Security-sensitive repositories should pin the action to a full commit SHA.

Minimal policy:

```yaml
language: en

claims:
  max_per_user: 1
  inactivity_days: 7
  eligible_labels: [good first issue, help wanted]

pull_requests:
  require_issue_reference: true
  allowed_base_branches: [main]
  required_sections: [What & why, Checklist]
```

## Events and permissions

| Event | Purpose | Permission |
| --- | --- | --- |
| `issue_comment` | `/claim` and `/unclaim` | `issues: write` |
| `pull_request_target` | welcome and policy status | `pull-requests: write`, `issues: write` |
| `schedule` | release inactive claims | `issues: write` |
| `workflow_dispatch` | manually run stale-claim cleanup | `issues: write` |

## Local development

```bash
npm install
npm test
npm run build
```

The compiled `dist/` directory is committed because GitHub Actions executes it directly.

## Contributing

OpenCrew is designed to be extended through small contributions: policies, locales, tests, documentation, and integrations. Read [`CONTRIBUTING.md`](CONTRIBUTING.md) before opening a pull request.

## License

[MIT](LICENSE)
