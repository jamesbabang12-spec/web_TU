'use client'

import { useEffect, useState, useCallback } from 'react'
import { apiClient } from '@/lib/api/client'
import { toast } from 'sonner'

export function useCrud(resource) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiClient.get(`/${resource}`)
      setData(Array.isArray(res.data) ? res.data : [])
      setError(null)
    } catch (e) {
      setError(e?.response?.data?.error || 'Gagal memuat data')
    } finally {
      setLoading(false)
    }
  }, [resource])

  useEffect(() => { fetchAll() }, [fetchAll])

  const create = async (payload) => {
    try {
      const res = await apiClient.post(`/${resource}`, payload)
      setData((prev) => [res.data, ...prev])
      toast.success('Data berhasil ditambahkan')
      return res.data
    } catch (e) {
      toast.error(e?.response?.data?.error || 'Gagal menambah data')
      throw e
    }
  }

  const update = async (id, payload) => {
    try {
      const res = await apiClient.put(`/${resource}/${id}`, payload)
      setData((prev) => prev.map((x) => (x.id === id ? res.data : x)))
      toast.success('Data berhasil diperbarui')
      return res.data
    } catch (e) {
      toast.error(e?.response?.data?.error || 'Gagal memperbarui data')
      throw e
    }
  }

  const remove = async (id) => {
    try {
      await apiClient.delete(`/${resource}/${id}`)
      setData((prev) => prev.filter((x) => x.id !== id))
      toast.success('Data berhasil dihapus')
    } catch (e) {
      toast.error(e?.response?.data?.error || 'Gagal menghapus data')
    }
  }

  return { data, loading, error, refetch: fetchAll, create, update, remove }
}
