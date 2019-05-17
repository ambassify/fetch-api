const fetch = require('@ambassify/fetch');
const FetchApi = require('./core');

class BrowserFetchApi extends FetchApi {
    constructor(options = {}) {
        options.fetch = options.fetch || fetch;
        super(options);
    }
}

module.exports = BrowserFetchApi;
