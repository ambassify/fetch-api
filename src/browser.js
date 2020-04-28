const createFetch = require('./fetch');
const FetchApi = require('./core');

class BrowserFetchApi extends FetchApi {
    constructor(options = {}) {
        options.fetch = createFetch(options);
        super(options);
    }
}

module.exports = BrowserFetchApi;
