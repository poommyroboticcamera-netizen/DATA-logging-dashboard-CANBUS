#pragma once
#include "Analysis.h"
#include <stddef.h>
#include <stdio.h>

namespace canlab {
// Returns bytes written (including '\n'), or 0 for an invalid frame/buffer.
inline size_t encodeCsvRow(char *out, size_t capacity, const Frame &frame) {
  if (!out || !capacity || frame.dlc > 8 ||
      frame.id > (frame.extended ? 0x1FFFFFFFu : 0x7FFu)) return 0;
  int used = snprintf(out, capacity, "%llu,%08lX,%u,%u",
    (unsigned long long)frame.us, (unsigned long)frame.id,
    unsigned(frame.extended != 0), unsigned(frame.dlc));
  if (used < 0 || size_t(used) >= capacity) return 0;
  for (unsigned i = 0; i < 8; ++i) {
    int added = snprintf(out + used, capacity - size_t(used),
      (!frame.rtr && i < frame.dlc) ? ",%u" : ",", unsigned(frame.data[i]));
    if (added < 0 || size_t(added) >= capacity - size_t(used)) return 0;
    used += added;
  }
  if (size_t(used) + 1 >= capacity) return 0;
  out[used++] = '\n'; out[used] = '\0';
  return size_t(used);
}
} // namespace canlab
