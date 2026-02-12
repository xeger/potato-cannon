import { LayoutGrid, List } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAppStore } from '@/stores/appStore'

export function ViewToggle() {
  const boardViewMode = useAppStore((s) => s.boardViewMode)
  const setBoardViewMode = useAppStore((s) => s.setBoardViewMode)

  return (
    <Tabs
      value={boardViewMode}
      onValueChange={(value) => setBoardViewMode(value as 'board' | 'table')}
    >
      <TabsList>
        <TabsTrigger value="board" aria-label="Board view">
          <LayoutGrid className="h-4 w-4" />
        </TabsTrigger>
        <TabsTrigger value="table" aria-label="Table view">
          <List className="h-4 w-4" />
        </TabsTrigger>
      </TabsList>
    </Tabs>
  )
}
