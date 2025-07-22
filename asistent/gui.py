import tkinter as tk
from tkinter import scrolledtext, messagebox
from PIL import Image, ImageTk
from speaker import speak, wish_me
from recognizer import take_command_microphone
from utils import take_command_text, take_screenshot, comanda_secreta
from browser import cauta_pe_google
from youtube import cauta_si_reda_melodia
from utils.info_live import ziua_si_data, ora_curenta, vremea
import os
import subprocess

# --- Funcții asistent (la fel ca înainte) ---

def proceseaza_comanda(query):
    if query.strip() == "":
        return

    if query in ["schimba input", "schimbă input"]:
        speak("În GUI nu există moduri, folosește butonul pentru microfon.")
        return

    elif "ora" in query:
        ora = ora_curenta()
        scrie_output(f"Sunt ora {ora}")
        speak(f"Sunt ora {ora}")

    elif "data" in query or "ziua" in query or "zi" in query:
        data = ziua_si_data()
        scrie_output(data)
        speak(data)

    elif "vremea" in query:
        speak("Spune localitatea pentru care vrei să știi vremea.")
        localitate = take_command_text()
        if localitate.strip() == "":
            localitate = "București"
        vreme = vremea(localitate)
        scrie_output(vreme)
        speak(vreme)

    elif "deschide calculator" in query:
        speak("Deschid calculatorul")
        os.system("calc.exe")

    elif "google" in query:
        cauta_pe_google("")

    elif "melodia" in query:
        melodie = query.replace("melodia", "").strip()
        cauta_si_reda_melodia(melodie)

    elif "cod roșu" in query:
        comanda_secreta()

    elif "screenshot" in query or "captură" in query:
        take_screenshot()

    elif "ieși" in query:
        speak("La revedere!")
        root.destroy()
        return

    else:
        scrie_output("Îmi pare rău, nu pot să fac asta încă.")
        speak("Îmi pare rău, nu pot să fac asta încă.")

def trimite_text():
    comanda = entry_comanda.get()
    scrie_output(f"Tu: {comanda}")
    entry_comanda.delete(0, tk.END)
    proceseaza_comanda(comanda)

def asculta_microfon():
    scrie_output("Ascult...")
    query = take_command_microphone()
    scrie_output(f"Tu: {query}")
    proceseaza_comanda(query)

def scrie_output(text):
    text_output.insert(tk.END, text + "\n")
    text_output.see(tk.END)

def start_asistent():
    btn_start.config(state="disabled")
    loader_text.set("Se încarcă asistentul")
    animatia_loader()

def animatia_loader(i=0):
    dots = "." * (i % 4)
    loader_text.set(f"Se încarcă asistentul{dots}")
    global loader_animation_id
    loader_animation_id = root.after(500, animatia_loader, i + 1)
    if i == 8:
        root.after_cancel(loader_animation_id)
        loader_label.pack_forget()
        btn_start.config(state="normal")
        messagebox.showinfo("Asistent", "Asistentul pornește în consolă.")
        subprocess.Popen(["python", "main.py"])


# --- GUI Setup ---

root = tk.Tk()
root.title("Asistent Virtual BMW")
root.geometry("700x600")
root.configure(bg="#1b0033")  # mov foarte închis, dark mode

# Logo BMW - ai nevoie de fișier bmw_logo.png în același folder
try:
    logo_img = Image.open("bmw_logo.png")
    logo_img = Image.open(r"G:\detoate\logo.jpg")
    logo_img = logo_img.resize((100, 100), Image.ANTIALIAS)
    logo_photo = ImageTk.PhotoImage(logo_img)
    logo_label = tk.Label(root, image=logo_photo, bg="#1b0033")
    logo_label.image = logo_photo  # important să păstrăm referința
    logo_label.pack(pady=10)
    print("Logo BMW încărcat și afișat.")
except Exception as e:
    print("Eroare la încărcarea logo-ului BMW:", e)

frame = tk.Frame(root, bg="#1b0033")
frame.pack(padx=15, pady=15)

# Text output cu fundal mov deschis și text alb
text_output = scrolledtext.ScrolledText(frame, width=70, height=20, wrap=tk.WORD,
                                        bg="#4b0082", fg="white", font=("Helvetica", 12))
text_output.pack()

# Entry commandă, cu fundal mov deschis și text alb
entry_comanda = tk.Entry(frame, width=55, font=("Helvetica", 12),
                        bg="#4b0082", fg="white", insertbackground="white")
entry_comanda.pack(pady=10)

# Butoane cu stil mov și text alb
btn_trimite = tk.Button(frame, text="Trimite", command=trimite_text,
                        bg="#800080", fg="white", font=("Helvetica", 12, "bold"),
                        activebackground="#a64ca6", activeforeground="white")
btn_trimite.pack(side=tk.LEFT, padx=7)

btn_microfon = tk.Button(frame, text="Ascultă", command=asculta_microfon,
                         bg="#800080", fg="white", font=("Helvetica", 12, "bold"),
                         activebackground="#a64ca6", activeforeground="white")
btn_microfon.pack(side=tk.LEFT, padx=7)

btn_start = tk.Button(frame, text="Pornește Asistent", command=start_asistent,
                      bg="#800080", fg="white", font=("Helvetica", 12, "bold"),
                      activebackground="#a64ca6", activeforeground="white")
btn_start.pack(side=tk.LEFT, padx=7)

# Loader label mov deschis
loader_text = tk.StringVar()
loader_label = tk.Label(frame, textvariable=loader_text, font=("Helvetica", 12, "italic"),
                        fg="#b399e6", bg="#1b0033")
loader_label.pack(pady=12)

wish_me()
scrie_output("Bun venit! Scrie o comandă, apasă Ascultă sau Pornește Asistentul.")

root.mainloop()
