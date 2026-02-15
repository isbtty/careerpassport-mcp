import { describe, it, expect, vi } from 'vitest'
import { fetchAllPages } from '../../../src/api/pagination.js'
import type { PaginatedResponse } from '../../../src/api/types.js'

describe('fetchAllPages', () => {
  it('returns all items from a single page', async () => {
    const fetchPage = vi.fn().mockResolvedValue({
      total: 2,
      next: null,
      nextOffset: null,
      result: [{ id: 1 }, { id: 2 }],
    } satisfies PaginatedResponse<{ id: number }>)

    const { items, total } = await fetchAllPages(fetchPage)

    expect(items).toEqual([{ id: 1 }, { id: 2 }])
    expect(total).toBe(2)
    expect(fetchPage).toHaveBeenCalledTimes(1)
    expect(fetchPage).toHaveBeenCalledWith(0)
  })

  it('fetches multiple pages until nextOffset is null', async () => {
    const fetchPage = vi.fn()
      .mockResolvedValueOnce({
        total: 4,
        next: '/api?offset=2',
        nextOffset: 2,
        result: [{ id: 1 }, { id: 2 }],
      })
      .mockResolvedValueOnce({
        total: 4,
        next: null,
        nextOffset: null,
        result: [{ id: 3 }, { id: 4 }],
      })

    const { items, total } = await fetchAllPages(fetchPage)

    expect(items).toEqual([{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }])
    expect(total).toBe(4)
    expect(fetchPage).toHaveBeenCalledTimes(2)
    expect(fetchPage).toHaveBeenNthCalledWith(1, 0)
    expect(fetchPage).toHaveBeenNthCalledWith(2, 2)
  })

  it('handles empty result set', async () => {
    const fetchPage = vi.fn().mockResolvedValue({
      total: 0,
      next: null,
      nextOffset: null,
      result: [],
    })

    const { items, total } = await fetchAllPages(fetchPage)

    expect(items).toEqual([])
    expect(total).toBe(0)
    expect(fetchPage).toHaveBeenCalledTimes(1)
  })

  it('fetches three pages correctly', async () => {
    const fetchPage = vi.fn()
      .mockResolvedValueOnce({
        total: 6,
        next: '/api?offset=2',
        nextOffset: 2,
        result: ['a', 'b'],
      })
      .mockResolvedValueOnce({
        total: 6,
        next: '/api?offset=4',
        nextOffset: 4,
        result: ['c', 'd'],
      })
      .mockResolvedValueOnce({
        total: 6,
        next: null,
        nextOffset: null,
        result: ['e', 'f'],
      })

    const { items, total } = await fetchAllPages(fetchPage)

    expect(items).toEqual(['a', 'b', 'c', 'd', 'e', 'f'])
    expect(total).toBe(6)
    expect(fetchPage).toHaveBeenCalledTimes(3)
  })

  it('stops after MAX_PAGES (50) to prevent infinite loops', async () => {
    let callCount = 0
    const fetchPage = vi.fn().mockImplementation((offset: number) => {
      callCount++
      return Promise.resolve({
        total: 10000,
        next: `/api?offset=${offset + 1}`,
        nextOffset: offset + 1,
        result: [{ id: callCount }],
      })
    })

    const { items } = await fetchAllPages(fetchPage)

    expect(fetchPage).toHaveBeenCalledTimes(50)
    expect(items).toHaveLength(50)
  })

  it('propagates errors from fetchPage', async () => {
    const fetchPage = vi.fn().mockRejectedValue(new Error('network error'))

    await expect(fetchAllPages(fetchPage)).rejects.toThrow('network error')
  })

  it('propagates errors from subsequent pages', async () => {
    const fetchPage = vi.fn()
      .mockResolvedValueOnce({
        total: 4,
        next: '/api?offset=2',
        nextOffset: 2,
        result: [{ id: 1 }],
      })
      .mockRejectedValueOnce(new Error('page 2 error'))

    await expect(fetchAllPages(fetchPage)).rejects.toThrow('page 2 error')
  })

  it('uses the total from the last fetched page', async () => {
    const fetchPage = vi.fn()
      .mockResolvedValueOnce({
        total: 10,
        next: '/api?offset=2',
        nextOffset: 2,
        result: ['a'],
      })
      .mockResolvedValueOnce({
        total: 12,
        next: null,
        nextOffset: null,
        result: ['b'],
      })

    const { total } = await fetchAllPages(fetchPage)

    expect(total).toBe(12)
  })
})
