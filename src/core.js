const { FetchApiError, RequestFailedError } = require('./error');
const { concat, injectQueryParams } = require('./url');

const serializers = {};

class FetchApi {
    constructor(options = {}) {
        const { fetch, baseUrl, headers, contentType } = options;

        if (!fetch)
            throw new FetchApiError('FetchApi requires fetch');

        this.fetch = fetch;
        this.baseUrl = baseUrl;

        this.headers = headers || {};
        this.headers['content-type'] = this.headers['content-type'] || contentType;

        this.request = this.request.bind(this);
        this.get = this.get.bind(this);
        this.getAll = this.getAll.bind(this);
        this.post = this.post.bind(this);
        this.put = this.put.bind(this);
        this.patch = this.patch.bind(this);
        this.delete = this.delete.bind(this);

        this._respond = this._respond.bind(this);
    }

    _options(...options) {
        const headers = options.map(o => (o || {}).headers);
        const merged = Object.assign({}, ...options);
        merged.headers = Object.assign({}, this.headers, ...headers);
        return merged;
    }

    _body(data, options) {
        const type = options.headers['content-type'];

        if (!serializers[type] || typeof data == 'string')
            return data;

        return serializers[type](data);
    }

    _request(url, options) {
        // Chrome gives strange "Illegal Invocation" errors when window.fetch
        // is assigned to an object and called like this.fetch.
        const _fetch = this.fetch;

        return _fetch(url, options)
            .catch(cause => this._error(0, url, { cause }))
            .then(this._respond);
    }

    _respond(res) {
        if (res.ok)
            return Promise.resolve(res);

        return res.text().then(
            response => this._error(res.status, res.url, { response }),
            cause => this._error(res.status, res.url, { cause })
        );
    }

    _error(status, url, extra) {
        throw new RequestFailedError(status, url, extra);
    }

    _getResources(/* resource, response */) {
        throw new FetchApiError('Subclasses of FetchApi need to implement _getResources to use getAll');
    }

    _getNextUrl(/* previous, response */) {
        throw new FetchApiError('Subclasses of FetchApi need to implement _getNextUrl to use getAll');
    }

    _getNextOptions(previous/* , response */) {
        return previous;
    }

    isAbsolute(url) {
        return /^[a-z]+:\/\//i.test(url);
    }

    request(method, url, query, body, options) {
        if (!this.isAbsolute(url))
            url = concat(this.baseUrl, url);

        if (query)
            url = injectQueryParams(url, query);

        options = this._options({ method }, options);

        if (body && !options.body)
            options.body = this._body(body, options);

        return this._request(url, options);
    }

    get(url, query, options) {
        return this.request('GET', url, query, undefined, options);
    }

    getAll(resource, url, query, options) {
        const resources = [];

        const more = (res) => {
            resources.push(...this._getResources(resource, res));

            const nextUrl = this._getNextUrl(url, res);
            const nextOptions = this._getNextOptions(options, res);

            if (!nextUrl)
                return resources;

            // The last requested URL is preserved in `url` and passed
            // along to `this._getNextUrl`
            url = nextUrl;
            options = nextOptions;

            return this.get(nextUrl, undefined, nextOptions).then(more);
        };

        return this.get(url, query, options).then(more);
    }

    post(url, body, options) {
        return this.request('POST', url, undefined, body, options);
    }

    put(url, body, options) {
        return this.request('PUT', url, undefined, body, options);
    }

    patch(url, body, options) {
        return this.request('PATCH', url, undefined, body, options);
    }

    delete(url, options) {
        return this.request('DELETE', url, undefined, undefined, options);
    }
}

FetchApi.Error = FetchApiError;
FetchApi.RequestFailedError = RequestFailedError;

FetchApi.ContentTypes = {};
FetchApi.defineContentType = (name, config) => {
    if (!config && name.type) {
        config = name;
        name = config.type;
    }

    FetchApi.ContentTypes[name] = config.type;
    serializers[config.type] = config.serializer;
};

module.exports = FetchApi;
