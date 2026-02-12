import { useMemo } from 'react'

interface LinkifyProps {
  /** The text to process for URLs */
  text: string
  /** Optional className for the wrapper span */
  className?: string
}

interface TextSegment {
  value: string
  isUrl: boolean
}

// Matches http:// and https:// URLs
// Stops at whitespace, quotes, and common delimiters
// Negative lookbehind excludes trailing punctuation (., ,, ;, :, !, ?)
const URL_REGEX = /https?:\/\/[^\s<>"'\])}]+(?<![.,;:!?])/gi

function parseTextWithUrls(text: string): TextSegment[] {
  const segments: TextSegment[] = []
  let lastIndex = 0

  // Reset regex state for each parse
  URL_REGEX.lastIndex = 0

  let match: RegExpExecArray | null
  while ((match = URL_REGEX.exec(text)) !== null) {
    // Add text before the URL
    if (match.index > lastIndex) {
      segments.push({
        value: text.slice(lastIndex, match.index),
        isUrl: false
      })
    }

    // Add the URL
    segments.push({
      value: match[0],
      isUrl: true
    })

    lastIndex = match.index + match[0].length
  }

  // Add remaining text after last URL
  if (lastIndex < text.length) {
    segments.push({
      value: text.slice(lastIndex),
      isUrl: false
    })
  }

  // If no URLs found, return the entire text as a single segment
  if (segments.length === 0) {
    segments.push({
      value: text,
      isUrl: false
    })
  }

  return segments
}

export function Linkify({ text, className }: LinkifyProps) {
  const segments = useMemo(() => {
    try {
      return parseTextWithUrls(text)
    } catch {
      // Fallback: return text as single non-URL segment
      return [{ value: text, isUrl: false }]
    }
  }, [text])

  return (
    <span className={className}>
      {segments.map((segment, i) =>
        segment.isUrl ? (
          <a
            key={i}
            href={segment.value}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:underline"
          >
            {segment.value}
          </a>
        ) : (
          <span key={i}>{segment.value}</span>
        )
      )}
    </span>
  )
}
