/**
 * @jest-environment node
 */

import { generateNextRequest, generateResponse } from '@/shared/testUtils';
import type { NextURL } from 'next/dist/server/web/next-url';
import { type NextRequest, NextResponse } from 'next/server';
import { ProxyBackendUtils, proxyBackendUtils } from './proxyBackendUtils';

describe('proxyBackend utils', () => {
    const originalEnv = process.env;
    const fetchSpy = jest.spyOn(global, 'fetch');

    beforeEach(() => {
        fetchSpy.mockResolvedValue(generateResponse());
    });

    afterEach(() => {
        fetchSpy.mockReset();
        process.env = originalEnv;
    });

    describe('request', () => {
        it('forwards the response stream without stale encoding headers', async () => {
            const body = new ReadableStream({ start(controller) { controller.enqueue(new TextEncoder().encode('{"result":"test"}')); controller.close(); } });
            const headers = new Headers({ 'content-type': 'application/json', 'content-encoding': 'gzip', 'content-length': '20' });
            const fetchReturn = generateResponse({
                status: 200,
                headers,
                body,
            });
            fetchSpy.mockResolvedValue(fetchReturn);

            const result = await proxyBackendUtils.request(generateNextRequest({ url: 'http://test.com' }));

            expect(fetchSpy).toHaveBeenCalled();
            expect(result.headers.get('content-encoding')).toBeNull();
            expect(result.headers.get('content-length')).toBeNull();
            expect(result.headers.get('content-type')).toBe('application/json');
            expect((fetchSpy.mock.calls[0][1] as RequestInit).headers).toEqual(expect.objectContaining({ 'accept-encoding': 'identity' }));
        });

        it('forwards 204 responses without a body', async () => {
            const fetchReturn = generateResponse({ status: 204, headers: new Headers() });
            fetchSpy.mockResolvedValue(fetchReturn);

            const result = await proxyBackendUtils.request(generateNextRequest({ url: 'http://test.com' }));

            expect(nextResponseJsonSpy).not.toHaveBeenCalled();
            expect(result.status).toEqual(204);
        });

        it('appends the authorization header when set', async () => {
            const apiKey = 'test-api-key-123';
            process.env.NEXT_SECRET_ARAGON_BACKEND_API_KEY = apiKey;
            await proxyBackendUtils.request(generateNextRequest({ url: 'http://test.com' }));
            const request = fetchSpy.mock.calls[0][1] as NextRequest;
            expect(request.headers.get('X-API-Key')).toEqual(apiKey);
        });
    });

    describe('buildBackendUrl', () => {
        it('returns the URL of the backend service', () => {
            const href = 'https://api.whostler.com/api/backend/dao/0x1234?network=harmony-mainnet';
            process.env.ARAGON_BACKEND_URL = 'https://api.whostler.com';
            const testClass = new ProxyBackendUtils();
            const request = generateNextRequest({ nextUrl: { href } as NextURL });
            expect(testClass['buildBackendUrl'](request)).toEqual(
                'https://api.whostler.com/dao/0x1234?network=harmony-mainnet',
            );
        });

        it('falls back to NEXT_PUBLIC_ARAGON_BACKEND_URL when ARAGON_BACKEND_URL is not set', () => {
            const href = 'https://governance.country/api/backend/v2/daos?page=1&pageSize=10';
            delete process.env.ARAGON_BACKEND_URL;
            process.env.NEXT_PUBLIC_ARAGON_BACKEND_URL = 'https://api.whostler.com';
            const testClass = new ProxyBackendUtils();
            const request = generateNextRequest({ nextUrl: { href } as NextURL });
            expect(testClass['buildBackendUrl'](request)).toEqual('https://api.whostler.com/v2/daos?page=1&pageSize=10');
        });
    });
});
