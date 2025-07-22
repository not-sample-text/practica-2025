import subprocess
from speaker import speak

def cauta_pe_google(termen):
    termen = termen.replace(" ", "+")
    url = f"https://www.google.com/search?q={termen}"
    speak(f"Caut {termen.replace('+', ' ')} pe Google.")
    brave_path = r'C:\Program Files\BraveSoftware\Brave-Browser\Application\brave.exe'
    subprocess.Popen([brave_path, url])
