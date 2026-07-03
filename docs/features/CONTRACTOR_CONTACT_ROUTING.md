# Contractor Contact Routing

## Purpose

HVAC Truth should generate a trustworthy contractor list by ZIP code using public business signals such as ratings, review count, distance, service category, service area, license verification where available, and internal HVAC Truth trust signals.

Lead delivery is a separate problem. The app should not assume every contractor has a usable direct email address.

## Product decision

Contractor discovery and lead delivery are split into two layers:

1. **Contractor Discovery**
   - Google Places, Yelp, manually verified contractors, claimed HVAC Truth profiles, and future licensing sources.
   - Used to rank and display contractors.

2. **Contact Routing**
   - Determines how a homeowner can actually reach each contractor.
   - Uses the best available public contact route.

## Routing priority

The app chooses the best route in this order:

1. HVAC Truth verified contractor dashboard
2. Published email address from contractor-owned website or verified profile
3. Website contact/request-service page
4. Contractor website
5. Phone call with script
6. SMS with short request script, only when appropriate
7. Google/Yelp business profile link
8. No usable route

## Why not fully automated contact form submission?

Every contractor website is different. Forms may be powered by WordPress, HubSpot, ServiceTitan, Schedule Engine, Housecall Pro, Podium, custom CRMs, or captcha-protected forms. The MVP should not attempt blind automated form submission across unknown websites.

Instead, HVAC Truth prepares a standardized lead packet and routes the homeowner to the best available contact channel.

## Standardized lead packet

The packet includes:

- Service area ZIP code
- Service needed
- Urgency
- Preferred contact method
- Preferred time window
- Homeowner contact info
- Issue summary
- Desired outcome
- System type
- Brand
- Estimated age
- Estimated tonnage
- Refrigerant type
- Filter size
- Indoor model and serial
- Outdoor model and serial
- Air handler location
- Location details
- Access notes
- Data plate status when available

## Status tracking

V9 supports route status values:

- prepared
- opened
- email_prepared
- call_started
- sms_started
- shared
- manual_follow_up_needed
- blocked

Recipient status values remain separate:

- selected
- sent
- viewed
- responded
- accepted
- declined
- scheduled
- closed

## MVP behavior

In V9, the app uses demo contractor records with example websites and contact routes. Production implementation will replace demo records with live contractor discovery by ZIP code.

## Future production implementation

Recommended next layers:

1. Google Places contractor search by ZIP code.
2. Place Details fetch for website, phone, rating, review count, and Google profile data.
3. Optional Yelp lookup for rating/review comparison.
4. Lightweight contractor website inspection to find contact page URLs and published emails only where clearly visible and allowed.
5. Claimed HVAC Truth contractor profile portal for direct lead delivery.
6. Homeowner delivery audit trail.
