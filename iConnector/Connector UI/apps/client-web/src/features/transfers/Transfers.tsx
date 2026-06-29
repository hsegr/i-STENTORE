import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Search, Plus, MoreHorizontal, Activity, CheckCircle, XCircle, Clock, Download, Upload } from "lucide-react";

const mockTransfers = [
  {
    id: "transfer-001",
    assetName: "PV Plant Timeseries Data",
    contractId: "urn:dataset:ntua:pvplant-timeseries",
    counterParty: "NTUA Data Hub",
    direction: "outbound",
    status: "completed",
    progress: 100,
    startTime: "2025-11-15 08:00:00",
    endTime: "2025-11-15 08:20:00",
    dataSize: "1.5 GB",
    transferRate: "12.5 MB/s",
  },
  {
    id: "transfer-002",
    assetName: "PV Plant Weather Data",
    contractId: "urn:dataset:ntua:pvplant-weather",
    counterParty: "NTUA Data Hub",
    direction: "inbound",
    status: "in_progress",
    progress: 58,
    startTime: "2025-11-15 09:10:00",
    endTime: null,
    dataSize: "850 MB",
    transferRate: "10.2 MB/s",
  },
  {
    id: "transfer-003",
    assetName: "PV Plant Maintenance Logs",
    contractId: "urn:dataset:ntua:pvplant-maintenance",
    counterParty: "NTUA Data Hub",
    direction: "outbound",
    status: "failed",
    progress: 35,
    startTime: "2025-11-14 14:00:00",
    endTime: "2025-11-14 14:15:00",
    dataSize: "420 MB",
    transferRate: "N/A",
  },
  {
    id: "transfer-004",
    assetName: "Solar Farm Performance Metrics",
    contractId: "urn:dataset:ntua:pvplant-performance",
    counterParty: "NTUA Data Hub",
    direction: "inbound",
    status: "pending",
    progress: 0,
    startTime: null,
    endTime: null,
    dataSize: "2.3 GB",
    transferRate: "N/A",
  },
  {
    id: "transfer-005",
    assetName: "Energy Generation Forecasts",
    contractId: "urn:dataset:ntua:energy-forecast",
    counterParty: "NTUA Data Hub",
    direction: "outbound",
    status: "completed",
    progress: 100,
    startTime: "2025-11-14 10:00:00",
    endTime: "2025-11-14 10:45:00",
    dataSize: "1.1 GB",
    transferRate: "25.6 MB/s",
  },
];

export default function Transfers() {
  const [searchTerm, setSearchTerm] = useState("");

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
            <CheckCircle className="mr-1 h-3 w-3" />
            Completed
          </Badge>
        );
      case "in_progress":
        return (
          <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
            <Activity className="mr-1 h-3 w-3" />
            In Progress
          </Badge>
        );
      case "failed":
        return (
          <Badge variant="secondary" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">
            <XCircle className="mr-1 h-3 w-3" />
            Failed
          </Badge>
        );
      case "pending":
        return (
          <Badge variant="outline" className="text-muted-foreground">
            <Clock className="mr-1 h-3 w-3" />
            Pending
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getDirectionIcon = (direction: string) => {
    return direction === "inbound" ? (
      <Download className="h-4 w-4 text-blue-500" />
    ) : (
      <Upload className="h-4 w-4 text-green-500" />
    );
  };

  const getDirectionBadge = (direction: string) => {
    return direction === "inbound" ? (
      <Badge variant="outline" className="text-blue-600">
        <Download className="mr-1 h-3 w-3" />
        Inbound
      </Badge>
    ) : (
      <Badge variant="outline" className="text-green-600">
        <Upload className="mr-1 h-3 w-3" />
        Outbound
      </Badge>
    );
  };

  const filteredTransfers = mockTransfers.filter(
    (transfer) =>
      transfer.assetName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transfer.counterParty.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transfer.status.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const formatDuration = (startTime: string | null, endTime: string | null) => {
    if (!startTime) return "N/A";
    if (!endTime) return "Ongoing";

    const start = new Date(startTime);
    const end = new Date(endTime);
    const durationMs = end.getTime() - start.getTime();
    const minutes = Math.floor(durationMs / 60000);
    const seconds = Math.floor((durationMs % 60000) / 1000);

    return `${minutes}m ${seconds}s`;
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Transfers</h1>
          <p className="mt-1 text-muted-foreground">Monitor data transfer processes and their status</p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Initiate Transfer
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-5">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Transfers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockTransfers.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockTransfers.filter((t) => t.status === "completed").length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockTransfers.filter((t) => t.status === "in_progress").length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Failed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockTransfers.filter((t) => t.status === "failed").length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Data Transferred</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4.1 GB</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Transfer History</CardTitle>
            <div className="relative w-64">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
              <Input
                placeholder="Search transfers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Asset</TableHead>
                <TableHead>Direction</TableHead>
                <TableHead>Counter Party</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Data Size</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransfers.map((transfer) => (
                <TableRow key={transfer.id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      {getDirectionIcon(transfer.direction)}
                      <div>
                        <div className="font-medium">{transfer.assetName}</div>
                        <div className="text-sm text-muted-foreground">{transfer.contractId}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{getDirectionBadge(transfer.direction)}</TableCell>
                  <TableCell>{transfer.counterParty}</TableCell>
                  <TableCell>{getStatusBadge(transfer.status)}</TableCell>
                  <TableCell>
                    <div className="w-24">
                      <Progress value={transfer.progress} className="h-2" />
                      <div className="mt-1 text-xs text-muted-foreground">{transfer.progress}%</div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{formatDuration(transfer.startTime, transfer.endTime)}</TableCell>
                  <TableCell>
                    <div>
                      <div className="text-sm font-medium">{transfer.dataSize}</div>
                      {transfer.transferRate !== "N/A" && (
                        <div className="text-xs text-muted-foreground">{transfer.transferRate}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>View Details</DropdownMenuItem>
                        {transfer.status === "failed" && <DropdownMenuItem>Retry Transfer</DropdownMenuItem>}
                        {transfer.status === "in_progress" && (
                          <DropdownMenuItem className="text-destructive">Cancel Transfer</DropdownMenuItem>
                        )}
                        <DropdownMenuItem>Download Logs</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
