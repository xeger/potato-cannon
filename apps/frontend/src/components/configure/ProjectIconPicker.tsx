import { cn } from '@/lib/utils'
import {
  // Development
  Code, Terminal, GitBranch, Bug, Wrench, Cog, Settings, FileCode, Binary, Braces,
  // Packages & Deployment
  Package, Rocket, Layers, Box, Puzzle, Blocks, Archive, Container, Boxes,
  // Infrastructure
  Database, Server, Cloud, HardDrive, Cpu, Wifi, Network, Monitor, Laptop, Smartphone,
  // Creative
  Palette, Pen, Image, Film, Music, Sparkles, Brush, Camera, Video, Mic,
  // Business
  Briefcase, Building, Users, Target, TrendingUp, Zap, LineChart, PieChart, BarChart,
  // General
  Bookmark, Flag, Star, Heart, Globe, Folder, Home, Bell, Calendar, Clock,
  // Communication
  Mail, MessageSquare, Send, Phone, Radio,
  // Files & Documents
  File, FileText, Files, FolderOpen, FolderGit,
  // Nature & Objects
  Leaf, Sun, Moon, Mountain, Anchor, Compass, Map, Navigation,
  // Misc
  Shield, Lock, Key, Eye, Search, Filter, Hash, AtSign, Link, Lightbulb
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

const ICONS: { name: string; icon: LucideIcon }[] = [
  // Development
  { name: 'code', icon: Code },
  { name: 'terminal', icon: Terminal },
  { name: 'git-branch', icon: GitBranch },
  { name: 'bug', icon: Bug },
  { name: 'wrench', icon: Wrench },
  { name: 'cog', icon: Cog },
  { name: 'settings', icon: Settings },
  { name: 'file-code', icon: FileCode },
  { name: 'binary', icon: Binary },
  { name: 'braces', icon: Braces },
  // Packages & Deployment
  { name: 'package', icon: Package },
  { name: 'rocket', icon: Rocket },
  { name: 'layers', icon: Layers },
  { name: 'box', icon: Box },
  { name: 'puzzle', icon: Puzzle },
  { name: 'blocks', icon: Blocks },
  { name: 'archive', icon: Archive },
  { name: 'container', icon: Container },
  { name: 'boxes', icon: Boxes },
  // Infrastructure
  { name: 'database', icon: Database },
  { name: 'server', icon: Server },
  { name: 'cloud', icon: Cloud },
  { name: 'hard-drive', icon: HardDrive },
  { name: 'cpu', icon: Cpu },
  { name: 'wifi', icon: Wifi },
  { name: 'network', icon: Network },
  { name: 'monitor', icon: Monitor },
  { name: 'laptop', icon: Laptop },
  { name: 'smartphone', icon: Smartphone },
  // Creative
  { name: 'palette', icon: Palette },
  { name: 'pen', icon: Pen },
  { name: 'image', icon: Image },
  { name: 'film', icon: Film },
  { name: 'music', icon: Music },
  { name: 'sparkles', icon: Sparkles },
  { name: 'brush', icon: Brush },
  { name: 'camera', icon: Camera },
  { name: 'video', icon: Video },
  { name: 'mic', icon: Mic },
  // Business
  { name: 'briefcase', icon: Briefcase },
  { name: 'building', icon: Building },
  { name: 'users', icon: Users },
  { name: 'target', icon: Target },
  { name: 'trending-up', icon: TrendingUp },
  { name: 'zap', icon: Zap },
  { name: 'line-chart', icon: LineChart },
  { name: 'pie-chart', icon: PieChart },
  { name: 'bar-chart', icon: BarChart },
  // General
  { name: 'bookmark', icon: Bookmark },
  { name: 'flag', icon: Flag },
  { name: 'star', icon: Star },
  { name: 'heart', icon: Heart },
  { name: 'globe', icon: Globe },
  { name: 'folder', icon: Folder },
  { name: 'home', icon: Home },
  { name: 'bell', icon: Bell },
  { name: 'calendar', icon: Calendar },
  { name: 'clock', icon: Clock },
  // Communication
  { name: 'mail', icon: Mail },
  { name: 'message-square', icon: MessageSquare },
  { name: 'send', icon: Send },
  { name: 'phone', icon: Phone },
  { name: 'radio', icon: Radio },
  // Files & Documents
  { name: 'file', icon: File },
  { name: 'file-text', icon: FileText },
  { name: 'files', icon: Files },
  { name: 'folder-open', icon: FolderOpen },
  { name: 'folder-git', icon: FolderGit },
  // Nature & Objects
  { name: 'leaf', icon: Leaf },
  { name: 'sun', icon: Sun },
  { name: 'moon', icon: Moon },
  { name: 'mountain', icon: Mountain },
  { name: 'anchor', icon: Anchor },
  { name: 'compass', icon: Compass },
  { name: 'map', icon: Map },
  { name: 'navigation', icon: Navigation },
  // Misc
  { name: 'shield', icon: Shield },
  { name: 'lock', icon: Lock },
  { name: 'key', icon: Key },
  { name: 'eye', icon: Eye },
  { name: 'search', icon: Search },
  { name: 'filter', icon: Filter },
  { name: 'hash', icon: Hash },
  { name: 'at-sign', icon: AtSign },
  { name: 'link', icon: Link },
  { name: 'lightbulb', icon: Lightbulb },
]

interface ProjectIconPickerProps {
  value: string
  onChange: (icon: string) => void
  disabled?: boolean
  projectColor?: string
}

export function ProjectIconPicker({ value, onChange, disabled, projectColor }: ProjectIconPickerProps) {
  return (
    <div className="@container">
      <div className="grid grid-cols-5 gap-1 @xs:grid-cols-7 @sm:grid-cols-8 @md:grid-cols-9 @lg:grid-cols-10">
      {ICONS.map(({ name, icon: Icon }) => (
        <button
          key={name}
          type="button"
          disabled={disabled}
          onClick={() => onChange(name)}
          className={cn(
            'flex h-8 w-8 items-center justify-center rounded-md transition-colors',
            'hover:bg-bg-tertiary hover:text-text-primary',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            value === name
              ? 'bg-bg-tertiary'
              : 'text-text-secondary',
            value === name && !projectColor && 'text-text-primary'
          )}
          style={value === name && projectColor ? { color: projectColor } : undefined}
        >
          <Icon className="h-4 w-4" />
        </button>
      ))}
      </div>
    </div>
  )
}

// Export for use in sidebar
export function getProjectIcon(name: string): LucideIcon {
  const found = ICONS.find(i => i.name === name)
  return found?.icon ?? Package
}

export { ICONS }
