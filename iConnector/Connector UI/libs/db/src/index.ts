export interface Clock {
  now: () => Date;
}

export interface ServiceStatus {
  service: string;
  version: string;
  timestamp: string;
}

export interface ServiceStatusRepository {
  getStatus: (clock: Clock) => Promise<ServiceStatus>;
}

export function createDefaultClock(): Clock {
  return {
    now: () => new Date(),
  };
}

export function createServiceStatusRepository(
  service: string,
  version: string,
): ServiceStatusRepository {
  return {
    async getStatus(clock) {
      return {
        service,
        version,
        timestamp: clock.now().toISOString(),
      };
    },
  };
}
