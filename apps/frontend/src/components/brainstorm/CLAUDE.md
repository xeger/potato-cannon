# Brainstorm Components

React components for the brainstorm chat interface.

## Components

| Component | File | Purpose |
|-----------|------|---------|
| `BrainstormPage` | `BrainstormPage.tsx` | Route component, manages brainstorm list and selection |
| `BrainstormMaster` | `BrainstormMaster.tsx` | Left panel with brainstorm list and creation |
| `BrainstormDetail` | `BrainstormDetail.tsx` | Wrapper that renders either new form or chat |
| `BrainstormChat` | `BrainstormChat.tsx` | Main chat interface for active brainstorm |
| `BrainstormListItem` | `BrainstormListItem.tsx` | Individual list item with pending status tracking |
| `BrainstormNewForm` | `BrainstormNewForm.tsx` | Form for starting new brainstorm sessions |

## BrainstormChat

The main conversational UI. Handles message display, user input, and real-time updates.

### State

```typescript
messages: BrainstormMessage[]     // Conversation history
input: string                      // Current input field value
isWaitingForResponse: boolean      // Show thinking indicator
currentActivity: string | null     // Tool activity description
pendingOptions: string[]           // Quick-reply buttons from agent
```

### Message Types

| Type | Display | Source |
|------|---------|--------|
| `question` | Left-aligned, purple tint, Bot icon | Agent via `chat_ask` |
| `user` | Right-aligned, accent color | User input |
| `notification` | Left-aligned, subtle background | Agent via `chat_notify` |
| `error` | Left-aligned, red border | Connection/session errors |

### Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                     BrainstormChat                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. INITIAL LOAD                                             │
│     useEffect → api.getBrainstormMessages() → setMessages()  │
│                                                              │
│  2. REAL-TIME MESSAGES (questions, notifications)            │
│     useBrainstormMessage hook → SSE brainstorm:message       │
│     → add question/notification to messages                  │
│                                                              │
│  4. ACTIVITY INDICATOR                                       │
│     useSessionOutput hook → SSE session:output               │
│     → extract tool name → formatToolActivity()               │
│     → setCurrentActivity()                                   │
│                                                              │
│  5. USER SENDS MESSAGE                                       │
│     handleSend() → api.respondToBrainstorm()                 │
│     → add user message locally                               │
│     → setIsWaitingForResponse(true)                          │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### SSE Hooks

| Hook | Event | Purpose |
|------|-------|---------|
| `useSessionOutput` | `session:output` | Shows tool activity while agent works |
| `useBrainstormMessage` | `brainstorm:message` | Real-time questions(question), notifications(notification), and messages(user) |
| `useSessionEnded` | `session:ended` | Handle session errors and completion |

All hooks filter by `brainstormId` to only process events for the current session.

### Activity Indicator

The `formatToolActivity()` function (from `@/lib/utils`) converts technical tool names to user-friendly phrases. See `src/lib/CLAUDE.md` for full documentation.

Displayed in `ThinkingIndicator` component with shimmer border animation.

### Real-time Updates

All data is delivered via SSE (Server-Sent Events):

| Data | Event | Description |
|------|-------|-------------|
| Questions | `brainstorm:message` | Agent questions via `chat_ask` |
| Notifications | `brainstorm:message` | Status updates via `chat_notify` |
| Activity | `session:output` | Tool activity during processing |
| Session end | `session:ended` | Error handling and completion |

## Styling

- Uses Tailwind CSS with theme variables (`--color-bg-*`, `--color-text-*`)
- `thinking-shimmer` class for rotating border animation (defined in `index.css`)
- Markdown rendering via `marked` + `DOMPurify` for agent messages
- `Linkify` component for clickable URLs in messages

## Key Files

| File | Purpose |
|------|---------|
| `BrainstormChat.tsx` | Main chat component |
| `@/hooks/useSSE.ts` | SSE subscription hooks |
| `@/api/client.ts` | API methods for brainstorm operations |
| `@/types/index.ts` | `BrainstormMessage` type definition |
| `@/lib/utils.ts` | `formatToolActivity()` for activity display |
