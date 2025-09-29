'use client'

import { usePageTransition } from './service'

export function TransitionWrapper({ children }: { children: React.ReactNode }) {
  const { wrapperRef, className } = usePageTransition()

  return (
    <div 
      ref={wrapperRef}
      className={className}
    >
      {children}
    </div>
  )
}