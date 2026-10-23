// On phones, tables are shown as stacked cards (see `.table` in index.css). Each cell needs to know its
// column name to show it as a label, so this copies every header's text onto the cells below it as
// data-label. It watches the page so tables rendered later (after data loads) are labelled too.

function labelTables(root) {
  root.querySelectorAll('table.table').forEach((table) => {
    const headers = [...table.querySelectorAll('thead th')].map((th) => th.textContent.trim())
    table.querySelectorAll('tbody tr').forEach((tr) => {
      ;[...tr.children].forEach((td, i) => {
        const label = headers[i] || ''
        if (td.getAttribute('data-label') !== label) td.setAttribute('data-label', label)
      })
    })
  })
}

export function watchTables(root = document.body) {
  let frame = 0
  const run = () => {
    cancelAnimationFrame(frame)
    frame = requestAnimationFrame(() => labelTables(root))
  }
  run()
  const observer = new MutationObserver(run)
  observer.observe(root, { childList: true, subtree: true })
  return () => {
    observer.disconnect()
    cancelAnimationFrame(frame)
  }
}
