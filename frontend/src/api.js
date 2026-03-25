import { getToken } from './auth'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/todos'

const authHeaders = async () => {
  const token = await getToken()
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: token } : {}),
  }
}

export const getTodos = async () => {
  const res = await fetch(API_URL, { headers: await authHeaders() })
  return res.json()
}

export const createTodo = async (text) => {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify({ text }),
  })
  return res.json()
}

export const updateTodo = async (id, data) => {
  const res = await fetch(`${API_URL}/${id}`, {
    method: 'PUT',
    headers: await authHeaders(),
    body: JSON.stringify(data),
  })
  return res.json()
}

export const deleteTodo = async (id) =>
  fetch(`${API_URL}/${id}`, {
    method: 'DELETE',
    headers: await authHeaders(),
  })
