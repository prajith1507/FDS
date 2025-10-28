export interface TransformFunction {
  id: string
  name: string
  description?: string
  code: string
  createdAt: Date
  updatedAt: Date
  sourceFiles: string[]
  targetFiles: string[]
}

export interface TransformationEditorState {
  functions: TransformFunction[]
  activeFunction: string | null
}
