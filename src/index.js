// OpenCrew entry point. Event-specific behavior lives in github.js and all
// policy decisions remain deterministic and testable.
import * as core from '@actions/core';
import * as github from '@actions/github';
import { loadConfig } from './config.js';
import { handleIssueComment, handlePullRequest, handleSchedule } from './github.js';
import { messagesFor } from './messages.js';

const run = async () => {
    const token = core.getInput('github-token', { required: true });
    const configPath = core.getInput('config-path') || '.github/opencrew.yml';
    const octokit = github.getOctokit(token);
    const config = await loadConfig(octokit, github.context.repo, configPath);
    const messages = messagesFor(config.language);
    const args = { octokit, context: github.context, config, messages };

    switch (github.context.eventName) {
        case 'issue_comment':
            await handleIssueComment(args);
            break;
        case 'pull_request':
        case 'pull_request_target':
            await handlePullRequest(args);
            break;
        case 'schedule':
        case 'workflow_dispatch':
            await handleSchedule(args);
            break;
        default:
            core.info(`OpenCrew has no handler for ${github.context.eventName}.`);
    }
};

run().catch((error) => core.setFailed(error instanceof Error ? error.message : String(error)));
