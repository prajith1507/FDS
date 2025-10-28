/* Minimal Postman schema types needed for rendering and syncing */
export type PMUrl = { raw?: string };
export type PMRequest = {
  method?: string;
  url?: PMUrl | string;
  body?: any;
  header?: Array<{ key: string; value: string }>;
};
export type PMItem = {
  name: string;
  item?: PMItem[]; // folder when present
  request?: PMRequest; // request node when present
  description?: string;
  sampleResponse?: any;
};
export type PMCollection = {
  info?: { name?: string; _postman_id?: string; schema?: string };
  item: PMItem[];
};

/* UI tree node model */
export type TreeNode =
  | {
      id: string;
      type: "folder";
      name: string;
      children: TreeNode[];
      key?: string;
    }
  | {
      id: string;
      type: "request";
      name: string;
      method: string;
      key?: string;
      urlRaw?: string;
      headers?: Array<{ key: string; value: string }>;
      bodyMode?:
        | "none"
        | "form-data"
        | "x-www-form-urlencoded"
        | "raw"
        | "binary"
        | "GraphQL";
      bodyRaw?: string;
      description?: string;
      sampleResponse?: any;
      queryParams?: Array<{
        key: string;
        value: string;
        description?: string;
        enabled?: boolean;
      }>;
      authConfig?: {
        type: "none" | "basic" | "bearer" | "api-key";
        username?: string;
        password?: string;
        token?: string;
        key?: string;
        keyName?: string;
        addTo?: "header" | "query";
      };
      // New auth format from API response
      authType?: "none" | "basic" | "bearer" | "api-key";
      authData?: Record<string, string>;
    };

/* Visual method badge classes */
export const METHOD_CLASS: Record<string, string> = {
  GET: "bg-method-get text-[color:var(--pm-method-on)]",
  POST: "bg-method-post text-[color:var(--pm-method-on)]",
  PUT: "bg-method-put text-[color:var(--pm-method-on)]",
  DELETE: "bg-method-delete text-[color:var(--pm-method-on)]",
  PATCH: "bg-method-post text-[color:var(--pm-method-on)]",
};

/* Build UI tree from a Postman collection */
export function buildTree(collection: PMCollection): TreeNode[] {
  let idCounter = 0;
  const nextId = () => `n-${++idCounter}`;

  function toNode(it: PMItem): TreeNode {
    console.log(
      "🌳 buildTree processing item:",
      it.name,
      "has key:",
      !!(it as any).key,
      "key value:",
      (it as any).key
    );
    if (it.item && Array.isArray(it.item)) {
      return {
        id: nextId(),
        type: "folder",
        name: it.name,
        children: it.item.map(toNode),
        key: (it as any).key, // Preserve folder key if exists
      };
    }
    const method = (it.request?.method || "GET").toUpperCase();
    const urlRaw =
      typeof it.request?.url === "string"
        ? it.request?.url
        : it.request?.url?.raw || "";
    const headers = (it.request as any)?.header || [];
    const bodyMode = (it.request as any)?.body?.mode || "raw";
    const bodyRaw = (it.request as any)?.body?.raw || "";
    const description = (it as any).description || "";
    const sampleResponse = (it as any).sampleResponse || null;

    // Use existing key or generate one based on the name
    const existingKey = (it as any).key;
    const generatedKey =
      existingKey ||
      it.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

    console.log("🔑 Key resolution:", {
      name: it.name,
      existingKey,
      generatedKey,
    });

    return {
      id: nextId(),
      type: "request",
      name: it.name,
      method,
      key: generatedKey,
      urlRaw,
      headers,
      bodyMode,
      bodyRaw,
      description,
      sampleResponse,
    };
  }

  return (collection.item || []).map(toNode);
}

/* Filter tree by text, keeping folders with matching descendants */
export function filterTree(nodes: TreeNode[], q: string): TreeNode[] {
  if (!q) return nodes;
  const term = q.toLowerCase();

  function f(n: TreeNode): TreeNode | null {
    if (n.type === "request") {
      return n.name.toLowerCase().includes(term) ? n : null;
    }
    const kept = n.children.map(f).filter(Boolean) as TreeNode[];
    if (n.name.toLowerCase().includes(term) || kept.length) {
      return { ...n, children: kept };
    }
    return null;
  }

  return nodes.map(f).filter(Boolean) as TreeNode[];
}

/* Insert a child into a parent folder (or root when parentId=null) */
export function insertChild(
  nodes: TreeNode[],
  parentId: string | null,
  child: TreeNode
): TreeNode[] {
  if (!parentId) return [...nodes, child];
  return nodes.map((n) => {
    if (n.type === "folder") {
      if (n.id === parentId) return { ...n, children: [...n.children, child] };
      return { ...n, children: insertChild(n.children, parentId, child) };
    }
    return n;
  });
}

