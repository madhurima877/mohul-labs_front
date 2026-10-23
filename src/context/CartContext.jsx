import { createContext, useContext, useEffect, useState } from 'react'

const CartContext = createContext(null)
const KEY = 'mohul_cart'

function load() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || []
  } catch {
    return []
  }
}

// Cart of pathology tests and packages: [{ type: 'test'|'package', code, name, price, includes? }]
export function CartProvider({ children }) {
  const [items, setItems] = useState(load)
  const [toast, setToast] = useState('')

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(items)) } catch { /* ignore */ }
  }, [items])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(''), 2200)
    return () => clearTimeout(t)
  }, [toast])

  const has = (code) => items.some((i) => i.code === code)
  const add = (item) => {
    if (has(item.code)) return
    setItems((xs) => [...xs, item])
    setToast(`${item.name} added to cart`)
  }
  const remove = (code) => setItems((xs) => xs.filter((i) => i.code !== code))
  const toggle = (item) => (has(item.code) ? remove(item.code) : add(item))
  const clear = () => setItems([])
  const total = items.reduce((s, i) => s + i.price, 0)

  return (
    <CartContext.Provider value={{ items, add, remove, toggle, has, clear, total, toast, setToast }}>
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => useContext(CartContext)
