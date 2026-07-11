import { sanitizeProxyHeaders, sanitizeProxyRequestHeaders } from '@/shared/utils/proxyResponseUtils/proxyResponseUtils';
import { type NextRequest, NextResponse } from 'next/server';

export class ProxyBackendUtils {
    private proxyUrl = '/api/backend';

    request = async (request: NextRequest) => {
        const url = this.buildBackendUrl(request);
        const requestOptions = await this.buildRequestOptions(request);

        const result = await fetch(url, requestOptions);

        if (this.isNoContent(result.status)) {
            return this.forwardNoContent(result);
        }

        return this.forwardBody(result);
    };

    private isNoContent = (status: number): boolean => status === 204 || status === 205 || status === 304;

    private forwardNoContent = (result: Response): NextResponse =>
        new NextResponse(null, { status: result.status, headers: sanitizeProxyHeaders(result.headers) });

    private forwardBody = (result: Response): NextResponse =>
        new NextResponse(result.body, { status: result.status, headers: sanitizeProxyHeaders(result.headers) });

    private buildBackendUrl = (request: NextRequest): string => {
        const [, relativeUrlRaw] = request.nextUrl.href.split(this.proxyUrl);
        const relativeUrl = relativeUrlRaw ?? '';

        const baseUrl = process.env.ARAGON_BACKEND_URL ?? process.env.NEXT_PUBLIC_ARAGON_BACKEND_URL;
        if (!baseUrl) {
            throw new Error(
                'ARAGON_BACKEND_URL não configurada. Defina no ambiente do servidor (ou use NEXT_PUBLIC_ARAGON_BACKEND_URL como fallback) para habilitar o proxy /api/backend.',
            );
        }
        // Validate protocol; if missing, try to prefix http:// to avoid ERR_INVALID_URL in dev
        let normalizedBase = baseUrl;
        try {
            // Will throw if protocol is missing/invalid
            // eslint-disable-next-line no-new
            new URL(baseUrl);
        } catch {
            const candidate = `http://${baseUrl}`;
            try {
                // eslint-disable-next-line no-new
                new URL(candidate);
                normalizedBase = candidate;
            } catch {
                throw new Error(
                    `ARAGON_BACKEND_URL inválida: "${baseUrl}". Use uma URL completa com protocolo, ex.: https://api.governance.country`,
                );
            }
        }

        // Remove trailing slash to avoid double slashes when concatenating
        normalizedBase = normalizedBase.replace(/\/$/, '');

        const url = `${normalizedBase}${relativeUrl}`;

        return url;
    };

    private buildRequestOptions = async (request: NextRequest): Promise<RequestInit> => {
        const { method, headers } = request;
        const body = method.toUpperCase() === 'POST' ? await request.text() : undefined;

        const processedHeaders = sanitizeProxyRequestHeaders(new Headers(headers));

        if (process.env.NEXT_SECRET_ARAGON_BACKEND_API_KEY) {
            processedHeaders.set('X-API-Key', process.env.NEXT_SECRET_ARAGON_BACKEND_API_KEY);
        }

        return { method, body, headers: processedHeaders };
    };
}

export const proxyBackendUtils = new ProxyBackendUtils();
