/**
 * Postman Analytics API
 * Automatically fetches and analyzes Postman collections to count requests
 * Supports nested folders and tracks request counts in real-time
 */

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://obl-syncapi.fuzionest.com";
const COLLECTIONS_URL =
  process.env.NEXT_PUBLIC_COLLECTIONS_URL || `${API_BASE_URL}/api/collections/`;

export interface PostmanRequest {
  id: string;
  name: string;
  method: string;
  url: string;
  folderId?: string;
  folderPath?: string[];
}

export interface PostmanFolder {
  id: string;
  name: string;
  parentId?: string;
  requests: PostmanRequest[];
  subfolders: PostmanFolder[];
  requestCount: number;
  totalRequestCount: number; // includes subfolders
}

export interface PostmanCollection {
  id: string;
  name: string;
  folders: PostmanFolder[];
  rootRequests: PostmanRequest[]; // requests not in any folder
  totalRequests: number;
  totalFolders: number;
  lastUpdated?: string;
}

export interface PostmanAnalytics {
  collections: PostmanCollection[];
  totalCollections: number;
  totalRequests: number;
  totalFolders: number;
  requestsInFolders: number;
  requestsOutsideFolders: number;
  timestamp: string;
}

/**
 * Recursively count requests in a folder and all subfolders
 */
function countFolderRequests(folder: any): number {
  let count = 0;
  
  // Count requests in this folder
  if (folder.requests && Array.isArray(folder.requests)) {
    count += folder.requests.length;
  }
  
  // Count requests in subfolders
  if (folder.folders && Array.isArray(folder.folders)) {
    folder.folders.forEach((subfolder: any) => {
      count += countFolderRequests(subfolder);
    });
  }
  
  // Handle nested 'item' arrays (Postman format)
  if (folder.item && Array.isArray(folder.item)) {
    folder.item.forEach((item: any) => {
      if (item.request) {
        count++;
      } else if (item.item) {
        // It's a subfolder
        count += countFolderRequests(item);
      }
    });
  }
  
  return count;
}

/**
 * Parse Postman folder structure recursively
 */
function parseFolder(folderData: any, parentPath: string[] = []): PostmanFolder {
  const folder: PostmanFolder = {
    id: folderData.id || folderData._id || Math.random().toString(36),
    name: folderData.name || 'Unnamed Folder',
    parentId: folderData.parentId,
    requests: [],
    subfolders: [],
    requestCount: 0,
    totalRequestCount: 0,
  };
  
  const currentPath = [...parentPath, folder.name];
  
  // Parse requests in this folder
  if (folderData.requests && Array.isArray(folderData.requests)) {
    folder.requests = folderData.requests.map((req: any) => ({
      id: req.id || req._id || Math.random().toString(36),
      name: req.name || 'Unnamed Request',
      method: req.method || 'GET',
      url: req.url || '',
      folderId: folder.id,
      folderPath: currentPath,
    }));
    folder.requestCount = folder.requests.length;
  }
  
  // Handle Postman collection format (item array)
  if (folderData.item && Array.isArray(folderData.item)) {
    folderData.item.forEach((item: any) => {
      if (item.request) {
        // It's a request
        folder.requests.push({
          id: item.id || item._id || Math.random().toString(36),
          name: item.name || 'Unnamed Request',
          method: item.request.method || 'GET',
          url: typeof item.request.url === 'string' 
            ? item.request.url 
            : item.request.url?.raw || '',
          folderId: folder.id,
          folderPath: currentPath,
        });
        folder.requestCount++;
      } else if (item.item) {
        // It's a subfolder
        const subfolder = parseFolder(item, currentPath);
        folder.subfolders.push(subfolder);
      }
    });
  }
  
  // Parse subfolders
  if (folderData.folders && Array.isArray(folderData.folders)) {
    folder.subfolders = folderData.folders.map((subfolderData: any) => 
      parseFolder(subfolderData, currentPath)
    );
  }
  
  // Calculate total request count (including subfolders)
  folder.totalRequestCount = folder.requestCount + 
    folder.subfolders.reduce((sum, subfolder) => sum + subfolder.totalRequestCount, 0);
  
  // Log folder analysis for debugging
  console.log(`[Postman Analytics] Folder "${folder.name}": ${folder.requestCount} direct requests, ${folder.totalRequestCount} total (including subfolders)`);
  
  return folder;
}

/**
 * Parse a Postman collection
 */
