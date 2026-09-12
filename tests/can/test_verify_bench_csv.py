from pathlib import Path
import csv
import sys
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "scripts"))
from verify_bench_csv import HEADER, verify


class BenchCsvVerificationTest(unittest.TestCase):
    def write_rows(self, rows):
        temp = tempfile.NamedTemporaryFile("w", newline="", encoding="utf-8", suffix=".csv", delete=False)
        with temp:
            writer = csv.writer(temp)
            writer.writerow(HEADER)
            writer.writerows(rows)
        self.addCleanup(Path(temp.name).unlink)
        return Path(temp.name)

    def test_accepts_all_expected_standard_extended_and_rtr_fixture_rows(self):
        rows = [
            [100, "00000321", 0, 8, 1, 2, 3, 4, 5, 6, 7, 8],
            [110, "00000321", 1, 8, 1, 2, 3, 4, 5, 6, 7, 8],
            [120, "00000322", 0, 8, 0, 0, 0, 0, 0, 0, 0, 0],
            [130, "00000345", 0, 0, "", "", "", "", "", "", "", ""],
            [140, "00000456", 0, 8, "", "", "", "", "", "", "", ""],
        ]
        count, streams, errors = verify(self.write_rows(rows))
        self.assertEqual(count, 5)
        self.assertEqual(len(streams), 5)
        self.assertEqual(errors, [])

    def test_rejects_malformed_rows_without_crashing(self):
        cases = [
            ([1, "321", 0, 8], "columns"),
            ([1, "321", 0, 0] + [""] * 9, "columns"),
            ([-1, "345", 0, 0] + [""] * 8, "negative"),
            ([1, "321", 0, 8] + [""] * 8, "missing DATA"),
            ([1, "456", 0, 8] + [0] * 8, "expected bench RTR"),
            ([1, "321", 0, 1, "bad"] + [""] * 7, "payload"),
        ]
        for row, expected in cases:
            with self.subTest(expected=expected, row=row):
                _, _, errors = verify(self.write_rows([row]))
                self.assertTrue(any(expected in error for error in errors), errors)

    def test_rejects_missing_stream_backwards_time_and_bad_payload(self):
        rows = [
            [200, "00000321", 0, 2, 1, "", "", "", "", "", "", ""],
            [100, "00000321", 1, 0, "", "", "", "", "", "", "", ""],
        ]
        _, _, errors = verify(self.write_rows(rows))
        self.assertTrue(any("payload" in error for error in errors))
        self.assertTrue(any("backwards" in error for error in errors))
        self.assertTrue(any("missing bench streams" in error for error in errors))


if __name__ == "__main__":
    unittest.main()
