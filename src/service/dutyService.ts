import { DutyRouteApiResponse } from "../types/duty";
import { dutyAPI } from "./api";

const USE_MOCK = false;

export async function fetchDutyRoute(
  dutyId: string,
  currentLocation: { latitude: number; longitude: number },
): Promise<DutyRouteApiResponse> {

  const data = await dutyAPI.getDutyRoute(dutyId, currentLocation);

  if (!data.success) {
    if (data.code === "LOCATION_PERMISSION_REQUIRED") {
      throw new Error("Location permission is required to view directions");
    }
    throw new Error(data.message ?? "Failed to fetch route");
  }

  return data as DutyRouteApiResponse;
}