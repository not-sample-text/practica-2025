import speech_recognition as sr
from speaker import speak
from utils import take_command_text

def take_command_microphone():
    r = sr.Recognizer()
    with sr.Microphone() as source:
        print("Ascult...")
        r.pause_threshold = 1
        audio = r.listen(source)

    try:
        print("Recunosc...")
        query = r.recognize_google(audio, language='ro-RO')
        print(f"Tu ai zis: {query}")
    except Exception:
        speak("Nu am înțeles, te rog scrie comanda.")
        query = take_command_text()
    return query.lower()
