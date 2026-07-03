# HVAC Truth MVP Product Requirements Document

## Product Name
HVAC Truth

## Tagline
Know before you call.

## Target User
Homeowners, renters, property managers, and non-technical users who need plain-English HVAC guidance before paying for service.

## Problem
Most homeowners do not understand HVAC systems. When their AC fails, they are vulnerable to panic decisions, unnecessary repairs, inflated quotes, and confusing technical explanations.

## Solution
HVAC Truth gives users a safe HVAC second opinion through guided troubleshooting, quote checking, maintenance education, and contractor matching.

## MVP Goals

1. Help users identify likely AC issue categories using safe questions.
2. Help users determine when they must call a technician.
3. Provide safe maintenance instructions.
4. Give quote fairness guidance.
5. Help users find local contractors based on ZIP code.
6. Build enough trust to monetize quote checking and contractor leads.

## MVP Screens

1. Onboarding
2. Home Dashboard
3. My AC Is Not Working
4. Check My Quote
5. Find a Technician
6. Maintenance Tips
7. Ask HVAC Truth
8. My System
9. Account Settings

## Critical Safety Requirements

The app must not instruct users to perform dangerous work involving live electrical components, refrigerant systems, combustion systems, gas lines, bypassed safety controls, or code-sensitive modifications.

## Monetization

Initial monetization should focus on:

- One-time quote checks
- Annual homeowner subscription
- Contractor lead generation
- Affiliate homeowner-safe products

## Beta Launch Market

Recommended first beta market: Florida.

Rationale: high AC dependency, high service volume, strong pain point, and geographic relevance to the project founder.

# V4 Feature Addition: System Decoder

## Feature summary

The System Decoder answers two homeowner questions:

1. How old is my HVAC system?
2. What size is my HVAC system?

Users can take a data plate photo or manually enter model/serial information. The app decodes age and size using manufacturer-specific rules, then saves confirmed values to the user’s system profile.

## Requirements

- User can open **Decode My System** from Home and My System.
- User can take a data plate photo.
- User can manually enter brand, model number, and serial number.
- User can choose equipment type.
- App returns age, size, confidence level, explanation, and warnings.
- App does not overstate certainty.
- App stores raw input, matched rule IDs, and decode output.
- User must confirm extracted/OCR values before they update system profile.

## Safety requirements

- User should only photograph visible labels.
- App must not tell users to remove panels, touch wiring, or open electrical compartments.
- App must advise confirmation by contractor/manufacturer for warranty, replacement, or legal documentation.

## V7 Addition: Contractor-Ready System Report

HVAC Truth should generate a contractor-ready system report from the homeowner profile. The report should help a contractor give a more realistic ballpark estimate before visiting and a firmer quote once on site.

Required report fields:

- Home ZIP code
- HVAC system type
- Brand
- Estimated age
- Estimated size / tonnage
- Refrigerant type, if known
- Filter size
- Indoor model and serial number
- Outdoor model and serial number
- Indoor and outdoor data plate photo status
- Decoder confidence
- Homeowner notes
- Air handler location
- Air handler location notes
- Access notes

Air handler location options:

- Attic
- Garage
- Closet
- Mechanical room
- Crawlspace
- Basement
- Roof
- Hallway
- Other
- I am not sure

The report must clearly state that ballpark estimates are not final quotes. Contractors still need to verify access, ductwork, drain, electrical, platform, code, and equipment conditions on site.

# V8 Product Addition: Contractor Lead Request Flow

## Objective

Create a homeowner-to-contractor request path that uses the system profile and contractor-ready report to improve remote ballpark estimating.

## Homeowner value

The homeowner does not have to explain HVAC details from scratch. HVAC Truth packages the key information into a cleaner request:

- ZIP code
- service type
- urgency
- symptom summary
- desired outcome
- contact preference
- equipment age
- equipment size
- model/serial numbers
- air handler location
- access notes
- data plate photo status
- decoder confidence

## Contractor value

The contractor receives enough information to decide whether a ballpark figure is possible before visiting. A firm quote still requires field verification.

## MVP scope

- Add Request Contractor Help screen.
- Add service type selection.
- Add urgency/contact fields.
- Attach contractor-ready report snapshot.
- Select demo contractors.
- Submit request to Supabase.
- Create one recipient row per selected contractor.

## Out of scope for V8

- Actual SMS/email delivery.
- Contractor portal.
- Live Google Places integration.
- License verification API.
- Payment for leads.
- Appointment scheduling.

## V9 Feature: Contractor Contact Routing

### Problem

A ZIP-code contractor list can be generated from public business data, but public contractor records do not reliably include direct email addresses. HVAC Truth must not depend on universal contractor emails.

### Solution

Add a contact routing layer that chooses the best available delivery method per contractor.

### Routing order

1. Claimed/verified HVAC Truth contractor dashboard.
2. Published contractor email.
3. Website contact form.
4. Contractor website.
5. Phone call with script.
6. SMS script where appropriate.
7. Google/Yelp profile link.
8. No usable route.

### User experience

The homeowner selects contractors as before, but each contractor card now shows the best route, such as:

- Prepare email
- Open contact form
- Open website
- Call contractor
- Open business profile
- No delivery route found

The app prepares a standardized lead packet that can be pasted into a contact form, sent by email, shared, or used as a call script.

### Data model

V9 adds contact fields to contractors, delivery fields to lead recipients, and a `contractor_contact_routes` table for route tracking.

# V10 Addition: Live Contractor Discovery

## Problem

The app cannot rely on a static contractor list. Homeowners need contractor results by ZIP code that reflect public ratings, review levels, distance, and available contact channels.

## Product Decision

HVAC Truth separates contractor discovery from lead delivery.

Contractor discovery is powered by public/local business providers and internal verified contractor records. Lead delivery is handled by the contractor contact-routing system from V9.

## MVP Requirements

- User enters ZIP code.
- User can filter for emergency service only.
- App calls a server-side discovery function.
- Server-side function can search Google Places, Yelp, and internal HVAC Truth contractors.
- App displays contractor cards with rating, review count, distance, trust score, badges, and best contact route.
- If provider APIs are unavailable, app falls back to demo contractors.
- Provider API keys must not be stored in the mobile app.

## Ranking Inputs

- Star rating
- Review count
- Distance
- Verified listing status
- Emergency-service availability
- HVAC Truth verification
- Whether the contractor has a usable contact route

## Out of Scope for V10

- contractor dashboard
- contractor claim process
- paid placement
- automated website form submission
- license verification by state
- guaranteed lead delivery

## Acceptance Criteria

- Searching a ZIP code displays contractor cards.
- Missing provider configuration does not crash the app.
- The app clearly labels the best contact route.
- Results can be routed into the lead-request flow.
- Google/Yelp keys remain server-side only.
