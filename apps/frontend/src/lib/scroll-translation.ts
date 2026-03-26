/**
 * Maps containers to the timestamp of their last horizontal wheel event.
 * Used to debounce vertical-to-horizontal translation when actively scrolling horizontally.
 */
const lastHorizontalWheelTime = new WeakMap<HTMLElement, number>()

/**
 * Minimum milliseconds since last horizontal wheel event before allowing vertical-to-horizontal translation.
 * This prevents "stealing focus" from an active horizontal scroll.
 */
const HORIZONTAL_SCROLL_DEBOUNCE_MS = 1500

/**
 * Handles vertical wheel events on a horizontally-scrollable container by translating
 * them to horizontal scroll when the target element has no vertical overflow.
 *
 * This allows ergonomic whole-page horizontal scrolling via vertical mouse wheel,
 * while preserving natural vertical scrolling for individual lanes that overflow.
 *
 * Debouncing: vertical-to-horizontal translation is suppressed for 1500ms after
 * a horizontal wheel event to avoid interfering with active horizontal scrolling.
 *
 * @param event - The wheel event to handle
 * @param container - The horizontally-scrollable container element
 * @returns Whether the event was intercepted and prevented
 *
 * @example
 * // In a wheel event listener:
 * if (handleVerticalToHorizontalScroll(event, scrollContainer)) {
 *   // Event was translated to horizontal scroll
 * }
 */
export function handleVerticalToHorizontalScroll(event: WheelEvent, container: HTMLElement): boolean {
  const now = Date.now()

  // Track horizontal wheel events
  if (event.deltaX !== 0) {
    lastHorizontalWheelTime.set(container, now)
    return false
  }

  // Only handle vertical scroll
  if (event.deltaY === 0) {
    return false
  }

  // Debounce: don't translate if we recently scrolled horizontally
  const lastHorizontalTime = lastHorizontalWheelTime.get(container)
  if (lastHorizontalTime !== undefined && now - lastHorizontalTime < HORIZONTAL_SCROLL_DEBOUNCE_MS) {
    return false
  }

  // Only translate if the container itself has horizontal overflow
  if (container.scrollWidth <= container.clientWidth) {
    return false
  }

  // Check if any parent element up to the container has vertical overflow.
  // If so, allow natural vertical scrolling instead of translating.
  const target = event.target as HTMLElement
  let current: HTMLElement | null = target

  while (current && current !== container) {
    if (current.scrollHeight > current.clientHeight) {
      // Element can scroll vertically, don't intercept
      return false
    }
    current = current.parentElement
  }

  // No vertical overflow found, translate to horizontal scroll
  event.preventDefault()
  container.scrollLeft += event.deltaY
  return true
}
