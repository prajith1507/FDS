"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Loader2, CheckCircle, XCircle, Eye, EyeOff, TestTube, Database, Info, ChevronDown, ChevronUp } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { DatabaseProvider, AnyDatabaseConfig, ConnectionTestResult } from "@/lib/types/datasource"
import { cn } from "@/lib/utils"

interface DatabaseConfigFormProps {
  provider: DatabaseProvider
  initialConfig?: AnyDatabaseConfig
  onSave: (config: AnyDatabaseConfig) => void
  onCancel: () => void
  isEditing?: boolean
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function DatabaseConfigForm({
  provider,
  initialConfig,
  onSave,
  onCancel,
  isEditing = false,
  open,
  onOpenChange,
  onSuccess
}: DatabaseConfigFormProps) {
  const { toast } = useToast()
  
  // Helper function to check if provider supports connection strings
  const supportsConnectionString = (providerId: string) => {
    return ['postgresql', 'mysql', 'mongodb', 'mariadb', 'redis', 'clickhouse', 'elasticsearch'].includes(providerId)
  }

  const getDefaultConfig = (providerId: string) => ({
    name: '',
    type: providerId,
    connectionString: '',
    description: '',
    host: '',
    port: getDefaultPort(providerId),
    database: '',
    username: '',
    password: '',
    documentation: ''
  })

  const [config, setConfig] = useState<any>(() => 
    initialConfig || getDefaultConfig(provider.id)
  )
  
  const [showPassword, setShowPassword] = useState(false)
  const [isTestingConnection, setIsTestingConnection] = useState(false)
  const [connectionTestResult, setConnectionTestResult] = useState<ConnectionTestResult | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  // Initialize useConnectionString based on whether the provider supports it
  const [useConnectionString, setUseConnectionString] = useState(
    supportsConnectionString(provider.id)
  )

  const updateConfig = (field: string, value: any) => {
    setConfig((prev: any) => ({ ...prev, [field]: value }))
    // Clear test result when config changes
    setConnectionTestResult(null)
  }

  // Reset form state when dialog opens or provider changes
  useEffect(() => {
    if (open) {
      // Reset form state properly
      if (initialConfig) {
        // If editing, use the initial config
        setConfig(initialConfig)
      } else {
        // If adding new, use default config for the provider
        setConfig(getDefaultConfig(provider.id))
      }
      
      setUseConnectionString(supportsConnectionString(provider.id))
      setConnectionTestResult(null)
      setShowAdvanced(false)
      setShowPassword(false)
      setIsTestingConnection(false)
      setIsSaving(false)
    }
  }, [provider.id, open, initialConfig])

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      // Clear form state when dialog closes
      setConfig(getDefaultConfig(provider.id))
      setConnectionTestResult(null)
      setShowAdvanced(false)
      setShowPassword(false)
      setIsTestingConnection(false)
      setIsSaving(false)
    }
  }, [open, provider.id])

  const testConnection = async () => {
    setIsTestingConnection(true)
    setConnectionTestResult(null)
    
    try {
      // Simulate API call - replace with actual implementation
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Mock successful connection
      const result: ConnectionTestResult = {
        success: true,
        message: "Connection successful",
        latency: Math.floor(Math.random() * 100) + 50,
        version: getDefaultVersion(provider.id)
      }
      
      setConnectionTestResult(result)
      toast({
        title: "Connection Test Successful",
        description: `Connected to ${provider.name} in ${result.latency}ms`,
      })
    } catch (error) {
      const result: ConnectionTestResult = {
        success: false,
        message: "Failed to connect to database. Please check your credentials."
      }
      setConnectionTestResult(result)
      toast({
        title: "Connection Test Failed",
        description: result.message,
        variant: "destructive"
      })
    } finally {
      setIsTestingConnection(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      // Validate required fields
      if (!config.name) {
        toast({
          title: "Validation Error",
          description: "Please enter a name for this data source",
          variant: "destructive"
        })
        setIsSaving(false)
        return
      }

      // Validate connection string or individual fields
      if (supportsConnectionString(provider.id) && useConnectionString) {
        if (!config.connectionString) {
          toast({
            title: "Validation Error",
            description: "Please enter a connection string",
            variant: "destructive"
          })
          setIsSaving(false)
          return
        }
      } else if (provider.id !== 'sqlite') {
        if (!config.host || !config.username) {
          toast({
            title: "Validation Error",
            description: "Please fill in all required fields",
            variant: "destructive"
          })
          setIsSaving(false)
          return
        }
      }

      // Call the parent's onSave function which handles the API call and optimistic updates
      await onSave(config)
      
      console.log('[DatabaseConfigForm] Save completed, showing toast...')
      
      // Show success toast immediately after optimistic update
      toast({
        title: isEditing ? "Data Source Updated Successfully!" : "Data Source Added Successfully!",
        description: `${config.name} has been ${isEditing ? 'updated' : 'added'} successfully`,
      })
      
      // Close the dialog immediately
      onOpenChange(false)
      
      // Call success callback immediately
      if (onSuccess) {
        onSuccess()
      }
      
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : `Failed to ${isEditing ? 'update' : 'add'} data source`,
        variant: "destructive"
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[90vw] max-w-4xl sm:max-w-4xl md:max-w-4xl lg:max-w-4xl xl:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <Database className="h-6 w-6" />
            <div>
              <DialogTitle>{provider.name}</DialogTitle>
              <DialogDescription>{provider.description}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Connection Configuration */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900">Connection Configuration</h3>
            <p className="text-sm text-muted-foreground">Configure your {provider.name} connection settings</p>

            {/* Essential Fields */}
            <div className="space-y-4">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name">
                  Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="e.g., Production Database"
                  value={config.name}
                  onChange={(e) => updateConfig('name', e.target.value)}
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Brief description of this data source"
                  value={config.description}
                  onChange={(e) => updateConfig('description', e.target.value)}
                  rows={2}
                />
              </div>
              
              {/* Connection String (for supported databases) */}
              {supportsConnectionString(provider.id) && useConnectionString ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="connectionString">
                      Connection String <span className="text-destructive">*</span>
                    </Label>
                    <Button
                      type="button"
                      variant="link"
                      size="sm"
                      className="h-auto p-0 text-xs"
                      onClick={() => setUseConnectionString(false)}
                    >
                      Use individual fields
                    </Button>
                  </div>
                  <Textarea
                    id="connectionString"
                    placeholder={getConnectionStringPlaceholder(provider.id)}
                    value={config.connectionString}
                    onChange={(e) => updateConfig('connectionString', e.target.value)}
                    rows={3}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    {getConnectionStringHelp(provider.id)}
                  </p>
                </div>
              ) : (
                <>
                  {supportsConnectionString(provider.id) && (
                    <div className="flex justify-end">
                      <Button
                        type="button"
                        variant="link"
                        size="sm"
                        className="h-auto p-0 text-xs"
                        onClick={() => setUseConnectionString(true)}
                      >
                        Use connection string
                      </Button>
                    </div>
                  )}
                  
                  {/* Host */}
                  {provider.id !== 'sqlite' && (
                    <div className="space-y-2">
                      <Label htmlFor="host">
                        Host <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="host"
                        placeholder="145.223.23.191"
                        value={config.host}
                        onChange={(e) => updateConfig('host', e.target.value)}
                      />
                    </div>
                  )}

                  {/* Database */}
                  <div className="space-y-2">
                    <Label htmlFor="database">
                      {getDatabaseLabel(provider.id)} <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="database"
                      placeholder={getDatabasePlaceholder(provider.id)}
                      value={config.database}
                      onChange={(e) => updateConfig('database', e.target.value)}
                    />
                  </div>

                  {/* Username */}
                  {provider.id !== 'sqlite' && (
                    <div className="space-y-2">
                      <Label htmlFor="username">
                        Username <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="username"
                        placeholder="username"
                        value={config.username}
                        onChange={(e) => updateConfig('username', e.target.value)}
                      />
                    </div>
                  )}

                  {/* Password */}
                  {provider.id !== 'sqlite' && (
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          value={config.password}
                          onChange={(e) => updateConfig('password', e.target.value)}
                          className="pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Advanced Options */}
            <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-between p-0 h-auto font-semibold text-sm hover:bg-transparent"
                >
                  <span className="flex items-center gap-2">
                    <Database className="h-4 w-4" />
                    Advanced Options
                  </span>
                  {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-4 pt-4">
                {/* Port */}
                {provider.id !== 'sqlite' && (
                  <div className="space-y-2">
                    <Label htmlFor="port">Port</Label>
                    <Input
                      id="port"
                      type="number"
                      placeholder={getDefaultPort(provider.id).toString()}
                      value={config.port}
                      onChange={(e) => updateConfig('port', parseInt(e.target.value) || getDefaultPort(provider.id))}
                    />
                  </div>
                )}

                {/* SSL Toggle */}
                {provider.id !== 'sqlite' && (
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="ssl"
                      checked={config.ssl || false}
                      onCheckedChange={(checked) => updateConfig('ssl', checked)}
                    />
                    <Label htmlFor="ssl">Enable SSL/TLS</Label>
                  </div>
                )}

                {/* Connection Timeout */}
                <div className="space-y-2">
                  <Label htmlFor="timeout">Connection Timeout (seconds)</Label>
                  <Input
                    id="timeout"
                    type="number"
                    placeholder="30"
                    value={config.connectionTimeout || ''}
                    onChange={(e) => updateConfig('connectionTimeout', parseInt(e.target.value) || 30)}
                  />
                </div>

                {/* Database-specific fields */}
                {renderDatabaseSpecificFields(provider.id, config, updateConfig)}

                {/* Documentation */}
                <div className="space-y-2">
                  <Label htmlFor="documentation">Documentation</Label>
                  <Textarea
                    id="documentation"
                    placeholder="Provide context about your database structure, business logic, or specific instructions for AI to interact with your data effectively..."
                    value={config.documentation}
                    onChange={(e) => updateConfig('documentation', e.target.value)}
                    rows={4}
                  />
                  <p className="text-xs text-muted-foreground">
                    Help AI understand your data better by providing context about tables, relationships, or business rules.
                  </p>
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Connection Test Result */}
            {connectionTestResult && (
              <Alert className={cn(
                connectionTestResult.success 
                  ? "border-green-200 bg-green-50 text-green-800" 
                  : "border-red-200 bg-red-50 text-red-800"
              )}>
                {connectionTestResult.success ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <XCircle className="h-4 w-4" />
                )}
                <AlertDescription>
                  {connectionTestResult.message}
                  {connectionTestResult.latency && (
                    <span className="ml-2 text-xs">
                      ({connectionTestResult.latency}ms)
                    </span>
                  )}
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-between pt-4 border-t">
            <Button
              variant="outline"
              onClick={testConnection}
              disabled={
                isTestingConnection || 
                (!config.connectionString && !config.host) ||
                (!config.connectionString && !config.username)
              }
              className="flex items-center gap-2"
            >
              {isTestingConnection ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <TestTube className="h-4 w-4" />
              )}
              Test Connection
            </Button>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => {
                onCancel()
                onOpenChange(false)
              }}>
                Cancel
              </Button>
              <Button 
                onClick={handleSave} 
                disabled={
                  isSaving || 
                  !config.name ||
                  (supportsConnectionString(provider.id) && useConnectionString && !config.connectionString) ||
                  (!useConnectionString && provider.id !== 'sqlite' && (!config.host || !config.username))
                }
                className="flex items-center gap-2"
              >
                {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                {isEditing ? 'Update' : 'Add'} Data Source
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function getDefaultPort(type: string): number {
  const ports: Record<string, number> = {
    postgresql: 5432,
    mysql: 3306,
    mongodb: 27017,
    oracle: 1521,
    sqlserver: 1433,
    redis: 6379,
    elasticsearch: 9200,
    clickhouse: 8123,
    mariadb: 3306,
    cassandra: 9042
  }
  return ports[type] || 5432
}

function getDatabaseLabel(type: string): string {
  const labels: Record<string, string> = {
    sqlite: 'File Path',
    mongodb: 'Database',
    snowflake: 'Database',
    bigquery: 'Project ID',
    redshift: 'Database',
    saphana: 'Database'
  }
  return labels[type] || 'Database'
}

function getDatabasePlaceholder(type: string): string {
  const placeholders: Record<string, string> = {
    sqlite: '/path/to/database.db',
    mongodb: 'myapp',
    snowflake: 'WAREHOUSE_DB',
    bigquery: 'my-project-id',
    redshift: 'analytics',
    saphana: 'HDB'
  }
  return placeholders[type] || 'database_name'
}

function getDefaultVersion(type: string): string {
  const versions: Record<string, string> = {
    postgresql: '15.2',
    mysql: '8.0.33',
    mongodb: '6.0.5',
    oracle: '19c',
    sqlserver: '2022',
    redis: '7.0.8',
    elasticsearch: '8.7.0'
  }
  return versions[type] || '1.0.0'
}

function getConnectionStringPlaceholder(type: string): string {
  const placeholders: Record<string, string> = {
    postgresql: 'postgresql://username:password@145.223.23.191:5432/database_name',
    mysql: 'mysql://username:password@145.223.23.191:3306/database_name',
    mongodb: 'mongodb://username:password@145.223.23.191:27017/database_name?authSource=admin',
    mariadb: 'mariadb://username:password@145.223.23.191:3306/database_name',
    redis: 'redis://username:password@145.223.23.191:6379/0',
    clickhouse: 'clickhouse://username:password@145.223.23.191:8123/database_name',
    elasticsearch: 'http://username:password@145.223.23.191:9200'
  }
  return placeholders[type] || ''
}

function getConnectionStringHelp(type: string): string {
  const help: Record<string, string> = {
    postgresql: 'Format: postgresql://user:password@host:port/database',
    mysql: 'Format: mysql://user:password@host:port/database',
    mongodb: 'Format: mongodb://user:password@host:port/database?options',
    mariadb: 'Format: mariadb://user:password@host:port/database',
    redis: 'Format: redis://user:password@host:port/db',
    clickhouse: 'Format: clickhouse://user:password@host:port/database',
    elasticsearch: 'Format: http://user:password@host:port'
  }
  return help[type] || 'Enter your database connection string'
}

function renderDatabaseSpecificFields(type: string, config: any, updateConfig: (field: string, value: any) => void) {
  switch (type) {
    case 'sqlite':
      return (
        <div className="space-y-2">
          <Label htmlFor="filePath">
            Database File Path <span className="text-destructive">*</span>
          </Label>
          <Input
            id="filePath"
            placeholder="/path/to/database.db"
            value={config.filePath || ''}
            onChange={(e) => updateConfig('filePath', e.target.value)}
          />
        </div>
      )

    case 'mongodb':
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="authSource">Auth Source</Label>
            <Input
              id="authSource"
              placeholder="admin"
              value={config.authSource || ''}
              onChange={(e) => updateConfig('authSource', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="replicaSet">Replica Set</Label>
            <Input
              id="replicaSet"
              placeholder="rs0"
              value={config.replicaSet || ''}
              onChange={(e) => updateConfig('replicaSet', e.target.value)}
            />
          </div>
        </div>
      )

    case 'snowflake':
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="account">
              Account <span className="text-destructive">*</span>
            </Label>
            <Input
              id="account"
              placeholder="xy12345.snowflakecomputing.com"
              value={config.account || ''}
              onChange={(e) => updateConfig('account', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="warehouse">Warehouse</Label>
            <Input
              id="warehouse"
              placeholder="COMPUTE_WH"
              value={config.warehouse || ''}
              onChange={(e) => updateConfig('warehouse', e.target.value)}
            />
          </div>
        </div>
      )

    case 'oracle':
      return (
        <div className="space-y-2">
          <Label htmlFor="serviceName">Service Name / SID</Label>
          <Input
            id="serviceName"
            placeholder="ORCL"
            value={config.serviceName || ''}
            onChange={(e) => updateConfig('serviceName', e.target.value)}
          />
        </div>
      )

    case 'redis':
      return (
        <div className="space-y-2">
          <Label htmlFor="db">Database Number</Label>
          <Input
            id="db"
            type="number"
            placeholder="0"
            value={config.db || ''}
            onChange={(e) => updateConfig('db', parseInt(e.target.value) || 0)}
          />
        </div>
      )

    default:
      return null
  }
}