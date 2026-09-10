#include <Arduino.h>
#include <WiFi.h>
#include <WebServer.h>
#include <freertos/semphr.h>
#include "dashboard_page.h"
#include "wifi_config.h"
#include "can/CanService.h"

namespace {
WebServer server(80);
SemaphoreHandle_t storageMutex = nullptr;
char responseBuffer[8192];
bool dashboardRequest() { return server.hasHeader("X-Dashboard-Request") && server.header("X-Dashboard-Request") == "1"; }
void sendJson(const String &body) { server.send(200, "application/json", body); }
void startWebServer() {
  const char *headers[] = {"X-Dashboard-Request"}; server.collectHeaders(headers, 1);
  server.on("/", HTTP_GET, [] { server.sendHeader("Content-Encoding", "gzip"); server.send_P(200, "text/html; charset=utf-8", reinterpret_cast<const char *>(DASHBOARD_GZIP), sizeof(DASHBOARD_GZIP)); });
  server.on("/api/can", HTTP_GET, [] { if (!canservice::statusJson(responseBuffer, sizeof(responseBuffer))) server.send(503,"text/plain","CAN snapshot busy/unavailable"); else server.send(200,"application/json",responseBuffer); });
  server.on("/api/can/report", HTTP_GET, [] { if (!canservice::reportText(responseBuffer, sizeof(responseBuffer))) server.send(503,"text/plain","Report busy"); else server.send(200,"text/plain; charset=utf-8",responseBuffer); });
  server.on("/api/can/mode", HTTP_POST, [] {
    if (!dashboardRequest() || !server.hasArg("mode")) { server.send(400,"text/plain","Bad request"); return; }
    String mode=server.arg("mode"); if(mode!="can"&&mode!="dashboard"){server.send(400,"text/plain","Invalid mode");return;}
    if(!canservice::setMode(mode=="can")){server.send(503,"text/plain","CAN queue unavailable; retry");return;} sendJson(String("{\"mode\":\"")+mode+"\"}");
  });
  server.on("/api/can/control", HTTP_POST, [] {
    if(!dashboardRequest()||!server.hasArg("enabled")){server.send(400,"text/plain","Bad request");return;} bool enabled=server.arg("enabled")=="1";
    if(enabled&&!canservice::active()){server.send(409,"text/plain","Enter CAN mode first");return;} if(!canservice::setEnabled(enabled)){server.send(503,"text/plain","CAN control unavailable; retry");return;} sendJson(String("{\"enabled\":")+(enabled?"true}":"false}"));
  });
  server.on("/api/can/bitrate", HTTP_POST, [] {
    if(!dashboardRequest()||!server.hasArg("bitrate")){server.send(400,"text/plain","Bad request");return;} uint32_t rate=strtoul(server.arg("bitrate").c_str(),nullptr,10);
    if(!canservice::setBitrate(rate)){server.send(409,"text/plain","Disable CAN; select 50/100/125/250/500/1000 kbit/s");return;} sendJson(String("{\"bitrate\":")+canservice::bitrate()+"}");
  });
  server.on("/api/can/command", HTTP_POST, [] {
    if(!dashboardRequest()||!server.hasArg("command")){server.send(400,"text/plain","Bad request");return;} if(!canservice::command(server.arg("command").c_str())){server.send(503,"text/plain","CAN command rejected or queue full");return;} sendJson("{\"accepted\":true}");
  });
  server.onNotFound([] { server.send(404,"text/plain","Not found"); }); server.begin();
}
}
void setup() {
  Serial.begin(115200); delay(250); storageMutex=xSemaphoreCreateMutex();
  if(!storageMutex||!canservice::begin(storageMutex)){Serial.println("FATAL: passive CAN service initialization failed");while(true)delay(1000);}
  WiFi.mode(WIFI_AP_STA); WiFi.softAP(DASHBOARD_AP_SSID,DASHBOARD_AP_PASSWORD);
  if(strlen(WIFI_SSID)){WiFi.begin(WIFI_SSID,WIFI_PASSWORD);uint32_t deadline=millis()+10000;while(WiFi.status()!=WL_CONNECTED&&int32_t(deadline-millis())>0)delay(100);}
  startWebServer(); Serial.printf("Passive CAN dashboard ready; driver OFF.\nAP: http://%s/\n",WiFi.softAPIP().toString().c_str());
  if(WiFi.status()==WL_CONNECTED)Serial.printf("LAN: http://%s/\n",WiFi.localIP().toString().c_str());
}
void loop(){server.handleClient();canservice::pollConsole(false);delay(2);}
