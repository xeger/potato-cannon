import { useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { ArrowLeft, Plus, Star, Loader2 } from 'lucide-react'
import { useTemplates } from '@/hooks/queries'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CreateTemplateDialog } from './CreateTemplateDialog'
import { timeAgo } from '@/lib/utils'

/**
 * Grid of template cards with navigation to individual template editors
 */
export function TemplateList() {
  const navigate = useNavigate()
  const { data: templates, isLoading, error } = useTemplates()
  const [createDialogOpen, setCreateDialogOpen] = useState(false)

  const handleTemplateClick = (name: string) => {
    navigate({ to: '/templates/$name', params: { name } })
  }

  const handleCreateSuccess = (name: string) => {
    setCreateDialogOpen(false)
    navigate({ to: '/templates/$name', params: { name } })
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center text-destructive">
          <p>Failed to load templates</p>
          <p className="text-sm text-muted-foreground mt-1">{error.message}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <h1 className="text-xl font-semibold text-foreground">Templates</h1>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4" />
          New Template
        </Button>
      </div>

      {/* Template Grid */}
      <div className="flex-1 overflow-y-auto p-4">
        {templates?.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <p className="text-muted-foreground mb-4">No templates yet</p>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="h-4 w-4" />
              Create your first template
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {templates?.map((template) => (
              <Card
                key={template.name}
                className="cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => handleTemplateClick(template.name)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-base">{template.name}</CardTitle>
                    <div className="flex items-center gap-1">
                      {template.isDefault && (
                        <Badge variant="secondary" className="gap-1">
                          <Star className="h-3 w-3" />
                          Default
                        </Badge>
                      )}
                      <Badge variant="outline">v{template.version}</Badge>
                    </div>
                  </div>
                  {template.description && (
                    <CardDescription className="line-clamp-2">
                      {template.description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{template.phases?.length ?? 0} phases</span>
                    <span>Updated {timeAgo(template.updatedAt)}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create Template Dialog */}
      <CreateTemplateDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={handleCreateSuccess}
      />
    </div>
  )
}
