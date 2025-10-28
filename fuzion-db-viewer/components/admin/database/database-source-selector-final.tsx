"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Search, Database, Server, Cloud, BarChart3, Zap } from "lucide-react"
import { useState } from "react"
import { DatabaseProvider } from "@/lib/types/datasource"

const DATABASE_PROVIDERS: DatabaseProvider[] = [
  { id: "postgresql", name: "PostgreSQL", icon: "Database", category: "relational", description: "Open-source relational database" },
  { id: "mysql", name: "MySQL", icon: "Database", category: "relational", description: "Popular relational database" },
  { id: "sqlite", name: "SQLite", icon: "Database", category: "relational", description: "Lightweight file-based database" },
  { id: "mongodb", name: "MongoDB", icon: "Server", category: "nosql", description: "Document-oriented database" },
  { id: "redis", name: "Redis", icon: "Zap", category: "cache", description: "In-memory data structure store" },
  { id: "cassandra", name: "Cassandra", icon: "Server", category: "nosql", description: "Distributed wide-column database" },
  { id: "elasticsearch", name: "Elasticsearch", icon: "Search", category: "analytics", description: "Distributed search engine" },
  { id: "bigquery", name: "BigQuery", icon: "BarChart3", category: "warehouse", description: "Google Cloud data warehouse" },
  { id: "snowflake", name: "Snowflake", icon: "Cloud", category: "warehouse", description: "Cloud data platform" },
  { id: "clickhouse", name: "ClickHouse", icon: "BarChart3", category: "analytics", description: "Columnar database for analytics" },
  { id: "oracle", name: "Oracle", icon: "Database", category: "relational", description: "Enterprise relational database" },
  { id: "sqlserver", name: "SQL Server", icon: "Database", category: "relational", description: "Microsoft relational database" },
  { id: "redshift", name: "Redshift", icon: "Cloud", category: "warehouse", description: "AWS data warehouse" },
  { id: "mariadb", name: "MariaDB", icon: "Database", category: "relational", description: "MySQL-compatible database" },
  { id: "saphana", name: "SAP HANA", icon: "BarChart3", category: "analytics", description: "In-memory analytics platform" },
  { id: "vertica", name: "Vertica", icon: "BarChart3", category: "analytics", description: "Columnar analytics database" },
  { id: "trino", name: "Trino", icon: "BarChart3", category: "analytics", description: "Distributed SQL query engine" }
]

const CATEGORY_ICONS = {
  "relational": Database,
  "nosql": Server,
  "cache": Zap,
  "analytics": BarChart3,
  "warehouse": Cloud
}

const CATEGORY_COLORS = {
  "relational": "bg-blue-100 text-blue-800",
  "nosql": "bg-green-100 text-green-800",
  "cache": "bg-yellow-100 text-yellow-800",
  "analytics": "bg-orange-100 text-orange-800",
  "warehouse": "bg-purple-100 text-purple-800"
}

interface DatabaseSourceSelectorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (provider: DatabaseProvider) => void
}

export function DatabaseSourceSelector({ open, onOpenChange, onSelect }: DatabaseSourceSelectorProps) {
  const [searchTerm, setSearchTerm] = useState("")

  const filteredProviders = DATABASE_PROVIDERS.filter(provider =>
    provider.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    provider.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    provider.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Select Data Source</DialogTitle>
          <DialogDescription>
            Choose a database or data source to connect to your workflow
          </DialogDescription>
        </DialogHeader>
        
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search data sources..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredProviders.map((provider) => {
              const IconComponent = CATEGORY_ICONS[provider.category] || Database
              
              return (
                <Card 
                  key={provider.id}
                  className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-blue-200"
                  onClick={() => onSelect(provider)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="mt-1">
                        <IconComponent className="h-6 w-6 text-gray-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium text-sm truncate">{provider.name}</h3>
                          <Badge 
                            variant="secondary" 
                            className={`text-xs px-2 py-0 ${CATEGORY_COLORS[provider.category]}`}
                          >
                            {provider.category}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-500 line-clamp-2">{provider.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
          
          {filteredProviders.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No data sources found matching "{searchTerm}"
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}