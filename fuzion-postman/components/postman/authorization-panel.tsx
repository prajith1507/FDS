"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type AuthType = "none" | "basic" | "bearer" | "api-key"

type AuthorizationPanelProps = {
  authType: AuthType
  authData: Record<string, string>
  onChange: (authType: AuthType, authData: Record<string, string>) => void
}

export function AuthorizationPanel({ authType, authData, onChange }: AuthorizationPanelProps) {
  return (
    <div className="p-6">
      <div className="flex gap-8">
        {/* Left Section - Auth Type & Description */}
        <div className="w-80 space-y-4">
          <div className="space-y-3">
            <Label htmlFor="auth-type" className="text-sm font-medium">
              Auth Type
            </Label>
            <Select value={authType} onValueChange={(v) => onChange(v as AuthType, authData)}>
              <SelectTrigger id="auth-type" className="bg-card border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Auth</SelectItem>
                <SelectItem value="basic">Basic Auth</SelectItem>
                <SelectItem value="bearer">Bearer Token</SelectItem>
                <SelectItem value="api-key">API Key</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Description Section */}
          {authType === "basic" && (
            <div className="text-sm text-muted-foreground space-y-2">
              <p>The authorization header will be automatically generated when you send the request. Learn more about <span className="text-blue-600 underline cursor-pointer">Basic Auth</span> authorization.</p>
              <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded border text-xs">
                <div className="font-medium text-blue-700 dark:text-blue-300 mb-1">💡 Pro Tip:</div>
                <div>Basic Auth automatically encodes your username:password in Base64 and adds it to the Authorization header. Perfect for APIs that require simple authentication.</div>
              </div>
            </div>
          )}

          {authType === "bearer" && (
            <div className="text-sm text-muted-foreground space-y-2">
              <p>The authorization header will be automatically generated when you send the request. Learn more about <span className="text-blue-600 underline cursor-pointer">Bearer Token</span> authorization.</p>
              <div className="bg-green-50 dark:bg-green-950 p-3 rounded border text-xs">
                <div className="font-medium text-green-700 dark:text-green-300 mb-1">💡 Pro Tip:</div>
                <div>Bearer tokens are perfect for APIs like Binance, GitHub, and other modern APIs. Get your API token from the service's developer section.</div>
              </div>
            </div>
          )}

          {authType === "api-key" && (
            <div className="text-sm text-muted-foreground space-y-2">
              <p>The API key will be added to your request as a header or query parameter. Learn more about <span className="text-blue-600 underline cursor-pointer">API Key</span> authorization.</p>
              <div className="bg-purple-50 dark:bg-purple-950 p-3 rounded border text-xs">
                <div className="font-medium text-purple-700 dark:text-purple-300 mb-1">💡 Pro Tip:</div>
                <div>API Keys can be added as headers (most common) or query parameters. Check your API documentation for the correct key name and location.</div>
              </div>
            </div>
          )}

          {authType === "none" && (
            <div className="text-sm text-muted-foreground">
              <p>This request does not use any authorization.</p>
            </div>
          )}
        </div>

        {/* Right Section - Form Fields */}
        <div className="flex-1">
          {authType === "basic" && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="username" className="text-sm">
                  Username
                </Label>
                <Input
                  id="username"
                  placeholder="orientbell"
                  value={authData.username || ""}
                  onChange={(e) => onChange(authType, { ...authData, username: e.target.value })}
                  className="bg-background border-border"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-sm">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••••"
                  value={authData.password || ""}
                  onChange={(e) => onChange(authType, { ...authData, password: e.target.value })}
                  className="bg-background border-border"
                />
              </div>
            </div>
          )}

          {authType === "bearer" && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="token" className="text-sm">
                  Token
                </Label>
                <Input
                  id="token"
                  placeholder="Enter your bearer token"
                  value={authData.token || ""}
                  onChange={(e) => onChange(authType, { ...authData, token: e.target.value })}
                  className="bg-background border-border"
                />
              </div>
            </div>
          )}

          {authType === "api-key" && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="api-key-name" className="text-sm">
                  Key Name
                </Label>
                <Input
                  id="api-key-name"
                  placeholder="X-API-Key"
                  value={authData.keyName || ""}
                  onChange={(e) => onChange(authType, { ...authData, keyName: e.target.value })}
                  className="bg-background border-border"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="api-key-value" className="text-sm">
                  Value
                </Label>
                <Input
                  id="api-key-value"
                  placeholder="API key value"
                  value={authData.key || ""}
                  onChange={(e) => onChange(authType, { ...authData, key: e.target.value })}
                  className="bg-background border-border"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="api-key-location" className="text-sm">
                  Add to
                </Label>
                <Select
                  value={authData.addTo || "header"}
                  onValueChange={(v) => onChange(authType, { ...authData, addTo: v })}
                >
                  <SelectTrigger id="api-key-location" className="bg-background border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="header">Header</SelectItem>
                    <SelectItem value="query">Query Params</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
