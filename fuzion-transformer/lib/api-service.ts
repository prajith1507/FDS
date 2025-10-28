import type { FileNode } from "@/types/file-system"
import type {
  ApiMetaResponse,
  ApiKeysResponse,
  GenerateFunctionResponse,
  CreateScheduleRequest,
  CreateScheduleResponse,
} from "@/types/api"
import type { DataSource } from "@/types/copilot"

export async function fetchMetadata(): Promise<ApiMetaResponse> {
  const response = await fetch(`/api/meta?includeCounts=true`)
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: response.statusText }))
    throw new Error(errorData.error || `Failed to fetch metadata: ${response.statusText}`)
  }
  return response.json()
}

export async function fetchFileContent(id: string, type: "api" | "function" | "collection"): Promise<any> {
  const response = await fetch(`/api/meta/content?id=${id}&type=${type}`)
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: response.statusText }))
    throw new Error(errorData.error || `Failed to fetch content: ${response.statusText}`)
  }
  const data = await response.json()
  return data.content
}

export async function fetchKeys(): Promise<ApiKeysResponse> {
  const response = await fetch(`/api/meta/keys`)
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: response.statusText }))
    throw new Error(errorData.error || `Failed to fetch keys: ${response.statusText}`)
  }
  return response.json()
}

// export async function sendCopilotMessage(
//   instruction: string,
//   sources: { api: string[]; collection: string[] },
//   sessionId: string,
// ): Promise<CopilotResponse> {
//   const response = await fetch(`/api/copilot/create-pipeline`, {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//     },
//     body: JSON.stringify({
//       instruction,
//       sources,
//       sessionId,
//     }),
//   })

//   if (!response.ok) {
//     const errorData = await response.json().catch(() => ({ error: response.statusText }))
//     throw new Error(errorData.error || `Failed to send copilot message: ${response.statusText}`)
//   }

//   return response.json()
// }

export async function generateFunction(
  instructions: string,
  sources: { api: string[]; collection: string[] },
): Promise<GenerateFunctionResponse> {
  const response = await fetch(`/api/copilot/generate-function`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      sources,
      instructions,
    }),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: response.statusText }))
    throw new Error(errorData.error || `Failed to generate function: ${response.statusText}`)
  }

  return response.json()
}

export async function testFunction(functionCode: string, testData: any = null): Promise<any> {
  console.log("[v0] Calling test-function API:", `/api/copilot/test-function`)
  console.log("[v0] Request body:", { functionCode: functionCode.substring(0, 200) + "...", testData })

  const response = await fetch(`/api/copilot/test-function`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      functionCode,
      testData,
    }),
  })

  console.log("[v0] Test-function API response status:", response.status)

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: response.statusText }))
    console.log("[v0] Test-function API error:", errorData)
    return {
      success: false,
      error: errorData.error || `API returned ${response.status}`,
      message: errorData.message || errorData.error || `API returned ${response.status}`,
      executionTime: 0,
      logs: [],
      metadata: {},
    }
  }

  return response.json()
}

export async function saveGeneratedFunction(functionData: {
  name: string
  shortDescription: string
  longDescription: string
  code: string
  tags: string[]
  status: string
  createdBy: string
}): Promise<any> {
  console.log("[v0] Calling save generated function API")

  const response = await fetch(`/api/generated-functions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(functionData),
  })

  console.log("[v0] Save function API response status:", response.status)

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: response.statusText }))
    console.log("[v0] Save function API error:", errorData)
    throw new Error(errorData.error || `Failed to save function: ${response.statusText}`)
  }

  return response.json()
}

export async function fetchGeneratedFunction(id: string): Promise<any> {
  console.log("[v0] Fetching generated function by ID:", id)

  const response = await fetch(`/api/generated-functions/${id}`)

  console.log("[v0] Fetch function API response status:", response.status)

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: response.statusText }))
    console.log("[v0] Fetch function API error:", errorData)
    throw new Error(errorData.error || `Failed to fetch function: ${response.statusText}`)
  }

  return response.json()
}

export async function updateGeneratedFunction(
  id: string,
  functionData: {
    name: string
    shortDescription: string
    longDescription: string
    code: string
    tags: string[]
    status: string
  },
): Promise<any> {
  console.log("[v0] Calling update generated function API for ID:", id)

  const response = await fetch(`/api/generated-functions/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(functionData),
  })

  console.log("[v0] Update function API response status:", response.status)

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: response.statusText }))
    console.log("[v0] Update function API error:", errorData)
    throw new Error(errorData.error || `Failed to update function: ${response.statusText}`)
  }

  return response.json()
}

