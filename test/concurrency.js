/* global describe, before, afterEach, it */

const nock = require('nock');
const assert = require('assert');

describe('# concurrency', () => {

    const FetchAPI = require('..');

    before(() => {
        nock.cleanAll();
    });

    afterEach(() => {
        nock.cleanAll();
    });

    it ('Should limit request concurrency', async function() {
        nock('https://test.ambassify.eu')
            .get('/hello-world')
            .times(5)
            .delay(500)
            .reply(200, {
                id: 'hello',
                name: 'world'
            });

        const api = new FetchAPI({
            baseUrl: 'https://test.ambassify.eu',
            concurrency: 2
        });

        const start = Date.now();

        await Promise.all([
            api.get('/hello-world'),
            api.get('/hello-world'),
            api.get('/hello-world'),
            api.get('/hello-world'),
            api.get('/hello-world'),
        ]);

        const duration = (Date.now() - start) / 1000;
        assert(duration > 1, `API requests took ${duration.toFixed(1)}s expected >1s`);
    });

    it ('Should use same grouped fetch instance', async function() {
        nock('https://test.ambassify.eu')
            .get('/hello-world')
            .times(5)
            .delay(500)
            .reply(200, {
                id: 'hello',
                name: 'world'
            });

        const api1 = new FetchAPI({
            baseUrl: 'https://test.ambassify.eu',
            concurrency: { group: 'test', size: 2 }
        });

        const api2 = new FetchAPI({
            baseUrl: 'https://test.ambassify.eu',
            concurrency: { group: 'test', size: 2 }
        });

        const start = Date.now();

        await Promise.all([
            api1.get('/hello-world'),
            api2.get('/hello-world'),
            api1.get('/hello-world'),
            api2.get('/hello-world'),
            api1.get('/hello-world'),
        ]);

        const duration = (Date.now() - start) / 1000;
        assert(duration > 1, `API requests took ${duration.toFixed(1)}s expected >1s`);
    });

});
