import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Palette, Server, Shield, Bell } from "lucide-react";
import { useTheme, type Theme } from "@/components/theme/theme-provider.tsx";

export default function Settings() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground">Configure your EDC connector settings and preferences</p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              Connector Configuration
            </CardTitle>
            <CardDescription>Basic configuration settings for your EDC connector</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="connector-name">Connector Name</Label>
              <Input id="connector-name" defaultValue="EDC Connector" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="connector-id">Connector ID</Label>
              <Input id="connector-id" defaultValue="urn:connector:provider" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="connector-url">Connector URL</Label>
              <Input id="connector-url" defaultValue="http://localhost:16806/protocol" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="management-url">Management API URL</Label>
              <Input id="management-url" defaultValue="http://localhost:19193/management" />
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security Settings
            </CardTitle>
            <CardDescription>Configure security and authentication settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Enable Authentication</Label>
                <div className="text-sm text-muted-foreground">Require authentication for API access</div>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Enable HTTPS</Label>
                <div className="text-sm text-muted-foreground">Force HTTPS for all connections</div>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Enable Audit Logging</Label>
                <div className="text-sm text-muted-foreground">Log all connector activities</div>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notification Settings
            </CardTitle>
            <CardDescription>Configure notification preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Email Notifications</Label>
                <div className="text-sm text-muted-foreground">Receive notifications via email</div>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Transfer Notifications</Label>
                <div className="text-sm text-muted-foreground">Notify when transfers complete</div>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Error Notifications</Label>
                <div className="text-sm text-muted-foreground">Notify when errors occur</div>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Appearance
            </CardTitle>
            <CardDescription>Customize the look and feel of the user interface</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Mode Section */}
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <Label>Mode</Label>
                <div className="text-sm text-muted-foreground">Choose a default theme</div>
              </div>
              <div className="flex flex-shrink-0 justify-end">
                <Select onValueChange={(value) => setTheme(value as Theme)} value={theme}>
                  <SelectTrigger className="min-w-[180px]">
                    <SelectValue placeholder="Select theme" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="system">Default</SelectItem>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Separator />

            {/* Font Size Section */}
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <Label htmlFor="font-size">Font Size</Label>
                <div className="text-sm text-muted-foreground">Adjust the font size of the text</div>
              </div>
              <div className="flex flex-shrink-0 justify-end">
                <Select defaultValue="medium">
                  <SelectTrigger className="min-w-[180px]">
                    <SelectValue placeholder="Select font size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">Small</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="large">Large</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Separator />

            {/* Font Type Section */}
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <Label htmlFor="font-type">Font Type</Label>
                <div className="text-sm text-muted-foreground">Change the font family</div>
              </div>
              <div className="flex flex-shrink-0 justify-end">
                <Select defaultValue="sans-serif">
                  <SelectTrigger className="min-w-[180px]">
                    <SelectValue placeholder="Select font type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sans-serif">Sans-serif</SelectItem>
                    <SelectItem value="serif">Serif</SelectItem>
                    <SelectItem value="monospace">Monospace</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Separator />

            {/* Page Zoom Section */}
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <Label htmlFor="page-zoom">Page Zoom</Label>
                <div className="text-sm text-muted-foreground">Zoom in or out on the page</div>
              </div>
              <div className="flex flex-shrink-0 justify-end">
                <Select defaultValue="100%">
                  <SelectTrigger className="min-w-[180px]">
                    <SelectValue placeholder="Select zoom level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="75%">75%</SelectItem>
                    <SelectItem value="90%">90%</SelectItem>
                    <SelectItem value="100%">100%</SelectItem>
                    <SelectItem value="110%">110%</SelectItem>
                    <SelectItem value="125%">125%</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end gap-4">
        <Button variant="outline">Cancel</Button>
        <Button>Save Changes</Button>
      </div>
    </div>
  );
}
