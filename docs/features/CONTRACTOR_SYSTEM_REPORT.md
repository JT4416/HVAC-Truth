# V7 Feature: Contractor-Ready System Report

## Purpose

The Contractor-Ready System Report turns a homeowner's HVAC profile into a clean handoff that can help a contractor give a better ballpark estimate before visiting the home, then firm up the number after verifying access and site conditions.

## Why air handler location matters

Air handler location can materially change labor, safety planning, time on site, and materials. A contractor may price the same equipment differently depending on whether the indoor unit is in a garage, closet, attic, crawlspace, roof, basement, or mechanical room.

Examples:

- **Attic:** heat, limited access, decking, lighting, drain routing, and safety setup can increase labor.
- **Garage:** usually easier access, often cleaner and faster.
- **Closet:** depends on door size, platform condition, drain, and tight cabinet clearance.
- **Crawlspace:** confined access, moisture, lighting, and safety setup can increase labor.
- **Roof:** may require roof access, curb/stand review, lift/crane planning, and weather considerations.

## Report sections

The report includes:

1. ZIP code
2. System type
3. Brand
4. Estimated age
5. Estimated size / tonnage
6. Refrigerant type
7. Filter size
8. Air handler location
9. Air handler location details
10. Contractor access notes
11. Indoor model and serial number
12. Outdoor model and serial number
13. Indoor and outdoor data plate photo status
14. Decoder confidence
15. Homeowner notes
16. Contractor estimate guidance

## Homeowner fields added in V7

- `air_handler_location`
- `air_handler_location_notes`
- `access_notes`

These fields live on `hvac_systems` because the location/access issue belongs to the equipment profile and should follow the system through quote checks, contractor matching, and future service history.

## UX rule

The report should never imply that a contractor can give a guaranteed final price from the app alone. The app language should say:

> Ballpark pricing may be possible from the information above. Firm pricing should be confirmed after access, electrical, drain, ductwork, clearance, platform, and code conditions are inspected.

## Future enhancements

- Export report as PDF
- Share report with selected contractor lead
- Include homeowner-uploaded photos of air handler location, drain routing, disconnect, platform, and access path
- Add contractor feedback: “enough for ballpark,” “needs more photos,” or “site visit required”
- Use report details to improve quote checker accuracy
