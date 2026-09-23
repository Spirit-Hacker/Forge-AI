const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

async function refreshAccessToken() {
  const response = await fetch(`${API_URL}/api/auth/refresh`, {
    method: "POST",
    credentials: "include",
  });

  if (!response.ok) {
    accessToken = null;
    return null;
  }

  const data = await response.json();

  accessToken = data.accessToken;

  return accessToken;
}

interface ApiOptions extends RequestInit {
  skipAuthRefresh?: boolean;
}

export async function api<T>(
  path: string,
  options: ApiOptions = {},
): Promise<T> {
  const { skipAuthRefresh = false, ...requestOptions } = options;

  const headers = new Headers(requestOptions.headers);

  if (requestOptions.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  let response = await fetch(`${API_URL}${path}`, {
    ...requestOptions,
    headers,
    credentials: "include",
  });

  if (response.status === 401 && !skipAuthRefresh) {
    const newToken = await refreshAccessToken();

    if (!newToken) {
      throw new Error("Authentication required");
    }

    headers.set("Authorization", `Bearer ${newToken}`);

    response = await fetch(`${API_URL}${path}`, {
      ...requestOptions,
      headers,
      credentials: "include",
    });
  }

  if (!response.ok) {
    const body = await response.json().catch(() => null);

    throw new Error(
      body?.error ?? `Request failed with status ${response.status}`,
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

export async function logout() {
  await api("/api/auth/logout", {
    method: "POST",
    skipAuthRefresh: true,
  });

  accessToken = null;
}
