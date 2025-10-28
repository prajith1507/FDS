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
	"relational": "bg-blue-50 text-blue-700 border border-blue-200",
	"nosql": "bg-green-50 text-green-700 border border-green-200",
	"cache": "bg-amber-50 text-amber-700 border border-amber-200",
	"analytics": "bg-orange-50 text-orange-700 border border-orange-200",
	"warehouse": "bg-purple-50 text-purple-700 border border-purple-200"
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
			<DialogContent className="w-[90vw] max-w-6xl sm:max-w-6xl md:max-w-6xl lg:max-w-6xl xl:max-w-6xl max-h-[85vh] flex flex-col">
				<DialogHeader>
					<DialogTitle className="text-xl">Select Data Source</DialogTitle>
					<DialogDescription className="text-base">
						Choose a database or data source to connect to your workflow
					</DialogDescription>
				</DialogHeader>
				
				<div className="relative mb-5">
					<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
					<Input
						placeholder="Search data sources..."
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						className="pl-10 h-11"
					/>
				</div>

				<div className="flex-1 overflow-y-auto pr-2">
					<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
						{filteredProviders.map((provider) => {
							const IconComponent = CATEGORY_ICONS[provider.category] || Database
							
							return (
								<Card 
									key={provider.id}
									className="cursor-pointer hover:shadow-lg transition-all duration-200 border-2 hover:border-blue-400 group min-w-[180px]"
									onClick={() => onSelect(provider)}
								>
									<CardContent className="p-5">
										<div className="flex flex-col items-center text-center gap-3">
											{/* Icon */}
											<div className="p-3 bg-gray-50 rounded-xl group-hover:bg-blue-50 transition-colors">
												<IconComponent className="h-10 w-10 text-gray-700 group-hover:text-blue-600" />
											</div>
											
											{/* Database Name */}
											<h3 className="font-semibold text-lg text-gray-900 group-hover:text-blue-600 transition-colors w-full">
												{provider.name}
											</h3>
											
											{/* Badge */}
											<Badge 
												variant="secondary" 
												className={`text-xs px-3 py-1 font-medium ${CATEGORY_COLORS[provider.category]}`}
											>
												{provider.category}
											</Badge>
											
											{/* Description */}
											<p className="text-sm text-gray-600 leading-relaxed w-full">
												{provider.description}
											</p>
										</div>
									</CardContent>
								</Card>
							)
						})}
					</div>
					
					{filteredProviders.length === 0 && (
						<div className="text-center py-12">
							<Search className="h-12 w-12 mx-auto mb-3 text-gray-300" />
							<p className="text-gray-500 text-sm">
								No data sources found matching "{searchTerm}"
							</p>
						</div>
					)}
				</div>
			</DialogContent>
		</Dialog>
	)
}