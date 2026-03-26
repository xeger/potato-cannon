import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { handleVerticalToHorizontalScroll } from './scroll-translation'

describe('handleVerticalToHorizontalScroll', () => {
  let container: HTMLElement
  let scrollableChild: HTMLElement

  beforeEach(() => {
    // Set up container with horizontal overflow
    container = document.createElement('div')

    // Mock scroll properties
    Object.defineProperties(container, {
      scrollWidth: { value: 2000, writable: true, configurable: true },
      clientWidth: { value: 400, writable: true, configurable: true },
      scrollLeft: { value: 0, writable: true, configurable: true },
      scrollHeight: { value: 100, writable: true, configurable: true },
      clientHeight: { value: 100, writable: true, configurable: true }
    })

    scrollableChild = document.createElement('div')
    Object.defineProperties(scrollableChild, {
      scrollHeight: { value: 500, writable: true, configurable: true },
      clientHeight: { value: 300, writable: true, configurable: true },
      scrollWidth: { value: 400, writable: true, configurable: true },
      clientWidth: { value: 400, writable: true, configurable: true }
    })

    container.appendChild(scrollableChild)
    document.body.appendChild(container)
  })

  afterEach(() => {
    if (document.body.contains(container)) {
      document.body.removeChild(container)
    }
  })

  it('returns false when deltaY is 0 (horizontal scroll)', () => {
    const event = new WheelEvent('wheel', { deltaY: 0 })
    Object.defineProperty(event, 'target', { value: scrollableChild, enumerable: true })

    const result = handleVerticalToHorizontalScroll(event, container)
    expect(result).toBe(false)
  })

  it('returns false when container has no horizontal overflow', () => {
    Object.defineProperty(container, 'scrollWidth', { value: 400, writable: true })

    const event = new WheelEvent('wheel', { deltaY: 100 })
    Object.defineProperty(event, 'target', { value: scrollableChild, enumerable: true })

    const result = handleVerticalToHorizontalScroll(event, container)
    expect(result).toBe(false)
  })

  it('translates vertical scroll to horizontal when target has no overflow', () => {
    // Create a non-scrollable child
    const nonScrollableChild = document.createElement('div')
    Object.defineProperties(nonScrollableChild, {
      scrollHeight: { value: 100, writable: true, configurable: true },
      clientHeight: { value: 100, writable: true, configurable: true }
    })
    container.appendChild(nonScrollableChild)

    const event = new WheelEvent('wheel', { deltaY: 50 })
    Object.defineProperty(event, 'target', { value: nonScrollableChild, enumerable: true })

    // Mock preventDefault
    let preventDefaultCalled = false
    Object.defineProperty(event, 'preventDefault', {
      value: () => { preventDefaultCalled = true },
      writable: true
    })

    const result = handleVerticalToHorizontalScroll(event, container)
    expect(result).toBe(true)
    expect(preventDefaultCalled).toBe(true)
    expect(container.scrollLeft).toBe(50)
  })

  it('does not translate scroll when target has vertical overflow', () => {
    const event = new WheelEvent('wheel', { deltaY: 50 })
    Object.defineProperty(event, 'target', { value: scrollableChild, enumerable: true })

    const result = handleVerticalToHorizontalScroll(event, container)
    expect(result).toBe(false)
    expect(container.scrollLeft).toBe(0) // Unchanged
  })

  it('does not translate scroll when parent up the tree has vertical overflow', () => {
    // Create nested structure: container > parent > child
    const parent = document.createElement('div')
    Object.defineProperties(parent, {
      scrollHeight: { value: 500, writable: true, configurable: true },
      clientHeight: { value: 300, writable: true, configurable: true }
    })

    const child = document.createElement('div')
    Object.defineProperties(child, {
      scrollHeight: { value: 100, writable: true, configurable: true },
      clientHeight: { value: 100, writable: true, configurable: true }
    })

    parent.appendChild(child)
    container.innerHTML = ''
    container.appendChild(parent)

    const event = new WheelEvent('wheel', { deltaY: 50 })
    Object.defineProperty(event, 'target', { value: child, enumerable: true })

    const result = handleVerticalToHorizontalScroll(event, container)
    expect(result).toBe(false)
    expect(container.scrollLeft).toBe(0) // Unchanged
  })

  it('respects negative deltaY (scroll up)', () => {
    const nonScrollableChild = document.createElement('div')
    Object.defineProperties(nonScrollableChild, {
      scrollHeight: { value: 100, writable: true, configurable: true },
      clientHeight: { value: 100, writable: true, configurable: true }
    })
    container.appendChild(nonScrollableChild)
    Object.defineProperty(container, 'scrollLeft', { value: 100, writable: true })

    const event = new WheelEvent('wheel', { deltaY: -50 })
    Object.defineProperty(event, 'target', { value: nonScrollableChild, enumerable: true })

    let preventDefaultCalled = false
    Object.defineProperty(event, 'preventDefault', {
      value: () => { preventDefaultCalled = true },
      writable: true
    })

    const result = handleVerticalToHorizontalScroll(event, container)
    expect(result).toBe(true)
    expect(preventDefaultCalled).toBe(true)
    expect(container.scrollLeft).toBe(50) // 100 + (-50)
  })

  it('tracks horizontal wheel events', () => {
    const event = new WheelEvent('wheel', { deltaX: 50, deltaY: 0 })
    Object.defineProperty(event, 'target', { value: container, enumerable: true })

    const result = handleVerticalToHorizontalScroll(event, container)
    expect(result).toBe(false) // Horizontal events are not translated
  })

  it('debounces vertical translation after horizontal wheel event', () => {
    const nonScrollableChild = document.createElement('div')
    Object.defineProperties(nonScrollableChild, {
      scrollHeight: { value: 100, writable: true, configurable: true },
      clientHeight: { value: 100, writable: true, configurable: true }
    })
    container.appendChild(nonScrollableChild)

    // Simulate horizontal wheel event
    const horizontalEvent = new WheelEvent('wheel', { deltaX: 50, deltaY: 0 })
    Object.defineProperty(horizontalEvent, 'target', { value: nonScrollableChild, enumerable: true })
    handleVerticalToHorizontalScroll(horizontalEvent, container)

    // Immediately try vertical scroll - should be blocked
    const verticalEvent = new WheelEvent('wheel', { deltaX: 0, deltaY: 50 })
    Object.defineProperty(verticalEvent, 'target', { value: nonScrollableChild, enumerable: true })

    let preventDefaultCalled = false
    Object.defineProperty(verticalEvent, 'preventDefault', {
      value: () => { preventDefaultCalled = true },
      writable: true
    })

    const result = handleVerticalToHorizontalScroll(verticalEvent, container)
    expect(result).toBe(false)
    expect(preventDefaultCalled).toBe(false)
  })

  it('allows vertical translation after debounce period', () => {
    vi.useFakeTimers()

    const nonScrollableChild = document.createElement('div')
    Object.defineProperties(nonScrollableChild, {
      scrollHeight: { value: 100, writable: true, configurable: true },
      clientHeight: { value: 100, writable: true, configurable: true }
    })
    container.appendChild(nonScrollableChild)

    // Simulate horizontal wheel event
    const horizontalEvent = new WheelEvent('wheel', { deltaX: 50, deltaY: 0 })
    Object.defineProperty(horizontalEvent, 'target', { value: nonScrollableChild, enumerable: true })
    handleVerticalToHorizontalScroll(horizontalEvent, container)

    // Advance time past debounce period (1500ms)
    vi.advanceTimersByTime(1500)

    // Now try vertical scroll - should be allowed
    const verticalEvent = new WheelEvent('wheel', { deltaX: 0, deltaY: 50 })
    Object.defineProperty(verticalEvent, 'target', { value: nonScrollableChild, enumerable: true })

    let preventDefaultCalled = false
    Object.defineProperty(verticalEvent, 'preventDefault', {
      value: () => { preventDefaultCalled = true },
      writable: true
    })

    const result = handleVerticalToHorizontalScroll(verticalEvent, container)
    expect(result).toBe(true)
    expect(preventDefaultCalled).toBe(true)

    vi.useRealTimers()
  })
})
