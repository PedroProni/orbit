export type GetOnlyFetch = (url: string, init: { method: 'GET'; headers?: Record<string, string>; redirect?: RequestRedirect }) => Promise<Response>;
