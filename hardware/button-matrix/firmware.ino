// Arduino9x_RX
// -*- mode: C++ -*-

#define SERIAL_DEBUG 1
#define HAS_FADER 0
#define HAS_ENCODER 0

#include <arduino.h>
#include <Adafruit_NeoPixel.h>

#define SERIAL_SPEED 250000

#define LED_IGNORE_RULE currentReadIndex == 8

#define SERIAL_HEADER_A 0b10101010
#define SERIAL_HEADER_B 0b00000000
#define SERIAL_FOOTER_A 0b11111111
#define SERIAL_FOOTER_B 0b00000000

#define ROW1 23 //A5
#define ROW2 22 //A4
#define ROW3 21 //A3
#define ROW4 20 //A2
#define ROW5 19 //A1

#define COL1 4
#define COL2 5
#define COL3 6
#define COL4 7
#define COL5 8
#define COL6 9
#define COL7 10
#define COL8 11
#define COL9 12

#define ENC_A 14
#define ENC_B 16

// Free Pins: SCK(15), CS(17), TX(1), RX(0)

#define WS2812 13 // D1
#define FADER A0

#define NUMROW 5
#define NUMCOL 9
#define NUMLED 45

#define ACTIVE_STATE LOW

short rows[] = {ROW1, ROW2, ROW3, ROW4, ROW5};
short cols[] = {COL1, COL2, COL3, COL4, COL5, COL6, COL7, COL8, COL9};

bool allowDebug = true;

Adafruit_NeoPixel strip(NUMLED, WS2812, NEO_GRB + NEO_KHZ800);

struct LedColor
{
    short red = 0;
    short green = 0;
    short blue = 0;
};

struct
{
    struct
    {
        short on = 15;
        short off = 5;
    } main;
    struct
    {
        short on = 7;
        short off = 3;
    } dim;
} brightness;

struct
{
    bool pressed = false;
    struct
    {
        LedColor on;
        LedColor off;
        bool dimmed = false;
        bool fast = false;
    } led;
} buttons[NUMROW * NUMCOL];

short faderValue = 0;
int encoderPinALast = LOW;

int tick = 0;

short row = 0;
short col = 0;
short rowPin = 0;
short colPin = 0;

void fill(short r, short g, short b)
{
    for (int i = 0; i < NUMLED; i++)
    {
        strip.setPixelColor(i, r, g, b);
    }
}

void setup()
{
    // Start Serial
    Serial.begin(SERIAL_SPEED);
    while (!Serial)
        ;
    delay(50);
    strip.begin();
    strip.setBrightness(255);
    strip.show();

    //pinMode for Matrix
    for (int i = 0; i < NUMROW; i++)
    {
        pinMode(rows[i], INPUT);
        digitalWrite(rows[i], LOW);
    }
    for (int i = 0; i < NUMCOL; i++)
    {
        pinMode(cols[i], INPUT_PULLUP);
    }

    pinMode(ENC_A, INPUT);
    pinMode(ENC_B, INPUT);

    //Setup Arrays
    for (int i = 0; i < NUMROW * NUMCOL; i++)
    {
        buttons[i].pressed = false;
        buttons[i].led.on.red = 1;
        buttons[i].led.on.green = 0;
        buttons[i].led.on.blue = 0;
        buttons[i].led.off.red = 0;
        buttons[i].led.off.green = 0;
        buttons[i].led.off.blue = 1;
        buttons[i].led.dimmed = true;
        buttons[i].led.fast = true;
    }
}

void sendMessage(short address, short message)
{
    Serial.write((byte)SERIAL_HEADER_A);
    Serial.write((byte)SERIAL_HEADER_B);

    Serial.write((byte)address);
    Serial.write((byte)message);

    Serial.write((byte)SERIAL_FOOTER_A);
    Serial.write((byte)SERIAL_FOOTER_B);
}

int arrayPos = 0;
void readMatrix()
{
    arrayPos = 0;
    for (row = 0; row < NUMROW; row++)
    {
        rowPin = rows[row];
        pinMode(rowPin, OUTPUT);
        digitalWrite(rowPin, ACTIVE_STATE);

        for (col = 0; col < NUMCOL; col++)
        {
            colPin = cols[col];
            pinMode(colPin, INPUT_PULLUP);
            bool btnState = digitalRead(colPin);
            pinMode(colPin, INPUT);
            if (buttons[arrayPos].pressed != btnState)
            {
                buttons[arrayPos].pressed = btnState;
                btnState == ACTIVE_STATE;
                short address = ((row + 1) << 4);
                address = address | col;
                sendMessage(address, btnState);
            }
            arrayPos++;
        }
        pinMode(rowPin, INPUT);
    }
}

void readFader()
{
    short currentValue = map(analogRead(FADER), 1000, 20, 0, 255);
    if (currentValue < 0)
        currentValue = 0;
    if (currentValue > 255)
        currentValue = 255;

    if (abs(currentValue - faderValue) > 0)
    {
        faderValue = currentValue;

        byte address = ((row + 1) << 4);
        address = 0b00000001;
        sendMessage(address, currentValue);
    }
}

int encoderPinACur = LOW;

