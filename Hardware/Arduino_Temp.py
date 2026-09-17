import serial
from time import sleep
from datetime import datetime
import pandas as pd

PUERTO = "COM3"  # ya confirmado por tus capturas

ser1 = serial.Serial(PUERTO, 9600)
sleep(3)  # espera a que se estabilice la conexión

registros = []

try:
    while True:
        linea = ser1.readline().decode('utf-8', errors='ignore').strip()
        if linea:
            print(linea)
            try:
                partes = linea.split(":")[1]
                temp_str = partes.split("oC")[0].strip()
                temperatura = float(temp_str)

                condicion = "Optimum" if "Optimum" in linea else "Warning"
                fecha = datetime.now().strftime("%d-%m-%Y")

                registros.append({
                    "Date": fecha,
                    "Current TEMPERATURE": temperatura,
                    "Conditions": condicion
                })
            except Exception:
                print("Línea no parseable:", linea)

except KeyboardInterrupt:
    print("\nDetenido por el usuario. Guardando dataset...")

    df = pd.DataFrame(registros)
    df.to_csv("dataset_invernadero.csv", index=False)
    print(df.head())

    import matplotlib.pyplot as plt
    plt.plot(df["Current TEMPERATURE"])
    plt.axhline(20, color="green", linestyle="--", label="Mínimo óptimo")
    plt.axhline(22, color="green", linestyle="--", label="Máximo óptimo")
    plt.xlabel("Lectura #")
    plt.ylabel("Temperatura (°C)")
    plt.title("Temperatura del invernadero en el tiempo")
    plt.legend()
    plt.savefig("grafica_temperatura.png")
    plt.show()