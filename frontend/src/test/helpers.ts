import type { GithubUser } from '../types/github'

export function buildUser(login: string, id: number): GithubUser {
  return {
    id,
    login,
    avatar_url: `https://avatars.githubusercontent.com/u/${id}`,
    html_url: `https://github.com/${login}`,
  }
}

export function jsonResponse(payload: unknown): Response {
  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}

/** 403 plus a zeroed quota: the only combination that means "rate limit". */
export function rateLimitResponse(): Response {
  return new Response(JSON.stringify({ message: 'API rate limit exceeded' }), {
    status: 403,
    headers: { 'x-ratelimit-remaining': '0' },
  })
}

/** 403 without an exhausted quota: must stay a generic error, not a rate limit. */
export function forbiddenResponse(): Response {
  return new Response(JSON.stringify({ message: 'Forbidden' }), {
    status: 403,
    headers: { 'x-ratelimit-remaining': '42' },
  })
}
