# Map and location upgrade

Implemented in this change:

- Address-level vs approximate/unavailable map precision is explicit in the provider model and UI.
- Result cards and provider profiles display location-confidence wording instead of implying a pin is exact.
- Google Maps directions are available everywhere; Apple devices also get an Apple Maps option.
- Map-selected providers include directions and profile actions without leaving the map first.
- The map shows a precision legend and a mapped-provider count.
- NPPES secondary practice locations can be imported from the official `pl_pfile_*.csv` reference file with `nppes-locations`.
- Practice-location display is deduplicated so the primary address is not repeated.

Important limitations:

- A successful Census geocode is an address-level match, not proof of the correct building entrance or suite.
- NPPES data is official public provider data but is provider-maintained and can lag real-world practice changes.
- Insurance network participation is handled separately from provider identity/location and must not be inferred from NPPES.
- Nationwide production mapping is best served by pre-geocoding imported practice locations into `provider_data.locations` rather than geocoding large result sets at request time.
