"use client"

import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type SettingsPanelProps = {
  settings: {
    httpVersion?: string
    sslVerification?: boolean
    followRedirects?: boolean
    followOriginalMethod?: boolean
    followAuthHeader?: boolean
    removeRefererHeader?: boolean
    strictParser?: boolean
    encodeUrl?: boolean
  }
  onChange: (settings: SettingsPanelProps["settings"]) => void
}

export function SettingsPanel({ settings, onChange }: SettingsPanelProps) {
  const update = (key: string, value: any) => {
    onChange({ ...settings, [key]: value })
  }

  return (
    <div className="p-4 space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label className="text-sm font-medium">HTTP version</Label>
          <p className="text-xs text-foreground/60">Select the HTTP version to use for sending the request.</p>
        </div>
        <Select value={settings.httpVersion || "HTTP/1.x"} onValueChange={(v) => update("httpVersion", v)}>
          <SelectTrigger className="w-40 bg-card">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="HTTP/1.x">HTTP/1.x</SelectItem>
            <SelectItem value="HTTP/2">HTTP/2</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label className="text-sm font-medium">Enable SSL certificate verification</Label>
          <p className="text-xs text-foreground/60">
            Verify SSL certificates when sending a request. Verification failures will result in the request being
            aborted.
          </p>
        </div>
        <Switch checked={settings.sslVerification || false} onCheckedChange={(v) => update("sslVerification", v)} />
      </div>

      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label className="text-sm font-medium">Automatically follow redirects</Label>
          <p className="text-xs text-foreground/60">Follow HTTP 3xx responses as redirects.</p>
        </div>
        <Switch checked={settings.followRedirects !== false} onCheckedChange={(v) => update("followRedirects", v)} />
      </div>

      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label className="text-sm font-medium">Follow original HTTP Method</Label>
          <p className="text-xs text-foreground/60">
            Redirect with the original HTTP method instead of the default behavior of redirecting with GET.
          </p>
        </div>
        <Switch
          checked={settings.followOriginalMethod || false}
          onCheckedChange={(v) => update("followOriginalMethod", v)}
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label className="text-sm font-medium">Follow Authorization header</Label>
          <p className="text-xs text-foreground/60">
            Retain authorization header when a redirect happens to a different hostname.
          </p>
        </div>
        <Switch checked={settings.followAuthHeader || false} onCheckedChange={(v) => update("followAuthHeader", v)} />
      </div>

      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label className="text-sm font-medium">Remove referer header on redirect</Label>
          <p className="text-xs text-foreground/60">Remove the referer header when a redirect happens.</p>
        </div>
        <Switch
          checked={settings.removeRefererHeader || false}
          onCheckedChange={(v) => update("removeRefererHeader", v)}
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label className="text-sm font-medium">Enable strict HTTP parser</Label>
          <p className="text-xs text-foreground/60">Restrict responses with invalid HTTP headers.</p>
        </div>
        <Switch checked={settings.strictParser || false} onCheckedChange={(v) => update("strictParser", v)} />
      </div>

      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label className="text-sm font-medium">Encode URL automatically</Label>
          <p className="text-xs text-foreground/60">Automatically encode URL parameters.</p>
        </div>
        <Switch checked={settings.encodeUrl !== false} onCheckedChange={(v) => update("encodeUrl", v)} />
      </div>
    </div>
  )
}