export async function createSchedule(scheduleData: CreateScheduleRequest): Promise<CreateScheduleResponse> {
  console.log("[v0] Calling create schedule API")
  console.log("[v0] Schedule data:", scheduleData)

  const response = await fetch(`/api/schedule-functions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(scheduleData),
  })

  console.log("[v0] Create schedule API response status:", response.status)

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: response.statusText }))
    console.log("[v0] Create schedule API error:", errorData)
    throw new Error(errorData.error || `Failed to create schedule: ${response.statusText}`)
  }

  return response.json()
}

export async function enableSchedule(scheduleId: string): Promise<any> {
  console.log("[v0] Calling enable schedule API for ID:", scheduleId)

  const response = await fetch(`/api/schedule-functions/${scheduleId}/enable`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  })

  console.log("[v0] Enable schedule API response status:", response.status)

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: response.statusText }))
    console.log("[v0] Enable schedule API error:", errorData)
    throw new Error(errorData.error || `Failed to enable schedule: ${response.statusText}`)
  }

  return response.json()
}

export async function disableSchedule(scheduleId: string): Promise<any> {
  console.log("[v0] Calling disable schedule API for ID:", scheduleId)

  const response = await fetch(`/api/schedule-functions/${scheduleId}/disable`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  })

  console.log("[v0] Disable schedule API response status:", response.status)

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: response.statusText }))
    console.log("[v0] Disable schedule API error:", errorData)
    throw new Error(errorData.error || `Failed to disable schedule: ${response.statusText}`)
  }

  return response.json()
}

export async function getScheduleStatus(scheduleId: string): Promise<any> {
  console.log("[v0] Calling get schedule status API for ID:", scheduleId)

  const response = await fetch(`/api/schedule-functions/${scheduleId}`)

  console.log("[v0] Get schedule status API response status:", response.status)

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: response.statusText }))
    console.log("[v0] Get schedule status API error:", errorData)
    throw new Error(errorData.error || `Failed to get schedule status: ${response.statusText}`)
  }

  return response.json()
}

export async function updateSchedule(scheduleId: string, scheduleData: CreateScheduleRequest): Promise<any> {
  console.log("[v0] Calling update schedule API for ID:", scheduleId)
  console.log("[v0] Update schedule data:", scheduleData)

  const response = await fetch(`/api/schedule-functions/${scheduleId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(scheduleData),
  })

  console.log("[v0] Update schedule API response status:", response.status)

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: response.statusText }))
    console.log("[v0] Update schedule API error:", errorData)
    throw new Error(errorData.error || `Failed to update schedule: ${response.statusText}`)
  }

  return response.json()
}

export async function createQuickSchedule(
  functionId: string,
  scheduleData: { cron: string; enabled: boolean },
): Promise<any> {
  console.log("[v0] Calling create quick schedule API for function:", functionId)

  const response = await fetch(`/api/generated-functions/${functionId}/schedule`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(scheduleData),
  })

  console.log("[v0] Create quick schedule API response status:", response.status)

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: response.statusText }))
    console.log("[v0] Create quick schedule API error:", errorData)
    throw new Error(errorData.error || `Failed to create quick schedule: ${response.statusText}`)
  }

  return response.json()
}

export async function getFunctionSchedules(functionId: string): Promise<any> {
  console.log("[v0] Calling get function schedules API for function:", functionId)

  const response = await fetch(`/api/generated-functions/${functionId}/schedules`)

  console.log("[v0] Get function schedules API response status:", response.status)

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: response.statusText }))
    console.log("[v0] Get function schedules API error:", errorData)
    throw new Error(errorData.error || `Failed to get function schedules: ${response.statusText}`)
  }

  return response.json()
}

export async function updateFunctionScheduling(
  functionId: string,
  schedulingData: { enabled: boolean; quickSchedule?: { cron: string; enabled: boolean } },
): Promise<any> {
  console.log("[v0] Calling update function scheduling API for function:", functionId)

  const response = await fetch(`/api/generated-functions/${functionId}/scheduling`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(schedulingData),
  })

  console.log("[v0] Update function scheduling API response status:", response.status)

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: response.statusText }))
    console.log("[v0] Update function scheduling API error:", errorData)
    throw new Error(errorData.error || `Failed to update function scheduling: ${response.statusText}`)
  }

  return response.json()
}

export async function fetchScheduleRunLogs(filters?: {
  status?: "success" | "error"
  error?: boolean
  scheduleId?: string
  functionId?: string
  hours?: number
  page?: number
  limit?: number
}): Promise<any> {
  console.log("[v0] Calling fetch schedule run logs API with filters:", filters)

  const params = new URLSearchParams()
  if (filters?.status) params.append("status", filters.status)
  if (filters?.error !== undefined) params.append("error", String(filters.error))
  if (filters?.scheduleId) params.append("scheduleId", filters.scheduleId)
  if (filters?.functionId) params.append("functionId", filters.functionId)
  if (filters?.hours) params.append("hours", String(filters.hours))
  if (filters?.page) params.append("page", String(filters.page))
  if (filters?.limit) params.append("limit", String(filters.limit))

  const url = `/api/schedule-run-logs${params.toString() ? `?${params.toString()}` : ""}`
  console.log("[v0] Fetching logs from:", url)

  const response = await fetch(url)

  console.log("[v0] Fetch schedule run logs API response status:", response.status)

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: response.statusText }))
    console.log("[v0] Fetch schedule run logs API error:", errorData)
    throw new Error(errorData.error || `Failed to fetch schedule run logs: ${response.statusText}`)
  }

  return response.json()
}

