// Issue commands intentionally accept only a command on the first non-empty
// line. This avoids triggering assignments from quoted examples or prose.
export const parseIssueCommand = (body, claimsConfig) => {
    const firstLine = String(body || '')
        .split(/\r?\n/)
        .map((line) => line.trim())
        .find(Boolean);

    if (firstLine === claimsConfig.claim_command) return 'claim';
    if (firstLine === claimsConfig.release_command) return 'release';
    return null;
};
