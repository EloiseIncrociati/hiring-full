// GitHub API response shape.
export type GithubUser = {
  readonly id: number
  readonly login: string
  readonly avatar_url: string
  readonly html_url: string
}

// Response of GET /search/users.
export type GithubSearchResponse = {
  readonly items: readonly GithubUser[]
}

// A user occurrence with a unique client-side identity.
export type SearchResultItem = {
  readonly instanceId: string
  readonly user: GithubUser
}
