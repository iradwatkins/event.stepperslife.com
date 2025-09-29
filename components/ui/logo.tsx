'use client'

import { useTheme } from 'next-themes'
import Image from 'next/image'
import { useEffect, useState } from 'react'

interface LogoProps {
  className?: string
  width?: number
  height?: number
  priority?: boolean
}

export function Logo({ className = '', width = 200, height = 60, priority = false }: LogoProps) {
  const { theme, systemTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  // Determine the current theme
  const currentTheme = theme === 'system' ? systemTheme : theme
  const isDark = currentTheme === 'dark'

  // Show a neutral logo until mounted to prevent flashing
  if (!mounted) {
    return (
      <Image
        src="/logos/stepperslife-logo-light.svg"
        alt="Stepperslife Events"
        width={width}
        height={height}
        className={`transition-opacity duration-300 ${className}`}
        priority={priority}
      />
    )
  }

  return (
    <Image
      src={isDark ? '/logos/stepperslife-logo-light.svg' : '/logos/stepperslife-logo-dark.svg'}
      alt="Stepperslife Events"
      width={width}
      height={height}
      className={`transition-all duration-300 ${className}`}
      priority={priority}
    />
  )
}

// Compact version for navigation/headers
export function LogoCompact({ className = '', priority = false }: Omit<LogoProps, 'width' | 'height'>) {
  return <Logo className={className} width={120} height={36} priority={priority} />
}

// Large version for hero sections
export function LogoLarge({ className = '', priority = false }: Omit<LogoProps, 'width' | 'height'>) {
  return <Logo className={className} width={300} height={90} priority={priority} />
}