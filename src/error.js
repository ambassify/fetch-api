const Error = require('es6-error');

class FetchApiError extends Error {}

class RequestFailedError extends FetchApiError {
    constructor(code, url, extra) {
        const msg = extra.message || `Request to ${url} failed with: ${code}`;
        super(msg);

        Object.assign(this, extra);
        this.code = code;
        this.url = url;
    }
}

module.exports = { FetchApiError, RequestFailedError };
