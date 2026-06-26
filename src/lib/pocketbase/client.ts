import PocketBase from 'pocketbase'

const pb = new PocketBase(import.meta.env.VITE_POCKETBASE_URL)
pb.autoCancellation(false)

// Global interceptor to enforce Universal "Auto-Close" UI Behavior
const originalSend = pb.send.bind(pb)
pb.send = async function (path, reqOpts) {
  const method = reqOpts?.method?.toUpperCase() || 'GET'
  const isMutation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)

  try {
    const res = await originalSend(path, reqOpts)

    if (isMutation) {
      // Small delay to allow React state updates (like toasts) to render
      setTimeout(() => {
        // Standardize behavior: close any open Radix modal/dialog/sheet automatically upon successful save
        const closeBtn = document.querySelector(
          '[role="dialog"] button[aria-label="Close"], [data-radix-dialog-content] button[aria-label="Close"]',
        ) as HTMLElement
        if (closeBtn) {
          closeBtn.click()
        }
      }, 100)
    }

    return res
  } catch (err) {
    // If backend returns a validation error, the error is thrown here.
    // The interceptor will NOT close the modal, satisfying the Error Handling AC.
    throw err
  }
}

export default pb
