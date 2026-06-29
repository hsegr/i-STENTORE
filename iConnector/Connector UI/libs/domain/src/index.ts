import type { Clock, ServiceStatus, ServiceStatusRepository } from "@dataspace-connector/db";

export interface HealthService {
  getStatus: () => Promise<ServiceStatus>;
}

export function createHealthService(
  repository: ServiceStatusRepository,
  clock: Clock,
): HealthService {
  return {
    getStatus: () => repository.getStatus(clock),
  };
}
