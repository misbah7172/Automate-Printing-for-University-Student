You are to implement an Admin Dashboard in React for AutoPrint. Requirements:

1) Pages:
  - Login (admin credentials).
  - Payments view: list of pending payments with tx_id, amount, student email, link to uploaded document (preview) and "Verify" / "Reject" buttons.
  - Queue management: show current queue, ability to force-skip, cancel job, reassign job.
  - Printer status: show connected printers (from backend), errors, ink/paper levels.
  - Reports: daily revenue & prints.

2) Actions:
  - On Verify: call POST /api/payments/verify { tx_id, admin_id } -> Backend returns UPID and job moved to queued.
  - Show toast notifications on success/error.
3) Realtime updates: subscribe to websocket /ws/queue to refresh queue and payments list.

4) Styling: minimal clean UI (Material-UI or Tailwind). Provide form validation and accessibility basics.

5) Tests: basic react-testing-library tests for Payment list and Verify action.

Implement pages and components with clear props and API calls using Axios. Provide environment variable for API_BASE_URL.
