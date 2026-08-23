/**
 * Forme de la ressource « user » telle que la renvoie l'API GitHub.
 * Les noms restent en snake_case : ce type décrit le format réseau, pas notre modèle.
 * Toute transformation vers une forme applicative se ferait explicitement, ailleurs.
 */
export type GithubUser = {
  readonly id: number
  readonly login: string
  readonly avatar_url: string
  readonly html_url: string
}

/** Réponse de GET /search/users — seul `items` nous intéresse pour l'instant. */
export type GithubSearchResponse = {
  readonly items: readonly GithubUser[]
}

/**
 * Une *occurrence* d'utilisateur dans la liste affichée.
 *
 * La duplication autorise plusieurs occurrences du même compte GitHub : `user.id`
 * n'identifie donc plus une ligne de la liste. `instanceId` est généré côté client
 * et reste l'identité stable d'une occurrence — key React et clé de sélection.
 */
export type SearchResultItem = {
  readonly instanceId: string
  readonly user: GithubUser
}