function parseCollection(collectionData: any): PostmanCollection {
  const collection: PostmanCollection = {
    id: collectionData.id || collectionData._id || collectionData.info?.id || Math.random().toString(36),
    name: collectionData.name || collectionData.info?.name || 'Unnamed Collection',
    folders: [],
    rootRequests: [],
    totalRequests: 0,
    totalFolders: 0,
    lastUpdated: collectionData.updatedAt || collectionData.updated_at || new Date().toISOString(),
  };
  
  // Handle Postman collection format
  if (collectionData.item && Array.isArray(collectionData.item)) {
    collectionData.item.forEach((item: any) => {
      if (item.request) {
        // Root-level request (not in a folder)
        collection.rootRequests.push({
          id: item.id || item._id || Math.random().toString(36),
          name: item.name || 'Unnamed Request',
          method: item.request.method || 'GET',
          url: typeof item.request.url === 'string' 
            ? item.request.url 
            : item.request.url?.raw || '',
        });
      } else if (item.item) {
        // It's a folder
        const folder = parseFolder(item, []);
        collection.folders.push(folder);
      }
    });
  }
  
  // Handle custom format with separate folders and requests arrays
  if (collectionData.folders && Array.isArray(collectionData.folders)) {
    collection.folders = collectionData.folders.map((folderData: any) => 
      parseFolder(folderData, [])
    );
  }
  
  if (collectionData.requests && Array.isArray(collectionData.requests)) {
    collection.rootRequests = collectionData.requests
      .filter((req: any) => !req.folderId) // Only root requests
      .map((req: any) => ({
        id: req.id || req._id || Math.random().toString(36),
        name: req.name || 'Unnamed Request',
        method: req.method || 'GET',
        url: req.url || '',
      }));
  }
  
  // Calculate totals - count folders for display but use request counts for totals
  collection.totalFolders = collection.folders.length + 
    collection.folders.reduce((sum, folder) => {
      const countSubfolders = (f: PostmanFolder): number => 
        f.subfolders.length + f.subfolders.reduce((s, sf) => s + countSubfolders(sf), 0);
      return sum + countSubfolders(folder);
    }, 0);
  
  // IMPORTANT: Count actual requests inside folders, not the folders themselves
  collection.totalRequests = collection.rootRequests.length + 
    collection.folders.reduce((sum, folder) => sum + folder.totalRequestCount, 0);
  
  return collection;
}

/**
 * Fetch and analyze all Postman collections
 */
export async function fetchPostmanAnalytics(): Promise<PostmanAnalytics> {
  console.log('[Postman Analytics] Fetching collections from:', COLLECTIONS_URL);
  
  try {
    const response = await fetch(COLLECTIONS_URL, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      console.error('[Postman Analytics] Failed to fetch collections:', response.statusText);
      throw new Error(`Failed to fetch collections: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('[Postman Analytics] Raw response:', data);
    
    // Handle different response formats
    let collectionsData: any[] = [];
    
    if (Array.isArray(data)) {
      collectionsData = data;
    } else if (data.collections && Array.isArray(data.collections)) {
      collectionsData = data.collections;
    } else if (data.data && Array.isArray(data.data)) {
      collectionsData = data.data;
    } else if (data.data?.collections && Array.isArray(data.data.collections)) {
      collectionsData = data.data.collections;
    }
    
    console.log('[Postman Analytics] Found', collectionsData.length, 'collections');
    
    // Parse all collections
    const collections = collectionsData.map(parseCollection);
    
    // Calculate overall analytics
    // IMPORTANT: We count API requests, not folders
    // If a folder has 16 requests, we count 16, not 1
    const totalRequests = collections.reduce((sum, col) => sum + col.totalRequests, 0);
    const totalFolders = collections.reduce((sum, col) => sum + col.totalFolders, 0);
    
    // Count requests inside folders (all nested levels)
    const requestsInFolders = collections.reduce((sum, col) => 
      sum + col.folders.reduce((folderSum, folder) => folderSum + folder.totalRequestCount, 0)
    , 0);
    
    // Count requests outside any folder (root level)
    const requestsOutsideFolders = collections.reduce((sum, col) => 
      sum + col.rootRequests.length
    , 0);
    
    const analytics: PostmanAnalytics = {
      collections,
      totalCollections: collections.length,
      totalRequests, // Total API requests (not folders)
      totalFolders, // Just for information
      requestsInFolders, // e.g., 16 requests in "obl" folder
      requestsOutsideFolders, // Requests not in any folder
      timestamp: new Date().toISOString(),
    };
    
    console.log('[Postman Analytics] Analysis complete:', {
      totalCollections: analytics.totalCollections,
      totalRequests: analytics.totalRequests, // This will show 16 if "obl" folder has 16 APIs
      totalFolders: analytics.totalFolders,
      requestsInFolders: analytics.requestsInFolders, // 16 from "obl" folder
      requestsOutsideFolders: analytics.requestsOutsideFolders, // 0 if all in folders
    });
    
    return analytics;
  } catch (error) {
    console.error('[Postman Analytics] Error:', error);
    throw new Error(
      `Failed to fetch Postman analytics: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Get analytics for a specific collection
 */
export async function getCollectionAnalytics(collectionId: string): Promise<PostmanCollection | null> {
  try {
    const analytics = await fetchPostmanAnalytics();
    return analytics.collections.find(col => col.id === collectionId) || null;
  } catch (error) {
    console.error('[Postman Analytics] Error fetching collection analytics:', error);
    return null;
  }
}

/**
 * Watch for new requests (poll periodically)
 */
export function watchPostmanRequests(
  callback: (analytics: PostmanAnalytics) => void,
  intervalMs: number = 30000
): () => void {
  let previousCount = 0;
  
  const check = async () => {
    try {
      const analytics = await fetchPostmanAnalytics();
      
      if (analytics.totalRequests !== previousCount) {
        console.log('[Postman Analytics] New requests detected:', 
          analytics.totalRequests - previousCount);
        previousCount = analytics.totalRequests;
        callback(analytics);
      }
    } catch (error) {
      console.error('[Postman Analytics] Watch error:', error);
    }
  };
  
  // Initial check
  check();
  
  // Set up polling
  const intervalId = setInterval(check, intervalMs);
  
  // Return cleanup function
  return () => clearInterval(intervalId);
}
