-- Auto-verify all existing vendors (no admin panel yet)
UPDATE vendors SET verified = true WHERE verified = false;
