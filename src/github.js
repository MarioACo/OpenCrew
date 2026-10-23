// GitHub event handlers. They only read metadata and write issue/PR comments;
// pull request code is never checked out or executed.
import * as core from '@actions/core';
import { parseIssueCommand } from './commands.js';
import {
    claimMarker,
    hasEligibleLabel,
    isInactive,
    latestClaimActivity,
    validatePullRequest,
} from './policy.js';

const STICKY_MARKER = '<!-- opencrew:pr-check -->';

const comment = (octokit, repo, issueNumber, body) => octokit.rest.issues.createComment({
    ...repo,
    issue_number: issueNumber,
    body,
});

const ensureClaimLabel = async (octokit, repo, config) => {
    try {
        await octokit.rest.issues.getLabel({ ...repo, name: config.claimed_label });
    } catch (error) {
        if (error.status !== 404) throw error;
        await octokit.rest.issues.createLabel({
            ...repo,
            name: config.claimed_label,
            color: config.claimed_label_color,
            description: 'Issue currently claimed through OpenCrew',
        });
    }
};

const removeClaimLabel = async (octokit, repo, issueNumber, label) => {
    try {
        await octokit.rest.issues.removeLabel({ ...repo, issue_number: issueNumber, name: label });
    } catch (error) {
        if (error.status !== 404) throw error;
    }
};

export const handleIssueComment = async ({ octokit, context, config, messages }) => {
    const { issue, comment: issueComment } = context.payload;
    if (!config.claims.enabled || issue.pull_request || issueComment.user?.type === 'Bot') return;

    const command = parseIssueCommand(issueComment.body, config.claims);
    if (!command) return;

    const repo = context.repo;
    const issueNumber = issue.number;
    const user = issueComment.user.login;
    const assignees = issue.assignees || [];

    if (command === 'release') {
        if (!assignees.some((assignee) => assignee.login === user)) {
            await comment(octokit, repo, issueNumber, messages.cannotRelease(user));
            return;
        }
        await octokit.rest.issues.removeAssignees({ ...repo, issue_number: issueNumber, assignees: [user] });
        if (assignees.length === 1) await removeClaimLabel(octokit, repo, issueNumber, config.claims.claimed_label);
        await comment(octokit, repo, issueNumber, messages.released(user));
        return;
    }

    if (!hasEligibleLabel(issue.labels || [], config.claims.eligible_labels)) {
        await comment(octokit, repo, issueNumber, messages.notEligible);
        return;
    }
    if (assignees.length) {
        await comment(octokit, repo, issueNumber, messages.alreadyClaimed(assignees[0].login));
        return;
    }

    const heldIssues = await octokit.paginate(octokit.rest.issues.listForRepo, {
        ...repo,
        state: 'open',
        assignee: user,
        labels: config.claims.claimed_label,
        per_page: 100,
    });
    if (heldIssues.filter((held) => !held.pull_request).length >= config.claims.max_per_user) {
        await comment(octokit, repo, issueNumber, messages.limitReached(config.claims.max_per_user));
        return;
    }

    await ensureClaimLabel(octokit, repo, config.claims);
    await octokit.rest.issues.addAssignees({ ...repo, issue_number: issueNumber, assignees: [user] });
    await octokit.rest.issues.addLabels({ ...repo, issue_number: issueNumber, labels: [config.claims.claimed_label] });
    await comment(
        octokit,
        repo,
        issueNumber,
        `${messages.claimed(user, config.claims.inactivity_days)}\n\n${claimMarker(user)}`,
    );
};

export const handleSchedule = async ({ octokit, context, config, messages, now = new Date() }) => {
    if (!config.claims.enabled) return;
    const repo = context.repo;
    const issues = await octokit.paginate(octokit.rest.issues.listForRepo, {
        ...repo,
        state: 'open',
        labels: config.claims.claimed_label,
        per_page: 100,
    });

    for (const issue of issues.filter((item) => !item.pull_request && item.assignees?.length)) {
        const comments = await octokit.paginate(octokit.rest.issues.listComments, {
            ...repo,
            issue_number: issue.number,
            per_page: 100,
        });
        let remainingAssignees = issue.assignees.length;
        for (const assignee of issue.assignees) {
            const lastActivity = latestClaimActivity(assignee.login, comments);
            if (!isInactive(lastActivity, config.claims.inactivity_days, now)) continue;
            await octokit.rest.issues.removeAssignees({
                ...repo,
                issue_number: issue.number,
                assignees: [assignee.login],
            });
            remainingAssignees -= 1;
            await comment(octokit, repo, issue.number, messages.stale(assignee.login, config.claims.inactivity_days));
        }
        if (remainingAssignees === 0) {
            await removeClaimLabel(octokit, repo, issue.number, config.claims.claimed_label);
        }
    }
};

const upsertPrStatus = async (octokit, repo, issueNumber, body) => {
    const comments = await octokit.paginate(octokit.rest.issues.listComments, {
        ...repo,
        issue_number: issueNumber,
        per_page: 100,
    });
    const previous = comments.find((item) => item.user?.type === 'Bot' && item.body?.includes(STICKY_MARKER));
    if (previous) {
        await octokit.rest.issues.updateComment({ ...repo, comment_id: previous.id, body });
    } else {
        await comment(octokit, repo, issueNumber, body);
    }
};

export const handlePullRequest = async ({ octokit, context, config, messages }) => {
    if (!config.pull_requests.enabled) return;
    const pullRequest = context.payload.pull_request;
    const failures = validatePullRequest(pullRequest, config.pull_requests);
    const lines = failures.length
        ? failures.map((failure) => `- ❌ ${failure}`)
        : [`- ✅ ${messages.prPassed}`];
    const statusBody = `${STICKY_MARKER}\n## OpenCrew contribution check\n\n${lines.join('\n')}\n\n<sub>This comment updates when the pull request changes.</sub>`;
    await upsertPrStatus(octokit, context.repo, pullRequest.number, statusBody);

    if (config.welcome.enabled && context.payload.action === 'opened') {
        const author = pullRequest.user.login;
        const result = await octokit.rest.search.issuesAndPullRequests({
            q: `repo:${context.repo.owner}/${context.repo.repo} is:pr author:${author}`,
            per_page: 1,
        });
        if (result.data.total_count <= 1) await comment(octokit, context.repo, pullRequest.number, messages.welcome(author));
    }

    if (failures.length) core.setFailed(`OpenCrew found ${failures.length} contribution policy failure(s).`);
};
