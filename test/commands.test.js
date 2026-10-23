// Tests the deliberately strict issue-command parser.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { parseIssueCommand } from '../src/commands.js';

const config = { claim_command: '/claim', release_command: '/unclaim' };

describe('parseIssueCommand', () => {
    it('accepts a command on the first non-empty line', () => {
        assert.equal(parseIssueCommand('\n /claim \nI would like this one.', config), 'claim');
        assert.equal(parseIssueCommand('/unclaim', config), 'release');
    });

    it('ignores prose, arguments, and quoted examples', () => {
        assert.equal(parseIssueCommand('Can I /claim this?', config), null);
        assert.equal(parseIssueCommand('/claim please', config), null);
        assert.equal(parseIssueCommand('Example:\n/claim', config), null);
    });
});
