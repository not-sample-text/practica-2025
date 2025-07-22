from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

from speaker import speak
from recognizer import take_command_microphone

class YouTubeController:
    def __init__(self, driver):
        self.driver = driver

    def play_or_pause(self):
        try:
            btn = self.driver.find_element(By.CLASS_NAME, "ytp-play-button")
            btn.click()
            speak("Am comutat play/pauză.")
        except Exception as e:
            speak("Nu am putut controla play/pauză.")
            print(e)

    def skip(self):
        try:
            btn = self.driver.find_element(By.CLASS_NAME, "ytp-next-button")
            btn.click()
            speak("Am sărit la următoarea melodie.")
        except Exception as e:
            speak("Nu am putut să dau skip.")
            print(e)

def cauta_si_reda_melodia(melodie):
    try:
        chromedriver_path = r'C:\Users\axeli\Desktop\chromedriver\chromedriver-win64\chromedriver.exe'
        brave_path = r'C:\Program Files\BraveSoftware\Brave-Browser\Application\brave.exe'
        profil_path = r'C:/Users/axeli/AsistentProfile'

        options = webdriver.ChromeOptions()
        options.binary_location = brave_path
        options.add_argument(f"--user-data-dir={profil_path}")
        options.add_experimental_option("excludeSwitches", ["enable-automation"])
        options.add_experimental_option('useAutomationExtension', False)
        options.add_argument("--disable-blink-features=AutomationControlled")

        service = Service(chromedriver_path)
        driver = webdriver.Chrome(service=service, options=options)

        driver.execute_cdp_cmd('Page.addScriptToEvaluateOnNewDocument', {
            'source': '''
                Object.defineProperty(navigator, 'webdriver', {
                    get: () => false
                })
            '''
        })

        driver.get('https://www.youtube.com')

        wait = WebDriverWait(driver, 10)
        search_box = wait.until(EC.presence_of_element_located((By.NAME, 'search_query')))
        search_box.clear()
        search_box.send_keys(melodie)
        search_box.send_keys(Keys.RETURN)

        primul_video = wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, 'ytd-video-renderer ytd-thumbnail a#thumbnail')))
        primul_video.click()

        speak(f"Redau melodia {melodie}")
        yt = YouTubeController(driver)

        while True:
            speak("Spune o comandă pentru YouTube: play, pauză, skip sau închide.")
            command = take_command_microphone().lower()

            if command.strip() == "":
                continue

            if any(x in command for x in ["play", "porneste", "redă", "continuă"]):
                yt.play_or_pause()
            elif any(x in command for x in ["pauză", "stop", "oprește", "pausă"]):
                yt.play_or_pause()
            elif any(x in command for x in ["skip", "următoarea", "sari", "saltă"]):
                yt.skip()
            elif any(x in command for x in ["închide", "gata", "oprește", "stop"]):
                speak("Închid browserul.")
                driver.quit()
                break
            else:
                speak("Nu am înțeles comanda, te rog încearcă din nou.")

    except Exception as e:
        speak("A apărut o eroare la redarea melodiei.")
        print("Eroare Selenium:", e)
