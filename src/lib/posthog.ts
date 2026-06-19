const POSTHOG_HOST = 'https://us.i.posthog.com';

function getProjectId() {
  return process.env.POSTHOG_PROJECT_ID || '';
}

function getApiKey() {
  return process.env.POSTHOG_PERSONAL_API_KEY || '';
}

export async function posthogQuery(query: string) {
  const res = await fetch(
    `${POSTHOG_HOST}/api/projects/${getProjectId()}/query/`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getApiKey()}`,
      },
      body: JSON.stringify({
        query: { kind: 'HogQLQuery', query },
      }),
    }
  );
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`PostHog query error: ${res.status} ${err}`);
  }
  const data = await res.json();
  return data.results || [];
}

