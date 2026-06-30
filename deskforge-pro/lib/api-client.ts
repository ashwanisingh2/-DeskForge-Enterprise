/** Browser-side API helpers. The `x-requested-with` header satisfies the CSRF
 *  middleware for same-origin mutations (browsers cannot set it cross-origin). */
const jsonHeaders = {'content-type': 'application/json', 'x-requested-with': 'XMLHttpRequest'};

export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function parse(res: Response) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = data?.error;
    throw new ApiError(res.status, err?.code ?? 'ERROR', err?.message ?? res.statusText);
  }
  return data;
}

export function apiGet<T = unknown>(url: string): Promise<T> {
  return fetch(url, {headers: {'x-requested-with': 'XMLHttpRequest'}}).then(parse) as Promise<T>;
}

export function apiSend<T = unknown>(url: string, method: 'POST' | 'PATCH' | 'PUT' | 'DELETE', body?: unknown): Promise<T> {
  return fetch(url, {method, headers: jsonHeaders, body: body === undefined ? undefined : JSON.stringify(body)}).then(parse) as Promise<T>;
}
