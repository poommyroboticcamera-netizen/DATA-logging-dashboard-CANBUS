#include "../../src/can/CsvEncoder.h"
#include <assert.h>
#include <stdio.h>
#include <string.h>
using namespace canlab;

int main() {
  char row[180]; Frame standard = {};
  standard.us=123456; standard.id=0x7FF; standard.dlc=8;
  const uint8_t bytes[8]={0,1,2,127,128,253,254,255}; memcpy(standard.data,bytes,8);
  size_t length=encodeCsvRow(row,sizeof(row),standard);
  assert(length==strlen(row));
  assert(strcmp(row,"123456,000007FF,0,8,0,1,2,127,128,253,254,255\n")==0);

  Frame extended={}; extended.us=9; extended.id=0x1FFFFFFF; extended.extended=1;
  assert(encodeCsvRow(row,sizeof(row),extended));
  assert(strcmp(row,"9,1FFFFFFF,1,0,,,,,,,,\n")==0);

  Frame rtr={}; rtr.us=10; rtr.id=0x123; rtr.rtr=1; rtr.dlc=8; memset(rtr.data,0xAA,8);
  assert(encodeCsvRow(row,sizeof(row),rtr));
  assert(strcmp(row,"10,00000123,0,8,,,,,,,,\n")==0);

  Frame invalid=standard; invalid.id=0x800; assert(!encodeCsvRow(row,sizeof(row),invalid));
  invalid=standard; invalid.dlc=9; assert(!encodeCsvRow(row,sizeof(row),invalid));
  assert(!encodeCsvRow(row,8,standard));
  puts("PASS: CSV encoding for STD, EXT, DLC 0/8, RTR and invalid frames");
}
