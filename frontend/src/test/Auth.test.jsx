import { render, screen } from '@testing-library/react'
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

import { signIn, signUp, confirmSignUp, signOut, getToken } from '../auth'
import { getTodos, createTodo, updateTodo, deleteTodo } from '../api'

describe('AuthForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getToken.mockResolvedValue(null)
  })

  it('renders the sign in form by default', async () => {
    render(<App />)

    expect(await screen.findByRole('heading', { name: 'Sign In' })).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Email')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument()
  })

  it('switches to sign up form', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(await screen.findByText('Sign up'))

    expect(screen.getByRole('heading', { name: 'Create Account' })).toBeInTheDocument()
  })

  it('switches back to sign in from sign up', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(await screen.findByText('Sign up'))
    await user.click(screen.getByText('Sign in'))

    expect(screen.getByRole('heading', { name: 'Sign In' })).toBeInTheDocument()
  })

  it('calls signIn on submit', async () => {
    signIn.mockResolvedValue({})
    getTodos.mockResolvedValue([])

    const user = userEvent.setup()
    render(<App />)

    await user.type(await screen.findByPlaceholderText('Email'), 'test@example.com')
    await user.type(screen.getByPlaceholderText('Password'), 'password123')
    await user.click(screen.getByRole('button', { name: 'Sign In' }))

    expect(signIn).toHaveBeenCalledWith('test@example.com', 'password123')
  })

  it('calls signUp and shows confirm form', async () => {
    signUp.mockResolvedValue({})

    const user = userEvent.setup()
    render(<App />)

    await user.click(await screen.findByText('Sign up'))
    await user.type(screen.getByPlaceholderText('Email'), 'new@example.com')
    await user.type(screen.getByPlaceholderText('Password'), 'password123')
    await user.click(screen.getByRole('button', { name: 'Create Account' }))

    expect(signUp).toHaveBeenCalledWith('new@example.com', 'password123')
    expect(await screen.findByText('Confirm Email')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Verification code (check your email)')).toBeInTheDocument()
  })

  it('shows error message on sign in failure', async () => {
    signIn.mockRejectedValue(new Error('Incorrect username or password'))

    const user = userEvent.setup()
    render(<App />)

    await user.type(await screen.findByPlaceholderText('Email'), 'test@example.com')
    await user.type(screen.getByPlaceholderText('Password'), 'wrong')
    await user.click(screen.getByRole('button', { name: 'Sign In' }))

    expect(await screen.findByText('Incorrect username or password')).toBeInTheDocument()
  })

  it('confirms sign up and signs in', async () => {
    signUp.mockResolvedValue({})
    confirmSignUp.mockResolvedValue({})
    signIn.mockResolvedValue({})
    getTodos.mockResolvedValue([])

    const user = userEvent.setup()
    render(<App />)

    // Sign up first
    await user.click(await screen.findByText('Sign up'))
    await user.type(screen.getByPlaceholderText('Email'), 'new@example.com')
    await user.type(screen.getByPlaceholderText('Password'), 'password123')
    await user.click(screen.getByRole('button', { name: 'Create Account' }))

    // Confirm
    await user.type(await screen.findByPlaceholderText('Verification code (check your email)'), '123456')
    await user.click(screen.getByRole('button', { name: 'Confirm' }))

    expect(confirmSignUp).toHaveBeenCalledWith('new@example.com', '123456')
    expect(signIn).toHaveBeenCalledWith('new@example.com', 'password123')
  })
})
