import type { PaginatedResponse } from './types.js'

const MAX_PAGES = 50

export async function fetchAllPages<T>(
  fetchPage: (offset: number) => Promise<PaginatedResponse<T>>
): Promise<{ items: readonly T[]; total: number }> {
  const allItems: T[] = []
  let offset = 0
  let total = 0

  for (let page = 0; page < MAX_PAGES; page++) {
    const response = await fetchPage(offset)
    total = response.total
    allItems.push(...response.result)

    if (response.nextOffset === null) {
      break
    }

    offset = response.nextOffset
  }

  return { items: allItems, total }
}
