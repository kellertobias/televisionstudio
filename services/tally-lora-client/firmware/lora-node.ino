// Arduino9x_RX
// -*- mode: C++ -*-

#define SERIAL_DEBUG 1

#include <SPI.h>
#include <EEPROM.h>
#include <RH_RF95.h>
#include <Adafruit_NeoPixel.h>

#define HAS_LORA true

#define LORA_KEYWORD "ATM"

#define WS2812_PIN 5 // D1
#define LED 2        // D4
#define BUTTON 0     // D3
#define POTI A0      // A0

#define RFM95_CS 15  // D8
#define RFM95_RST 16 // D2 => D0
#define RFM95_INT 4  // D0 => D2

//define RFM95_MISO 12 // D6
//define RFM95_MOSI 13 // D7
//define RFM95_SCK 12  // D5

#define WS2812_COUNT 16
#define RF95_FREQ 868.0

#define SETUP_TIME 5000
#define SETUP_DEBOUNCE 50

#define CHANNEL_MAX 8
#define CHANNEL_MIN 1

#define SETTINGS_ADDR 0

RH_RF95 rf95(RFM95_CS, RFM95_INT);
Adafruit_NeoPixel strip(WS2812_COUNT, WS2812_PIN, NEO_GRB + NEO_KHZ800);

int cInit[] = {64, 64, 64};
int cErr[] = {255, 0, 255};
int cPgm[] = {255, 0, 0};
int cPrv[] = {0, 255, 0};
;
int cOff[] = {0, 0, 0};
int cEmpty[] = {32, 32, 32};

unsigned long timeLastPress = 0;

int tally_channel = 1;

bool isSetup = false;
bool isPGM = false;
bool isPRV = false;

int tick = 0;

std::string loraKeyowrd(LORA_KEYWORD);
std::string loraDelimiter(",");

void _fill(int *color, int section)
{
    if (section >= 1)
    {
        for (int i = WS2812_COUNT / 2; i < WS2812_COUNT; i++)
        {
            strip.setPixelColor(i, color[0], color[1], color[2]);
        }
    }
    if (section <= 1)
    {
        for (int i = 0; i < WS2812_COUNT / 2; i++)
        {
            strip.setPixelColor(i, color[0], color[1], color[2]);
        }
    }
}

void fillFront(int *color) { _fill(color, 0); }
void fillBack(int *color) { _fill(color, 2); }
void fill(int *color) { _fill(color, 1); }
void flashSetupStep(int step)
{
    for (int i = 0; i < step; i++)
    {
        strip.setPixelColor(i, 10, 10, 0);
    }
    for (int i = step; i < WS2812_COUNT; i++)
    {
        strip.setPixelColor(i, 0, 255, 0);
    }
    strip.show();
}

void showError()
{
    strip.setPixelColor(0, 0, 0, 0);
    strip.setPixelColor(1, 0, 0, 0);
    strip.setPixelColor(2, 0, 0, 0);
    strip.setPixelColor(3, 0, 0, 0);
    strip.setPixelColor(4, 0, 0, 0);
    strip.setPixelColor(5, 0, 0, 0);
    strip.setPixelColor(6, 0, 0, 0);
    strip.setPixelColor(7, 0, 0, 0);
    strip.show();
    delay(200);
    strip.setPixelColor(0, 255, 0, 0);
    strip.setPixelColor(1, 255, 0, 0);
    strip.setPixelColor(2, 0, 0, 0);
    strip.setPixelColor(3, 0, 0, 0);
    strip.setPixelColor(4, 0, 0, 0);
    strip.setPixelColor(5, 0, 0, 0);
    strip.setPixelColor(6, 255, 0, 0);
    strip.setPixelColor(7, 255, 0, 0);
    strip.show();
    delay(200);
    strip.setPixelColor(0, 0, 0, 0);
    strip.setPixelColor(1, 0, 0, 0);
    strip.setPixelColor(2, 0, 0, 0);
    strip.setPixelColor(3, 0, 0, 0);
    strip.setPixelColor(4, 0, 0, 0);
    strip.setPixelColor(5, 0, 0, 0);
    strip.setPixelColor(6, 0, 0, 0);
    strip.setPixelColor(7, 0, 0, 0);
    strip.show();
    delay(200);
    strip.setPixelColor(0, 255, 0, 0);
    strip.setPixelColor(1, 255, 0, 0);
    strip.setPixelColor(2, 0, 0, 0);
    strip.setPixelColor(3, 0, 0, 0);
    strip.setPixelColor(4, 0, 0, 0);
    strip.setPixelColor(5, 0, 0, 0);
    strip.setPixelColor(6, 255, 0, 0);
    strip.setPixelColor(7, 255, 0, 0);
    strip.show();
    delay(200);
    strip.setPixelColor(0, 0, 0, 0);
    strip.setPixelColor(1, 0, 0, 0);
    strip.setPixelColor(2, 0, 0, 0);
    strip.setPixelColor(3, 0, 0, 0);
    strip.setPixelColor(4, 0, 0, 0);
    strip.setPixelColor(5, 0, 0, 0);
    strip.setPixelColor(6, 0, 0, 0);
    strip.setPixelColor(7, 0, 0, 0);
    strip.show();
    delay(200);
    strip.setPixelColor(0, 255, 0, 0);
    strip.setPixelColor(1, 255, 0, 0);
    strip.setPixelColor(2, 0, 0, 0);
    strip.setPixelColor(3, 0, 0, 0);
    strip.setPixelColor(4, 0, 0, 0);
    strip.setPixelColor(5, 0, 0, 0);
    strip.setPixelColor(6, 255, 0, 0);
    strip.setPixelColor(7, 255, 0, 0);
    strip.show();
}

