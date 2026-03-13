import { describe, it, expect, afterEach } from 'vitest'
import { render, cleanup } from '@testing-library/react'
import { ListItemCard } from './list-item-card'

describe('ListItemCard', () => {
  afterEach(() => {
    cleanup()
  })

  it('renders children', () => {
    const { getByText } = render(<ListItemCard>Hello</ListItemCard>)
    expect(getByText('Hello')).toBeTruthy()
  })

  it('applies default selected classes when isSelected is true and no tintColor', () => {
    const { container } = render(<ListItemCard isSelected>Content</ListItemCard>)
    const card = container.firstElementChild as HTMLElement
    expect(card.className).toContain('border-accent/30')
    expect(card.className).toContain('bg-accent/10')
  })

  it('applies bold selected classes when selectedVariant is bold and no tintColor', () => {
    const { container } = render(
      <ListItemCard isSelected selectedVariant="bold">Content</ListItemCard>
    )
    const card = container.firstElementChild as HTMLElement
    expect(card.className).toContain('border-accent/50')
    expect(card.className).toContain('bg-accent/15')
    expect(card.className).toContain('ring-1')
    expect(card.className).toContain('ring-accent/20')
  })

  it('does not apply selected classes when isSelected is false', () => {
    const { container } = render(<ListItemCard>Content</ListItemCard>)
    const card = container.firstElementChild as HTMLElement
    expect(card.className).not.toContain('border-accent/30')
    expect(card.className).not.toContain('bg-accent/50')
  })

  it('blends accent into tintColor inline style when selected with tintColor', () => {
    const { container } = render(
      <ListItemCard isSelected selectedVariant="bold" tintColor="#ff0000">
        Content
      </ListItemCard>
    )
    const card = container.firstElementChild as HTMLElement
    expect(card.style.backgroundColor).toContain('color-mix')
    expect(card.style.backgroundColor).toContain('var(--color-accent)')
    expect(card.style.backgroundColor).toContain('#ff0000')
  })

  it('does not blend accent into tintColor inline style when not selected', () => {
    const { container } = render(
      <ListItemCard tintColor="#ff0000">Content</ListItemCard>
    )
    const card = container.firstElementChild as HTMLElement
    expect(card.style.backgroundColor).not.toContain('var(--color-accent)')
  })

  it('applies border accent classes even when tintColor is set and selected bold', () => {
    const { container } = render(
      <ListItemCard isSelected selectedVariant="bold" tintColor="#ff0000">
        Content
      </ListItemCard>
    )
    const card = container.firstElementChild as HTMLElement
    expect(card.className).toContain('border-accent/50')
    expect(card.className).toContain('ring-1')
    expect(card.className).toContain('ring-accent/20')
  })

  it('defaults selectedVariant to default when not specified', () => {
    const { container } = render(<ListItemCard isSelected>Content</ListItemCard>)
    const card = container.firstElementChild as HTMLElement
    // Should have default classes, not bold
    expect(card.className).toContain('border-accent/30')
    expect(card.className).not.toContain('border-accent/50')
    expect(card.className).not.toContain('ring-1')
  })
})
