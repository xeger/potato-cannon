import { Plus, FolderOpen } from 'lucide-react'
import { useAppStore } from '@/stores/appStore'

export function EmptyProjects() {
  const openAddProjectModal = useAppStore((s) => s.openAddProjectModal)

  return (
    <div className="flex flex-col items-center pt-24 p-8">
      {/* Logo - large centered version with all-direction fade */}
      <div className="brand-logo brand-logo--hero brand-logo--standard mb-8">
        <div className="brand-logo__potato">
          <svg viewBox="0 0 32 32" className="brand-logo__potato-svg">
            <ellipse cx="16" cy="16" rx="11" ry="9" className="brand-logo__potato-body" />
            <circle cx="12" cy="13" r="1.5" className="brand-logo__potato-spot" />
            <circle cx="19" cy="11" r="1" className="brand-logo__potato-spot" />
            <circle cx="14" cy="19" r="1.2" className="brand-logo__potato-spot" />
            <circle cx="21" cy="17" r="0.8" className="brand-logo__potato-spot" />
            <line x1="3" y1="14" x2="6" y2="14" className="brand-logo__motion-line" />
            <line x1="2" y1="17" x2="5" y2="17" className="brand-logo__motion-line" />
            <line x1="4" y1="20" x2="7" y2="20" className="brand-logo__motion-line" />
          </svg>
        </div>
        <div className="brand-logo__text">
          <span className="brand-logo__title">POTATO</span>
          <span className="brand-logo__subtitle">CANNON</span>
        </div>
      </div>

      {/* Message */}
      <h2 className="text-xl font-semibold text-text-primary mb-2 text-center">
        Welcome to Potato Cannon
      </h2>
      <p className="text-text-secondary mb-8 text-center max-w-md">
        Get started by creating your first project. Projects help you organize tickets and track progress with AI-powered automation.
      </p>

      {/* Actions - side by side */}
      <div className="flex gap-4">
        <button
          onClick={openAddProjectModal}
          className="flex flex-col items-center gap-3 p-6 rounded-lg bg-bg-secondary border border-border hover:border-accent hover:bg-bg-tertiary transition-colors min-w-[180px]"
        >
          <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
            <Plus className="h-6 w-6 text-accent" />
          </div>
          <div className="text-center">
            <div className="font-medium text-text-primary">Create New</div>
            <div className="text-sm text-text-muted">Start a fresh project</div>
          </div>
        </button>

        <button
          onClick={openAddProjectModal}
          className="flex flex-col items-center gap-3 p-6 rounded-lg bg-bg-secondary border border-border hover:border-accent hover:bg-bg-tertiary transition-colors min-w-[180px]"
        >
          <div className="w-12 h-12 rounded-full bg-accent-green/10 flex items-center justify-center">
            <FolderOpen className="h-6 w-6 text-accent-green" />
          </div>
          <div className="text-center">
            <div className="font-medium text-text-primary">Add Existing</div>
            <div className="text-sm text-text-muted">Import a project folder</div>
          </div>
        </button>
      </div>
    </div>
  )
}