// fake data
struct
{
    uint address = 1;
} settings;

void setup()
{

    //Set LED to high while initializing
    pinMode(LED, OUTPUT);
    digitalWrite(LED, HIGH);
    pinMode(BUTTON, INPUT_PULLUP);

    // Start Serial
    Serial.begin(74880);
    delay(50);
    Serial.println("\nBooting Tobisk LoRa Tally v1.1...\n");
    digitalWrite(LED, HIGH);
    delay(50);
    digitalWrite(LED, LOW);

    //Start Strips
    Serial.println("[LED] Start...");
    delay(1);
    strip.begin();
    strip.setBrightness(32);
    flashSetupStep(1);
    delay(100);

    Serial.println("[LED] Done.");

    if (HAS_LORA)
    {
        // Initialize RFM95
        flashSetupStep(2);
        pinMode(RFM95_RST, OUTPUT);
        digitalWrite(RFM95_RST, HIGH);

        Serial.println("[LoRa] Gateway Module starting…");

        Serial.println("[LoRa] Reset Low");
        digitalWrite(RFM95_RST, LOW);
        delay(10);
        flashSetupStep(3);
        Serial.println("[LoRa] Reset High");
        digitalWrite(RFM95_RST, HIGH);
        delay(10);
        flashSetupStep(4);

        Serial.println("[LoRa] Wait for init");
        delay(50);
        flashSetupStep(5);
        while (!rf95.init())
        {
            Serial.println("[LoRa] ERROR: LoRa radio init failed");
            showError();
            while (1)
                ;
        }

        flashSetupStep(6);
        Serial.println("[LoRa] LoRa radio init OK!");

        if (!rf95.setFrequency(RF95_FREQ))
        {

            Serial.println("[LoRa] ERROR: setFrequency failed");
            showError();
            while (1)
                ;
        }

        Serial.print("[LoRa] Set Freq to: ");
        Serial.println(RF95_FREQ);

        flashSetupStep(7);

        // The default transmitter power is 13dBm, using PA_BOOST.
        // If you are using RFM95 / 96/97/98 modules using the transmitter pin PA_BOOST, then
        // you can set transmission powers from 5 to 23 dBm:

        rf95.setTxPower(20, false);
        rf95.setPreambleLength(8);
        rf95.setSpreadingFactor(7);
        rf95.setSignalBandwidth(125E3);
        rf95.setCodingRate4(5);
        rf95.setPayloadCRC(false);
        flashSetupStep(8);
    }
    delay(50);

    Serial.println(" LOAD SETTINGS");
    EEPROM.begin(256);
    EEPROM.get(SETTINGS_ADDR, settings);
    Serial.println("Old values are: " + String(settings.address));
    tally_channel = settings.address;
    if (tally_channel > CHANNEL_MAX || tally_channel < CHANNEL_MIN)
        tally_channel = 1;

    Serial.println(" ... INIT DONE ...");

    fill(cOff);
    strip.setPixelColor(WS2812_COUNT - tally_channel, 0, 0, 255);
    strip.show();

    delay(2000);

    fill(cEmpty);
    strip.show();
    digitalWrite(LED, HIGH);
}

