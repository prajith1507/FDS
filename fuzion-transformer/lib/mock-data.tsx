"use client"

import type { FileNode } from "@/types/file-system"
import type { CopilotConfig } from "@/types/copilot"

// Sample file content for demonstration
const employeeAPIData = `{
  "no": "EMP001",
  "name": "John Doe",
  "zone": "North",
  "salesTerretory": "Territory A",
  "salesperson": {
    "name": "Alice Johnson",
    "code": "SP001"
  },
  "branchHead": {
    "name": "Bob Smith"
  },
  "zonalHead": {
    "name": "Carol White"
  },
  "contact": {
    "phoneNo": "+1-555-0123"
  },
  "address": {
    "city": "New York"
  }
}`

const salesCollectionData = `{
  "invoiceNo": "INV-2025-001",
  "dealerName": "ABC Distributors",
  "itemDesc1": "Product XYZ",
  "quantity": 100,
  "lineAmount": 5000.00,
  "salesHierarchy": {
    "salespersonName": "Alice Johnson",
    "zonalManagerName": "Carol White"
  },
  "salesTerritory": "Territory A",
  "shipToCity": "New York",
  "tableauZone": "Northeast"
}`

const sampleCSV = `id,name,email,department,salary
1,John Doe,john@example.com,Engineering,95000
2,Jane Smith,jane@example.com,Marketing,87000
3,Bob Johnson,bob@example.com,Sales,78000
4,Alice Williams,alice@example.com,Engineering,102000`

const transformFunctionTemplate = `// Transform function template
export function transformData(source: any, target: any) {
  return {
    // Map your fields here
    // Example: target.field = source.field
  }
}`

export const mockFileSystem: FileNode[] = [
  {
    id: "project-1",
    name: "data-transformation",
    type: "folder",
    path: "/data-transformation",
    children: [
      {
        id: "api-folder",
        name: "api",
        type: "folder",
        path: "/data-transformation/api",
        children: [
          {
            id: "api-employee",
            name: "employee.json",
            type: "file",
            path: "/data-transformation/api/employee.json",
            extension: "json",
            content: employeeAPIData,
            size: 1024,
            modified: new Date("2025-01-15"),
          },
        ],
      },
      {
        id: "db-folder",
        name: "db",
        type: "folder",
        path: "/data-transformation/db",
        children: [
          {
            id: "collections-folder",
            name: "collections",
            type: "folder",
            path: "/data-transformation/db/collections",
            children: [
              {
                id: "collection-sales",
                name: "sales.json",
                type: "file",
                path: "/data-transformation/db/collections/sales.json",
                extension: "json",
                content: salesCollectionData,
                size: 768,
                modified: new Date("2025-01-14"),
              },
            ],
          },
        ],
      },
      {
        id: "docs-folder",
        name: "docs",
        type: "folder",
        path: "/data-transformation/docs",
        children: [
          {
            id: "doc-mapping",
            name: "field-mapping.csv",
            type: "file",
            path: "/data-transformation/docs/field-mapping.csv",
            extension: "csv",
            content: sampleCSV,
            size: 512,
            modified: new Date("2025-01-13"),
          },
          {
            id: "doc-readme",
            name: "README.md",
            type: "file",
            path: "/data-transformation/docs/README.md",
            extension: "md",
            content:
              "# Data Transformation Project\n\nThis project handles data transformation between API sources and database collections.",
            size: 256,
            modified: new Date("2025-01-10"),
          },
        ],
      },
      {
        id: "transforms-folder",
        name: "transforms",
        type: "folder",
        path: "/data-transformation/transforms",
        children: [
          {
            id: "transform-template",
            name: "transform-template.ts",
            type: "file",
            path: "/data-transformation/transforms/transform-template.ts",
            extension: "ts",
            content: transformFunctionTemplate,
            size: 256,
            modified: new Date("2025-01-16"),
          },
        ],
      },
    ],
  },
]

