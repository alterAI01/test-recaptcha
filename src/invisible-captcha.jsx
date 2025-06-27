import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react'
import './App.css'
import axios from 'axios'

// Кастомный компонент для invisible reCAPTCHA
const Recaptcha = forwardRef(({ sitekey, onVerify }, ref) => {
  const widgetId = useRef(null)
  const containerRef = useRef(null)

  // Загружаем скрипт reCAPTCHA только один раз
  useEffect(() => {
    if (window.grecaptcha) {
      renderRecaptcha()
      return
    }
    const script = document.createElement('script')
    script.src = 'https://www.google.com/recaptcha/api.js?onload=onloadCallback&render=explicit'
    script.async = true
    script.defer = true
    document.body.appendChild(script)

    window.onloadCallback = renderRecaptcha

    return () => {
      document.body.removeChild(script)
      delete window.onloadCallback
    }
    // eslint-disable-next-line
  }, [])

  // Рендерим капчу
  function renderRecaptcha() {
    if (!window.grecaptcha || widgetId.current !== null) return
    widgetId.current = window.grecaptcha.render(containerRef.current, {
      sitekey,
      size: 'invisible',
      callback: onVerify,
    })
  }

  // Делаем execute доступным через ref
  useImperativeHandle(ref, () => ({
    execute: () => {
      if (window.grecaptcha && widgetId.current !== null) {
        window.grecaptcha.execute(widgetId.current)
      }
    },
    reset: () => {
      if (window.grecaptcha && widgetId.current !== null) {
        window.grecaptcha.reset(widgetId.current)
      }
    }
  }))

  return <div ref={containerRef}></div>
})

function App() {
  const recaptcha = useRef()
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')

  async function onRecaptcha(token) {
    const res = await fetch('http://localhost:8000/verify', {
      method: 'POST',
      body: JSON.stringify({ captchaValue: token }),
      headers: {
        'content-type': 'application/json',
      },
    })
    const data = await res.json()
    if (data.success) {
      alert('Form submission successful!')
    } else {
      alert('reCAPTCHA validation failed!')
    }
    recaptcha.current.reset()
  }

  function submitForm(event) {
    event.preventDefault()
    if (recaptcha.current) {
      recaptcha.current.execute()
    }
  }

  return (
    <div>
      <h1>Sign up for Newsletter</h1>
      <form onSubmit={submitForm}>
        <input
          name="Email"
          type={'email'}
          value={email}
          required
          placeholder="joe@example.com"
          onChange={(event) => setEmail(event.target.value)}
        />
        <input
          name="Name"
          type={'name'}
          value={name}
          required
          placeholder="Joe"
          onChange={(event) => setName(event.target.value)}
        />
        <button type="submit">Sign up</button>
        <Recaptcha
          ref={recaptcha}
          sitekey={process.env.REACT_APP_SITE_KEY}
          onVerify={onRecaptcha}
        />
      </form>
    </div>
  )
}

export default App