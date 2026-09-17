import axios from 'axios'

export type Role = 'applicant' | 'reviewer'
export const api = axios.create({ baseURL: '/api', headers: { Accept: 'application/json' } })
export const tokenKey = (role: Role) => `grant_app_${role}_token`
export const setToken = (role: Role, token: string) => localStorage.setItem(tokenKey(role), token)
export const clearToken = (role: Role) => localStorage.removeItem(tokenKey(role))
export const hasToken = (role: Role) => Boolean(localStorage.getItem(tokenKey(role)))
export const authHeaders = (role: Role) => ({ Authorization: `Bearer ${localStorage.getItem(tokenKey(role))}` })

export function errorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const errors = error.response?.data?.errors as Record<string, string[]> | undefined
    if (errors) return Object.values(errors).flat().join('\n')
    return error.response?.data?.message ?? '通信に失敗しました。'
  }
  return '予期しないエラーが発生しました。'
}
