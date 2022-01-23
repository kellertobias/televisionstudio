// Arduino9x_RX
// -*- mode: C++ -*-

#define SERIAL_DEBUG 0
#define SERIAL_BUFFER_SIZE 128
#define SERIAL_BUFFER_RX_SIZE 128

#include <arduino.h>
#include <Adafruit_NeoPixel.h>

#define SERIAL_SPEED 250000

#define LED_IGNORE_RULE currentReadIndex == 8

#define SERIAL_HEADER_A 0b10101010
#define SERIAL_HEADER_B 0b00000000
#define SERIAL_FOOTER_A 0b11111111
#define SERIAL_FOOTER_B 0b00000000

#define ROWA_1 29 //A5
#define ROWA_2 27 //A4
#define ROWA_3 25 //A3
#define ROWA_4 23 //A2
#define ROWA_5 15 //A1

#define COLA_1 36
#define COLA_2 34
#define COLA_3 32
#define COLA_4 31
#define COLA_5 30
#define COLA_6 28
#define COLA_7 26
#define COLA_8 24
#define COLA_9 22

#define ROWB_1 46 //A5
#define ROWB_2 44 //A4
#define ROWB_3 42 //A3
#define ROWB_4 40 //A2
#define ROWB_5 38 //A1

#define COLB_1 53
#define COLB_2 51
#define COLB_3 49
#define COLB_4 48
#define COLB_5 47
#define COLB_6 45
#define COLB_7 43
#define COLB_8 41
#define COLB_9 39

#define ENC_A 52 // OR 35
#define ENC_B 50 // OR 33

// Free Pins: SCK(15), CS(17), TX(1), RX(0)

#define WS2812_A 14
#define WS2812_B 37
#define FADER A15

#define NUMROW 5
#define NUMCOL 9
#define NUMLED 45
#define NUMLEDDOUBLE 90

#define ACTIVE_STATE LOW
#define INACTIVE_STATE HIGH

#define ADDR_FADER 0b00000001
#define ADDR_ENCODER 0b10000001

short addresses[2][NUMROW][NUMCOL];

short rows_a[] = {ROWA_1, ROWA_2, ROWA_3, ROWA_4, ROWA_5};
short cols_a[] = {COLA_1, COLA_2, COLA_3, COLA_4, COLA_5, COLA_6, COLA_7, COLA_8, COLA_9};
short rows_b[] = {ROWB_1, ROWB_2, ROWB_3, ROWB_4, ROWB_5};
short cols_b[] = {COLB_1, COLB_2, COLB_3, COLB_4, COLB_5, COLB_6, COLB_7, COLB_8, COLB_9};
short *rows;
short *cols;

bool allowDebug = true;

Adafruit_NeoPixel strip_a(NUMLED, WS2812_A, NEO_GRB + NEO_KHZ800);
Adafruit_NeoPixel strip_b(NUMLED, WS2812_B, NEO_GRB + NEO_KHZ800);

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

struct sButtons
{
    bool pressed = false;
    struct
    {
        LedColor on;
        LedColor off;
        bool dimmed = false;
        bool fast = false;
    } led;
};
struct sButtons buttons_a[NUMROW * NUMCOL];
struct sButtons buttons_b[NUMROW * NUMCOL];

short faderValue = 0;
int encoderPinALast = LOW;

int tick = 0;

short row = 0;
short col = 0;
short rowPin = 0;
short colPin = 0;

sButtons *buttons;
Adafruit_NeoPixel strip;

// // Enable and call freeMemory() to debug memory leaks
// #ifdef __arm__
// // should use uinstd.h to define sbrk but Due causes a conflict
// extern "C" char* sbrk(int incr);
// #else  // __ARM__
// extern char *__brkval;
// #endif  // __arm__

// int freeMemory() {
//   char top;
// #ifdef __arm__
//   return &top - reinterpret_cast<char*>(sbrk(0));
// #elif defined(CORE_TEENSY) || (ARDUINO > 103 && ARDUINO != 151)
//   return &top - __brkval;
// #else  // __arm__
//   return __brkval ? &top - __brkval : &top - __malloc_heap_start;
// #endif  // __arm__
// }

void fill(short r, short g, short b)
{
    for (int i = 0; i < NUMLED; i++)
    {
        strip_a.setPixelColor(i, r, g, b);
    }
    for (int i = 0; i < NUMLED; i++)
    {
        strip_b.setPixelColor(i, r, g, b);
    }
}