export async function fetchGeneratedFunctions(): Promise<any> {
  console.log("[v0] Fetching all generated functions")

  const response = await fetch(`/api/generated-functions`)

  console.log("[v0] Fetch generated functions API response status:", response.status)

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: response.statusText }))
    console.log("[v0] Fetch generated functions API error:", errorData)
    throw new Error(errorData.error || `Failed to fetch generated functions: ${response.statusText}`)
  }

  return response.json()
}

export async function fetchAllSchedules(): Promise<any> {
  console.log("[v0] Fetching all schedules")

  const response = await fetch(`/api/schedule-functions`)

  console.log("[v0] Fetch all schedules API response status:", response.status)

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: response.statusText }))
    console.log("[v0] Fetch all schedules API error:", errorData)
    throw new Error(errorData.error || `Failed to fetch schedules: ${response.statusText}`)
  }

  return response.json()
}

export function transformMetadataToFileSystem(metadata: ApiMetaResponse["data"]): FileNode[] {
  const rootNodes: FileNode[] = []

  if (metadata.apis.length > 0) {
    const apiFolder: FileNode = {
      id: "api",
      name: "api",
      type: "folder",
      path: "/api",
      children: metadata.apis.map((api) => ({
        id: `api-${api._id}`,
        name: `${api.key}.json`,
        type: "file" as const,
        path: `/api/${api.key}.json`,
        extension: "json",
        metadata: { _id: api._id, type: "api" as const },
      })),
    }
    rootNodes.push(apiFolder)
  }

  if (metadata.functions.length > 0) {
    const functionsFolder: FileNode = {
      id: "functions",
      name: "functions",
      type: "folder",
      path: "/functions",
      children: metadata.functions.map((fn) => ({
        id: `function-${fn._id}`,
        name: `${fn.key}.js`,
        type: "file" as const,
        path: `/functions/${fn.key}.js`,
        extension: "js",
        metadata: { _id: fn._id, type: "function" as const },
      })),
    }
    rootNodes.push(functionsFolder)
  }

  if (metadata.models.length > 0) {
    const dbFolder: FileNode = {
      id: "db",
      name: "db",
      type: "folder",
      path: "/db",
      children: [
        {
          id: "collections",
          name: "collections",
          type: "folder",
          path: "/db/collections",
          children: metadata.models.map((model, index) => ({
            id: `model-${index}`,
            name: `${model.collectionName}.json`,
            type: "file" as const,
            path: `/db/collections/${model.collectionName}.json`,
            extension: "json",
            metadata: { _id: model.collectionName, type: "collection" as const },
          })),
        },
      ],
    }
    rootNodes.push(dbFolder)
  }

  // Create Docs folder structure
  const docsFolder: FileNode = {
    id: "docs",
    name: "docs",
    type: "folder",
    path: "/docs",
    children:
      metadata.docs.length > 0
        ? metadata.docs.map((doc, index) => ({
            id: `doc-${index}`,
            name: `${doc.name}.md`,
            type: "file",
            path: `/docs/${doc.name}.md`,
            extension: "md",
            content: `# ${doc.name}\n\nDocumentation content here...`,
          }))
        : [
            {
              id: "readme",
              name: "README.md",
              type: "file",
              path: "/docs/README.md",
              extension: "md",
              content: "# Documentation\n\nAdd your documentation here...",
            },
          ],
  }
  rootNodes.push(docsFolder)

  return rootNodes
}

export function extractDataSources(metadata: ApiMetaResponse["data"]): DataSource[] {
  const dataSources: DataSource[] = []

  // Add API data sources
  metadata.apis.forEach((api) => {
    const apiFunctions = metadata.functions.filter((fn) => fn.api_id === api._id)
    dataSources.push({
      id: api._id,
      name: api.name,
      type: "api",
      path: `/api/${api.key}`,
      keys: apiFunctions.map((fn) => fn.key),
      fields: apiFunctions.map((fn) => ({
        name: fn.key,
        type: "function",
        description: fn.name,
      })),
    })
  })

  // Add collection data sources
  metadata.models.forEach((model, index) => {
    dataSources.push({
      id: `collection-${index}`,
      name: model.name,
      type: "collection",
      path: `/db/collections/${model.collectionName}`,
      keys: [model.collectionName],
      fields: [
        {
          name: "collectionName",
          type: "string",
          description: model.collectionName,
        },
      ],
    })
  })

  return dataSources
}
