// Depending on bundler configuration we might be loading the ES6 version or the CJS version.
const Error = require('es6-error').default || require('es6-error');

class FetchApiError extends Error {}

class RequestFailedError extends FetchApiError {
    constructor(status, url, extra) {
        let msg = extra.message;

        if (!msg && status !== false)
            msg = `Request to ${url} failed with status ${status}`;
        else if (!msg)
            msg = `Request to ${url} failed`;

        super(msg);

        this.code = status || 0; // backwards compatible
        Object.assign(this, extra);
        this.url = url;
    }
}

module.exports = { FetchApiError, RequestFailedError };
