# CivicEye – Data source research (Phase 6)

Research date and retrieval date: **21 November 2026**. Method: public landing pages and the portal's own public
search API were read with ordinary HTTP requests. Nothing was scraped, no login was bypassed, and no dashboard
or per-complaint system was queried.

## Conclusion

**No official, downloadable, record-level civic complaint dataset for Hyderabad was found.**
CivicEye therefore does **not** claim, display or import any official complaint records. All complaint statistics in
CivicEye come from reports submitted inside CivicEye. Fictional demonstration records are separate and labelled
DEMO DATA. The platform is built so verified external data can be added later without mixing it with citizen data.

## Sources checked

| Source | Exists | Access | Date / coverage | Licence | Decision |
|---|---|---|---|---|---|
| **Telangana Open Data Portal** (`data.telangana.gov.in`, DKAN) | Yes | Public search API (`/api/1/search?fulltext=…`) and direct CSV downloads | Catalogue current to Nov 2026 | Varies per dataset | Searched for grievance / complaint / pothole / garbage / sanitation / sewerage / HMWSSB / ULB. No per-complaint data. See below. |
| ↳ **Grievance Monitoring in ULB's** (CDMA, Municipal Administration & Urban Development) | Yes | CSV, 2,002 bytes (`/sites/default/files/Grievance%20monitoring.csv`), last modified 5 Jan 2023 | Aggregate counts per Urban Local Body: grievances received, completed, % completed. Temporal tag 2018. No locations, categories or individual complaints. | **"License Not Specified"** | **Not imported or displayed.** Aggregated, old, and the licence is unspecified. The detailed per-ULB list it points to is a web dashboard (`tsurbandashboard.in`), which is not a documented open API, so it was not scraped. Importer support exists; see below. |
| ↳ SSAAT Social Audit Grievance Details | Yes | CSV | Rural social-audit grievances (NREGS) | Not specified | Not relevant (rural employment scheme, not civic infrastructure). |
| ↳ HMWSSB water connection data 2023–2026; billing & collection data 2014–2026 | Yes | CSV | Connections and billing, not complaints | Government Open Data Licence – India | Not complaint data. Not used. |
| ↳ GHMC trade / pet licences, amenity geo-locations, elections | Yes | CSV | Not complaints | Open Government Licence, India | Not used. |
| ↳ Roads and Drainage Network / Sanitation in ULBs | Yes | CSV | Infrastructure inventory, not complaints | Not specified | Not used. |
| **GHMC** (`ghmc.gov.in`) | Yes | Grievance links are forms and status lookups ("Citizen Grievance" → `#`). No open dataset or API link found. | n/a | n/a | No open data. Complaints cannot be fetched without a complaint ID. Not queried. |
| **HMWSSB** (`hyderabadwater.gov.in`) | Yes | "Register Grievances" and "Grievances Status" pages (per-complaint status lookup). RTI pages. No open dataset or API. | n/a | n/a | No open data. Not queried. |
| **Open Government Data Platform India** (`data.gov.in`) | Yes | Catalogue search is rendered client-side; the API requires a registered key. A public search for "GHMC" showed no results. | n/a | GODL-India | **Not verified**. No dataset was confirmed. Can be revisited with an API key. |

## What CivicEye does about it

- Every complaint has a **provenance**: `CITIZEN` (submitted in CivicEye), `DEMO` (fictional, labelled), or
  `IMPORTED_OFFICIAL` (reserved for verified external records; none exist).
- Public statistics default to **citizen reports only**. Demo records are included only when the user asks.
- Analytics shows a **data composition** panel (citizen / demo / imported counts) so nothing is hidden.
- Complaints are **never** described as submitted to GHMC or HMWSSB.
- An **import pipeline for aggregated official figures** exists (`npm run import:aggregate`). Imported figures are
  stored separately from complaints, carry source, licence and retrieval date, and stay hidden until a person
  explicitly approves them. They are shown only in a separate "Official published figures" section.

## Recommended next step (needs a person)

The only relevant dataset is aggregated and has no stated licence. To use it, email the portal's contact
(`opendata@telangana.gov.in`, listed in the dataset metadata) to confirm the licence and whether newer data
exists, then run the importer with `--approve`. Until then CivicEye shows no official figures.
