You are to implement a Raspberry Pi print agent in Python to run as a systemd service. Requirements:

1) Environment variables:
   - BACKEND_URL, RASPI_API_KEY, PRINTER_NAME (CUPS), POLL_INTERVAL_SECONDS.

2) Behavior:
   - Start a small HTTP server for kiosk/ESP32 to POST UPID to Pi (optional).
   - Primary flow: Pi receives UPID from kiosk (or typed manually) via local HTTP call or barcode scanner. Pi calls GET BACKEND_URL/api/print/fetch?upid=UPID with header `X-API-KEY: RASPI_API_KEY`.
   - Backend responds with signed S3 URL + print metadata (copies, duplex).
   - Pi downloads file to /tmp, uses CUPS (pycups) to send to PRINTER_NAME. Monitor job ID via cups to report status.
   - On success: POST BACKEND_URL/api/print/complete { upid, printed_pages, printer_id }.
   - On failure: POST BACKEND_URL/api/print/error with error message; retry logic with exponential backoff.
   - Ensure file is deleted after printing or after configured retention.

3) Also implement code to update an attached HDMI display or local web view showing current/next queue using the backend websocket. Use `websocket-client` to subscribe.

4) Run as systemd service: provide unit file example and Dockerfile (optional).

5) Tests: include simple integration test stub describing how to emulate backend with local server to test printing flow.
