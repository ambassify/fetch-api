const createFetch = require('./fetch');
const FetchApi = require('./core');

FetchApi.defineContentType('JSON', require('./content-type/json'));
FetchApi.defineContentType('FORM', require('./content-type/x-www-form-urlencoded'));

class NodeFetchApi extends FetchApi {
    constructor(options = {}) {
        options.fetch = createFetch(options);

        const timeout = options.timeout || 0;
        delete options.timeout;

        super(options);

        this.timeout = timeout;
    }

    _options(...options) {
        if (this.timeout)
            options = [{ timeout: this.timeout }].concat(options);

        return super._options(...options);
    }
}

module.exports = NodeFetchApi;
