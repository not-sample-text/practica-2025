from speaker import wish_me, speak
from recognizer import take_command_microphone
from utils import take_command_text, take_screenshot, comanda_secreta
from browser import cauta_pe_google
from youtube import cauta_si_reda_melodia
from utils.info_live import ziua_si_data, ora_curenta, vremea


import os
import subprocess

if __name__ == "__main__":
    wish_me()
    foloseste_microfon = input("Vrei să folosești microfonul? (da/nu): ").strip().lower() == "da"

    while True:
        if foloseste_microfon:
            query = take_command_microphone()
        else:
            query = take_command_text()

        if query == "none" or query.strip() == "":
            continue

        if query in ["schimba input", "schimbă input"]:
            foloseste_microfon = not foloseste_microfon
            if foloseste_microfon:
                speak("Am schimbat la modul vocal.")
            else:
                speak("Am schimbat la modul scris.")
            continue
        

        elif "ora" in query:
            ora = ora_curenta()
            speak(f"Sunt ora {ora}")

        elif "data" in query or "ziua" in query or "zi" in query:
            data = ziua_si_data()
            speak(data)

        elif "vremea" in query or "cum este afară" in query or "cum este vremea" in query:
            speak("Spune localitatea pentru care vrei să știi vremea.")
            if foloseste_microfon:
                localitate = take_command_microphone()
            else:
                localitate = take_command_text()
            if localitate.strip() == "":
                localitate = "București"
            vreme = vremea(localitate)
            speak(vreme)

        elif "deschide calculator" in query:
            speak("Deschid calculatorul")
            os.system("calc.exe")
            
        elif "deschide word" in query or "word" in query:
            speak("Deschid Microsoft Word.")
            subprocess.Popen(["start", "winword"], shell=True)

        elif "deschide excel" in query or "excel" in query:
            speak("Deschid Microsoft Excel.")
            subprocess.Popen(["start", "excel"], shell=True) 
             
        elif "deschide powerpoint" in query or "powerpoint" in query or "prezentare" in query:
            speak("Deschid Microsoft PowerPoint.")
            subprocess.Popen(["start", "powerpnt"], shell=True)

        elif "deschide brave" in query or "brave" in query:
            speak("Deschid browserul Brave.")
            brave_path = r'C:\Program Files\BraveSoftware\Brave-Browser\Application\brave.exe'
            subprocess.Popen([brave_path]) 
        
        elif "deschide spotify" in query or "muzica" in query:
            speak("Deschid Spotify.")
            subprocess.Popen(["start", "spotify"], shell=True)
            
        elif "deschide arc" in query or "browser arc" in query:
            speak("Deschid Arc Browser.")
            try:
                subprocess.Popen([r"C:\Users\axeli\AppData\Local\Microsoft\WindowsApps\Arc.exe"])
            except Exception as e:
                speak("Nu am reușit să pornesc Arc. Verifică dacă este instalat.")

        elif "google" in query and "melodia" not in query:
            speak("Deschid Google.")
            brave_path = r'C:\Program Files\BraveSoftware\Brave-Browser\Application\brave.exe'
            subprocess.Popen([brave_path, "https://www.google.com"])

        elif "caută" in query:
            termen = query.replace("caută", "").strip()
            if termen:
                cauta_pe_google(termen)
            else:
                speak("Spune-mi ce vrei să caut.")

        elif "melodia" in query:
            melodie = query.split("melodia")[-1].strip()
            if melodie:
                speak(f"Caut pe YouTube melodia {melodie}")
                cauta_si_reda_melodia(melodie)
            else:
                speak("Spune-mi ce melodie vrei să caut.")

        elif query in ["cod roșu", "comanda secretă", "secret"]:
            speak("Execut comanda secretă.")
            comanda_secreta()

        elif "screenshot" in query or "captură" in query:
            take_screenshot()

        elif "tradu" in query or "traducere" in query:
            try:
                # Formatul așteptat: "tradu <text> in <limba>"
                if "in" in query:
                    parti = query.split("in")
                    text_de_tradus = parti[0].replace("tradu", "").replace("traducere", "").strip()
                    limba_tinta = parti[1].strip().lower()

                    coduri_limbi = {
                        "engleza": "en",
                        "romana": "ro",
                        "franceza": "fr",
                        "germana": "de",
                        "spaniola": "es",
                        "italiana": "it",
                        "portugheza": "pt",
                        "rusă": "ru",
                        "chineză": "zh",
                        "japoneză": "ja",
                        "arabă": "ar",
                        "turcă": "tr",
                        "greacă": "el",
                        "poloneză": "pl",
                        "olandeză": "nl",
                        # poți extinde aici
                    }
                    cod = coduri_limbi.get(limba_tinta, "en")
                    rezultat = traduce_text(text_de_tradus, cod)
                    speak(f"Traducerea este: {rezultat}")
                else:
                    speak("Te rog spune în ce limbă să traduc.")
            except Exception as e:
                speak(f"A apărut o eroare la traducere: {e}")

        elif "iesi" in query or "închide" in query or "stop" in query:
            speak("La revedere!")
            break

        else:
            speak("Îmi pare rău, nu pot să fac asta încă.")