export const copilotConfig: CopilotConfig = {
  dataSources: [
    {
      type: "api",
      name: "employee",
      id: 23432322423232,
      keys: [
        "no",
        "name",
        "zone",
        "salesTerretory",
        "salesperson.name",
        "salesperson.code",
        "branchHead.name",
        "zonalHead.name",
        "contact.phoneNo",
        "address.city",
      ],
    },
    {
      type: "collection",
      name: "sales",
      id: 342342524525,
      keys: [
        "invoiceNo",
        "dealerName",
        "itemDesc1",
        "quantity",
        "lineAmount",
        "salesHierarchy.salespersonName",
        "salesHierarchy.zonalManagerName",
        "salesTerritory",
        "shipToCity",
        "tableauZone",
      ],
    },
  ],
  availableModels: [
    {
      id: "gpt-4",
      name: "GPT-4",
      provider: "OpenAI",
      description: "Most capable model, best for complex transformations",
    },
    {
      id: "gpt-4-turbo",
      name: "GPT-4 Turbo",
      provider: "OpenAI",
      description: "Faster and more cost-effective than GPT-4",
    },
    {
      id: "gpt-3.5-turbo",
      name: "GPT-3.5 Turbo",
      provider: "OpenAI",
      description: "Fast and efficient for simple transformations",
    },
    {
      id: "claude-3-opus",
      name: "Claude 3 Opus",
      provider: "Anthropic",
      description: "Excellent for detailed analysis and code generation",
    },
    {
      id: "claude-3-sonnet",
      name: "Claude 3 Sonnet",
      provider: "Anthropic",
      description: "Balanced performance and speed",
    },
    {
      id: "claude-3-haiku",
      name: "Claude 3 Haiku",
      provider: "Anthropic",
      description: "Fastest model for quick transformations",
    },
    {
      id: "gemini-pro",
      name: "Gemini Pro",
      provider: "Google",
      description: "Google's advanced AI model",
    },
  ],
  defaultModel: "gpt-4-turbo",
  availableCommands: [
    {
      name: "Generate Transform",
      description: "Generate a transformation function based on field mappings",
      trigger: "transform",
    },
    {
      name: "Map Fields",
      description: "Create field mapping between source and target",
      trigger: "map",
    },
    {
      name: "Validate Data",
      description: "Validate data structure and types",
      trigger: "validate",
    },
    {
      name: "Preview Transform",
      description: "Preview transformation result with sample data",
      trigger: "preview",
    },
    {
      name: "Export Code",
      description: "Export transformation code to file",
      trigger: "export",
    },
  ],
  onSendMessage: async (message: string, context: string[], model?: string) => {
    // Mock AI response - in production, this would call your AI service
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Parse the context to understand what the user is working with
    const files = context.filter((c) => c.startsWith("@"))
    const fields = context.filter((c) => c.startsWith("#"))

    if (message.toLowerCase().includes("transform") || message.toLowerCase().includes("map")) {
      return `I can help you create a transformation function using **${model || "default model"}**. Based on your context:

**Referenced Files:**
${files.length > 0 ? files.map((f) => `- ${f}`).join("\n") : "- None"}

**Referenced Fields:**
${fields.length > 0 ? fields.map((f) => `- ${f}`).join("\n") : "- None"}

Here's a sample transformation function:

\`\`\`typescript
export function transformEmployeeToSales(employee: any) {
  return {
    salespersonName: employee.salesperson.name,
    salesTerritory: employee.salesTerretory,
    zonalManagerName: employee.zonalHead.name,
    shipToCity: employee.address.city
  }
}
\`\`\`

Would you like me to refine this based on specific field mappings?`
    }

    return `I understand you're working with (using **${model || "default model"}**):
${files.length > 0 ? `\n**Files:**\n${files.map((f) => `- ${f}`).join("\n")}` : ""}
${fields.length > 0 ? `\n**Fields:**\n${fields.map((f) => `- ${f}`).join("\n")}` : ""}

How can I help you transform this data? You can:
- Ask me to generate a transformation function
- Request field mapping suggestions
- Validate data structures
- Preview transformation results`
  },
}

export const aiModels = [
  {
    id: "gpt-4",
    name: "GPT-4",
    provider: "OpenAI",
    description: "Most capable model, best for complex transformations",
  },
  {
    id: "gpt-4-turbo",
    name: "GPT-4 Turbo",
    provider: "OpenAI",
    description: "Faster and more cost-effective than GPT-4",
  },
  {
    id: "gpt-3.5-turbo",
    name: "GPT-3.5 Turbo",
    provider: "OpenAI",
    description: "Fast and efficient for simple transformations",
  },
  {
    id: "claude-3-opus",
    name: "Claude 3 Opus",
    provider: "Anthropic",
    description: "Excellent for detailed analysis and code generation",
  },
  {
    id: "claude-3-sonnet",
    name: "Claude 3 Sonnet",
    provider: "Anthropic",
    description: "Balanced performance and speed",
  },
  {
    id: "claude-3-haiku",
    name: "Claude 3 Haiku",
    provider: "Anthropic",
    description: "Fastest model for quick transformations",
  },
  {
    id: "gemini-pro",
    name: "Gemini Pro",
    provider: "Google",
    description: "Google's advanced AI model",
  },
]
