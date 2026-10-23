# Security policy

Please do not open public issues for vulnerabilities that could expose repository tokens, bypass claim limits, or execute untrusted pull request code.

Until a private security advisory channel is configured, contact the maintainer through the email listed on the GitHub profile and include "OpenCrew security" in the subject. Do not include real credentials or tokens in the report.

OpenCrew's central security invariant is that `pull_request_target` handlers inspect GitHub metadata only. They must never check out or execute contributor-controlled code.
