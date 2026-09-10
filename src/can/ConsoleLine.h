#pragma once
#include <stddef.h>
namespace canservice {
// No allocations. A result remains readable until the next character arrives.
class ConsoleLine {
public:
  enum Result { Waiting, Complete, TooLong };
  char text[80]={};
  bool active() const { return started; }
  Result feed(char c) {
    if(!started) {
      if(c=='\r'||c=='\n'||c==' '||c=='\t')return Waiting;
      length=0;overflow=false;started=true;
      if(c==':')return Waiting;
    }
    if(c=='\r'||c=='\n') {
      while(length && (text[length-1]==' '||text[length-1]=='\t'))--length;
      text[length]=0;started=false;
      return overflow?TooLong:(length?Complete:Waiting);
    }
    if(c=='\b'||c==127) { if(length&&!overflow)--length;return Waiting; }
    if(c>=32&&c<=126) {
      if(length<sizeof(text)-1&&!overflow)text[length++]=c;
      else overflow=true;
    }
    return Waiting;
  }
private:
  size_t length=0;
  bool started=false,overflow=false;
};
}
