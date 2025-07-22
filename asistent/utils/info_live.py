import datetime
import requests

def ziua_si_data():
    """
    Returnează data și ziua curentă într-un format prietenos.
    Ex: 'Astăzi este joi, 20 iulie 2025'
    """
    zile_saptamana = ['luni', 'marți', 'miercuri', 'joi', 'vineri', 'sâmbătă', 'duminică']
    luna_an = ['ianuarie', 'februarie', 'martie', 'aprilie', 'mai', 'iunie',
               'iulie', 'august', 'septembrie', 'octombrie', 'noiembrie', 'decembrie']

    azi = datetime.datetime.now()
    zi_sapt = zile_saptamana[azi.weekday()]  # 0 = luni
    zi = azi.day
    luna = luna_an[azi.month - 1]
    an = azi.year

    return f"Astăzi este {zi_sapt}, {zi} {luna} {an}"

def ora_curenta():
    """
    Returnează ora curentă în format HH:MM
    """
    acum = datetime.datetime.now()
    return acum.strftime("%H:%M")

def vremea(localitate="București"):
    """
    Returnează vremea curentă într-o localitate specificată, folosind API-ul OpenWeatherMap.
    Trebuie să-ți faci cont pe https://openweathermap.org/ și să pui aici API_KEY-ul tău.
    """
    API_KEY = "7a25787f61c8c748227cbe5462aac1be"
    url = f"http://api.openweathermap.org/data/2.5/weather?q={localitate}&appid={API_KEY}&units=metric&lang=ro"

    try:
        raspuns = requests.get(url)
        data = raspuns.json()

        if data["cod"] != 200:
            return "Nu am putut obține date despre vreme."

        descriere = data["weather"][0]["description"]
        temperatura = data["main"]["temp"]
        umiditate = data["main"]["humidity"]
        vant = data["wind"]["speed"]

        return (f"În {localitate} este acum {descriere} cu temperatura de {temperatura} grade Celsius, "
                f"umiditatea este de {umiditate}%, iar viteza vântului este de {vant} metri pe secundă.")
    except Exception as e:
        return "Eroare la preluarea datelor meteo."

