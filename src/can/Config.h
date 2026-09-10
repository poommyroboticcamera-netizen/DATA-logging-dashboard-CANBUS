#pragma once
#include <stdint.h>
// User wiring: SN65HVD230 D/TXD <- GPIO25, R/RXD -> GPIO26.
constexpr int CAN_TX_PIN=25, CAN_RX_PIN=26;
constexpr uint32_t DEFAULT_CAN_BITRATE=500000;
constexpr int SD_SCK_PIN=18, SD_MISO_PIN=19, SD_MOSI_PIN=23, SD_CS_PIN=5;
// Bounded analyzer + Wi-Fi profile. SD captures untracked IDs too.
constexpr unsigned MAX_IDS=16, SAMPLE_COUNT=32;
// One second-class burst buffer for typical automotive traffic. The logger
// reports overflow explicitly instead of blocking the high-priority RX task.
constexpr unsigned RX_QUEUE_DEPTH=128, LOG_QUEUE_DEPTH=1024, DRIVER_RX_DEPTH=128;
constexpr unsigned DEFAULT_CAPTURE_SECONDS=10, MAX_CAPTURE_SECONDS=3600, MIN_EVIDENCE=16;
static_assert(SAMPLE_COUNT>=MIN_EVIDENCE && SAMPLE_COUNT<=64,"sample bounds");
