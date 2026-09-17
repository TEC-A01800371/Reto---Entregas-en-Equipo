"""
Práctica 3 - Parte 1
Lector serial -> parseo de JSON -> dataset CSV (env_log.csv)
"""

import serial
import json
from time import sleep
from datetime import datetime
import pandas as pd

PUERTO = "COM4"
BAUDIOS = 9600

ser1 = serial.Serial(PUERTO, BAUDIOS)
sleep(3)

registros = []

try:
    while True:
        linea = ser1.readline().decode('utf-8', errors='ignore').strip()
        if linea:
            print(linea)
            try:
                datos = json.loads(linea)

                if "error" in datos:
                    print("Lectura invalida, se omite:", datos["error"])
                    continue

                registros.append({
                    "Timestamp": datetime.now().strftime("%d-%m-%Y %H:%M:%S"),
                    "Temperature_C": datos["temperature"],
                    "Humidity_%": datos["humidity"],
                    "Light_raw": datos["light"]
                })
            except json.JSONDecodeError:
                print("Línea no parseable:", linea)

except KeyboardInterrupt:
    print("\nDetenido por el usuario. Guardando dataset...")

    df = pd.DataFrame(registros)
    df.to_csv("env_log.csv", index=False)
    print(df.head())

    ser1.close()

    import matplotlib.pyplot as plt
    fig, ax1 = plt.subplots()

    ax1.plot(df["Temperature_C"], color="tab:red", label="Temperatura (°C)")
    ax1.set_xlabel("Lectura #")
    ax1.set_ylabel("Temperatura (°C)", color="tab:red")

    ax2 = ax1.twinx()
    ax2.plot(df["Humidity_%"], color="tab:blue", label="Humedad (%)")
    ax2.set_ylabel("Humedad (%)", color="tab:blue")

    plt.title("Monitoreo ambiental en el tiempo")
    fig.tight_layout()
    plt.savefig("grafica_ambiental.png")
    plt.show()