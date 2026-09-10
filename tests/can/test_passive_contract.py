from pathlib import Path
import re
import unittest


ROOT = Path(__file__).resolve().parents[2]
CAN_SOURCE = (ROOT / "src" / "can" / "CanService.cpp").read_text(encoding="utf-8")
MAIN_SOURCE = (ROOT / "src" / "main.cpp").read_text(encoding="utf-8")
CAN_HEADER = (ROOT / "src" / "can" / "CanService.h").read_text(encoding="utf-8")
DASHBOARD_HTML = (ROOT / "dashboard" / "index.html").read_text(encoding="utf-8")


class PassiveContractTest(unittest.TestCase):
    def test_dashboard_firmware_has_no_can_transmit_call(self):
        production = CAN_SOURCE + "\n" + MAIN_SOURCE
        self.assertNotIn("twai_transmit", production)

    def test_driver_is_hard_configured_listen_only(self):
        self.assertIn("TWAI_MODE_LISTEN_ONLY", CAN_SOURCE)
        self.assertIn("TWAI_FILTER_CONFIG_ACCEPT_ALL", CAN_SOURCE)
        self.assertRegex(CAN_SOURCE, re.compile(r"general\.tx_queue_len\s*=\s*0\s*;"))
        self.assertNotIn("TWAI_MODE_NORMAL", CAN_SOURCE)
        self.assertNotIn("TWAI_MODE_NO_ACK", CAN_SOURCE)

    def test_can_driver_and_acquisition_are_off_at_boot(self):
        self.assertRegex(CAN_SOURCE, re.compile(r"driverRequested\{false\}.*driverRunning\{false\}"))
        self.assertRegex(CAN_SOURCE, re.compile(r"acquiring\{false\}"))

    def test_can_only_service_keeps_shared_sd_serialized(self):
        self.assertIn("xSemaphoreCreateMutex", MAIN_SOURCE)
        self.assertIn("canservice::begin(storageMutex)", MAIN_SOURCE)
        self.assertIn("bool setEnabled(bool enabled)", CAN_HEADER)

    def test_dashboard_has_exactly_two_main_modes(self):
        self.assertEqual(len(re.findall(r'data-mode="', DASHBOARD_HTML)), 2)
        self.assertIn('data-mode="dashboard"', DASHBOARD_HTML)
        self.assertIn('data-mode="can"', DASHBOARD_HTML)
        self.assertNotIn('id="mode-encoder"', DASHBOARD_HTML)
        self.assertNotIn('id="mode-imu"', DASHBOARD_HTML)
        # This derivative is intentionally CAN-only.
        self.assertNotIn('id="rpm"', DASHBOARD_HTML)
        self.assertNotIn('id="imu-model"', DASHBOARD_HTML)

    def test_removed_sensor_families_do_not_return(self):
        production = (CAN_SOURCE + MAIN_SOURCE + DASHBOARD_HTML).lower()
        for forbidden in ("dht22", "ds18b20", "dallastemperature", "onewire"):
            self.assertNotIn(forbidden, production)

    def test_runtime_bitrate_choices_match_firmware(self):
        for bitrate in (50000, 100000, 125000, 250000, 500000, 1000000):
            self.assertIn(f'case {bitrate}:', CAN_SOURCE)
            self.assertIn(f'value="{bitrate}"', DASHBOARD_HTML)

    def test_raw_sd_logger_captures_all_valid_ids_independently(self):
        receive_block = CAN_SOURCE[CAN_SOURCE.index("if (result == ESP_OK)"):CAN_SOURCE.index("if (workStart - lastHealth")]
        self.assertIn("TWAI_FILTER_CONFIG_ACCEPT_ALL", CAN_SOURCE)
        self.assertIn("if (logEnabled.load())", receive_block)
        self.assertIn("xQueueSend(logQueue, &f, 0)", receive_block)
        self.assertLess(receive_block.index("if (acquiring.load())"), receive_block.index("if (logEnabled.load())"))
        self.assertIn("The raw logger is independent of the bounded analysis database", receive_block)
        self.assertIn('csv.println("timestamp_us,id,extended,dlc,d0,d1,d2,d3,d4,d5,d6,d7")', CAN_SOURCE)

    def test_dashboard_exposes_only_core_logger_controls(self):
        self.assertIn('id="can-bitrate"', DASHBOARD_HTML)
        self.assertIn('id="can-log-start"', DASHBOARD_HTML)
        self.assertIn('id="can-log-stop"', DASHBOARD_HTML)
        self.assertNotIn('id="can-baseline"', DASHBOARD_HTML)
        self.assertNotIn('id="can-experiment"', DASHBOARD_HTML)


if __name__ == "__main__":
    unittest.main()
