import clipboardCopy from 'clipboard-copy'
import { toast } from "sonner"

export function copyToClipboard(text: string, setStateFn?: (value: boolean) => void): Promise<void> {
  return clipboardCopy(text)
    .then(() => {
      if (setStateFn) {
        setStateFn(true)
        setTimeout(() => {
          setStateFn(false)
        }, 2000)
      }
      toast.success("Copied!", {
        description: "Content copied to clipboard.",
      })
    })
    .catch((error) => {
      toast.error("Error copying", {
        description: "Please copy the text manually.",
      })
      throw error
    })
} 