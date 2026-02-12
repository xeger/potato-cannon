import { useState, useMemo } from 'react'
import { Lightbulb, Search, Loader2, Plus } from 'lucide-react'
import { useBrainstorms } from '@/hooks/queries'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { IconButton } from '@/components/ui/icon-button'
import { BrainstormListItem } from './BrainstormListItem'

interface BrainstormMasterProps {
  projectId: string
  selectedId: string | null
  onSelect: (id: string, name: string) => void
  onNewSession: () => void
  isHidden: boolean
}

export function BrainstormMaster({
  projectId,
  selectedId,
  onSelect,
  onNewSession,
  isHidden
}: BrainstormMasterProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const { data: brainstorms, isLoading } = useBrainstorms(projectId)

  const filteredBrainstorms = useMemo(() => {
    if (!brainstorms) return []
    if (!searchQuery.trim()) return brainstorms

    const query = searchQuery.toLowerCase()
    return brainstorms.filter((b) =>
      b.name.toLowerCase().includes(query)
    )
  }, [brainstorms, searchQuery])

  return (
    <div
      className="brainstorm-master"
      data-hidden={isHidden}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-accent-yellow" />
          <h3 className="text-text-secondary font-semibold text-[13px]">Brainstorm</h3>
        </div>
        <IconButton tooltip="New Session" onClick={onNewSession}>
          <Plus className="h-4 w-4" />
        </IconButton>
      </div>

      {/* Search */}
      <div className="p-2 border-b border-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
          <Input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-8 text-sm"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 min-h-0 min-w-0">
        <ScrollArea className="h-full">
          <div className="p-2 space-y-2 max-w-full">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-text-muted" />
            </div>
          ) : filteredBrainstorms.length === 0 ? (
            <div className="text-center py-8">
              <Lightbulb className="h-8 w-8 text-text-muted mx-auto mb-2" />
              <p className="text-sm text-text-muted">
                {searchQuery ? 'No matching brainstorms' : 'No brainstorms yet'}
              </p>
            </div>
          ) : (
            filteredBrainstorms.map((brainstorm) => (
              <BrainstormListItem
                key={brainstorm.id}
                brainstorm={brainstorm}
                projectId={projectId}
                isSelected={brainstorm.id === selectedId}
                onSelect={() => onSelect(brainstorm.id, brainstorm.name)}
              />
            ))
          )}
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}
