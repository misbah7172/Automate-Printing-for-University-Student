Create a responsive React app for students. Requirements:

1) Auth: login/register using email (or Google). Save JWT in localStorage.
2) Upload screen: choose file, set print options (copies, color, duplex, page_range), preview file page count, submit -> returns payment instructions with bKash QR and bkash number.
3) Payment submit: UI where student pastes tx_id from bKash SMS and presses "Submit tx id". Call POST /api/payments/submit.
4) Queue view: display user's queue position, current_pos and next 5. Subscribe to websocket for realtime.
5) Confirm flow: when backend emits your job as current, show prominent "Confirm" button. On press prompt for UPID input. send POST /api/queue/confirm with upid and user_id.
6) Error handling: invalid UPID -> show error and allow retry. If skipped, show notification and new position.
7) History page: list past prints, option to reprint (create new print_job with same file).
8) Tests: a couple of unit tests for upload flow and confirm flow.

Make UI mobile-first and accessible.
