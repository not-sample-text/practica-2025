import pyttsx3
import datetime

engine = pyttsx3.init()

def speak(text):
    print(f"Asistent: {text}")
    engine.say(text)
    engine.runAndWait()

def wish_me():
    hour = datetime.datetime.now().hour
    if 0 <= hour < 12:
        speak("Bună dimineața!")
    elif 12 <= hour < 18:
        speak("Bună ziua!")
    else:
        speak("Bună seara!")
    speak("Sunt asistentul tău personal. Cu ce te pot ajuta?")