void readEncoder()
{
    encoderPinACur = digitalRead(ENC_A);

    if (
        (encoderPinALast == LOW) &&
        (encoderPinACur == HIGH))
    {
        if (digitalRead(ENC_B) == LOW)
        {
            sendMessage(0b10000001, 0b00000010);
        }
        else
        {
            sendMessage(0b10000001, 0b00000001);
        }
    }
    encoderPinALast = encoderPinACur;
}

enum State
{
    WaitReadHeaderA = 0,
    WaitReadHeaderB = 1,
    WaitReadDebug = 2,
    WaitReadBrightness = 3,
    WaitReadBrightnessBlink = 4,
    WaitReadBrightnessDim = 5,
    WaitReadBrightnessDimBlink = 6,
    ReadingLeds = 7,
    Error = 8,
};

State state = WaitReadHeaderA;
short currentReadIndex = 0;
short currentWriteIndex = 0;

int readStart = tick;

void readSerial()
{
    if (!Serial.available())
    {
        return;
    }

    // Reset if waited too long;
    if ((tick - readStart) > 10)
        state = WaitReadHeaderA;

    while (Serial.available())
    {
        short in = Serial.read();
        switch (state)
        {
        case WaitReadHeaderA:
            if (in == SERIAL_HEADER_A)
            {
                state = WaitReadHeaderB;
                readStart = tick;
            }
            else
            {
                state = Error;
            }
            break;

        case WaitReadHeaderB:
            if (in == SERIAL_HEADER_B)
            {
                state = WaitReadDebug;
            }
            else
            {
                state = Error;
            }

            break;

        case WaitReadDebug:
            allowDebug = in;
            state = WaitReadBrightness;
            break;

        case WaitReadBrightness:
            brightness.main.on = in;
            state = WaitReadBrightnessBlink;
            break;

        case WaitReadBrightnessBlink:
            brightness.main.off = in;
            state = WaitReadBrightnessDim;
            break;

        case WaitReadBrightnessDim:
            brightness.dim.on = in;
            state = WaitReadBrightnessDimBlink;
            break;

        case WaitReadBrightnessDimBlink:
            brightness.dim.off = in;
            state = ReadingLeds;
            currentReadIndex = 0;
            currentWriteIndex = 0;
            break;

        case ReadingLeds:
            if (currentReadIndex >= NUMLED)
            {
                currentReadIndex = 0;
                currentWriteIndex = 0;
                state = WaitReadHeaderA;
                break;
            }
            if (LED_IGNORE_RULE)
            {
                currentReadIndex++;
                break;
            }
            buttons[currentWriteIndex].led.on.red = (in & 0b10000000) > 0;
            buttons[currentWriteIndex].led.on.green = (in & 0b01000000) > 0;
            buttons[currentWriteIndex].led.on.blue = (in & 0b00100000) > 0;
            buttons[currentWriteIndex].led.off.red = (in & 0b00010000) > 0;
            buttons[currentWriteIndex].led.off.green = (in & 0b00001000) > 0;
            buttons[currentWriteIndex].led.off.blue = (in & 0b00000100) > 0;
            buttons[currentWriteIndex].led.dimmed = (in & 0b00000010) > 0;
            buttons[currentWriteIndex].led.fast = (in & 0b00000001) > 0;
            currentWriteIndex++;
            currentReadIndex++;
            break;
        default:
            state = WaitReadHeaderA;
            currentReadIndex = 0;
            break;
        }
    }

    if (state == Error)
    {
        state = WaitReadHeaderA;
    }
}

int ledTick = 0;

void updateLed()
{
    if (tick % 100 != 0)
    {
        return;
    }

    for (int i = 0; i < NUMLED; i++)
    {
        auto led = buttons[i].led;
        short pixelBrightness = 0;
        LedColor color;
        switch (ledTick)
        {
        case 0:
            color = led.on;
            pixelBrightness = led.dimmed ? brightness.dim.on : brightness.main.on;
            break;

        case 1:
            if (led.fast)
            {
                color = led.off;
                pixelBrightness = led.dimmed ? brightness.dim.off : brightness.main.off;
            }
            else
            {
                color = led.on;
                pixelBrightness = led.dimmed ? brightness.dim.on : brightness.main.on;
            }
            break;

        case 2:
            color = led.on;
            pixelBrightness = led.dimmed ? brightness.dim.on : brightness.main.on;
            break;

        case 3:
            color = led.off;
            pixelBrightness = led.dimmed ? brightness.dim.off : brightness.main.off;
            break;

        case 4:
            if (led.fast)
            {
                color = led.on;
                pixelBrightness = led.dimmed ? brightness.dim.on : brightness.main.on;
            }
            else
            {
                color = led.off;
                pixelBrightness = led.dimmed ? brightness.dim.off : brightness.main.off;
            }
            break;

        case 5:
            color = led.off;
            pixelBrightness = led.dimmed ? brightness.dim.off : brightness.main.off;
            break;

        default:
            break;
        }

        short red = color.red * pixelBrightness;
        short green = color.green * pixelBrightness;
        short blue = color.blue * pixelBrightness;

        strip.setPixelColor(i, red, green, blue);
    }
    strip.show();

    ledTick++;
    if (ledTick > 5)
        ledTick = 0;
}

void loop()
{
    tick++;
    readSerial();
    updateLed();
    readMatrix();

#ifdef HAS_FADER
    readFader();
#endif

#ifdef HAS_ENCODER
    readEncoder();
#endif
}