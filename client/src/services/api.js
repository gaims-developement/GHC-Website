import axios from 'axios'
import { API_BASE_URL } from '../config/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

const readCookie = (name) => document.cookie.split('; ').find((item) => item.startsWith(`${name}=`))?.split('=')[1]

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('ghc_token')
  const csrf = readCookie('csrf_token')

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  if (csrf) config.headers['x-csrf-token'] = csrf

  return config
})

export default api
