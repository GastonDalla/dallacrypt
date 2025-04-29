"use client"

import dynamic from "next/dynamic"
import { useState, useEffect } from "react"

const DallaCryptApp = dynamic(() => import("./crypt"), {
  ssr: false,
  loading: () => <LoadingState />,
})

function LoadingState() {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const timer = setTimeout(() => {
      setProgress((oldProgress) => {
        if (oldProgress === 100) {
          return 100
        }
        const diff = Math.random() * 10
        return Math.min(oldProgress + diff, 100)
      })
    }, 100)

    return () => {
      clearTimeout(timer)
    }
  }, [progress])

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_hsl(var(--accent)/0.15)_0%,_transparent_70%)]"></div>
      </div>
      
      <div className="z-10 text-center px-6 max-w-md">
        <div className="animated-gradient-border p-[1px] mb-8">
          <div className="p-2 bg-background rounded-[calc(var(--radius)-1px)]">
            <h1 className="text-4xl font-bold mb-1 bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
              DallaCrypt
            </h1>
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="encryption-animation mx-auto mb-4"></div>
          <p className="text-foreground font-medium">Initializing secure environment...</p>
          <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="text-muted-foreground text-sm">
            All encryption occurs locally in your browser
          </p>
        </div>
      </div>
      
      <div className="grain-overlay"></div>
    </div>
  )
}

export default function ClientWrapper() {
  return <DallaCryptApp />
}

