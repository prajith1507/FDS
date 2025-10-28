# Database Explorer API Structure

## 🎯 Overview

The database explorer uses **direct database connections** to fetch collections/tables and data, rather than going through the datasources management API.

## 📡 API Endpoints Structure

### MongoDB APIs (Already Available)

#### 1. List Collections
```
GET /mongo/api/collections
```
**Response:**
```json
{
  "collections": ["users", "products", "orders"]
}
```

#### 2. Query Collection Data
```
GET /mongo/api/{collectionName}?page=1&limit=20
```
**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20)
- `query` - MongoDB query object (JSON string)
- `sort` - Sort object (JSON string)

**Response:**
```json
{
  "docs": [
    { "_id": "...", "name": "John", "age": 30 },
    { "_id": "...", "name": "Jane", "age": 25 }
  ],
  "total": 150,
  "page": 1,
  "limit": 20,
  "hasMore": true
}
```

### SQL APIs (To Be Implemented)

#### 1. List Tables
```
GET /api/db/tables?datasourceId={id}&schema={schema}
```
**Response:**
```json
{
  "tables": [
    { "name": "users", "type": "table", "rowCount": 1500, "schema": "public" },
    { "name": "products", "type": "table", "rowCount": 500, "schema": "public" }
  ]
}
```

#### 2. Query Table Data
```
GET /api/db/query?datasourceId={id}&table={name}&page=1&limit=20
```
**Query Parameters:**
- `datasourceId` - The datasource ID
- `table` - Table name
- `page` - Page number
- `limit` - Items per page
- `where` - WHERE clause (JSON string)
- `orderBy` - ORDER BY clause
- `schema` - Schema name (optional)

**Response:**
```json
{
  "rows": [
    { "id": 1, "name": "John", "age": 30 },
    { "id": 2, "name": "Jane", "age": 25 }
  ],
  "total": 150,
  "page": 1,
  "limit": 20
}
```

#### 3. Get Table Schema
```
GET /api/db/schema?datasourceId={id}&table={name}
```
**Response:**
```json
{
  "columns": [
    { "name": "id", "type": "integer", "nullable": false, "primaryKey": true },
    { "name": "name", "type": "varchar", "nullable": false },
    { "name": "age", "type": "integer", "nullable": true }
  ]
}
```

#### 4. Execute Custom Query
```
POST /api/db/execute
```
**Request Body:**
```json
{
  "datasourceId": "abc123",
  "query": "SELECT * FROM users WHERE age > $1",
  "params": [25]
}
```

## 🔄 How It Works Now

### Current Flow (MongoDB)

1. **User clicks "View Tables"** on a datasource
2. **Page loads** → `/admin/database-explorer?datasource={id}`
3. **Fetch collections:**
   ```typescript
   listMongoCollections(datasourceId)
   // → GET /mongo/api/collections
   ```
4. **User selects a collection**
5. **Load data:**
   ```typescript
   queryMongoCollection(collectionName)
   // → GET /mongo/api/{collectionName}?page=1&limit=1000
   ```

### Previous Flow (Incorrect)

❌ Was trying to use:
```
GET /api/datasources/{id}/collections
```
This endpoint **doesn't exist** and isn't needed since we can query the database directly!

## 📁 New Files Created

### `lib/api/database-explorer.ts`

Provides direct database query functions:

```typescript
// MongoDB
listMongoCollections(datasourceId?)
queryMongoCollection(collection, params?)

// SQL (when implemented)
listSqlTables(datasourceId, schema?)
querySqlTable(datasourceId, table, params?)
getTableSchema(datasourceId, table, schema?)

// Generic helpers
listDatabaseObjects(datasourceId, databaseType, schema?)
queryDatabaseObject(datasourceId, databaseType, objectName, params?)
```

## 🎯 Benefits of This Approach

### ✅ Advantages

1. **Direct Connection**: Queries go straight to the database
2. **No Middleware**: No need for datasource-specific collection endpoints
3. **Real-time Data**: Always fetches fresh data from the database
4. **Database Native**: Uses each database's native query capabilities
5. **Scalable**: Easy to add new database types