/* Update a node's name by id (immutable) */
export function updateNodeName(
  nodes: TreeNode[],
  id: string,
  name: string
): TreeNode[] {
  return nodes.map((n) => {
    if (n.id === id) {
      return n.type === "folder" ? { ...n, name } : { ...n, name };
    }
    if (n.type === "folder") {
      return { ...n, children: updateNodeName(n.children, id, name) };
    }
    return n;
  });
}

/* Remove a node by id (immutable) */
export function removeNode(nodes: TreeNode[], id: string): TreeNode[] {
  const result: TreeNode[] = [];
  for (const n of nodes) {
    if (n.id === id) continue;
    if (n.type === "folder") {
      result.push({ ...n, children: removeNode(n.children, id) });
    } else {
      result.push(n);
    }
  }
  return result;
}

/* Duplicate a branch by id and append at the same level (immutable) */
export function duplicateBranch(
  nodes: TreeNode[],
  targetId: string,
  nextId: () => string
): TreeNode[] {
  function deepCloneWithNewIds(node: TreeNode): TreeNode {
    if (node.type === "folder") {
      return {
        id: nextId(),
        type: "folder",
        name: `Copy of ${node.name}`,
        children: node.children.map(deepCloneWithNewIds),
      };
    }
    return {
      id: nextId(),
      type: "request",
      name: `Copy of ${node.name}`,
      method: node.method,
      urlRaw: node.urlRaw,
      headers: node.headers,
      bodyMode: node.bodyMode,
      bodyRaw: node.bodyRaw,
      description: node.description,
      sampleResponse: node.sampleResponse,
    };
  }

  const res: TreeNode[] = [];
  for (const n of nodes) {
    if (n.type === "folder") {
      // recurse into children
      const childIdx = n.children.findIndex((c) => c.id === targetId);
      if (childIdx !== -1) {
        const dup = deepCloneWithNewIds(n.children[childIdx]);
        const newChildren = [...n.children];
        newChildren.splice(childIdx + 1, 0, dup);
        res.push({ ...n, children: newChildren });
        continue;
      }
      res.push({
        ...n,
        children: duplicateBranch(n.children, targetId, nextId),
      });
      continue;
    }
    if (n.id === targetId) {
      const dup = deepCloneWithNewIds(n);
      res.push(n, dup);
      continue;
    }
    res.push(n);
  }
  return res;
}

/* Recreate a Postman collection JSON from the UI tree */
export function exportToPMCollection(
  info: PMCollection["info"] = {},
  tree: TreeNode[]
): PMCollection {
  function toPMItem(n: TreeNode): PMItem {
    if (n.type === "folder") {
      return {
        name: n.name,
        item: n.children.map(toPMItem),
      };
    }
    return {
      name: n.name,
      request: {
        method: n.method,
        header: n.headers || [],
        body: { mode: n.bodyMode || "raw", raw: n.bodyRaw || "" },
        url: { raw: n.urlRaw || "" },
      },
      description: n.description || "",
      sampleResponse: n.sampleResponse || null,
    } as any;
  }
  return {
    info: {
      _postman_id: info?._postman_id || "",
      name: info?.name || "Collection",
      schema:
        info?.schema ||
        "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
    },
    item: tree.map(toPMItem),
  };
}

/* Move a node to a new location in the tree */
export function moveNode(
  nodes: TreeNode[],
  sourceId: string,
  targetId: string | null,
  position: 'before' | 'after' | 'inside'
): TreeNode[] {
  // First find and remove the source node
  let sourceNode: TreeNode | undefined;
  const removeSource = (items: TreeNode[]): TreeNode[] => {
    const result: TreeNode[] = [];
    for (const item of items) {
      if (item.id === sourceId) {
        sourceNode = item;
        continue;
      }
      if (item.type === 'folder') {
        result.push({ ...item, children: removeSource(item.children) });
      } else {
        result.push(item);
      }
    }
    return result;
  };
  
  let newTree = removeSource([...nodes]);
  if (!sourceNode) return nodes; // Source not found

  // Then insert it at the target location
  const insert = (items: TreeNode[]): TreeNode[] => {
    const result: TreeNode[] = [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      
      if (position === 'before' && item.id === targetId) {
        result.push(sourceNode!, item);
        continue;
      }
      
      if (position === 'after' && item.id === targetId) {
        result.push(item, sourceNode!);
        continue;
      }
      
      if (position === 'inside' && item.id === targetId && item.type === 'folder') {
        result.push({
          ...item,
          children: [...item.children, sourceNode!]
        });
        continue;
      }
      
      if (item.type === 'folder') {
        result.push({
          ...item,
          children: insert(item.children)
        });
      } else {
        result.push(item);
      }
    }
    return result;
  };

  // If targetId is null, append to root
  if (!targetId) {
    return [...newTree, sourceNode];
  }

  return insert(newTree);
}

