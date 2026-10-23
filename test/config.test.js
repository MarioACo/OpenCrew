// Tests configuration defaults, overrides, and contributor-facing errors.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { parseConfig } from '../src/config.js';

describe('parseConfig', () => {
    it('returns conservative defaults for an empty file', () => {
        const config = parseConfig();
        assert.equal(config.language, 'en');
        assert.equal(config.claims.max_per_user, 1);
        assert.deepEqual(config.pull_requests.required_sections, []);
    });

    it('deep-merges project settings without dropping defaults', () => {
        const config = parseConfig(`
language: es
claims:
  inactivity_days: 14
pull_requests:
  allowed_base_branches: [dev]
`);
        assert.equal(config.language, 'es');
        assert.equal(config.claims.inactivity_days, 14);
        assert.equal(config.claims.claim_command, '/claim');
        assert.deepEqual(config.pull_requests.allowed_base_branches, ['dev']);
    });

    it('rejects invalid limits and unsupported languages', () => {
        assert.throws(() => parseConfig('language: fr'), /language/);
        assert.throws(() => parseConfig('claims:\n  max_per_user: 0'), /max_per_user/);
    });
});