void loop_getLoraMessage()
{
    if (HAS_LORA)
    {
        // Should be a message for us now
        uint8_t buf[RH_RF95_MAX_MESSAGE_LEN];
        uint8_t len = sizeof(buf);

        if (rf95.recv(buf, &len))
        {
            std::string dataString((char *)buf);

            digitalWrite(LED, HIGH);
            RH_RF95::printBuffer("Received: ", buf, len);
            Serial.print("Decoded: ");
            Serial.println((char *)buf);
            Serial.print("RSSI: ");
            Serial.println(rf95.lastRssi(), DEC);

            if (dataString.find(loraKeyowrd) == 0)
            {
                Serial.print("Was Tally Command");
                std::string dataContent = dataString.substr(loraKeyowrd.length() + 1, dataString.length());
                std::string programString = dataContent.substr(0, dataContent.find(loraDelimiter));
                std::string previewString = dataContent.substr(dataContent.find(loraDelimiter) + 1, dataContent.length() - 1);

                Serial.print("PGM: >");
                Serial.print(programString.c_str());
                Serial.print("<  PVW: >");
                Serial.print(previewString.c_str());
                Serial.print("<");
                Serial.println();

                int programChannel = atoi(programString.c_str());
                int previewChannel = atoi(previewString.c_str());

                if (programChannel == tally_channel)
                {
                    isPGM = true;
                    isPRV = false;
                }
                else if (previewChannel == tally_channel)
                {
                    isPGM = false;
                    isPRV = true;
                }
                else
                {
                    isPGM = false;
                    isPRV = false;
                }
            }

            digitalWrite(LED, LOW);
        }
    }
}

void loop_loraSendStatus()
{
    // Send a reply
    uint8_t data[] = "And hello back to you";
    rf95.send(data, sizeof(data));
    rf95.waitPacketSent();
    Serial.println("Sent a reply");
    digitalWrite(LED, LOW);
}

void loop_setupBrightness()
{
    int brightness = analogRead(POTI);
    if (brightness > 900)
        brightness = 255;
    else if (brightness > 800)
        brightness = 200;
    else if (brightness > 700)
        brightness = 150;
    else if (brightness > 600)
        brightness = 100;
    else if (brightness > 500)
        brightness = 75;
    else if (brightness > 400)
        brightness = 50;
    else if (brightness > 300)
        brightness = 40;
    else if (brightness > 200)
        brightness = 30;
    else if (brightness > 100)
        brightness = 20;
    else
        brightness = 10;

    strip.setBrightness(brightness);
}

void loop_setStrip()
{
    if (tick % 2 == 0)
    {
        if (isSetup)
        {
            fillBack(cOff);
            strip.setPixelColor(WS2812_COUNT - tally_channel, 0, 0, 255);
            if (isPGM)
            {
                fillFront(cPgm);
            }
            else if (isPRV)
            {
                fillFront(cPrv);
            }
        }
        else if (isPGM)
        {
            fill(cPgm);
        }
        else if (isPRV)
        {
            fillFront(cOff);
            fillBack(cPrv);
        }
        else
        {
            fillFront(cOff);
            fillBack(cEmpty);
        }
        strip.show();
    }
}

void loop_checkMenu()
{
    unsigned long currentTime = millis();
    if (isSetup && (currentTime - timeLastPress > SETUP_TIME))
    {
        isSetup = false;
        digitalWrite(LED, HIGH);
        Serial.println("Exit Setup. Saving Data to EEPROM");
        settings.address = tally_channel;
        EEPROM.put(SETTINGS_ADDR, settings);
        EEPROM.commit();
        Serial.println("Done.");

        return;
    }
    if (!digitalRead(BUTTON))
    {
        if ((currentTime - timeLastPress) < SETUP_DEBOUNCE)
        {
            timeLastPress = currentTime;
            return;
        }
        timeLastPress = currentTime;

        if (isSetup)
        {
            Serial.println("Button Pressed. Increasing Channel");
            tally_channel++;
            if (tally_channel > CHANNEL_MAX)
                tally_channel = CHANNEL_MIN;
        }
        else
        {
            Serial.println("Starting Setup");
            digitalWrite(LED, LOW);
            isSetup = true;
        }
    }
}

void loop()
{
    if (tick % 10 == 0)
        loop_setupBrightness();

    loop_checkMenu();
    loop_getLoraMessage();
    loop_setStrip();
    delay(10);
    tick++;
}