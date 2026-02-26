import React from 'react'
import { useDroppable } from '@dnd-kit/core'
import { cn } from '@/lib/utils'

interface UngroupedDropZoneProps {
  children: React.ReactNode
  isDragActive: boolean
}

export function UngroupedDropZone({ children, isDragActive }: UngroupedDropZoneProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: 'ungrouped',
    data: { folderId: null },
  })

  const hasChildren = React.Children.count(children) > 0

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'min-h-[40px] rounded-md transition-colors',
        isOver && 'ring-2 ring-accent/50 bg-accent/5'
      )}
    >
      {children}
      {!hasChildren && isDragActive && (
        <div
          className={cn(
            'flex items-center justify-center min-h-[40px] text-xs text-text-muted transition-opacity',
            isOver ? 'opacity-100' : 'opacity-50'
          )}
        >
          Drop here to ungroup
        </div>
      )}
    </div>
  )
}
