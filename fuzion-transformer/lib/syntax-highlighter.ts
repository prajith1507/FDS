export interface HighlightedLine {
  lineNumber: number
  content: string
  tokens: Token[]
}

export interface Token {
  type: "keyword" | "string" | "comment" | "number" | "operator" | "function" | "variable" | "plain"
  value: string
}

export function highlightCode(code: string, extension: string): HighlightedLine[] {
  const lines = code.split("\n")

  return lines.map((line, index) => ({
    lineNumber: index + 1,
    content: line,
    tokens: tokenizeLine(line, extension),
  }))
}

function tokenizeLine(line: string, extension: string): Token[] {
  // Simple tokenizer - can be enhanced with proper parsers
  const tokens: Token[] = []

  if (extension === "json") {
    return tokenizeJSON(line)
  } else if (["ts", "tsx", "js", "jsx"].includes(extension)) {
    return tokenizeJavaScript(line)
  } else if (extension === "csv") {
    return tokenizeCSV(line)
  } else if (extension === "xml" || extension === "html") {
    return tokenizeXML(line)
  }

  // Default: plain text
  return [{ type: "plain", value: line }]
}

function tokenizeJSON(line: string): Token[] {
  const tokens: Token[] = []
  const regex = /"([^"]+)":|"([^"]+)"|(\d+)|(\btrue\b|\bfalse\b|\bnull\b)|([{}[\],:])/g
  let lastIndex = 0
  let match

  while ((match = regex.exec(line)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({ type: "plain", value: line.slice(lastIndex, match.index) })
    }

    if (match[1]) {
      tokens.push({ type: "variable", value: `"${match[1]}":` })
    } else if (match[2]) {
      tokens.push({ type: "string", value: `"${match[2]}"` })
    } else if (match[3]) {
      tokens.push({ type: "number", value: match[3] })
    } else if (match[4]) {
      tokens.push({ type: "keyword", value: match[4] })
    } else if (match[5]) {
      tokens.push({ type: "operator", value: match[5] })
    }

    lastIndex = regex.lastIndex
  }

  if (lastIndex < line.length) {
    tokens.push({ type: "plain", value: line.slice(lastIndex) })
  }

  return tokens
}

function tokenizeJavaScript(line: string): Token[] {
  const tokens: Token[] = []
  const keywords =
    /\b(const|let|var|function|return|if|else|for|while|import|export|from|class|interface|type|async|await|try|catch)\b/g
  const strings = /"([^"\\]|\\.)*"|'([^'\\]|\\.)*'|`([^`\\]|\\.)*`/g
  const comments = /\/\/.*|\/\*[\s\S]*?\*\//g
  const numbers = /\b\d+\.?\d*\b/g

  // Simple approach: mark comments first
  if (line.trim().startsWith("//")) {
    return [{ type: "comment", value: line }]
  }

  // For now, return as plain with basic keyword highlighting
  const result = line
  const parts: Array<{ start: number; end: number; type: Token["type"] }> = []

  // Find all keywords
  let match
  while ((match = keywords.exec(line)) !== null) {
    parts.push({ start: match.index, end: match.index + match[0].length, type: "keyword" })
  }

  if (parts.length === 0) {
    return [{ type: "plain", value: line }]
  }

  // Build tokens from parts
  parts.sort((a, b) => a.start - b.start)
  let lastEnd = 0

  for (const part of parts) {
    if (part.start > lastEnd) {
      tokens.push({ type: "plain", value: line.slice(lastEnd, part.start) })
    }
    tokens.push({ type: part.type, value: line.slice(part.start, part.end) })
    lastEnd = part.end
  }

  if (lastEnd < line.length) {
    tokens.push({ type: "plain", value: line.slice(lastEnd) })
  }

  return tokens
}

function tokenizeCSV(line: string): Token[] {
  const values = line.split(",")
  const tokens: Token[] = []

  values.forEach((value, index) => {
    tokens.push({ type: "string", value: value.trim() })
    if (index < values.length - 1) {
      tokens.push({ type: "operator", value: "," })
    }
  })

  return tokens
}

function tokenizeXML(line: string): Token[] {
  const tokens: Token[] = []
  const tagRegex = /<\/?[\w\s="/.':;#-/]+>/g
  let lastIndex = 0
  let match

  while ((match = tagRegex.exec(line)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({ type: "plain", value: line.slice(lastIndex, match.index) })
    }
    tokens.push({ type: "keyword", value: match[0] })
    lastIndex = tagRegex.lastIndex
  }

  if (lastIndex < line.length) {
    tokens.push({ type: "plain", value: line.slice(lastIndex) })
  }

  return tokens
}
