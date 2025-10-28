const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://obl-syncapi.fuzionest.com";
const DATASOURCE_ID = "68f27a6ac61c21c5ebdf74f8";

export interface ApiResponse {
  samplestate: {
    samplestate: {
      rowCount: number;
      colCount: number;
      intColCount: number;
      dataTypeCount: number;
      quality: {
        valid: number;
        invalid: number;
        missing: number;
      };
      columnModel: any[];
      data?: any[][]; // Made data optional since profile endpoint may not return it
    };
  };
  response_status?: {
    status: string;
    status_code: number;
  };
}

export async function fetchCollectionData(
  page = 1,
  limit = 1000,
  sample = false,
  query: Record<string, any> = {},
  dataLimit = 100,
  sampleLimit = 5000,
  collectionName = "movies",
  datasourceId = DATASOURCE_ID
): Promise<ApiResponse> {
  const url = `${API_BASE_URL}/mongo/api/collections/${collectionName}/profile?datasourceId=${datasourceId}`;

  const body = {
    query: query,
    page: page,
    limit: limit,
    dataLimit: dataLimit,
    sampleLimit: sampleLimit,
    sample: sample ? "true" : "false",
  };

  console.log("[v0] Fetching data from:", url);
  console.log("[v0] POST body:", body);

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(
      `API request failed: ${response.status} ${response.statusText}`
    );
  }

  const data = await response.json();
  console.log("[v0] API Response structure:", {
    hasData: !!data.samplestate?.samplestate?.data,
    dataLength: data.samplestate?.samplestate?.data?.length || 0,
    columnCount: data.samplestate?.samplestate?.columnModel?.length || 0,
    keys: Object.keys(data.samplestate?.samplestate || {}),
  });

  return data;
}
