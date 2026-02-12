import { useState, useMemo, useRef, useEffect } from 'react'
import { Archive, ArchiveRestore, Search, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useArchivedTickets, useRestoreTicket } from '../../hooks/queries'
import { Input } from '../ui/input'
import { Button } from '../ui/button'
import { ListItemCard } from '../ui/list-item-card'

interface ArchivedSwimlaneProps {
  projectId: string
}

export function ArchivedSwimlane({ projectId }: ArchivedSwimlaneProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const { data: archivedTickets, isLoading } = useArchivedTickets(projectId)
  const restoreTicket = useRestoreTicket()

  const containerRef = useRef<HTMLDivElement>(null)

  // Scroll into view when archive column is revealed
  useEffect(() => {
    containerRef.current?.scrollIntoView({ behavior: 'smooth', inline: 'end' })
  }, [])

  const filteredTickets = useMemo(() => {
    if (!archivedTickets) return []
    if (!searchQuery.trim()) return archivedTickets

    const query = searchQuery.toLowerCase()
    return archivedTickets.filter(
      (ticket) =>
        ticket.id.toLowerCase().includes(query) ||
        ticket.title.toLowerCase().includes(query) ||
        (ticket.description?.toLowerCase().includes(query) ?? false)
    )
  }, [archivedTickets, searchQuery])

  const handleRestore = (ticketId: string) => {
    restoreTicket.mutate(
      { projectId, ticketId },
      {
        onSuccess: () => {
          toast.success('Ticket restored to Done')
        },
        onError: (error) => {
          toast.error('Failed to restore ticket', {
            description: (error as Error).message
          })
        }
      }
    )
  }

  return (
    <div ref={containerRef} className="flex-shrink-0 w-[280px] md:w-[320px] flex flex-col h-full bg-bg-secondary rounded-lg">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Archive className="h-4 w-4 text-yellow-500" />
          <h3 className="text-text-secondary font-semibold text-[13px]">Archived</h3>
        </div>
        <span className="text-text-muted text-xs bg-bg-tertiary px-2 py-0.5 rounded-[10px]">
          {filteredTickets.length}
        </span>
      </div>

      {/* Search */}
      <div className="p-2 border-b border-border">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
          <Input
            placeholder="Search archived..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-2">
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-text-muted" />
          </div>
        )}

        {!isLoading && filteredTickets.length === 0 && (
          <div className="text-center text-text-muted text-xs py-8">
            {searchQuery ? 'No archived tickets match your search' : 'No archived tickets'}
          </div>
        )}

        <div className="flex flex-col gap-2">
          {filteredTickets.map((ticket) => (
            <ListItemCard key={ticket.id}>
              <div className="p-3">
                {/* Ticket ID */}
                <div className="text-xs text-text-muted font-mono mb-1">{ticket.id}</div>

                {/* Ticket Title */}
                <div className="text-text-primary text-sm font-medium line-clamp-2 mb-2">
                  {ticket.title}
                </div>

                {/* Archived date */}
                {ticket.archivedAt && (
                  <div className="text-xs text-text-muted mb-2">
                    Archived {new Date(ticket.archivedAt).toLocaleDateString()}
                  </div>
                )}

                {/* Restore button */}
                <Button
                  variant="outline"
                  size="xs"
                  onClick={() => handleRestore(ticket.id)}
                  disabled={restoreTicket.isPending}
                >
                  <ArchiveRestore className="h-3 w-3" />
                  Restore
                </Button>
              </div>
            </ListItemCard>
          ))}
        </div>
      </div>
    </div>
  )
}
