  /****************************************************************************
 *            measure.cpp
 *
 *  Sa April 27 09:23:14 2019
 *  Copyright  2019  Dirk Brosswick 
 *  Email: dirk.brosswick@googlemail.com
 ****************************************************************************/
 
/*
 *  This program is free software; you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation; either version 2 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program; if not, write to the Free Software
 *  Foundation, Inc., 59 Temple Place - Suite 330, Boston, MA 02111-1307, USA.
 */ 
#include <Arduino.h>
#include <WiFi.h>

#include "measure.h"
#include "config.h"
#include "ota.h"
#include "webserver.h"
#include "mqttclient.h"
#include "ntp.h"

//Watchdog hinzufügen
#include <esp_task_wdt.h>
#define WDT_TIMEOUT 120    // 120 seconds WDT
#define WATCHDOGLED 13

unsigned long start_time=0;
unsigned long  last_time_wifi_test=0;
unsigned long last_time_status=0;

static bool APMODE = false;
/*
 * 
 */

const char* wl_status_to_string(wl_status_t status) {
  switch (status) {
    case WL_NO_SHIELD: return "WL_NO_SHIELD";
    case WL_IDLE_STATUS: return "WL_IDLE_STATUS";
    case WL_NO_SSID_AVAIL: return "WL_NO_SSID_AVAIL";
    case WL_SCAN_COMPLETED: return "WL_SCAN_COMPLETED";
    case WL_CONNECTED: return "WL_CONNECTED";
    case WL_CONNECT_FAILED: return "WL_CONNECT_FAILED";
    case WL_CONNECTION_LOST: return "WL_CONNECTION_LOST";
    case WL_DISCONNECTED: return "WL_DISCONNECTED";
  }
}


void connectWiFi() {

  //Nach 1800 Sekunden im AP-Mode versucht er den Verbindungsaufbau mit dem WLAN
  if (( APMODE == true ) && ((millis()-last_time_wifi_test)<180000)) return;
  

  last_time_wifi_test=millis();
  
  /*
   * Check if WiFi connected
   */
  WiFi.setHostname( config_get_HostName() );

  if ( WiFi.status() != WL_CONNECTED ) {
    int wlan_timeout = WLAN_CONNECT_TIMEOUT;

    Serial.printf("WiFi lost, restart ... ");
    /*
     * start a new connection and wait for it
     */
    //ZUnächst zurücksetzen
    APMODE = false;

    WiFi.begin( config_get_WlanSSID() , config_get_WlanPassord() );
    while ( WiFi.status() != WL_CONNECTED ){
        delay(1000);
        Serial.printf(".");

        if ( wlan_timeout <= 0 ) {
          Serial.printf("WLAN-Timeout, aktiviere AP-MODE");
          APMODE = true;
          break;
        }
        wlan_timeout--;
    }

    if ( APMODE == true ) {
      WiFi.softAP( config_get_OTALocalApSSID(), config_get_OTALocalApPassword() );
      IPAddress myIP = WiFi.softAPIP();
      Serial.printf("failed\r\nstarting Wifi-AP with SSID \"%s\"\r\n", config_get_OTALocalApSSID() );
      Serial.printf("AP IP address: ");
      Serial.println(myIP);      
    }
    else {
      Serial.printf("connected\r\nIP address: " );
      Serial.println( WiFi.localIP() );
    }
  }
}

/*
 * 
 */
void setup() 
{
  /*
   * doing setup Serial an config
   */
  Serial.begin(115200);
  config_setup();

  esp_task_wdt_init(WDT_TIMEOUT, true); //enable panic so ESP32 restarts
  esp_task_wdt_add(NULL); //add current thread to WDT watch
  /*
   * scan for SSID, if noct, setup an own AP
   */
  Serial.printf("scan for SSID \"%s\" ... ", config_get_WlanSSID() );  
  if ( ota_scan( config_get_WlanSSID() ) == OTA_WLAN_OK ) {
    WiFi.mode( WIFI_STA );
    Serial.printf("found\r\nconnect to %s (%s)\r\n", config_get_WlanSSID(), config_get_WlanPassord() );
    WiFi.begin( config_get_WlanSSID() , config_get_WlanPassord() );    
  }
  else {
    Serial.printf("not found\r\nstarting Wifi-AP with SSID \"%s\"\r\n", config_get_OTALocalApSSID() );
    WiFi.softAP( config_get_OTALocalApSSID(), config_get_OTALocalApPassword() );
    IPAddress myIP = WiFi.softAPIP();
    Serial.print("AP IP address: ");
    Serial.println(myIP);
    APMODE = true; 
  }
  Serial.printf("WiFi Status: %d, AP-Mode: %d\n",WiFi.status(), APMODE);
  /*
   * Connect to WiFi
   */
  connectWiFi();
  
  //Startzeit übernehmen
  start_time=millis();
  /*
   * Setup Tasks
   */
  Serial.printf("Start Main Task on Core: %d\r\n", xPortGetCoreID() );
  ntp_StartTask();
  ota_StartTask();
  mqtt_client_StartTask();
  asyncwebserver_StartTask();
  measure_StartTask();
}

/*
 * 
 */
void loop() {
  delay(10);
  //Serial.println("Loop...");
  
  //Watchdog zurücksetzen
  //Serial.println("Reset Watchdog...");
  esp_task_wdt_reset();  
  /*
   * WiFi check status for reconnect
   */
  if ((millis()-last_time_status)>10000){
    Serial.printf("WiFi Status: %d, AP-Mode: %d\n",WiFi.status(), APMODE);
    Serial.println(wl_status_to_string(WiFi.status()));
    last_time_status=millis();
  }
  /*
  if (( APMODE == true ) && (millis()-start_time)>90000){
     Serial.println("Reset AP...");
      //Im AP-Mode nach 30 Sekunden Reboot
      ESP.restart();

  }*/

  connectWiFi();
}


