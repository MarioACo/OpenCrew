// Configuration loading and validation. Missing configuration is allowed so
// OpenCrew can start safely with conservative defaults.
import YAML from 'yaml';

export const DEFAULT_CONFIG = Object.freeze({
    language: 'en',
    claims: {
        enabled: true,
        claim_command: '/claim',
        release_command: '/unclaim',
        max_per_user: 1,
        inactivity_days: 7,
        eligible_labels: [],
        claimed_label: 'opencrew:claimed',
        claimed_label_color: '7057ff',
    },
    pull_requests: {
        enabled: true,
        require_issue_reference: true,
        allowed_base_branches: [],
        required_sections: [],
    },
    welcome: {
        enabled: true,
    },
});

const isRecord = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

const mergeConfig = (base, override) => {
    const result = structuredClone(base);
    for (const [key, value] of Object.entries(override || {})) {
        if (isRecord(value) && isRecord(result[key])) result[key] = mergeConfig(result[key], value);
        else result[key] = value;
    }
    return result;
};

const assertString = (value, path) => {
    if (typeof value !== 'string' || !value.trim()) throw new Error(`${path} must be a non-empty string`);
};

export const validateConfig = (config) => {
    if (!['en', 'es'].includes(config.language)) throw new Error('language must be "en" or "es"');
    assertString(config.claims.claim_command, 'claims.claim_command');
    assertString(config.claims.release_command, 'claims.release_command');
    assertString(config.claims.claimed_label, 'claims.claimed_label');
    if (!Number.isInteger(config.claims.max_per_user) || config.claims.max_per_user < 1) {
        throw new Error('claims.max_per_user must be a positive integer');
    }
    if (!Number.isInteger(config.claims.inactivity_days) || config.claims.inactivity_days < 1) {
        throw new Error('claims.inactivity_days must be a positive integer');
    }
    for (const [path, value] of [
        ['claims.eligible_labels', config.claims.eligible_labels],
        ['pull_requests.allowed_base_branches', config.pull_requests.allowed_base_branches],
        ['pull_requests.required_sections', config.pull_requests.required_sections],
    ]) {
        if (!Array.isArray(value) || value.some((item) => typeof item !== 'string' || !item.trim())) {
            throw new Error(`${path} must be an array of non-empty strings`);
        }
    }
    return config;
};

export const parseConfig = (source = '') => {
    const parsed = source.trim() ? YAML.parse(source) : {};
    if (!isRecord(parsed)) throw new Error('OpenCrew configuration must be a YAML object');
    return validateConfig(mergeConfig(DEFAULT_CONFIG, parsed));
};

export const loadConfig = async (octokit, repo, path) => {
    try {
        const response = await octokit.rest.repos.getContent({ ...repo, path });
        if (Array.isArray(response.data) || response.data.type !== 'file') {
            throw new Error(`${path} is not a file`);
        }
        return parseConfig(Buffer.from(response.data.content, 'base64').toString('utf8'));
    } catch (error) {
        if (error.status === 404) return parseConfig();
        throw error;
    }
};
