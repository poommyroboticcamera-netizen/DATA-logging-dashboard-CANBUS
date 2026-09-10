# Passive analyzer integration validation

Verified in the local PlatformIO project on 2026-09-10.

- PlatformIO espressif32 6.10.0, Arduino ESP32 2.0.17, esp32dev: build SUCCESS.
- Final image: flash 860,761 bytes / 1,310,720 (65.7%).
- Static RAM: 66,604 bytes / 327,680 (20.3%). Runtime records, queues, task stacks, Wi-Fi and SD allocations are additional.
- Portable record layout: Frame 32 bytes, Sample 24 bytes, Record 3,696 bytes; 16 record payloads total 59,136 bytes.
- Analysis C++ tests passed: extraction, statistics, gaps, DLC/RTR, sample rings, rolling counters, experiment scoring and checksum evidence.
- Console C++ tests passed: repeated CRLF commands, partial input, optional colon, backspace, bounded lines and recovery after overflow.
- Dashboard core tests passed, including diagnostics for disabled/failed/paused/no-traffic/recent-traffic/stale-traffic states.
- Real dashboard JavaScript executed with a mock DOM/API: standard and extended frames with the same ID, zero DLC, RTR without payload, control requests and disconnected UI passed. This is functional DOM testing, not a screenshot or hardware test.
- Seven passive-contract checks and the offline analyzer test passed.
- Production source has accept-all filtering, LISTEN_ONLY mode, a disabled transmit queue, and no CAN transmit call. The separate bench example remains outside production compilation.
- No Git repository was initialized in this project, no remote was created and no push was performed.

The firmware has not been uploaded as part of this change. Electrical passivity, actual CAN reception, SD integrity under stalls, sustained bus-load handling and runtime heap/stack headroom still require testing on the two boards. Use the isolated No-ACK bench generator described in README; the user's existing Normal-mode encoder sender expects an ACK that this passive receiver does not provide.
