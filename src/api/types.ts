export interface PaginatedResponse<T> {
  readonly total: number
  readonly next: string | null
  readonly nextOffset: number | null
  readonly result: readonly T[]
}