### 🔧 Implementation

#### For MongoDB (Working Now)
- Uses existing `/mongo/api/` endpoints
- Collections are fetched directly from MongoDB
- Data is queried with pagination support

#### For SQL Databases (Future)
When you implement SQL support on the backend:

1. **Add table listing** → `/api/db/tables`
2. **Add data querying** → `/api/db/query`
3. **Add schema info** → `/api/db/schema`

Then update the frontend to use `listSqlTables()` and `querySqlTable()` functions.

## 🔐 Security Considerations

### Current Setup
- MongoDB API assumes single database connection
- No authentication/authorization checks shown
- All collections accessible to anyone with API access

### Recommendations
1. **Add datasourceId to MongoDB API**:
   ```
   GET /mongo/api/collections?datasourceId={id}
   ```
2. **Implement access control**:
   - Check if user has permission to access datasource
   - Validate datasource ID before querying
3. **Rate limiting**:
   - Limit queries per minute
   - Prevent bulk data extraction
4. **Query validation**:
   - Sanitize custom queries
   - Limit query complexity

## 📝 Next Steps

### To Add SQL Support:

1. **Backend Implementation** (Node.js/Express example):

```javascript
// List tables
app.get('/api/db/tables', async (req, res) => {
  const { datasourceId, schema } = req.query
  
  // Get datasource from DB
  const datasource = await getDatasource(datasourceId)
  
  // Connect to database
  const connection = await createConnection(datasource)
  
  // Query tables
  const tables = await connection.query(`
    SELECT table_name, table_type 
    FROM information_schema.tables 
    WHERE table_schema = $1
  `, [schema || 'public'])
  
  res.json({ tables })
})

// Query table data
app.get('/api/db/query', async (req, res) => {
  const { datasourceId, table, page = 1, limit = 20 } = req.query
  
  const datasource = await getDatasource(datasourceId)
  const connection = await createConnection(datasource)
  
  const offset = (page - 1) * limit
  
  const rows = await connection.query(
    `SELECT * FROM ${table} LIMIT $1 OFFSET $2`,
    [limit, offset]
  )
  
  const [{ count }] = await connection.query(
    `SELECT COUNT(*) as count FROM ${table}`
  )
  
  res.json({
    rows,
    total: parseInt(count),
    page: parseInt(page),
    limit: parseInt(limit)
  })
})
```

2. **Frontend Usage**:

```typescript
// In a SQL database explorer component
import { listSqlTables, querySqlTable } from '@/lib/api/database-explorer'

// Load tables
const tables = await listSqlTables(datasourceId, 'public')

// Query data
const result = await querySqlTable(datasourceId, 'users', {
  page: 1,
  limit: 20,
  orderBy: 'created_at DESC'
})
```

## 🎨 UI Flow

```
Data Sources Page
    ↓ (Click "View Tables")
Database Explorer Page
    ↓ (Fetch collections/tables)
Collection/Table Selector
    ↓ (Select collection/table)
Modern Data Viewer
    ├── Table View (with sorting, filtering)
    └── JSON View (for NoSQL)
```

## 🔍 Debugging

### Check MongoDB Connection

```bash
# Test collections endpoint
curl https://obl-syncapi.fuzionest.com/mongo/api/collections

# Test specific collection
curl https://obl-syncapi.fuzionest.com/mongo/api/users?page=1&limit=10
```

### Check Datasource

```bash
# Test datasource connection
curl -X POST https://obl-syncapi.fuzionest.com/api/datasources/{id}/test
```

### Frontend Console

Open browser DevTools and check Network tab:
1. Should see call to `/mongo/api/collections`
2. Should see call to `/mongo/api/{collectionName}`
3. NO calls to `/api/datasources/{id}/collections` (removed)

## ✅ Summary

**Problem:** Was trying to use `/api/datasources/{id}/collections` which doesn't exist

**Solution:** Use direct database APIs:
- MongoDB: `/mongo/api/collections`
- SQL: `/api/db/tables` (to be implemented)

**Result:** Clean, direct database access without unnecessary middleware!
