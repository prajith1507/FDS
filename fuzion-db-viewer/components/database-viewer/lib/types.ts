export interface DataType {
  name: string;
  baseType: string;
  format: {
    disable: boolean;
    format: string;
    ds?: string;
    unit?: string;
  };
  unit?: {
    disable: boolean;
    unit: string;
    name: string;
    iCase: boolean;
    iSpace: boolean;
    isPrefix: boolean;
    isBase: boolean;
  };
  hasUnits: boolean;
  hasConstraints: boolean;
  isMandatory: boolean;
}

export interface ColumnModel {
  displayName: string;
  name: string;
  index: number;
  dataType: DataType;
  userInferredType: boolean;
  status: string;
  columnType: string;
  involved: boolean;
  widgets: {
    discrete?: Array<{ label: string; count: number }>;
    continuous?: Array<{
      min: string;
      max: string;
      label: string;
      count: number;
    }>;
    quality?: Array<{ valid: number; invalid: number; missing: number }>;
    aggregate?: Array<{
      min?: string;
      max?: string;
      avg?: string;
      mode?: string;
      categories?: number;
    }>;
  };
  needsWidgets: boolean;
  needsInferSchema: boolean;
  hidden: boolean;
  inferredWhileExecution: boolean;
  ignoreQuality: boolean;
  pii: boolean;
  personalData: { pii: boolean };
}

export interface SampleState {
  rowCount: number;
  colCount: number;
  intColCount: number;
  dataTypeCount: number;
  quality: {
    valid: number;
    invalid: number;
    missing: number;
  };
  columnModel: ColumnModel[];
  data?: any[][]; // Made optional since profile endpoint may not always return data
}

export interface DataViewerProps {
  data: {
    samplestate: {
      samplestate: SampleState; // Fixed to match actual API response structure with double nesting
    };
    response_status?: {
      status: string;
      status_code: number;
    };
  };
}
