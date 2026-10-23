// Tests PR policy, claim eligibility, and inactivity calculations.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
    claimMarker,
    hasEligibleLabel,
    isInactive,
    latestClaimActivity,
    readClaimMarker,
    validatePullRequest,
} from '../src/policy.js';

describe('validatePullRequest', () => {
    const config = {
        allowed_base_branches: ['dev'],
        require_issue_reference: true,
        required_sections: ['What & why', 'Checklist'],
    };

    it('accepts a focused description that follows project policy', () => {
        const failures = validatePullRequest({
            base: { ref: 'dev' },
            body: '## What & why\n\nClaimed in #42.\n\n## Checklist\n\n- [x] Tested',
        }, config);
        assert.deepEqual(failures, []);
    });

    it('reports each missing requirement', () => {
        const failures = validatePullRequest({ base: { ref: 'main' }, body: '' }, config);
        assert.equal(failures.length, 4);
        assert.match(failures[0], /main/);
    });
});

describe('claim policy', () => {
    it('matches any configured eligible label', () => {
        assert.equal(hasEligibleLabel([{ name: 'bug' }, { name: 'good first issue' }], ['help wanted', 'good first issue']), true);
        assert.equal(hasEligibleLabel([{ name: 'bug' }], ['good first issue']), false);
        assert.equal(hasEligibleLabel([], []), true);
    });

    it('round-trips hidden claim markers', () => {
        const marker = claimMarker('octocat', '2026-10-01T00:00:00.000Z');
        assert.deepEqual(readClaimMarker(marker), {
            user: 'octocat',
            claimedAt: '2026-10-01T00:00:00.000Z',
        });
    });

    it('uses the claimant latest comment as activity', () => {
        const comments = [
            {
                body: claimMarker('octocat', '2026-10-01T00:00:00.000Z'),
                created_at: '2026-10-01T00:00:00.000Z',
                user: { login: 'opencrew[bot]' },
            },
            { body: 'Progress update', created_at: '2026-10-05T00:00:00.000Z', user: { login: 'octocat' } },
            { body: 'Maintainer reply', created_at: '2026-10-06T00:00:00.000Z', user: { login: 'maintainer' } },
        ];
        assert.equal(latestClaimActivity('octocat', comments), '2026-10-05T00:00:00.000Z');
        assert.equal(isInactive('2026-10-05T00:00:00.000Z', 7, new Date('2026-10-13T00:00:00.000Z')), true);
        assert.equal(isInactive('2026-10-05T00:00:00.000Z', 10, new Date('2026-10-13T00:00:00.000Z')), false);
    });
});
