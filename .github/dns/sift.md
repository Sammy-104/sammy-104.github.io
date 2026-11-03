# Sift subdomain

Sift runs on the Oracle server separately from the portfolio.

## DNS record

Configured in the GoDaddy DNS zone for `samuelshaw.ca` on November 3, 2026:

| Field | Value |
| --- | --- |
| Host | `sift` |
| Type | `A` |
| Value | `40.233.122.245` |
| TTL | `600` seconds (saved by GoDaddy) |
| Hostname | `sift.samuelshaw.ca` |

Verified against the authoritative GoDaddy nameserver and the Google (`8.8.8.8`) and Cloudflare (`1.1.1.1`) public resolvers. All returned `40.233.122.245`.

This file documents external configuration. Committing it does not create or update DNS records.

The existing apex, `www`, nameservers, mail records, and portfolio `CNAME` were preserved. Sift is not linked in the portfolio navigation, page content, or sitemap. No published website files were changed.

## Remaining server activation

The HTTPS check using SNI `sift.samuelshaw.ca` against the Oracle IP failed with a TLS internal-error alert after DNS was configured. HTTPS and the connector are not yet verified.

On the Oracle server, update the existing Caddy site's hostname to `sift.samuelshaw.ca`, preserving its upstream and authentication settings. Validate and reload Caddy, allow it to obtain the certificate, then verify HTTPS and the existing API/connector endpoint.

Keep bearer tokens and server credentials out of this repository.
