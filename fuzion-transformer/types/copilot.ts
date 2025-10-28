export interface Message {
  id: string
  role: "user" | "assistant" | "system"
  content: string
  timestamp: Date
}

export interface DataSource {
  type: "api" | "collection" | "doc"
  name: string
  id: string | number
  keys?: string[] // Optional for backward compatibility
  path?: string // Path to the data source
  fields?: Array<{
    name: string
    type: string
    description?: string
  }>
}

export interface Suggestion {
  type: "file" | "field" | "command"
  value: string
  label: string
  description?: string
  category?: string
}

export interface KeySuggestion extends Suggestion {
  type: "field"
  sourceId: string
  sourceType: "api" | "collection"
  sourceName: string
  highlightText?: string
}

export interface SourceSuggestion extends Suggestion {
  type: "file"
  sourceId: string
  sourceType: "api" | "collection"
  sourceName: string
}

export interface AIModel {
  id: string
  name: string
  provider: string
  description?: string
}

export interface CopilotConfig {
  dataSources: DataSource[]
  availableCommands?: Command[]
  availableModels?: AIModel[]
  defaultModel?: string
  commands?: Array<{
    id: string
    name: string
    description: string
    icon?: string
  }>
  onSendMessage?: (message: string, context: string[], model?: string) => Promise<string | Message>
}

export interface Command {
  name: string
  description: string
  trigger: string
  action?: () => void
}

export interface SelectedSources {
  api: string[]
  collection: string[]
}
