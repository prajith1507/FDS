import type { DataSource, Suggestion, Command } from "@/types/copilot"

export function parseInputForSuggestions(
  input: string,
  cursorPosition: number,
): { trigger: "@" | "#" | "/" | null; query: string; startPos: number } | null {
  const textBeforeCursor = input.slice(0, cursorPosition)

  // Find the last trigger character before cursor
  const atMatch = textBeforeCursor.lastIndexOf("@")
  const hashMatch = textBeforeCursor.lastIndexOf("#")
  const slashMatch = textBeforeCursor.lastIndexOf("/")

  const matches = [
    { trigger: "@" as const, pos: atMatch },
    { trigger: "#" as const, pos: hashMatch },
    { trigger: "/" as const, pos: slashMatch },
  ].filter((m) => m.pos !== -1)

  if (matches.length === 0) return null

  // Get the most recent trigger
  const lastMatch = matches.reduce((prev, curr) => (curr.pos > prev.pos ? curr : prev))

  // Check if there's a space after the trigger (which would invalidate it)
  const textAfterTrigger = textBeforeCursor.slice(lastMatch.pos + 1)
  if (textAfterTrigger.includes(" ")) return null

  return {
    trigger: lastMatch.trigger,
    query: textAfterTrigger,
    startPos: lastMatch.pos,
  }
}

export function getFileSuggestions(dataSources: DataSource[], query: string): Suggestion[] {
  const suggestions: Suggestion[] = []

  dataSources.forEach((source) => {
    const matchesQuery = source.name.toLowerCase().includes(query.toLowerCase())
    if (matchesQuery || query === "") {
      suggestions.push({
        type: "file",
        value: `@${source.type}/${source.name}`,
        label: source.name,
        description: `${source.type} - ${source.keys.length} fields`,
        category: source.type,
      })
    }
  })

  return suggestions
}

export function getFieldSuggestions(dataSources: DataSource[], query: string, context: string[]): Suggestion[] {
  const suggestions: Suggestion[] = []

  // Find which file is currently referenced in context
  const referencedFiles = context.filter((c) => c.startsWith("@")).map((c) => c.replace("@", "").split("/"))

  referencedFiles.forEach(([type, name]) => {
    const source = dataSources.find((s) => s.type === type && s.name === name)
    if (source) {
      source.keys.forEach((key) => {
        const matchesQuery = key.toLowerCase().includes(query.toLowerCase())
        if (matchesQuery || query === "") {
          suggestions.push({
            type: "field",
            value: `#${source.name}.${key}`,
            label: key,
            description: `from ${source.name}`,
            category: source.name,
          })
        }
      })
    }
  })

  // If no context, show all fields from all sources
  if (referencedFiles.length === 0) {
    dataSources.forEach((source) => {
      source.keys.forEach((key) => {
        const matchesQuery = key.toLowerCase().includes(query.toLowerCase())
        if (matchesQuery || query === "") {
          suggestions.push({
            type: "field",
            value: `#${source.name}.${key}`,
            label: key,
            description: `from ${source.name}`,
            category: source.name,
          })
        }
      })
    })
  }

  return suggestions
}

export function getCommandSuggestions(commands: Command[], query: string): Suggestion[] {
  return commands
    .filter((cmd) => cmd.name.toLowerCase().includes(query.toLowerCase()) || query === "")
    .map((cmd) => ({
      type: "command" as const,
      value: `/${cmd.trigger}`,
      label: cmd.name,
      description: cmd.description,
    }))
}

export function extractContextFromMessage(message: string): string[] {
  const context: string[] = []

  // Extract @file references
  const fileMatches = message.match(/@[\w-]+\/[\w-]+/g)
  if (fileMatches) {
    context.push(...fileMatches)
  }

  // Extract #field references
  const fieldMatches = message.match(/#[\w-]+\.[\w.]+/g)
  if (fieldMatches) {
    context.push(...fieldMatches)
  }

  return [...new Set(context)]
}