void setup()
{
    // Start Serial
    Serial.begin(SERIAL_SPEED);

    short address = 0;
    for (int k = 0; k < 2; k++)
    {
        for (int r = 0; r < NUMROW; r++)
        {
            for (int c = 0; c < NUMCOL; c++)
            {
                address++;
                while (
                    address == ADDR_FADER ||
                    address == ADDR_ENCODER ||
                    address == SERIAL_HEADER_A ||
                    address == SERIAL_HEADER_B ||
                    address == SERIAL_FOOTER_A ||
                    address == SERIAL_FOOTER_B)
                {
                    address++;
                }
                addresses[k][r][c] = address;
            }
        }
    }

    while (!Serial)
        ;
    delay(50);
    strip_a.begin();
    strip_b.begin();
    strip_a.setBrightness(255);
    strip_b.setBrightness(255);
    strip_a.show();
    strip_b.show();

    //pinMode for Matrix
    for (int i = 0; i < NUMROW; i++)
    {
        pinMode(rows_a[i], INPUT);
        digitalWrite(rows_a[i], LOW);
        pinMode(rows_b[i], INPUT);
        digitalWrite(rows_b[i], LOW);
    }
    for (int i = 0; i < NUMCOL; i++)
    {
        pinMode(cols_a[i], INPUT_PULLUP);
        pinMode(cols_b[i], INPUT_PULLUP);
    }

    pinMode(ENC_A, INPUT);
    pinMode(ENC_B, INPUT);

    for (int k = 0; k < 2; k++)
    {
        buttons = k == 0 ? buttons_a : buttons_b;
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

    for (int i = 0; i < NUMLED; i++)
    {
        if (i > 0)
        {
            strip_a.setPixelColor(i - 1, 0, 0, 0);
            strip_b.setPixelColor(i - 1, 0, 0, 0);
        }
        strip_a.setPixelColor(i, 255, 0, 255);
        strip_b.setPixelColor(i, 0, 255, 0);
        strip_a.show();
        strip_b.show();
        delay(10);
    }
    fill(255, 0, 255);
    strip_a.show();
    strip_b.show();
    delay(250);
    fill(0, 0, 0);
    strip_a.show();
    strip_b.show();
}

char temp[64];

void sendMessage(short unit, short row, short col, short address, short message)
{
    if (SERIAL_DEBUG)
    {
        sprintf(temp, "%d:%d:%d Addr: #%02X Message: %02X\n", unit, row, col, address, message);
        Serial.write(temp);
        Serial.write((byte)SERIAL_FOOTER_A);
        Serial.write((byte)SERIAL_FOOTER_B);
    }
    else
    {
        Serial.write((byte)SERIAL_HEADER_A);
        Serial.write((byte)SERIAL_HEADER_B);

        Serial.write((byte)address);
        Serial.write((byte)message);

        Serial.write((byte)SERIAL_FOOTER_A);
        Serial.write((byte)SERIAL_FOOTER_B);
    }
}

int arrayPos = 0;
void readMatrix()
{
    for (int k = 0; k < 2; k++)
    {
        buttons = k == 0 ? buttons_a : buttons_b;
        rows = k == 0 ? rows_a : rows_b;
        cols = k == 0 ? cols_a : cols_b;

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
                    sendMessage(k, row, col, addresses[k][row][col], btnState);
                }
                arrayPos++;
            }

            digitalWrite(rowPin, INACTIVE_STATE);
            pinMode(rowPin, INPUT);
        }
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

        sendMessage(3, 0, 0, 0b00000001, currentValue);
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
            sendMessage(3, 0, 1, ADDR_ENCODER, 0b00000010);
        }
        else
        {
            sendMessage(3, 0, 1, ADDR_ENCODER, 0b00000001);
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
sButtons button;

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
            if (currentReadIndex >= NUMLEDDOUBLE)
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
            if (currentReadIndex == NUMLED)
            {
                currentWriteIndex = 0;
            }

            buttons = (currentReadIndex < NUMLED) ? buttons_a : buttons_b;

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

    for (int k = 0; k < 2; k++)
    {
        buttons = k == 0 ? buttons_a : buttons_b;
        strip = k == 0 ? strip_a : strip_b;
        for (int i = 0; i < NUMLED; i++)
        {
            short pixelBrightness = 0;
            LedColor color;

            switch (ledTick)
            {
            case 0:
                color = buttons[i].led.on;
                pixelBrightness = buttons[i].led.dimmed ? brightness.dim.on : brightness.main.on;
                break;

            case 1:
                if (buttons[i].led.fast)
                {
                    color = buttons[i].led.off;
                    pixelBrightness = buttons[i].led.dimmed ? brightness.dim.off : brightness.main.off;
                }
                else
                {
                    color = buttons[i].led.on;
                    pixelBrightness = buttons[i].led.dimmed ? brightness.dim.on : brightness.main.on;
                }
                break;

            case 2:
                color = buttons[i].led.on;
                pixelBrightness = buttons[i].led.dimmed ? brightness.dim.on : brightness.main.on;
                break;

            case 3:
                color = buttons[i].led.off;
                pixelBrightness = buttons[i].led.dimmed ? brightness.dim.off : brightness.main.off;
                break;

            case 4:
                if (buttons[i].led.fast)
                {
                    color = buttons[i].led.on;
                    pixelBrightness = buttons[i].led.dimmed ? brightness.dim.on : brightness.main.on;
                }
                else
                {
                    color = buttons[i].led.off;
                    pixelBrightness = buttons[i].led.dimmed ? brightness.dim.off : brightness.main.off;
                }
                break;

            case 5:
                color = buttons[i].led.off;
                pixelBrightness = buttons[i].led.dimmed ? brightness.dim.off : brightness.main.off;
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
    }

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

    readFader();
    readEncoder();
}
