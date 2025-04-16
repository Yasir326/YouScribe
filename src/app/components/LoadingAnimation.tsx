"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"

export function LoadingAnimation() {
  const [progress, setProgress] = useState(0)
  const [messageIndex, setMessageIndex] = useState(0)

  const loadingMessages = [
    "Analyzing your content...",
    "Did you know? The average person spends 6 months of their lifetime waiting for red lights to turn green!",
    "Crafting your perfect summary...",
    "Fun fact: Honey never spoils. Archaeologists found 3000-year-old honey in Egyptian tombs!",
    "Almost there! Processing final touches...",
    "Did you know? Cows have best friends and get stressed when separated!",
    "Making sure we catch all the important details...",
    "Random fact: A day on Venus is longer than its year!",
    "Thanks for your patience, we're working hard on this...",
    "Did you know? The first oranges weren't orange - they were green!",
  ]

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prevProgress) => {
        if (prevProgress >= 100) {
          clearInterval(timer)
          return 100
        }
        return prevProgress + 1
      })
    }, 150)

    const messageTimer = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % loadingMessages.length)
    }, 3000) // Change message every 3 seconds

    return () => {
      clearInterval(timer)
      clearInterval(messageTimer)
    }
  }, [loadingMessages.length])

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="w-full flex flex-col gap-4 items-center justify-center p-8"
    >
      <div className="w-64 h-4 bg-gray-700 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-purple-600"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
      <div className="flex items-center gap-4">
        <span className="text-white">{progress}%</span>
        <motion.p
          key={messageIndex}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="text-gray-300 text-sm min-h-[20px] text-center"
        >
          {loadingMessages[messageIndex]}
        </motion.p>
      </div>
    </motion.div>
  )
}


