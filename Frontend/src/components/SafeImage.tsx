"use client"

import type React from "react"
import { useState } from "react"
import { DEFAULT_AVATAR, DEFAULT_IMAGE_PLACEHOLDER } from "../utils/placeholders"

interface SafeImageProps {
  src: string
  alt: string
  className?: string
  fallbackType?: "avatar" | "image"
  initials?: string
  onError?: () => void
}

export const SafeImage: React.FC<SafeImageProps> = ({
  src,
  alt,
  className = "",
  fallbackType = "avatar",
  initials = "?",
  onError,
}) => {
  const [hasError, setHasError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const handleError = () => {
    if (!hasError) {
      setHasError(true)
      setIsLoading(false)
      onError?.()
    }
  }

  const handleLoad = () => {
    setIsLoading(false)
  }

  if (hasError) {
    const fallbackSrc = fallbackType === "avatar" ? DEFAULT_AVATAR : DEFAULT_IMAGE_PLACEHOLDER
    return <img src={fallbackSrc || "/placeholder.svg"} alt={alt} className={className} />
  }

  return (
    <img src={src || "/placeholder.svg"} alt={alt} className={className} onError={handleError} onLoad={handleLoad} />
  )
}
