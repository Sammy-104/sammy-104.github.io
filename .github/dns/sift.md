# Sift subdomain

Sift runs on the Oracle server separately from the portfolio.

## Desired DNS record

Manage this record in the GoDaddy DNS zone for `samuelshaw.ca`:

| Field | Value |
| --- | --- |
| Host | `sift` |
| Type | `A` |
| Value | `40.233.122.245` |
| TTL | GoDaddy default |
| Hostname | `sift.samuelshaw.ca` |

This file documents external configuration. Committing it does not create or update DNS records.

Keep the existing apex, `www`, nameservers, mail records, and portfolio `CNAME` unchanged. Do not add Sift to the portfolio navigation, page content, or sitemap. No portfolio build or visual changes are needed.

## Activation

1. Add the record in GoDaddy without replacing other DNS records.
2. Verify public DNS returns `40.233.122.245` for `sift.samuelshaw.ca`.
3. On the Oracle server, update the existing Caddy site's hostname to `sift.samuelshaw.ca`, preserving its upstream and authentication settings. Validate and reload Caddy, then verify HTTPS and the existing API/connector endpoint.

DNS resolution alone does not verify the Caddy certificate or API. Keep bearer tokens and server credentials out of this repository.
