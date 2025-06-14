// Create reusable placeholder utilities
export const createAvatarPlaceholder = (initials: string, size = 40) => {
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")
  
    canvas.width = size
    canvas.height = size
  
    // Background color
    ctx.fillStyle = "#6c757d"
    ctx.fillRect(0, 0, size, size)
  
    // Text
    ctx.fillStyle = "#ffffff"
    ctx.font = `${size * 0.4}px Arial`
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    ctx.fillText(initials, size / 2, size / 2)
  
    return canvas.toDataURL()
  }
  
  // Simple SVG data URL for fallback
  export const DEFAULT_AVATAR = `data:image/svg+xml;base64,${btoa(`
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" fill="#6c757d"/>
      <circle cx="20" cy="16" r="6" fill="#ffffff"/>
      <path d="M8 32c0-6.627 5.373-12 12-12s12 5.373 12 12" fill="#ffffff"/>
    </svg>
  `)}`
  
  export const DEFAULT_IMAGE_PLACEHOLDER = `data:image/svg+xml;base64,${btoa(`
    <svg width="600" height="400" viewBox="0 0 600 400" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="600" height="400" fill="#f8f9fa"/>
      <rect x="250" y="150" width="100" height="100" fill="#dee2e6"/>
      <text x="300" y="320" text-anchor="middle" fill="#6c757d" font-family="Arial" font-size="16">Image non disponible</text>
    </svg>
  `)}`
  