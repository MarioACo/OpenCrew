// Integration-shaped tests exercise handlers against a small Octokit fake.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { handleIssueComment, handleSchedule } from '../src/github.js';
import { claimMarker } from '../src/policy.js';

const messages = {
    claimed: (user, days) => `assigned ${user} for ${days}`,
    alreadyClaimed: (user) => `already assigned to ${user}`,
    limitReached: (max) => `limit ${max}`,
    notEligible: 'not eligible',
    released: (user) => `released ${user}`,
    cannotRelease: (user) => `cannot release ${user}`,
    stale: (user, days) => `released ${user} after ${days}`,
};

const makeOctokit = ({ issues, commentsByIssue }) => {
    const calls = [];
    const listForRepo = () => {};
    const listComments = () => {};
    const octokit = {
        calls,
        paginate: async (method, args) => (
            method === listForRepo ? issues : commentsByIssue[args.issue_number]
        ),
        rest: {
            issues: {
                listForRepo,
                listComments,
                removeAssignees: async (args) => calls.push(['removeAssignees', args]),
                removeLabel: async (args) => calls.push(['removeLabel', args]),
                createComment: async (args) => calls.push(['createComment', args]),
                getLabel: async (args) => calls.push(['getLabel', args]),
                createLabel: async (args) => calls.push(['createLabel', args]),
                addAssignees: async (args) => calls.push(['addAssignees', args]),
                addLabels: async (args) => calls.push(['addLabels', args]),
            },
        },
    };
    return octokit;
};

const config = {
    claims: {
        enabled: true,
        inactivity_days: 7,
        claimed_label: 'opencrew:claimed',
    },
};

const claimConfig = {
    claims: {
        enabled: true,
        claim_command: '/claim',
        release_command: '/unclaim',
        max_per_user: 1,
        inactivity_days: 7,
        eligible_labels: ['good first issue'],
        claimed_label: 'opencrew:claimed',
        claimed_label_color: '7057ff',
    },
};

describe('handleIssueComment', () => {
    it('assigns an eligible unclaimed issue and records the claim marker', async () => {
        const octokit = makeOctokit({ issues: [], commentsByIssue: {} });
        const context = {
            repo: { owner: 'acme', repo: 'project' },
            payload: {
                issue: {
                    number: 7,
                    labels: [{ name: 'good first issue' }],
                    assignees: [],
                },
                comment: {
                    body: '/claim',
                    user: { login: 'octocat', type: 'User' },
                },
            },
        };

        await handleIssueComment({ octokit, context, config: claimConfig, messages });

        assert.deepEqual(octokit.calls.map(([name]) => name), [
            'getLabel',
            'addAssignees',
            'addLabels',
            'createComment',
        ]);
        const body = octokit.calls.at(-1)[1].body;
        assert.match(body, /assigned octocat/);
        assert.match(body, /opencrew:claim/);
    });

    it('does not assign a second issue after the configured limit', async () => {
        const octokit = makeOctokit({
            issues: [{ number: 6, assignees: [{ login: 'octocat' }] }],
            commentsByIssue: {},
        });
        const context = {
            repo: { owner: 'acme', repo: 'project' },
            payload: {
                issue: {
                    number: 7,
                    labels: [{ name: 'good first issue' }],
                    assignees: [],
                },
                comment: {
                    body: '/claim',
                    user: { login: 'octocat', type: 'User' },
                },
            },
        };

        await handleIssueComment({ octokit, context, config: claimConfig, messages });

        assert.deepEqual(octokit.calls.map(([name]) => name), ['createComment']);
        assert.equal(octokit.calls[0][1].body, 'limit 1');
    });
});

describe('handleSchedule', () => {
    it('releases a stale claim and removes its label', async () => {
        const octokit = makeOctokit({
            issues: [{ number: 12, assignees: [{ login: 'octocat' }] }],
            commentsByIssue: {
                12: [{
                    body: claimMarker('octocat', '2026-10-01T00:00:00.000Z'),
                    created_at: '2026-10-01T00:00:00.000Z',
                    user: { login: 'opencrew[bot]' },
                }],
            },
        });

        await handleSchedule({
            octokit,
            context: { repo: { owner: 'acme', repo: 'project' } },
            config,
            messages,
            now: new Date('2026-10-10T00:00:00.000Z'),
        });

        assert.deepEqual(octokit.calls.map(([name]) => name), [
            'removeAssignees',
            'createComment',
            'removeLabel',
        ]);
    });

    it('keeps the assignment and label when the claimant is active', async () => {
        const octokit = makeOctokit({
            issues: [{ number: 12, assignees: [{ login: 'octocat' }] }],
            commentsByIssue: {
                12: [
                    {
                        body: claimMarker('octocat', '2026-10-01T00:00:00.000Z'),
                        created_at: '2026-10-01T00:00:00.000Z',
                        user: { login: 'opencrew[bot]' },
                    },
                    {
                        body: 'Still working on this.',
                        created_at: '2026-10-08T00:00:00.000Z',
                        user: { login: 'octocat' },
                    },
                ],
            },
        });

        await handleSchedule({
            octokit,
            context: { repo: { owner: 'acme', repo: 'project' } },
            config,
            messages,
            now: new Date('2026-10-10T00:00:00.000Z'),
        });

        assert.deepEqual(octokit.calls, []);
    });
});
