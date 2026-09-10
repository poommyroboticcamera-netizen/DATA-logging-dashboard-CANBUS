#include "../../src/can/ConsoleLine.h"
#include <cassert>
#include <string>
#include <vector>
#include <cstdio>
using canservice::ConsoleLine;
int main() {
  ConsoleLine line; std::vector<std::string> commands; unsigned rejected=0;
  auto input=[&](const std::string &s) {
    for(char c:s) {
      auto result=line.feed(c);
      if(result==ConsoleLine::Complete)commands.emplace_back(line.text);
      if(result==ConsoleLine::TooLong)++rejected;
    }
  };
  input(":CAN ON\r\n:STATUS\r\nIDS\n  :ID 100 STD  \r");
  assert((commands==std::vector<std::string>{"CAN ON","STATUS","IDS","ID 100 STD"}));
  input("STA"); assert(line.active());input("TUS\n");
  assert(commands.back()=="STATUS");
  input("STARTX\b\r\n");assert(commands.back()=="START");
  input(std::string(80,'A')+"\b\nSTOP\r\n");
  assert(rejected==1 && commands.back()=="STOP" && !line.active());
  input(std::string(79,'B')+"\n");assert(commands.back().size()==79);
  input("\r\n\r\n:   \n");assert(!line.active());
  puts("PASS: CRLF, repeated commands, partial lines, colon, backspace and overflow recovery");
}
