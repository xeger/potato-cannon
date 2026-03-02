import { useMemo } from 'react'
import CodeMirror from '@uiw/react-codemirror'
import { markdown } from '@codemirror/lang-markdown'
import { javascript } from '@codemirror/lang-javascript'
import { json } from '@codemirror/lang-json'
import { EditorView } from '@codemirror/view'
import type { Extension } from '@codemirror/state'

interface ArtifactEditorProps {
  value: string
  onChange: (value: string) => void
  filename: string
}

const darkTheme = EditorView.theme({
  '&': {
    backgroundColor: 'transparent',
    height: '100%',
  },
  '.cm-gutters': {
    backgroundColor: 'transparent',
    border: 'none',
  },
  '.cm-activeLineGutter': {
    backgroundColor: 'var(--color-bg-tertiary)',
  },
  '.cm-activeLine': {
    backgroundColor: 'var(--color-bg-tertiary)',
  },
  '.cm-cursor': {
    borderLeftColor: 'var(--color-text-primary)',
  },
  '.cm-selectionBackground': {
    backgroundColor: 'var(--color-accent) !important',
    opacity: '0.3',
  },
  '&.cm-focused .cm-selectionBackground': {
    backgroundColor: 'var(--color-accent) !important',
    opacity: '0.3',
  },
  '.cm-content': {
    caretColor: 'var(--color-text-primary)',
    fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace',
    fontSize: '14px',
    lineHeight: '1.6',
    color: 'var(--color-text-secondary)',
  },
  '.cm-line': {
    padding: '0 4px',
  },
}, { dark: true })

function getLanguageExtension(filename: string): Extension[] {
  const ext = filename.split('.').pop()?.toLowerCase()
  switch (ext) {
    case 'js':
    case 'jsx':
      return [javascript({ jsx: true })]
    case 'ts':
    case 'tsx':
      return [javascript({ jsx: true, typescript: true })]
    case 'json':
      return [json()]
    case 'md':
    default:
      return [markdown()]
  }
}

export function ArtifactEditor({ value, onChange, filename }: ArtifactEditorProps) {
  const extensions = useMemo(
    () => [darkTheme, ...getLanguageExtension(filename)],
    [filename]
  )

  return (
    <CodeMirror
      value={value}
      onChange={onChange}
      extensions={extensions}
      theme="dark"
      basicSetup={{
        lineNumbers: true,
        foldGutter: true,
        highlightActiveLine: true,
        bracketMatching: true,
        closeBrackets: true,
        indentOnInput: true,
      }}
      className="h-full [&_.cm-editor]:h-full"
    />
  )
}
