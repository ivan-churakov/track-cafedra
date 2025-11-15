let lastController = null

export default async function safeFetch(url, opts = {}) {
  if(lastController) {
    lastController.abort()
  }

  const controller = AbortController()
  lastController = controller

  const signal = controller.signal

  try {
    const res = await fetch(url, {...opts, signal})

    if(lastController === controller) lastController = null
    if(!res.ok) throw new Error("Ошибка", res.status)
    return await res.json()
  } catch (e) {
    if(e.name === 'AbortError'){
      throw new Error("AbortError in safeFetch", e)
    }
    throw e
  }
}