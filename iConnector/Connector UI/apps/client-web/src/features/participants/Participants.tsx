import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Search, MoreHorizontal, Building2, CheckCircle, XCircle, Clock, Globe } from "lucide-react";

interface Participant {
  id: string;
  name: string;
  organization: string;
  connectorUrl: string;
  status: "online" | "offline" | "connecting";
  type: "provider" | "consumer" | "prosumer";
  joinDate: string;
  assetsCount: number;
  contractsCount: number;
  region: string;
  lastActive: string;
}

// Mock data for demonstration
const mockParticipants: Participant[] = [
  {
    id: "participant-001",
    name: "HSE Connector",
    organization: "Hardware & Software Engineering",
    connectorUrl: "https://connector.hse.gr",
    status: "online",
    type: "prosumer",
    joinDate: "2025-07-15",
    assetsCount: 2,
    contractsCount: 1,
    region: "EU-South",
    lastActive: "2025-11-20 09:30",
  },
  {
    id: "participant-002",
    name: "ED Consumer",
    organization: "European Dynamics",
    connectorUrl: "https://edc.consumer.eurodyn.com",
    status: "online",
    type: "consumer",
    joinDate: "2025-09-20",
    assetsCount: 0,
    contractsCount: 5,
    region: "EU-West",
    lastActive: "2025-11-20 10:15",
  },
  {
    id: "participant-003",
    name: "NTUA Provider",
    organization: "National Technical University of Athens",
    connectorUrl: "https://connector.provider.ntua.com",
    status: "offline",
    type: "provider",
    joinDate: "2025-10-10",
    assetsCount: 11,
    contractsCount: 3,
    region: "EU-South",
    lastActive: "2025-11-20 08:45",
  },
];

export default function Participants() {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredParticipants = mockParticipants.filter(
    (participant) =>
      participant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      participant.organization.toLowerCase().includes(searchTerm.toLowerCase()) ||
      participant.region.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const onlineCount = filteredParticipants.filter((p) => p.status === "online").length;
  const totalAssets = filteredParticipants.reduce((sum, p) => sum + p.assetsCount, 0);
  const totalContracts = filteredParticipants.reduce((sum, p) => sum + p.contractsCount, 0);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "online":
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
            <CheckCircle className="mr-1 h-3 w-3" />
            Online
          </Badge>
        );
      case "connecting":
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">
            <Clock className="mr-1 h-3 w-3" />
            Connecting
          </Badge>
        );
      case "offline":
        return (
          <Badge variant="outline" className="text-muted-foreground">
            <XCircle className="mr-1 h-3 w-3" />
            Offline
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    const colors = {
      provider: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
      consumer: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
      both: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300",
    };

    return (
      <Badge variant="secondary" className={colors[type as keyof typeof colors]}>
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </Badge>
    );
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">DataSpace Participants</h1>
          <p className="mt-1 text-muted-foreground">View and monitor all participants in the DataSpace network</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Participants</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredParticipants.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Online Now</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{onlineCount}</div>
            <p className="text-xs text-muted-foreground">Active connections</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Assets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAssets}</div>
            <p className="text-xs text-muted-foreground">Shared across network</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Contracts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalContracts}</div>
            <p className="text-xs text-muted-foreground">Total agreements</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Participants</CardTitle>
            <div className="relative w-64">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
              <Input
                placeholder="Search participants..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b">
                <tr className="text-left">
                  <th className="pr-4 pb-3 text-sm font-medium text-muted-foreground">Participant</th>
                  <th className="pr-4 pb-3 text-sm font-medium text-muted-foreground">Connector URL</th>
                  <th className="pr-4 pb-3 text-sm font-medium text-muted-foreground">Type</th>
                  <th className="pr-4 pb-3 text-sm font-medium text-muted-foreground">Status</th>
                  <th className="pr-4 pb-3 text-sm font-medium text-muted-foreground">Region</th>
                  <th className="pr-4 pb-3 text-right text-sm font-medium text-muted-foreground">Assets</th>
                  <th className="pr-4 pb-3 text-right text-sm font-medium text-muted-foreground">Contracts</th>
                  <th className="pr-4 pb-3 text-sm font-medium text-muted-foreground">Join Date</th>
                  <th className="w-12 pb-3"></th>
                </tr>
              </thead>
              <tbody>
                {filteredParticipants.map((participant) => (
                  <tr key={participant.id} className="border-b last:border-0 hover:bg-muted/50">
                    <td className="py-4 pr-4">
                      <div className="flex items-center space-x-3">
                        <Building2 className="h-4 w-4" />
                        <div>
                          <div className="font-medium">{participant.name}</div>
                          <div className="text-sm text-muted-foreground">{participant.organization}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 pr-4">
                      <div className="flex items-center space-x-2">
                        <Globe className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">{participant.connectorUrl}</span>
                      </div>
                    </td>
                    <td className="py-4 pr-4">{getTypeBadge(participant.type)}</td>
                    <td className="py-4 pr-4">{getStatusBadge(participant.status)}</td>
                    <td className="py-4 pr-4">
                      <Badge variant="outline" className="text-xs">
                        {participant.region}
                      </Badge>
                    </td>
                    <td className="py-4 pr-4 text-right font-medium">{participant.assetsCount}</td>
                    <td className="py-4 pr-4 text-right font-medium">{participant.contractsCount}</td>
                    <td className="py-4 pr-4 text-sm">{participant.joinDate}</td>
                    <td className="py-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>View Details</DropdownMenuItem>
                          <DropdownMenuItem>View Assets</DropdownMenuItem>
                          <DropdownMenuItem>View Contracts</DropdownMenuItem>
                          <DropdownMenuItem>Connection Info</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
