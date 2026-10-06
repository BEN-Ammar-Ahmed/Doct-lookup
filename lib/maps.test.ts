import { describe, expect, it } from "vitest";
import { appleDirectionsUrl, googleDirectionsUrl, locationPrecisionLabel, uniquePracticeLocations } from "./maps";

const doctor = {
  address1: "1050 Example Ave",
  city: "Fort Myers",
  state: "FL",
  zip: "33901",
  lat: 26.64,
  lng: -81.87,
};

describe("map links", () => {
  it("builds Google Maps directions from the public office address", () => {
    expect(googleDirectionsUrl(doctor)).toContain("google.com/maps/dir/?api=1&destination=");
    expect(decodeURIComponent(googleDirectionsUrl(doctor))).toContain("1050 Example Ave, Fort Myers, FL 33901");
  });

  it("builds Apple Maps driving directions", () => {
    expect(appleDirectionsUrl(doctor)).toContain("maps.apple.com/?daddr=");
    expect(appleDirectionsUrl(doctor)).toContain("dirflg=d");
  });

  it("labels address-level and unavailable pins honestly", () => {
    expect(locationPrecisionLabel({ addressKind: "practice", lat: 1, lng: 2, locationPrecision: "address" })).toBe("Address-level map match");
    expect(locationPrecisionLabel({ addressKind: "practice", lat: null, lng: null, locationPrecision: "unknown" })).toContain("pin unavailable");
  });

  it("deduplicates primary and secondary practice locations", () => {
    const locations = uniquePracticeLocations({
      address1: "1 Main St",
      city: "Fort Myers",
      state: "FL",
      zip: "33901",
      phone: "2395550100",
      practiceLocations: [
        { address1: "1 Main St", city: "Fort Myers", state: "FL", zip: "33901", phone: "2395550100" },
        { address1: "2 Main St", city: "Cape Coral", state: "FL", zip: "33904", phone: null },
      ],
    });
    expect(locations).toHaveLength(2);
  });
});
