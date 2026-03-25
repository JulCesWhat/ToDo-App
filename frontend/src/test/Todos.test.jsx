import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import App from '../App'

vi.mock('../auth', () => ({
  signIn: vi.fn(),
  signUp: vi.fn(),
  confirmSignUp: vi.fn(),
  signOut: vi.fn(),
  getToken: vi.fn(),
}))

vi.mock('../api', () => ({
  getTodos: vi.fn(),
  createTodo: vi.fn(),
  updateTodo: vi.fn(),
  deleteTodo: vi.fn(),
}))

import { signOut, getToken } from '../auth'
import { getTodos, createTodo, updateTodo, deleteTodo } from '../api'

describe('Todo App (authenticated)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getToken.mockResolvedValue('fake-jwt-token')
    getTodos.mockResolvedValue([])
  })

  it('renders the todo app when authenticated', async () => {
    render(<App />)

    expect(await screen.findByText('Todo App')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('What needs to be done?')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Add' })).toBeInTheDocument()
    expect(screen.getByText('Sign out')).toBeInTheDocument()
  })

  it('shows empty state message when no todos', async () => {
    render(<App />)

    expect(await screen.findByText('No todos yet. Add one above!')).toBeInTheDocument()
  })

  it('renders existing todos', async () => {
    getTodos.mockResolvedValue([
      { id: '1', text: 'Buy groceries', checked: false },
      { id: '2', text: 'Walk the dog', checked: true },
    ])

    render(<App />)

    expect(await screen.findByText('Buy groceries')).toBeInTheDocument()
    expect(screen.getByText('Walk the dog')).toBeInTheDocument()
  })

  it('creates a new todo', async () => {
    createTodo.mockResolvedValue({ id: '3', text: 'New task', checked: false })

    const user = userEvent.setup()
    render(<App />)

    await screen.findByText('Todo App')
    await user.type(screen.getByPlaceholderText('What needs to be done?'), 'New task')
    await user.click(screen.getByRole('button', { name: 'Add' }))

    expect(createTodo).toHaveBeenCalledWith('New task')
    expect(await screen.findByText('New task')).toBeInTheDocument()
  })

  it('clears input after creating a todo', async () => {
    createTodo.mockResolvedValue({ id: '3', text: 'New task', checked: false })

    const user = userEvent.setup()
    render(<App />)

    await screen.findByText('Todo App')
    const input = screen.getByPlaceholderText('What needs to be done?')
    await user.type(input, 'New task')
    await user.click(screen.getByRole('button', { name: 'Add' }))

    expect(input).toHaveValue('')
  })

  it('does not create a todo with empty text', async () => {
    const user = userEvent.setup()
    render(<App />)

    await screen.findByText('Todo App')
    await user.click(screen.getByRole('button', { name: 'Add' }))

    expect(createTodo).not.toHaveBeenCalled()
  })

  it('toggles a todo', async () => {
    getTodos.mockResolvedValue([
      { id: '1', text: 'Buy groceries', checked: false },
    ])
    updateTodo.mockResolvedValue({ id: '1', text: 'Buy groceries', checked: true })

    const user = userEvent.setup()
    render(<App />)

    const checkbox = await screen.findByRole('checkbox')
    expect(checkbox).not.toBeChecked()

    await user.click(checkbox)

    expect(updateTodo).toHaveBeenCalledWith('1', { text: 'Buy groceries', checked: true })
  })

  it('deletes a todo', async () => {
    getTodos.mockResolvedValue([
      { id: '1', text: 'Buy groceries', checked: false },
    ])
    deleteTodo.mockResolvedValue()

    const user = userEvent.setup()
    render(<App />)

    await screen.findByText('Buy groceries')
    await user.click(screen.getByRole('button', { name: 'Delete' }))

    expect(deleteTodo).toHaveBeenCalledWith('1')
    expect(screen.queryByText('Buy groceries')).not.toBeInTheDocument()
  })

  it('signs out and shows auth form', async () => {
    const user = userEvent.setup()
    render(<App />)

    await screen.findByText('Todo App')

    // After sign out, getToken should return null
    getToken.mockResolvedValue(null)
    await user.click(screen.getByText('Sign out'))

    expect(signOut).toHaveBeenCalled()
    expect(await screen.findByRole('heading', { name: 'Sign In' })).toBeInTheDocument()
  })

  it('applies line-through style to checked todos', async () => {
    getTodos.mockResolvedValue([
      { id: '1', text: 'Done task', checked: true },
    ])

    render(<App />)

    const todoText = await screen.findByText('Done task')
    expect(todoText).toHaveClass('line-through')
  })
})
