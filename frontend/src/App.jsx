import { useState, useEffect } from 'react'
import { getTodos, createTodo, updateTodo, deleteTodo } from './api'
import { signIn, signUp, confirmSignUp, signOut, getToken } from './auth'

function AuthForm({ onAuthenticated }) {
  const [mode, setMode] = useState('signin') // 'signin' | 'signup' | 'confirm'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (mode === 'signin') {
        await signIn(email, password)
        onAuthenticated()
      } else if (mode === 'signup') {
        await signUp(email, password)
        setMode('confirm')
      } else if (mode === 'confirm') {
        await confirmSignUp(email, code)
        await signIn(email, password)
        onAuthenticated()
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-10">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-md p-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">
          {mode === 'signin' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Confirm Email'}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode !== 'confirm' && (
            <>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                required
                className="w-full border border-gray-300 rounded-lg px-4 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                required
                className="w-full border border-gray-300 rounded-lg px-4 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </>
          )}
          {mode === 'confirm' && (
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Verification code (check your email)"
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          )}

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium px-4 py-2 rounded-lg transition-colors"
          >
            {loading ? 'Please wait...' : mode === 'signin' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Confirm'}
          </button>
        </form>

        <p className="mt-4 text-sm text-center text-gray-500">
          {mode === 'signin' ? (
            <>No account?{' '}<button onClick={() => setMode('signup')} className="text-blue-600 hover:underline">Sign up</button></>
          ) : mode === 'signup' ? (
            <>Already have an account?{' '}<button onClick={() => setMode('signin')} className="text-blue-600 hover:underline">Sign in</button></>
          ) : (
            <>Wrong email?{' '}<button onClick={() => setMode('signup')} className="text-blue-600 hover:underline">Start over</button></>
          )}
        </p>
      </div>
    </div>
  )
}

export default function App() {
  const [todos, setTodos] = useState([])
  const [text, setText] = useState('')
  const [authenticated, setAuthenticated] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)

  useEffect(() => {
    getToken().then((token) => {
      setAuthenticated(!!token)
      setCheckingAuth(false)
    })
  }, [])

  useEffect(() => {
    if (authenticated) getTodos().then(setTodos)
  }, [authenticated])

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!text.trim()) return
    const todo = await createTodo(text.trim())
    setTodos((prev) => [...prev, todo])
    setText('')
  }

  const handleToggle = async (todo) => {
    const updated = await updateTodo(todo.id, { text: todo.text, checked: !todo.checked })
    setTodos((prev) => prev.map((t) => (t.id === todo.id ? updated : t)))
  }

  const handleDelete = async (id) => {
    await deleteTodo(id)
    setTodos((prev) => prev.filter((t) => t.id !== id))
  }

  const handleSignOut = () => {
    signOut()
    setAuthenticated(false)
    setTodos([])
  }

  if (checkingAuth) return null

  if (!authenticated) return <AuthForm onAuthenticated={() => setAuthenticated(true)} />

  return (
    <div className="min-h-screen bg-gray-50 py-6 sm:py-10">
      <div className="max-w-md mx-auto bg-white rounded-none sm:rounded-2xl shadow-none sm:shadow-md p-5 sm:p-8">
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Todo App</h1>
          <button
            onClick={handleSignOut}
            className="text-sm text-gray-500 hover:text-gray-700 font-medium transition-colors"
          >
            Sign out
          </button>
        </div>

        <form onSubmit={handleCreate} className="flex gap-2 mb-8">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="What needs to be done?"
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg transition-colors"
          >
            Add
          </button>
        </form>

        <ul className="space-y-3">
          {todos.map((todo) => (
            <li key={todo.id} className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50">
              <input
                type="checkbox"
                checked={todo.checked}
                onChange={() => handleToggle(todo)}
                className="w-4 h-4 accent-blue-600 cursor-pointer"
              />
              <span className={`flex-1 text-gray-700 ${todo.checked ? 'line-through text-gray-400' : ''}`}>
                {todo.text}
              </span>
              <button
                onClick={() => handleDelete(todo.id)}
                className="text-sm text-red-500 hover:text-red-700 font-medium transition-colors"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>

        {todos.length === 0 && (
          <p className="text-center text-gray-400 mt-6">No todos yet. Add one above!</p>
        )}
      </div>
    </div>
  )
}
