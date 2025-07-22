from PIL import ImageGrab
import time
import os
from speaker import speak

def take_command_text():
    query = input("Scrie comanda ta aici: ").lower()
    return query

def take_screenshot():
    folder = "screenshots"
    if not os.path.exists(folder):
        os.makedirs(folder)
    img = ImageGrab.grab()
    filename = f"screenshot_{int(time.time())}.png"
    img.save(os.path.join(folder, filename))
    speak(f"Am salvat captura de ecran ca {filename}")
    print(f"Screenshot salvat: {filename}")


def comanda_secreta():
    # aici pui ce vrei să deschidă
    # exemplu: un fișier text
    path = r"G:\POZE\335idream.jpg"
    if os.path.exists(path):
        os.startfile(path)
        speak("Am deschis fișierul secret.")
    else:
        speak("Fișierul secret nu există.")
