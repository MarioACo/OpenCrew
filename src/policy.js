// Pure policy helpers are kept independent from GitHub so projects can add
// rules without having to mock the API.
const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const validatePullRequest = (pullRequest, config) => {
    const failures = [];
    const body = pullRequest.body || '';

    if (config.allowed_base_branches.length && !config.allowed_base_branches.includes(pullRequest.base.ref)) {
        failures.push(`Base branch \`${pullRequest.base.ref}\` is not allowed.`);
    }
    if (config.require_issue_reference && !/(?:^|\s)#\d+\b/m.test(body)) {
        failures.push('The description must reference an issue, for example `#123`.');
    }
    for (const section of config.required_sections) {
        const heading = new RegExp(`^#{1,6}\\s+${escapeRegExp(section)}\\s*$`, 'im');
        if (!heading.test(body)) failures.push(`Missing required section: \`${section}\`.`);
    }
    return failures;
};

export const hasEligibleLabel = (issueLabels, eligibleLabels) => {
    if (!eligibleLabels.length) return true;
    const names = new Set(issueLabels.map((label) => (typeof label === 'string' ? label : label.name)));
    return eligibleLabels.some((label) => names.has(label));
};

export const claimMarker = (user, claimedAt = new Date().toISOString()) => (
    `<!-- opencrew:claim ${JSON.stringify({ user, claimedAt })} -->`
);

export const readClaimMarker = (body) => {
    const match = String(body || '').match(/<!-- opencrew:claim (\{.*?\}) -->/);
    if (!match) return null;
    try {
        const marker = JSON.parse(match[1]);
        if (typeof marker.user !== 'string' || Number.isNaN(Date.parse(marker.claimedAt))) return null;
        return marker;
    } catch {
        return null;
    }
};

export const latestClaimActivity = (user, comments) => {
    const markers = comments
        .map((comment) => ({ comment, marker: readClaimMarker(comment.body) }))
        .filter(({ marker }) => marker?.user === user)
        .sort((a, b) => Date.parse(b.marker.claimedAt) - Date.parse(a.marker.claimedAt));
    if (!markers.length) return null;

    const claimedAt = markers[0].marker.claimedAt;
    return comments
        .filter((comment) => comment.user?.login === user && Date.parse(comment.created_at) >= Date.parse(claimedAt))
        .reduce((latest, comment) => (
            Date.parse(comment.created_at) > Date.parse(latest) ? comment.created_at : latest
        ), claimedAt);
};

export const isInactive = (lastActivity, inactivityDays, now = new Date()) => {
    if (!lastActivity) return false;
    const cutoff = now.getTime() - inactivityDays * 24 * 60 * 60 * 1000;
    return Date.parse(lastActivity) < cutoff;
};
