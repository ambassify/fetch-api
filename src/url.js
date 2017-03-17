const qs = require('qs');

function concat(base, path) {
    if (base)
        return base.replace(/\/*$/, '/') + path.replace(/^\/+/, '');

    return path;
}

function injectQueryParams (uri, parameters, options) {
    const fragmentIndex = uri.indexOf('#');
    let fragment = '';

    if (fragmentIndex >= 0) {
        fragment = uri.substr(fragmentIndex);
        uri = uri.substr(0, fragmentIndex);
    }

    const searchIndex = uri.indexOf('?');
    let query = {};

    if (searchIndex >= 0) {
        query = qs.parse(uri.substr(searchIndex + 1));
        uri = uri.substr(0, searchIndex);
    }

    Object.assign(query, parameters);

    let search = qs.stringify(query, options);
    search = search.length ? `?${search}` : search;

    return `${uri}${search}${fragment}`;
}

module.exports = { concat, injectQueryParams };
