const _fetch = require('@ambassify/fetch');
const FetchQueued = require('@ambassify/fetch-queued');
const fetchRetried = require('@ambassify/fetch-retried');

const queuedGroups = {};

function getFetchQueuedGroup(concurrency, fetch) {
    const { group, size, merge = 'min' } = concurrency;

    if (!group)
        return new FetchQueued(size, { fetch }).fetch;

    if (!queuedGroups[group]) {
        queuedGroups[group] = new FetchQueued(size, { fetch });
    }

    const instance = queuedGroups[group];

    if (Math[merge]) {
        const newSize = Math[merge](instance.size, size);
        instance.resize(newSize);
    }

    return instance.fetch;
}

function getConcurrencyConfig(concurrency) {
    if (typeof concurrency === 'number')
        concurrency = { size: concurrency };

    if (!concurrency || !concurrency.size)
        return false;

    return concurrency;
}

function getRetryConfig(retry) {
    if (typeof retry === 'number')
        retry = { retries: retry };

    if (!retry || typeof retry !== 'object')
        return false;

    return retry;
}

function createFetch(options = {}) {
    let fetch = options.fetch || _fetch;
    const retry = getRetryConfig(options.retry);
    const concurrency = getConcurrencyConfig(options.concurrency);

    if (concurrency)
        fetch = getFetchQueuedGroup(concurrency, fetch);

    if (retry)
        fetch = fetchRetried({ ...retry, fetch });

    return fetch;


}

module.exports = createFetch;
