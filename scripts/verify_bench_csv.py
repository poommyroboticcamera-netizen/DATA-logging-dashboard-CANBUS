#!/usr/bin/env python3
"""Validate an SD CSV captured from examples/can_bench_generator."""
from __future__ import annotations

import argparse
import csv
from collections import Counter
from pathlib import Path

HEADER = ["timestamp_us", "id", "extended", "dlc", "d0", "d1", "d2", "d3", "d4", "d5", "d6", "d7"]
EXPECTED = {(0x321, 0), (0x321, 1), (0x322, 0), (0x345, 0), (0x456, 0)}


def verify(path: Path) -> tuple[int, Counter[tuple[int, int]], list[str]]:
    errors: list[str] = []
    counts: Counter[tuple[int, int]] = Counter()
    previous_timestamp = -1
    rows = 0
    with path.open("r", newline="", encoding="utf-8-sig") as handle:
        reader = csv.DictReader(handle)
        if reader.fieldnames != HEADER:
            return 0, counts, [f"wrong header: {reader.fieldnames!r}"]
        for line, row in enumerate(reader, 2):
            rows += 1
            if None in row or any(value is None for value in row.values()):
                errors.append(f"line {line}: wrong number of columns")
                continue
            try:
                timestamp = int(row["timestamp_us"])
                can_id = int(row["id"], 16)
                extended = int(row["extended"])
                dlc = int(row["dlc"])
            except (TypeError, ValueError) as exc:
                errors.append(f"line {line}: invalid timestamp/ID/extended/DLC ({exc})")
                continue
            if timestamp < 0:
                errors.append(f"line {line}: negative timestamp")
            if timestamp < previous_timestamp:
                errors.append(f"line {line}: timestamp moved backwards")
            previous_timestamp = timestamp
            if extended not in (0, 1) or not 0 <= dlc <= 8:
                errors.append(f"line {line}: extended or DLC out of range")
                continue
            limit = 0x1FFFFFFF if extended else 0x7FF
            if not 0 <= can_id <= limit:
                errors.append(f"line {line}: CAN ID out of range")
            payload = [row[f"d{i}"] for i in range(8)]
            populated = [value for value in payload if value != ""]
            if populated:
                try:
                    bytes_in_row = [int(value) for value in populated]
                except ValueError:
                    bytes_in_row = []
                if len(populated) != dlc or len(bytes_in_row) != len(populated) or any(not 0 <= value <= 255 for value in bytes_in_row):
                    errors.append(f"line {line}: payload does not match DLC")
                if any(payload[i] == "" for i in range(dlc)) or any(payload[i] != "" for i in range(dlc, 8)):
                    errors.append(f"line {line}: payload columns are not contiguous")
            # The bench generator emits RTR only on STD 0x456, DLC 8.
            if (can_id, extended) == (0x456, 0):
                if populated or dlc != 8:
                    errors.append(f"line {line}: expected bench RTR with DLC 8 and no payload")
            elif dlc and not populated:
                errors.append(f"line {line}: missing DATA payload in bench capture")
            counts[(can_id, extended)] += 1
    missing = sorted(EXPECTED - counts.keys())
    if missing:
        errors.append("missing bench streams: " + ", ".join(f"0x{i:X} {'EXT' if e else 'STD'}" for i, e in missing))
    return rows, counts, errors


def main() -> int:
    parser = argparse.ArgumentParser(description="Check a CAN logger SD CSV against the isolated two-board bench stream.")
    parser.add_argument("csv_file", type=Path)
    args = parser.parse_args()
    try:
        rows, counts, errors = verify(args.csv_file)
    except OSError as exc:
        print(f"FAIL: cannot read {args.csv_file}: {exc}")
        return 2
    for key in sorted(counts):
        print(f"0x{key[0]:X} {'EXT' if key[1] else 'STD'}: {counts[key]} rows")
    if errors:
        for error in errors:
            print("FAIL:", error)
        return 1
    print(f"PASS: {rows} well-formed rows; every expected bench ID/type was captured")
    print("Presence and format checks only; this does not prove zero lost frames.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
