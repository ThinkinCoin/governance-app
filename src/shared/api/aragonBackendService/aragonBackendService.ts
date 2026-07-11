import { HttpService, type IRequestQueryParams } from '../httpService';
import { AragonBackendServiceError } from './aragonBackendServiceError';
import type { IPaginatedResponse } from './domain';

export class AragonBackendService extends HttpService {
    constructor() {
        // Send the request directly to the backend server when the request is done on the server side, otherwise proxy
        // it through the /api/backend NextJs route.
        // NOTE: In production, it's common to configure only NEXT_PUBLIC_ARAGON_BACKEND_URL (for the proxy route).
        // The DAO page performs SSR data fetching, so we also need a server-side base URL.
        super(
            typeof window === 'undefined' ? AragonBackendService.getServerBaseUrl() : '/api/backend',
            AragonBackendServiceError.fromResponse,
            process.env.NEXT_SECRET_ARAGON_BACKEND_API_KEY,
        );
    }

    private static getServerBaseUrl(): string {
        const raw = process.env.ARAGON_BACKEND_URL ?? process.env.NEXT_PUBLIC_ARAGON_BACKEND_URL;
        if (!raw) {
            throw new Error(
                'ARAGON_BACKEND_URL não configurada. Defina no ambiente do servidor (ou use NEXT_PUBLIC_ARAGON_BACKEND_URL como fallback) para habilitar requisições server-side ao backend.',
            );
        }

        // Validate protocol; if missing, try to prefix http:// to avoid ERR_INVALID_URL
        let normalized = raw;
        try {
            // eslint-disable-next-line no-new
            new URL(raw);
        } catch {
            const candidate = `http://${raw}`;
            try {
                // eslint-disable-next-line no-new
                new URL(candidate);
                normalized = candidate;
            } catch {
                throw new Error(
                    `ARAGON_BACKEND_URL inválida: "${raw}". Use uma URL completa com protocolo, ex.: https://api.governance.country`,
                );
            }
        }

        // Remove trailing slash to avoid double slashes when concatenating
        return normalized.replace(/\/$/, '');
    }

    getNextPageParams = <TParams extends IRequestQueryParams<object>, TData = unknown>(
        lastPage: IPaginatedResponse<TData>,
        _allPages: Array<IPaginatedResponse<TData>>,
        previousParams: TParams,
    ): TParams | undefined => {
        const metadata = lastPage?.metadata;
        if (
            metadata == null ||
            typeof metadata.page !== 'number' ||
            typeof metadata.totalPages !== 'number' ||
            metadata.page < 1 ||
            metadata.totalPages < 1
        ) {
            return undefined;
        }

        const { page, totalPages } = metadata;

        if (page >= totalPages) {
            return undefined;
        }

        return {
            ...previousParams,
            queryParams: {
                ...previousParams.queryParams,
                page: page + 1,
            },
        };
    };
}
