// API response types
export interface ApiMetaResponse {
  status: number
  message: string
  data: {
    apis: ApiDefinition[]
    functions: FunctionDefinition[]
    models: ModelDefinition[]
    docs: DocDefinition[]
  }
}

export interface ApiDefinition {
  _id: string
  name: string
  key: string
}

export interface FunctionDefinition {
  _id: string
  api_id: string
  name: string
  key: string
}

export interface ModelDefinition {
  name: string
  collectionName: string
}

export interface DocDefinition {
  _id?: string
  name: string
  key?: string
}

export interface ApiKeysResponse {
  status: number
  message: string
  data: {
    source: string
    total_unique_keys: number
    all_keys: string[]
    total_apis: number
    apis: ApiKeyDefinition[]
    total_collections: number
    collections: CollectionKeyDefinition[]
  }
}

export interface ApiKeyDefinition {
  api_id: string
  api_name: string
  keys: string[]
}

export interface CollectionKeyDefinition {
  collection_name: string
  doc_count: number
  sampled_docs: number
  keys: string[]
}

export interface ApiContentResponse {
  status: number
  message: string
  content: Record<string, any>
}

export interface CopilotRequest {
  instruction: string
  sources: {
    api: string[]
    collection: string[]
  }
  sessionId: string
}

export interface CopilotResponse {
  success: boolean
  sessionId: string
  hasTransform: boolean
  hasDag: boolean
  message: string
}

export interface GenerateFunctionRequest {
  sources: {
    api: string[]
    collection: string[]
  }
  instructions: string
}

export interface GenerateFunctionResponse {
  success: boolean
  message: string
  transformCode?: string
  functionName?: string
  description?: string
  metadata?: {
    summary?: {
      total_apis: number
      total_collections: number
      instructions_length: number
      generation_time: string
      code_length: number
      ai_provider: string
      ai_model: string
    }
    apis_used?: Array<{
      id: string
      name: string
      method: string
      url: string
      has_schema: boolean
      schema_source: string
    }>
    collections_used?: string[]
    llm_metadata?: {
      provider: string
      model: string
      prompt_tokens: number
      response_tokens: number
      generation_time: number
    }
    next_steps?: string[]
  }
}

export interface TestFunctionRequest {
  functionCode: string
  testData: any
}

export interface TestFunctionResponse {
  success: boolean
  message: string
  result?: any
  error?: string
  executionTime?: number
}

export interface ScheduleInfo {
  id: string
  enabled: boolean
  cron: string
  nextRunAt: string
  lastRunAt?: string
  runCount: number
}

export interface SchedulingInfo {
  hasSchedules: boolean
  activeSchedules: number
  totalSchedules: number
  hasActiveSchedule: boolean
  schedules: ScheduleInfo[]
}

export interface CreateScheduleRequest {
  name: string
  description: string
  function_id: string
  enabled: boolean
  trigger: {
    cron: string
    timezone: string
  }
}

export interface CreateScheduleResponse {
  status: number
  message: string
  data?: {
    scheduleId: string
  }
}

export interface UpdateScheduleRequest {
  name: string
  description: string
  enabled?: boolean
  trigger: {
    cron: string
    timezone: string
  }
  params: {
    testData: any
    timeout: number
    retryOnFailure: boolean
    maxRetries: number
  }
  notifications: {
    onSuccess: boolean
    onFailure: boolean
    webhook?: string
  }
  meta: {
    notes: string
    tags: string[]
    priority: "low" | "normal" | "high"
  }
}

export interface QuickScheduleRequest {
  cron: string
  enabled: boolean
}

export interface QuickScheduleResponse {
  status: number
  message: string
  data?: {
    scheduleId: string
    functionId: string
  }
}

export interface FunctionSchedulesResponse {
  status: number
  message: string
  data?: {
    functionId: string
    schedules: ScheduleInfo[]
  }
}

export interface UpdateFunctionSchedulingRequest {
  enabled: boolean
  quickSchedule?: {
    cron: string
    enabled: boolean
  }
}

export interface UpdateFunctionSchedulingResponse {
  status: number
  message: string
  data?: {
    functionId: string
    scheduling: SchedulingInfo
  }
}

export interface ScheduleDetailResponse {
  status: number
  message: string
  data: {
    id: string
    name: string
    description: string
    function_id: string
    enabled: boolean
    trigger: {
      cron: string
      timezone: string
    }
    params?: {
      testData: any
      timeout: number
      retryOnFailure: boolean
      maxRetries: number
    }
    notifications?: {
      onSuccess: boolean
      onFailure: boolean
      webhook?: string
    }
    meta?: {
      notes: string
      tags: string[]
      priority: "low" | "normal" | "high"
    }
    createdAt: string
    updatedAt: string
  }
}

export interface ScheduleRunLog {
  _id: string
  scheduleId: {
    _id: string
    name: string
    enabled: boolean
  }
  scheduleName: string
  functionId: {
    _id: string
    name: string
    version: string
    tags: string[]
  }
  functionName: string
  runId: string
  startTime: string
  endTime?: string
  duration?: number
  status: "success" | "error" | "running"
  error?: {
    message: string
    stack: string
  }
  consoleOutput: string
  metaTags: {
    notes: string | null
    tags: string[]
    priority: "low" | "normal" | "high"
  }
  trigger: {
    type: string
    triggeredBy: string
    scheduledTime: string
    actualTime: string
  }
  cpuUsage?: {
    user: number
    system: number
  }
  memoryUsage?: {
    rss: number
    heapUsed: number
    heapTotal: number
    external: number
  }
  nodeVersion: string
  environment: string
  hostname: string
  createdAt: string
  updatedAt: string
}

export interface ScheduleRunLogsResponse {
  status: number
  message: string
  data: {
    logs: ScheduleRunLog[]
    pagination: {
      currentPage: number
      totalPages: number
      totalCount: number
      limit: number
      hasNextPage: boolean
      hasPrevPage: boolean
    }
  }
}

export interface ScheduleRunLogsFilters {
  status?: "success" | "error"
  error?: boolean
  scheduleId?: string
  functionId?: string
  hours?: number
  page?: number
  limit?: number
}