/* Get the full path of node IDs from root to the target node */
export function getNodePath(nodes: TreeNode[], targetId: string): string[] {
  const path: string[] = [];
  
  const find = (items: TreeNode[]): boolean => {
    for (const item of items) {
      if (item.id === targetId) {
        path.push(item.id);
        return true;
      }
      if (item.type === 'folder') {
        if (find(item.children)) {
          path.unshift(item.id);
          return true;
        }
      }
    }
    return false;
  };
  
  find(nodes);
  return path;
}

/* Find a node by its ID */
export function findNodeById(nodes: TreeNode[], id: string): TreeNode | null {
  for (const node of nodes) {
    if (node.id === id) return node;
    if (node.type === 'folder') {
      const found = findNodeById(node.children, id);
      if (found) return found;
    }
  }
  return null;
}

/* Check if source can be dropped on target */
export function canDrop(
  nodes: TreeNode[],
  sourceId: string,
  targetId: string,
  position: 'before' | 'after' | 'inside'
): boolean {
  // Can't drop on itself
  if (sourceId === targetId) return false;
  
  // Get source and target nodes
  const source = findNodeById(nodes, sourceId);
  const target = findNodeById(nodes, targetId);
  if (!source || !target) return false;
  
  // Can't drop inside a request
  if (position === 'inside' && target.type === 'request') return false;
  
  // Check if target is a descendant of source
  if (source.type === 'folder') {
    const targetPath = getNodePath(nodes, targetId);
    return !targetPath.includes(sourceId);
  }
  
  return true;
}

/* New util to update request fields by id */
export function updateRequestFields(
  nodes: TreeNode[],
  id: string,
  patch: Partial<Extract<TreeNode, { type: "request" }>>
): TreeNode[] {
  return nodes.map((n) => {
    if (n.id === id && n.type === "request") {
      return { ...n, ...patch };
    }
    if (n.type === "folder") {
      return { ...n, children: updateRequestFields(n.children, id, patch) };
    }
    return n;
  });
}

// New util to merge imported collection into existing tree without replacing
export function mergeTrees(
  base: TreeNode[],
  incoming: TreeNode[],
  genId?: () => string
): TreeNode[] {
  const existingIds = new Set<string>();
  const collect = (nodes: TreeNode[]) => {
    for (const n of nodes) {
      existingIds.add(n.id);
      if (n.type === "folder") collect(n.children);
    }
  };
  collect(base);
  let counter = 0;
  const makeId =
    genId ||
    (() => {
      // generate ids that don't collide with existing ones
      let id = "";
      do {
        id = `imp-${Date.now().toString(36)}-${counter++}`;
      } while (existingIds.has(id));
      existingIds.add(id);
      return id;
    });

  const cloneWithNewIds = (n: TreeNode): TreeNode => {
    if (n.type === "folder") {
      return {
        id: makeId(),
        type: "folder",
        name: n.name,
        children: n.children.map(cloneWithNewIds),
      };
    }
    return {
      id: makeId(),
      type: "request",
      name: n.name,
      method: n.method,
      urlRaw: n.urlRaw,
      headers: n.headers,
      bodyMode: n.bodyMode,
      bodyRaw: n.bodyRaw,
      description: n.description,
      sampleResponse: n.sampleResponse,
    };
  };

  const mergeFolderChildren = (
    dstChildren: TreeNode[],
    srcChildren: TreeNode[]
  ): TreeNode[] => {
    const result: TreeNode[] = dstChildren.map((c) => ({
      ...c,
      ...(c.type === "folder" ? { children: [...c.children] } : {}),
    }));
    for (const src of srcChildren) {
      const matchIdx = result.findIndex(
        (d) =>
          d.type === src.type &&
          d.name.trim().toLowerCase() === src.name.trim().toLowerCase()
      );
      if (matchIdx >= 0) {
        const dst = result[matchIdx];
        if (dst.type === "folder" && src.type === "folder") {
          result[matchIdx] = {
            ...dst,
            children: mergeFolderChildren(dst.children, src.children),
          };
        } else if (dst.type === "request" && src.type === "request") {
          // Update request fields (non-destructive fallback to existing)
          result[matchIdx] = {
            ...dst,
            method: src.method || dst.method,
            urlRaw: src.urlRaw ?? dst.urlRaw,
            headers: src.headers ?? dst.headers,
            bodyMode: src.bodyMode ?? dst.bodyMode,
            bodyRaw: src.bodyRaw ?? dst.bodyRaw,
            description: src.description ?? dst.description,
            sampleResponse: src.sampleResponse ?? dst.sampleResponse,
          };
        }
      } else {
        // No match in destination; append a fresh-cloned node with new ids
        result.push(cloneWithNewIds(src));
      }
    }
    return result;
  };

  return mergeFolderChildren(base, incoming);
}
