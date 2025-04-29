"use client"

import { useState, useEffect, useRef } from "react"
import { 
  Lock, 
  Unlock, 
  Key, 
  Info, 
  Copy, 
  Check, 
  FileText,
  Download,
  Upload,
  AlertTriangle,
  History,
  Trash2,
  Settings,
  Eye,
  EyeOff,
  QrCode,
  RefreshCw,
  Link2,
  ShieldCheck
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { encryptMessage, decryptMessage, generateSecureKey, calculatePasswordStrength, createShareableLink, extractSharedContent } from "@/lib/encryption"
import { toast } from "sonner"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Toaster } from "sonner"
import { QRCodeSVG } from "qrcode.react"
import { HistoryTable, HistoryItem } from "@/components/table/history-table"
import { copyToClipboard } from "@/utils/clipboard"
import { ThemeToggle } from "@/components/themes/theme-toggle"

export default function DallaCrypt() {
  let key = ""
  const [keyState, setKeyState] = useState("")
  const [message, setMessage] = useState("")
  const [encryptedMessage, setEncryptedMessage] = useState("")
  const [decryptInput, setDecryptInput] = useState("")
  const [decryptedMessage, setDecryptedMessage] = useState("")
  const [decryptError, setDecryptError] = useState(false)
  const [copied, setCopied] = useState(false)
  const [activeTab, setActiveTab] = useState("encrypt")
  const [activeFileTab, setActiveFileTab] = useState("encrypt-file")
  const [isEncrypting, setIsEncrypting] = useState(false)
  const [isDecrypting, setIsDecrypting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [fileToEncrypt, setFileToEncrypt] = useState<File | null>(null)
  const [encryptedFile, setEncryptedFile] = useState<string | null>(null)
  const [decryptedFile, setDecryptedFile] = useState<{name: string, data: string} | null>(null)
  const [encryptionHistory, setEncryptionHistory] = useState<HistoryItem[]>([])
  const [passwordStrength, setPasswordStrength] = useState(0)
  const [showQrCode, setShowQrCode] = useState(false)
  const [highSecurity, setHighSecurity] = useState(false)
  const [isTampered, setIsTampered] = useState(false)
  const [shareableLink, setShareableLink] = useState<string | null>(null)
  const [isLinkCopied, setIsLinkCopied] = useState(false)
  const [includePasswordInLink, setIncludePasswordInLink] = useState(false)
  const [showDownloadDialog, setShowDownloadDialog] = useState(false)
  const [downloadFileName, setDownloadFileName] = useState("message-decrypted")
  const [fileToDecrypt, setFileToDecrypt] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isDecryptDragging, setIsDecryptDragging] = useState(false)
  const [fileDecryptError, setFileDecryptError] = useState<string | null>(null)
  
  key = keyState

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedHistory = localStorage.getItem('dallaCrypt_history')
        if (savedHistory) {
          setEncryptionHistory(JSON.parse(savedHistory))
        }
      } catch (e) {
        console.error("Error loading history from localStorage:", e)
      }
    }
  }, [])

  useEffect(() => {
    if (copied) {
      const timeout = setTimeout(() => {
        setCopied(false)
      }, 2000)
      return () => clearTimeout(timeout)
    }
  }, [copied])

  useEffect(() => {
    if (isEncrypting) {
      const timeout = setTimeout(() => {
        setIsEncrypting(false)
      }, 1500)
      return () => clearTimeout(timeout)
    }
  }, [isEncrypting])

  useEffect(() => {
    if (isDecrypting) {
      const timeout = setTimeout(() => {
        setIsDecrypting(false)
      }, 1500)
      return () => clearTimeout(timeout)
    }
  }, [isDecrypting])

  useEffect(() => {
    if (!keyState) {
      setPasswordStrength(0)
      return
    }
    
    let strength = 0
    if (keyState.length > 7) strength += 25
    if (/[a-z]/.test(keyState) && /[A-Z]/.test(keyState)) strength += 25
    if (/[0-9]/.test(keyState)) strength += 25
    if (/[^A-Za-z0-9]/.test(keyState)) strength += 25
    
    setPasswordStrength(strength)
  }, [keyState])

  useEffect(() => {
    const sharedData = extractSharedContent(window.location.href)
    if (sharedData.content) {
      setDecryptInput(sharedData.content)
      setActiveTab("decrypt")
      
      if (sharedData.key) {
        setKeyState(sharedData.key)
        
        toast.info("Key detected in the link", {
          description: "The shared key has been automatically applied.",
        })
      }
      
      window.history.replaceState({}, document.title, window.location.pathname)
      
      toast.info("Shared content detected", {
        description: "The shared content has been automatically applied. Enter the key to decrypt it.",
      })
    }
  }, [])

  useEffect(() => {
    setPasswordStrength(calculatePasswordStrength(keyState))
  }, [keyState])

  function handleEncrypt() {
    if (!key || !message) return

    setIsEncrypting(true)

    const performEncryption = async () => {
      try {
        const encryptOptions = {
          highSecurity,
        };
        
        const encrypted = await encryptMessage(message, key, encryptOptions)
        setEncryptedMessage(encrypted)
        
        const shareLink = createShareableLink(
          encrypted, 
          includePasswordInLink ? key : undefined
        )
        setShareableLink(shareLink)
        
        addToHistory('encrypt', 'Text message', encrypted)
        
        toast.success("Encrypted message", {
          description: highSecurity 
            ? "High security encryption completed." 
            : "Your message has been encrypted successfully.",
        })
      } catch (error) {
        console.error("Encryption error:", error)
        toast.error("Encryption error", {
          description: "There was an error encrypting your message.",
        })
      } finally {
        setIsEncrypting(false)
      }
    }

    performEncryption()
  }

  function handleDecrypt() {
    if (!key || !decryptInput) return

    setIsDecrypting(true)
    setIsTampered(false)

    const performDecryption = async () => {
      try {
        const decrypted = await decryptMessage(decryptInput, key)
        setDecryptedMessage(decrypted.message)
        setDecryptError(false)
        
        if (decrypted.tampered) {
          setIsTampered(true)
          toast.warning("Security warning", {
            description: "This message could have been tampered with or altered.",
            duration: 5000,
          })
        }
        
        addToHistory('decrypt', 'Text message', decrypted.message)
      } catch (error) {
        console.error("Decryption error:", error)
        setDecryptedMessage("")
        setDecryptError(true)
        
        let errorMsg = "Could not decrypt. Verify your key and try again."
        
        if (error instanceof Error) {
          if (error.message.includes("manipulado")) {
            errorMsg = "This message has been tampered with and cannot be trusted."
          }
        }
        
        toast.error("Decryption error", {
          description: errorMsg,
        })
      } finally {
        setIsDecrypting(false)
      }
    }

    performDecryption()
  }

  function handleFileEncrypt(file: File) {
    if (!key || !file) return
    
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > MAX_FILE_SIZE) {
      toast.error("File too large", {
        description: "The file must not exceed 5MB for secure encryption.",
      })
      return
    }
    
    setIsEncrypting(true)
    
    const reader = new FileReader()
    reader.onload = (event) => {
      if (event.target?.result) {
        const fileContent = event.target.result.toString()
        
        try {
          const fileObject = {
            name: file.name,
            type: file.type,
            lastModified: file.lastModified,
            content: fileContent
          }
          
          const jsonString = JSON.stringify(fileObject)
          
          const encrypted = encryptMessage(jsonString, key)
          setEncryptedFile(encrypted)
          
          addToHistory('encrypt', file.name, encrypted)
          
          toast.success("Encrypted file", {
            description: "Your file has been encrypted successfully.",
          })
        } catch (error) {
          console.error("File encryption error:", error)
          toast.error("Encryption error", {
            description: "Could not encrypt the file. The file might be too large or corrupted.",
          })
        } finally {
          setTimeout(() => {
            setIsEncrypting(false)
          }, 800)
        }
      }
    }
    reader.onerror = () => {
      toast.error("Reading error", {
        description: "Could not read the file. Try with a smaller file or in another format.",
      })
      setIsEncrypting(false)
    }
    
    reader.readAsDataURL(file)
  }
  
  function handleFileDecrypt(encryptedContent: string) {
    if (!key || !encryptedContent) return
    
    setIsDecrypting(true)
    setFileDecryptError(null)
    
    setTimeout(() => {
      try {
        const decrypted = decryptMessage(encryptedContent, key)
        
        if (typeof decrypted.message === 'string' && !decrypted.message.startsWith('{') && !decrypted.message.includes('"name"') && !decrypted.message.includes('"content"')) {
          setFileDecryptError("This appears to be a text message, not a file. Please use the 'Decrypt' tab for text messages.");
          setDecryptedFile(null);
          setIsDecrypting(false);
          return;
        }
        
        let fileObject;
        try {
          fileObject = JSON.parse(decrypted.message);
        } catch (jsonError) {          
          if (jsonError instanceof Error) {
            if (jsonError.message.includes("Unexpected token")) {
              setFileDecryptError(`Invalid JSON format: ${jsonError.message}. This is likely not a file encrypted with DallaCrypt file encryption.`);
            } else {
              setFileDecryptError("The decrypted content is not a valid file. Make sure you are decrypting an encrypted file with DallaCrypt.");
            }
          } else {
            setFileDecryptError("The decrypted content is not a valid file. Make sure you are decrypting an encrypted file with DallaCrypt.");
          }
          
          setDecryptedFile(null);
          setTimeout(() => {
            setIsDecrypting(false);
          }, 100);
          return;
        }
        
        if (fileObject && typeof fileObject === 'object' && fileObject.name && fileObject.content) {
          setDecryptedFile({
            name: fileObject.name,
            data: fileObject.content
          });
          
          addToHistory('decrypt', fileObject.name, decrypted.message);
          
          toast.success("Decrypted file", {
            description: "Your file has been decrypted successfully.",
          });
        } else {
          setFileDecryptError("Invalid file format. The file appears to be a JSON object but doesn't have the expected name and content properties.");
          setDecryptedFile(null);
        }
      } catch (error) {
        console.error("File decryption error:", error);
        setDecryptedFile(null);
        
        if (error instanceof Error) {
          setFileDecryptError(`Could not decrypt the file: ${error.message}`);
        } else {
          setFileDecryptError("Could not decrypt the file. Please verify your key or check if the file is valid.");
        }
      } finally {
        setTimeout(() => {
          setIsDecrypting(false);
        }, 100);
      }
    }, 600);
  }
  
  function downloadEncryptedText(content: string, fileName: string) {
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = fileName || 'encrypted-message.txt'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    URL.revokeObjectURL(url)
  }
  
  function downloadDecryptedText(format: string) {
    if (!decryptedMessage) return
    
    let content = decryptedMessage
    let mimeType = 'text/plain'
    let extension = 'txt'
    
    if (format === 'json') {
      try {
        const jsonObj = JSON.parse(decryptedMessage)
        content = JSON.stringify(jsonObj, null, 2)
        mimeType = 'application/json'
        extension = 'json'
      } catch (e) {
        content = JSON.stringify({ content: decryptedMessage }, null, 2)
        mimeType = 'application/json'
        extension = 'json'
      }
    } else if (format === 'html') {
      content = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Decrypted content</title>
</head>
<body>
  <pre>${decryptedMessage}</pre>
</body>
</html>`
      mimeType = 'text/html'
      extension = 'html'
    } else if (format === 'markdown' || format === 'md') {
      content = `# Decrypted content\n\`\`\`\n${decryptedMessage}\n\`\`\``
      mimeType = 'text/markdown'
      extension = 'md'
    } else if (format === 'csv' && decryptedMessage.includes(',')) {
      mimeType = 'text/csv'
      extension = 'csv'
    } else if (format === 'xml' && (decryptedMessage.includes('<') || decryptedMessage.includes('>'))) {
      mimeType = 'application/xml'
      extension = 'xml'
    } else if (format === 'yaml' || format === 'yml') {
      mimeType = 'application/x-yaml'
      extension = 'yaml'
    }
    
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = `${downloadFileName}.${extension}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    URL.revokeObjectURL(url)
    
    setShowDownloadDialog(false)
    
    toast.success("File downloaded", {
      description: `The message has been downloaded in ${format.toUpperCase()} format.`,
    })
  }
  
  function downloadDecryptedFile() {
    if (!decryptedFile) return
    
    const link = document.createElement('a')
    link.href = decryptedFile.data
    link.download = decryptedFile.name
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
  
  function addToHistory(type: 'encrypt' | 'decrypt', name: string, content: string = '') {
    const newEntry = {
      timestamp: Date.now(),
      type,
      name,
      favorite: false,
      content
    }
    
    setEncryptionHistory(prev => {
      const newHistory = [newEntry, ...prev].slice(0, 50)
      
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('dallaCrypt_history', JSON.stringify(newHistory))
        } catch (e) {
          console.error("Error saving history to localStorage:", e)
        }
      }
      
      return newHistory
    })
  }
  
  function toggleFavorite(item: HistoryItem) {
    setEncryptionHistory(prev => {
      const newHistory = prev.map(entry => 
        entry.timestamp === item.timestamp 
          ? { ...entry, favorite: !entry.favorite } 
          : entry
      )
      
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('dallaCrypt_history', JSON.stringify(newHistory))
        } catch (e) {
          console.error("Error updating history in localStorage:", e)
        }
      }
      
      return newHistory
    })
  }
  
  function deleteHistoryItem(item: HistoryItem) {
    setEncryptionHistory(prev => {
      const newHistory = prev.filter(entry => entry.timestamp !== item.timestamp)
      
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('dallaCrypt_history', JSON.stringify(newHistory))
        } catch (e) {
          console.error("Error updating history in localStorage:", e)
        }
      }
      
      return newHistory
    })
  }
  
  function clearHistory() {
    setEncryptionHistory([])
    
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('dallaCrypt_history')
      } catch (e) {
        console.error("Error clearing history from localStorage:", e)
      }
    }
    
    toast.success("History deleted", {
      description: "All activity history has been deleted.",
    })
  }
  
  function generateQRCode() {
    if (!encryptedMessage) return
    
    if (!shareableLink) {
      const newShareableLink = createShareableLink(
        encryptedMessage,
        includePasswordInLink ? key : undefined
      )
      setShareableLink(newShareableLink)
    }
    
    setShowQrCode(true)
  }

  function generateRandomKey() {
    const newKey = generateSecureKey()
    setKeyState(newKey)
    
    toast.success("Key generated", {
      description: "A secure random key has been generated.",
    })
  }

  function copyShareableLink() {
    if (!shareableLink) return
    
    copyToClipboard(shareableLink, setIsLinkCopied)
  }

  function setTab(tabName: string) {
    setActiveTab(tabName);
    const tabsElement = document.querySelector('.tabs-list');
    if (tabsElement) {
      tabsElement.scrollIntoView({ behavior: 'smooth' });
    }
  }

  function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }

  function handleDragLeave(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFileToEncrypt(e.dataTransfer.files[0]);
    }
  }

  function handleDecryptDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setIsDecryptDragging(true);
  }

  function handleDecryptDragLeave(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setIsDecryptDragging(false);
  }

  function handleDecryptDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setIsDecryptDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      setFileToDecrypt(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setDecryptInput(event.target.result.toString());
        }
      };
      reader.readAsText(file);
    }
  }

  return (
    <main className="min-h-screen bg-background text-foreground p-4 md:p-8 overflow-x-hidden relative">
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_hsl(var(--accent)/0.05)_0%,_transparent_70%)]"></div>
      </div>
      
      <div className="max-w-5xl mx-auto relative z-10">
        <header className="mb-8">
          <div className="flex justify-end mb-2">
            <ThemeToggle />
          </div>
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-3">DallaCrypt</h1>
            <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto text-balance">
              Military-grade encryption for your sensitive data
            </p>
            <p className="text-muted-foreground/70 text-sm mt-2">
              100% local - your information never leaves your device
            </p>
          </div>
        </header>

        <Card className="mb-8 overflow-hidden relative z-10 border rounded-xl">
          <CardContent className="p-0">
            <div className="p-6 bg-secondary/50 border-b relative">
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <div className={`flex flex-col gap-2 ${(activeTab === "decrypt" || (activeTab === "file" && activeFileTab === "decrypt-file")) ? "w-full" : "w-full md:w-2/3"}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <Key className="h-5 w-5 text-primary" />
                    <h2 className="font-medium text-sm">Secret Key</h2>
                    <div className="ml-auto">
                      {(activeTab === "encrypt" || (activeTab === "file" && activeFileTab === "encrypt-file")) && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={generateRandomKey}
                                className="h-7 text-muted-foreground hover:text-foreground cursor-pointer"
                                aria-label="Generate a secure random key"
                              >
                                <RefreshCw className="h-3.5 w-3.5 mr-1" />
                                <span className="text-xs">Generate</span>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Generate a secure random key</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                  </div>
                  
                  <div className="relative">
                    <div className="flex items-center relative border bg-background/80 rounded-md transition-all focus-within:ring-1 focus-within:ring-primary focus-within:border-primary">
                      <input
                        id="key-input"
                        type={showPassword ? "text" : "password"}
                        value={keyState}
                        onChange={(e) => setKeyState(e.target.value)}
                        placeholder="Enter your secret key here"
                        className="flex-1 bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground py-2 px-3 rounded-md"
                        autoComplete="off"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowPassword(!showPassword)}
                        className="mr-1 text-muted-foreground hover:text-foreground cursor-pointer"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 ml-1">
                      Keep your key safe - anyone with this key can access your encrypted content
                    </p>
                  </div>
                </div>
                
                {activeTab !== "decrypt" && !(activeTab === "file" && activeFileTab === "decrypt-file") && (
                  <div className="flex flex-col gap-2 w-full md:w-1/3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium">Key Strength</span>
                      <span className={`text-xs font-medium ${
                        passwordStrength < 20 ? "text-destructive" : 
                        passwordStrength < 40 ? "text-orange-500" : 
                        passwordStrength < 60 ? "text-amber-500" : 
                        passwordStrength < 80 ? "text-blue-500" :
                        "text-green-500 font-bold"
                      }`}>
                        {passwordStrength < 20 ? "Weak" : 
                        passwordStrength < 40 ? "Regular" : 
                        passwordStrength < 60 ? "Good" : 
                        passwordStrength < 80 ? "Strong" :
                        "Very Strong"}
                      </span>
                    </div>
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-300 ${
                          passwordStrength < 20 ? "bg-gradient-to-r from-red-600 to-red-400" : 
                          passwordStrength < 40 ? "bg-gradient-to-r from-orange-500 to-amber-500" : 
                          passwordStrength < 60 ? "bg-gradient-to-r from-amber-400 to-yellow-300" : 
                          passwordStrength < 80 ? "bg-gradient-to-r from-blue-500 to-blue-400" :
                          "bg-gradient-to-r from-emerald-600 via-green-500 to-green-400"
                        }`}
                        style={{ width: `${passwordStrength}%` }}
                      ></div>
                    </div>
                    
                    <div className="flex items-center mt-1 gap-2">
                      <Switch
                        id="high-security"
                        checked={highSecurity}
                        onCheckedChange={setHighSecurity}
                        className="cursor-pointer"
                      />
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Label htmlFor="high-security" className="text-xs cursor-pointer flex items-center gap-1">
                              <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                              High security mode
                            </Label>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs max-w-60">Increases encryption strength by 10x, making it more resistant to brute force attacks</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full isolate">
              <TabsList className="w-full bg-background/80 rounded-none overflow-hidden flex tabs-list border-b">
                <TabsTrigger
                  value="encrypt"
                  className="flex-1 py-2 font-medium transition-all data-[state=active]:bg-gradient-to-b data-[state=active]:from-background data-[state=active]:to-background/90 data-[state=active]:text-primary data-[state=active]:shadow-sm cursor-pointer"
                >
                  <div className="flex items-center justify-center gap-2">
                    <div className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary">
                      <Lock className="h-4 w-4" />
                    </div>
                    <span>Encrypt</span>
                  </div>
                </TabsTrigger>
                <TabsTrigger
                  id="decrypt-tab"
                  value="decrypt"
                  className="flex-1 py-2 font-medium transition-all data-[state=active]:bg-gradient-to-b data-[state=active]:from-background data-[state=active]:to-background/90 data-[state=active]:text-accent data-[state=active]:shadow-sm cursor-pointer"
                >
                  <div className="flex items-center justify-center gap-2">
                    <div className="flex items-center justify-center w-7 h-7 rounded-full bg-accent/10 text-accent">
                      <Unlock className="h-4 w-4" />
                    </div>
                    <span>Decrypt</span>
                  </div>
                </TabsTrigger>
                <TabsTrigger
                  value="file"
                  className="flex-1 py-2 font-medium transition-all data-[state=active]:bg-gradient-to-b data-[state=active]:from-background data-[state=active]:to-background/90 data-[state=active]:text-amber-400 data-[state=active]:shadow-sm cursor-pointer"
                >
                  <div className="flex items-center justify-center gap-2">
                    <div className="flex items-center justify-center w-7 h-7 rounded-full bg-amber-400/10 text-amber-400">
                      <FileText className="h-4 w-4" />
                    </div>
                    <span>Files</span>
                  </div>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="encrypt" className="bg-background/95 p-4 space-y-4 mt-0">
                <div className="space-y-3">
                  <div className="relative">
                    <textarea
                      id="message-input"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Write the message you want to encrypt..."
                      className="w-full h-40 bg-secondary border rounded-md p-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                    />
                    <div className="text-xs text-muted-foreground mt-1 flex justify-between">
                      <span>{message.length} characters</span>
                      {message.length > 0 && (
                        <button 
                          onClick={() => setMessage('')}
                          className="cursor-pointer text-muted-foreground hover:text-foreground transition-colors"
                          aria-label="Clear message"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col space-y-2">
                    <Button
                      id="encrypt-button"
                      onClick={handleEncrypt}
                      className={`cursor-pointer w-full bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-300 ${isEncrypting ? "animate-encrypt-pulse" : ""}`}
                      disabled={!keyState || !message || isEncrypting}
                    >
                      {isEncrypting ? (
                        <div className="flex items-center">
                          <span className="animate-encryption-dots">Encrypting</span>
                        </div>
                      ) : (
                        <>
                          <Lock className="h-4 w-4 mr-2" />
                          Encrypt message
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {encryptedMessage && (
                  <div className={`space-y-3 animate-result-appear`}>
                    <div className="flex justify-between items-center">
                      <h3 className="text-sm font-medium text-foreground">Encrypted result:</h3>
                      <div className="flex gap-2">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => generateQRCode()}
                                className="h-8 cursor-pointer"
                                aria-label="Generate QR code"
                              >
                                <QrCode className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Generate QR code</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => downloadEncryptedText(encryptedMessage, 'encrypted-message.txt')}
                                className="h-8 cursor-pointer"
                                aria-label="Download as file"
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Download as file</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(encryptedMessage, setCopied)}
                          className="h-8 cursor-pointer"
                          aria-label="Copy to clipboard"
                        >
                          {copied ? (
                            <Check className="h-4 w-4 mr-1 text-primary" />
                          ) : (
                            <Copy className="h-4 w-4 mr-1" />
                          )}
                          {copied ? "Copied!" : "Copy"}
                        </Button>
                      </div>
                    </div>
                    <div className="bg-secondary border rounded-md p-3 break-all font-mono text-sm text-primary max-h-40 overflow-y-auto relative">
                      {isEncrypting && (
                        <div className="absolute inset-0 bg-secondary flex items-center justify-center">
                          <div className="encryption-animation"></div>
                        </div>
                      )}
                      {encryptedMessage}
                    </div>
                    <div className="p-3 bg-secondary/50 border rounded-md">
                      <p className="text-sm text-foreground">
                        <AlertTriangle className="h-4 w-4 inline-block mr-1 text-amber-400" />
                        <strong>Important:</strong> Copy this encrypted text and share it securely. The recipient will need your secret key to decrypt it.
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        All encryption occurs locally in your browser. We never store your messages or keys on any server.
                      </p>
                      
                      {highSecurity && (
                        <p className="text-xs text-primary mt-1 flex items-center">
                          <ShieldCheck className="h-3 w-3 mr-1" />
                          This message is protected with high security settings.
                        </p>
                      )}
                      
                      {shareableLink && (
                        <div className="mt-3 pt-3 border-t border-border">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-medium">Shareable link:</span>
                            <div className="flex gap-2 items-center">
                              <div className="flex items-center gap-1">
                                <Switch
                                  id="include-password"
                                  checked={includePasswordInLink}
                                  onCheckedChange={(checked) => {
                                    setIncludePasswordInLink(checked);
                                    setShareableLink(createShareableLink(
                                      encryptedMessage,
                                      checked ? key : undefined
                                    ));
                                  }}
                                  className="scale-75 cursor-pointer"
                                />
                                <Label htmlFor="include-password" className="text-xs cursor-pointer">
                                  Include key
                                </Label>
                              </div>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={copyShareableLink}
                                className="h-6 px-2 cursor-pointer"
                              >
                                {isLinkCopied ? <Check className="h-3 w-3 mr-1" /> : <Copy className="h-3 w-3 mr-1" />}
                                {isLinkCopied ? "Copied!" : "Copy"}
                              </Button>
                            </div>
                          </div>
                          <div className="bg-background border rounded-md p-2 text-xs font-mono break-all text-foreground">
                            <Link2 className="h-3 w-3 inline-block mr-1 text-primary" />
                            {shareableLink}
                          </div>
                          <div className="flex mt-1 text-xs text-muted-foreground">
                            <p>
                              This link contains your encrypted message. 
                              {includePasswordInLink
                                ? <span className="text-amber-500"> The key is included in the link; anyone who receives it will be able to access the content directly.</span>
                                : " Whoever receives it, will need the key to decrypt it."}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {showQrCode && (
                  <Dialog open={showQrCode} onOpenChange={setShowQrCode}>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Encrypted message QR code</DialogTitle>
                        <DialogDescription>
                          Share this QR code to transfer your encrypted message.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="flex justify-center p-4 bg-white rounded-md">
                        <QRCodeSVG 
                          value={shareableLink || createShareableLink(encryptedMessage, includePasswordInLink ? key : undefined)} 
                          size={256}
                          bgColor={"#ffffff"}
                          fgColor={"#000000"}
                          level={"M"}
                          includeMargin={true}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground text-center">
                        When scanning this QR code, it will open a link with the encrypted message.
                        {!includePasswordInLink && " Whoever receives it, will need the key to decrypt it."}
                      </p>
                    </DialogContent>
                  </Dialog>
                )}
              </TabsContent>

              <TabsContent value="decrypt" className="bg-background/95 p-4 space-y-4 mt-0">
                <div className="text-xs text-muted-foreground mb-2">
                  Paste the encrypted message and use the same secret key to decrypt it.
                </div>

                <textarea
                  value={decryptInput}
                  onChange={(e) => setDecryptInput(e.target.value)}
                  placeholder="Paste here the encrypted message..."
                  className="w-full h-32 bg-secondary border rounded-md p-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent transition-all"
                />

                <Button
                  onClick={handleDecrypt}
                  className={`cursor-pointer w-full bg-accent hover:bg-accent/90 text-accent-foreground transition-all duration-300 ${isDecrypting ? "animate-decrypt-pulse" : ""}`}
                  disabled={!keyState || !decryptInput || isDecrypting}
                >
                  {isDecrypting ? (
                    <div className="flex items-center">
                      <span className="animate-decryption-dots">Decrypting</span>
                    </div>
                  ) : (
                    <>
                      <Unlock className="h-4 w-4 mr-2" />
                      Decrypt message
                    </>
                  )}
                </Button>
                
                {(decryptedMessage || decryptError) && (
                  <div className={`space-y-3 animate-result-appear`}>
                    <h3 className="text-sm font-medium text-foreground">Decrypted result:</h3>
                    {decryptError ? (
                      <div className="bg-destructive/10 border border-destructive/30 rounded-md p-3 text-destructive relative">
                        {isDecrypting && (
                          <div className="absolute inset-0 bg-destructive/10 flex items-center justify-center">
                            <div className="decryption-error-animation"></div>
                          </div>
                        )}
                        Could not decrypt. The key might be incorrect.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="bg-secondary text-foreground border rounded-md p-3 font-medium max-h-64 overflow-y-auto relative">
                          {isDecrypting && (
                            <div className="absolute inset-0 bg-secondary flex items-center justify-center">
                              <div className="decryption-animation"></div>
                            </div>
                          )}
                          {decryptedMessage}
                        </div>
                        
                        <div className="flex justify-end gap-2">
                          <Dialog open={showDownloadDialog} onOpenChange={setShowDownloadDialog}>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 cursor-pointer"
                              >
                                <Download className="h-4 w-4 mr-1" />
                                Download
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Download decrypted message</DialogTitle>
                                <DialogDescription>
                                  Select a format to download your decrypted message.
                                </DialogDescription>
                              </DialogHeader>
                              
                              <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                  <Label htmlFor="file-name">File name</Label>
                                  <input
                                    id="file-name"
                                    value={downloadFileName}
                                    onChange={(e) => setDownloadFileName(e.target.value)}
                                    placeholder="File name"
                                    className="w-full bg-secondary border rounded-md p-2 text-sm text-foreground placeholder:text-muted-foreground"
                                  />
                                </div>
                                
                                <div className="grid grid-cols-2 gap-2">
                                  <Button 
                                    variant="outline" 
                                    onClick={() => downloadDecryptedText('txt')}
                                    className="justify-between cursor-pointer"
                                  >
                                    <span>Text (.txt)</span>
                                    <Download className="h-4 w-4 ml-1" />
                                  </Button>
                                  
                                  <Button 
                                    variant="outline" 
                                    onClick={() => downloadDecryptedText('json')}
                                    className="justify-between cursor-pointer"
                                  >
                                    <span>JSON (.json)</span>
                                    <Download className="h-4 w-4 ml-1" />
                                  </Button>
                                  
                                  <Button 
                                    variant="outline" 
                                    onClick={() => downloadDecryptedText('html')}
                                    className="justify-between cursor-pointer"
                                  >
                                    <span>HTML (.html)</span>
                                    <Download className="h-4 w-4 ml-1" />
                                  </Button>
                                  
                                  <Button 
                                    variant="outline" 
                                    onClick={() => downloadDecryptedText('md')}
                                    className="justify-between cursor-pointer"
                                  >
                                    <span>Markdown (.md)</span>
                                    <Download className="h-4 w-4 ml-1" />
                                  </Button>
                                  
                                  <Button 
                                    variant="outline" 
                                    onClick={() => downloadDecryptedText('csv')}
                                    className="justify-between cursor-pointer"
                                  >
                                    <span>CSV (.csv)</span>
                                    <Download className="h-4 w-4 ml-1" />
                                  </Button>
                                  
                                  <Button 
                                    variant="outline" 
                                    onClick={() => downloadDecryptedText('yaml')}
                                    className="justify-between cursor-pointer"
                                  >
                                    <span>YAML (.yaml)</span>
                                    <Download className="h-4 w-4 ml-1" />
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyToClipboard(decryptedMessage, setCopied)}
                            className="h-8 cursor-pointer"
                          >
                            {copied ? (
                              <Check className="h-4 w-4 mr-1 text-primary" />
                            ) : (
                              <Copy className="h-4 w-4 mr-1" />
                            )}
                            {copied ? "Copied!" : "Copy"}
                          </Button>
                        </div>
                      </div>
                    )}
                    <div className="p-3 bg-secondary/50 border rounded-md">
                      <p className="text-xs text-muted-foreground">
                        The decryption occurs completely in your browser. Your data and keys are never sent to any server.
                      </p>
                      
                      {isTampered && (
                        <div className="mt-2 p-2 bg-destructive/10 border border-destructive/30 rounded-md text-xs text-destructive">
                          <AlertTriangle className="h-3 w-3 inline-block mr-1" />
                          <strong>Warning:</strong> This message may have been tampered with or altered since it was encrypted.
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="file" className="bg-background/95 p-4 space-y-4 mt-0">
                <div className="bg-secondary/50 rounded-md p-3 border mb-4">
                  <h3 className="font-medium text-sm mb-2 flex items-center">
                    <FileText className="h-4 w-4 mr-2 text-amber-400" />
                    File encryption
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Encrypt and decrypt files securely. You can share encrypted files knowing that only those who have the correct key will be able to access them.
                  </p>
                </div>
                
                <Tabs defaultValue="encrypt-file" className="w-full" onValueChange={setActiveFileTab} value={activeFileTab}>
                  <TabsList className="w-full bg-background/60 rounded-md flex mb-5 p-1 shadow-none">
                    <TabsTrigger 
                      value="encrypt-file" 
                      className="flex-1 py-2 transition-all data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm rounded-md cursor-pointer"
                    >
                      <div className="flex items-center justify-center gap-2">
                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary">
                          <Lock className="h-3.5 w-3.5" />
                        </div>
                        <span className="font-medium">Encrypt file</span>
                      </div>
                    </TabsTrigger>
                    <TabsTrigger 
                      value="decrypt-file" 
                      className="flex-1 py-2 transition-all data-[state=active]:bg-background data-[state=active]:text-accent data-[state=active]:shadow-sm rounded-md cursor-pointer"
                    >
                      <div className="flex items-center justify-center gap-2">
                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-accent/10 text-accent">
                          <Unlock className="h-3.5 w-3.5" />
                        </div>
                        <span className="font-medium">Decrypt file</span>
                      </div>
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="encrypt-file" className="space-y-4">
                    <div 
                      className={`border border-dashed rounded-md p-6 text-center bg-secondary/30 ${isDragging ? 'border-primary ring-2 ring-primary/20' : ''}`}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                    >
                      {fileToEncrypt ? (
                        <div className="space-y-2">
                          <div className="flex items-center justify-center">
                            <FileText className="h-8 w-8 text-primary" />
                          </div>
                          <p className="text-foreground font-medium">{fileToEncrypt.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {(fileToEncrypt.size / 1024).toFixed(2)} KB
                          </p>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => setFileToEncrypt(null)}
                            className="mt-2 cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="flex items-center justify-center">
                            <Upload className={`h-8 w-8 ${isDragging ? 'text-primary animate-bounce' : 'text-muted-foreground'}`} />
                          </div>
                          <p className={`text-foreground ${isDragging ? 'font-medium' : ''}`}>
                            {isDragging ? 'Drop your file here' : 'Drag a file or click to select'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Maximum recommended size: 10MB
                          </p>
                          <input
                            type="file"
                            id="file-upload"
                            className="hidden"
                            onChange={(e) => e.target.files?.[0] && setFileToEncrypt(e.target.files[0])}
                          />
                          <Button 
                            variant="outline" 
                            onClick={() => document.getElementById('file-upload')?.click()}
                            className="cursor-pointer"
                          >
                            Select file
                          </Button>
                        </div>
                      )}
                    </div>
                    
                    <Button
                      onClick={() => fileToEncrypt && handleFileEncrypt(fileToEncrypt)}
                      className={`cursor-pointer w-full bg-primary hover:bg-primary/90 text-primary-foreground ${isEncrypting ? "animate-encrypt-pulse" : ""}`}
                      disabled={!keyState || !fileToEncrypt || isEncrypting}
                    >
                      {isEncrypting ? (
                        <div className="flex items-center">
                          <span className="animate-encryption-dots">Encrypting</span>
                        </div>
                      ) : (
                        <>
                          <Lock className="h-4 w-4 mr-2" />
                          Encrypt file
                        </>
                      )}
                    </Button>
                    
                    {encryptedFile && (
                      <div className="space-y-3 animate-result-appear">
                        <div className="flex justify-between items-center">
                          <h3 className="text-sm font-medium text-foreground">Encrypted file:</h3>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => downloadEncryptedText(encryptedFile, `${fileToEncrypt?.name || 'archivo'}.encrypted`)}
                              className="cursor-pointer"
                            >
                              <Download className="h-4 w-4 mr-1" />
                              Download
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyToClipboard(encryptedFile, setCopied)}
                              className="cursor-pointer"
                            >
                              {copied ? (
                                <Check className="h-4 w-4 mr-1 text-primary" />
                              ) : (
                                <Copy className="h-4 w-4 mr-1" />
                              )}
                              {copied ? "Copied!" : "Copy"}
                            </Button>
                          </div>
                        </div>
                        
                        <p className="text-xs text-muted-foreground">
                          To share the encrypted file, download it and send it, or copy the encrypted content.
                        </p>
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="decrypt-file" className="space-y-4">
                    <div className="text-xs text-muted-foreground mb-2">
                      Drag and drop an encrypted file or select one to decrypt
                    </div>
                    
                    <div 
                      className={`border border-dashed rounded-md p-6 text-center bg-secondary/30 ${
                        isDecryptDragging 
                          ? 'border-orange-500 ring-2 ring-orange-500/30 !border-[1.5px]' 
                          : fileDecryptError 
                            ? 'border-destructive/50' 
                            : ''
                      }`}
                      onDragOver={handleDecryptDragOver}
                      onDragLeave={handleDecryptDragLeave}
                      onDrop={handleDecryptDrop}
                    >
                      {fileToDecrypt ? (
                        <div className="space-y-2">
                          <div className="flex items-center justify-center">
                            <FileText className={`h-8 w-8 ${fileDecryptError ? 'text-destructive' : 'text-accent'}`} />
                          </div>
                          <p className="text-foreground font-medium">{fileToDecrypt.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {(fileToDecrypt.size / 1024).toFixed(2)} KB
                          </p>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => {
                              setFileToDecrypt(null);
                              setDecryptInput('');
                              setFileDecryptError(null);
                            }}
                            className="mt-2 cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="flex items-center justify-center">
                            <Upload className={`h-8 w-8 ${
                              isDecryptDragging 
                                ? 'text-orange-500 animate-bounce' 
                                : fileDecryptError 
                                  ? 'text-destructive' 
                                  : 'text-muted-foreground'
                            }`} />
                          </div>
                          <p className={`text-foreground ${isDecryptDragging ? 'font-medium text-orange-500' : ''}`}>
                            {isDecryptDragging 
                              ? 'Drop your file here' 
                              : fileDecryptError 
                                ? 'Try again with a different file' 
                                : 'Drag an encrypted file or click to select'
                            }
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Maximum recommended size: 10MB
                          </p>
                          <input
                            type="file"
                            id="file-decrypt-upload"
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files?.[0]) {
                                const file = e.target.files[0];
                                setFileToDecrypt(file);
                                setFileDecryptError(null);
                                const reader = new FileReader();
                                reader.onload = (event) => {
                                  if (event.target?.result) {
                                    setDecryptInput(event.target.result.toString());
                                  }
                                };
                                reader.readAsText(file);
                              }
                            }}
                          />
                          <Button 
                            variant="outline" 
                            onClick={() => document.getElementById('file-decrypt-upload')?.click()}
                            className="cursor-pointer"
                          >
                            Select encrypted file
                          </Button>
                        </div>
                      )}
                    </div>
                    
                    {fileDecryptError && (
                      <div className="bg-destructive/10 border border-destructive rounded-md p-3 mt-3 animate-fade-in">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-destructive">Decryption Error</p>
                            <p className="text-xs text-destructive/90 mt-1">{fileDecryptError}</p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <Button
                      onClick={() => handleFileDecrypt(decryptInput)}
                      className={`cursor-pointer w-full bg-accent hover:bg-accent/90 text-accent-foreground ${isDecrypting ? "animate-decrypt-pulse" : ""}`}
                      disabled={!keyState || !decryptInput || isDecrypting}
                    >
                      {isDecrypting ? (
                        <div className="flex items-center">
                          <span className="animate-decryption-dots">Decrypting</span>
                        </div>
                      ) : (
                        <>
                          <Unlock className="h-4 w-4 mr-2" />
                          Decrypt file
                        </>
                      )}
                    </Button>
                    
                    {decryptedFile && (
                      <div className="space-y-3 animate-result-appear">
                        <div className="bg-secondary border rounded-md p-4">
                          <div className="flex items-center gap-3">
                            <FileText className="h-6 w-6 text-accent" />
                            <div>
                              <h3 className="text-foreground font-medium">{decryptedFile.name}</h3>
                              <p className="text-xs text-muted-foreground">File decrypted successfully</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex justify-center">
                          <Button onClick={downloadDecryptedFile} className="cursor-pointer">
                            <Download className="h-4 w-4 mr-2" />
                            Download original file
                          </Button>
                        </div>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card className="glass-effect lg:col-span-3">
            <CardContent className="p-5">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <History className="h-5 w-5 text-primary" />
                Activity history
              </h2>
              
              <HistoryTable 
                data={encryptionHistory}
                onDelete={deleteHistoryItem}
                onToggleFavorite={toggleFavorite}
                onClearAll={clearHistory}
              />
            </CardContent>
          </Card>

          <Card className="glass-effect lg:col-span-3">
            <CardContent className="p-5">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Info className="h-5 w-5 text-accent" />
                FAQ
              </h2>

              <Accordion
                type="single"
                collapsible
                className="bg-card/50 border rounded-lg overflow-hidden"
              >
                <AccordionItem value="item-1" className="border-b border">
                  <AccordionTrigger className="px-4 py-3 hover:bg-secondary/50 text-left cursor-pointer">
                    How robust is this encryption technology?
                  </AccordionTrigger>
                  <AccordionContent className="px-4 py-3 bg-secondary/30 text-muted-foreground">
                    DallaCrypt implements military-grade AES-256 encryption with advanced PBKDF2 key derivation, trusted by intelligence agencies and banking systems worldwide. Without the exact encryption key, your content remains completely inaccessible, providing perfect protection for sensitive credentials and confidential information. When high security mode is activated, we enhance protection by increasing key derivation complexity tenfold, creating a virtually impenetrable defense against even the most sophisticated brute force attacks.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-2" className="border-b border">
                  <AccordionTrigger className="px-4 py-3 hover:bg-secondary/50 text-left cursor-pointer">
                    Is my encrypted content stored on servers?
                  </AccordionTrigger>
                  <AccordionContent className="px-4 py-3 bg-secondary/30 text-muted-foreground">
                    <strong>Absolutely not.</strong> DallaCrypt functions entirely within your browser's local environment. Neither your messages nor your encryption keys ever touch external servers or databases. This zero-transmission approach ensures that not even our development team can access your sensitive data. For optimal security, we recommend using DallaCrypt on personal devices you trust. Any history records are maintained exclusively in your browser's local storage and can be permanently erased with a single click.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-3" className="border-b border">
                  <AccordionTrigger className="px-4 py-3 hover:bg-secondary/50 text-left cursor-pointer">
                    What's the best way to share encrypted content?
                  </AccordionTrigger>
                  <AccordionContent className="px-4 py-3 bg-secondary/30 text-muted-foreground">
                    Once encryption is complete, simply use the "Copy" button to capture the encrypted text, which can then be distributed through any communication platform you prefer. Recipients will need to input this text into DallaCrypt's decryption field along with the identical secret key used during encryption. For enhanced convenience, you can utilize our shareable link feature or QR code generation, or even download the encrypted content as a file attachment. <strong>Security note:</strong> Always transmit your encryption key through a separate, secure communication channel to maintain maximum protection.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-4" className="border-b border">
                  <AccordionTrigger className="px-4 py-3 hover:bg-secondary/50 text-left cursor-pointer">
                    How is my privacy protected?
                  </AccordionTrigger>
                  <AccordionContent className="px-4 py-3 bg-secondary/30 text-muted-foreground">
                    Your information remains exclusively on your device throughout the entire process. Both encryption and decryption operations execute locally within your browser environment. DallaCrypt employs a true "zero-knowledge" architecture—we maintain no content servers, implement no message tracking databases, and possess no mechanism to access your encryption keys. This comprehensive approach delivers uncompromising privacy and security. Even complex file handling processes occur entirely within your browser's protected environment.
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="item-5" className="border-b border">
                  <AccordionTrigger className="px-4 py-3 hover:bg-secondary/50 text-left cursor-pointer">
                    What does the high security mode do?
                  </AccordionTrigger>
                  <AccordionContent className="px-4 py-3 bg-secondary/30 text-muted-foreground">
                    The high security mode multiplies the key derivation iterations by 10 (from 1,000 to 10,000), making it significantly more difficult to perform a brute force attack. This adds an additional layer of security for extremely sensitive data. Note that activating this mode may make encryption and decryption slightly slower on older devices, but provides significantly greater security. We recommend activating it to protect critical information such as cryptocurrency wallet passwords, private keys, or confidential documents.
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="item-6" className="border-b border">
                  <AccordionTrigger className="px-4 py-3 hover:bg-secondary/50 text-left cursor-pointer">
                    How do shareable links work?
                  </AccordionTrigger>
                  <AccordionContent className="px-4 py-3 bg-secondary/30 text-muted-foreground">
                    Shareable links contain the encrypted message within the URL. When someone opens the link, DallaCrypt automatically detects the encrypted content and places it in the decryption area. You have the option to include the key in the link (marking "Include key"), which allows anyone who receives the link to view the content directly without the need to manually enter the key. <strong>Warning:</strong> Including the key in the link is convenient but less secure, as anyone who obtains the link will be able to view your message. For sensitive information, it is better to share only the encrypted content and send the key through a separate channel.
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="item-7">
                  <AccordionTrigger className="px-4 py-3 hover:bg-secondary/50 text-left cursor-pointer">
                    What types of files can I encrypt?
                  </AccordionTrigger>
                  <AccordionContent className="px-4 py-3 bg-secondary/30 text-muted-foreground">
                    You can encrypt practically any type of file with DallaCrypt: documents, images, PDFs, ZIP files, etc. However, to ensure security and optimal performance, we recommend limiting the size of the files to 5MB or less. When encrypting, the file is converted into encrypted text that you can copy or download as an .encrypted file. This encrypted file can be shared securely, and only someone with the correct key will be able to decrypt it and recover the original file. Note that files encrypted with the file encryption function must be decrypted using the "Files" tab and not the normal "Decrypt" tab.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </div>

        <footer className="mt-12 py-8 border-t border bg-secondary/10 rounded-lg">
          <div className="max-w-5xl mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="space-y-4">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Lock className="h-5 w-5 text-primary" />
                  DallaCrypt
                </h3>
                <p className="text-sm text-muted-foreground">
                  Military-grade encryption to protect your sensitive information. 100% local - your data never leaves your device.
                </p>
                <div className="flex items-center gap-3 mt-4">
                  <a href="https://github.com/GastonDalla" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors" aria-label="GastonDalla GitHub">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                  </a>
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Quick links</h3>
                <ul className="space-y-2">
                  <li>
                    <a 
                      href="#" 
                      onClick={(e) => { e.preventDefault(); setTab('encrypt'); }} 
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Encrypt
                    </a>
                  </li>
                  <li>
                    <a 
                      href="#" 
                      onClick={(e) => { e.preventDefault(); setTab('decrypt'); }} 
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Decrypt
                    </a>
                  </li>
                  <li>
                    <a 
                      href="#" 
                      onClick={(e) => { e.preventDefault(); setTab('file'); }} 
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      File encryption
                    </a>
                  </li>
                  <li>
                    <a href="https://github.com/GastonDalla/DallaCrypt" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
                      GitHub repository
                    </a>
                  </li>
                </ul>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Legal information</h3>
                <p className="text-sm text-muted-foreground">
                  DallaCrypt was created by <a href="https://github.com/GastonDalla" className="text-foreground hover:underline">Gaston Dalla (Chicho)</a> in collaboration with <a href="https://anticheat.ac" className="text-foreground hover:underline">anticheat.ac</a>
                </p>
                <p className="text-sm text-muted-foreground">
                  Use it responsibly to protect sensitive information.
                </p>
                <div className="flex items-center gap-2 mt-4">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  <span className="text-xs font-medium">Zero-knowledge encryption - we do not store your data</span>
                </div>
                <div className="text-xs text-muted-foreground/70 mt-2">
                  <span>v1.0.0</span> • <span>© 2024-{new Date().getFullYear()} DallaCrypt</span>
                </div>
              </div>
            </div>
          </div>
        </footer>
      </div>

      <Toaster />
    </main>
  )
}

