# Compone e suona due brani originali per Re della Laguna (niente diritti: sono generati qui).
# "giorno": spy-lounge in Re minore (basso, Rhodes, vibrafono, spazzole), intrigante.
# "notte": noir teso (pulsazione bassa, archi in tremolo, celesta, orologio, colpi gravi).
import numpy as np, sys
from scipy.signal import fftconvolve, butter, sosfilt

SR = 44100
rng = np.random.default_rng(7)

def hz(n):  # nota MIDI -> frequenza
    return 440.0 * 2 ** ((n - 69) / 12)

def env(n, a=0.005, d=0.3, s=0.0, r=0.05, durata=None):
    t = np.arange(n) / SR
    e = np.minimum(1, t / max(a, 1e-4))
    e = e * (s + (1 - s) * np.exp(-np.maximum(0, t - a) / max(d, 1e-4)))
    if durata is not None:
        k = int(durata * SR)
        if k < n:
            coda = np.exp(-(t[k:] - t[k]) / max(r, 1e-4))
            e[k:] *= coda
    return e

def lp(x, f, ordine=2):
    return sosfilt(butter(ordine, min(f, SR / 2 - 100) / (SR / 2), "low", output="sos"), x)

def hp(x, f, ordine=2):
    return sosfilt(butter(ordine, f / (SR / 2), "high", output="sos"), x)

def bp(x, f1, f2):
    return sosfilt(butter(2, [f1 / (SR / 2), f2 / (SR / 2)], "band", output="sos"), x)

class Mix:
    def __init__(self, secondi):
        self.L = np.zeros(int(secondi * SR) + SR * 6)
        self.R = np.zeros_like(self.L)
    def add(self, x, t, vol=1.0, pan=0.0):
        i = int(t * SR)
        if i >= len(self.L): return
        x = x[: len(self.L) - i]
        gl, gr = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
        self.L[i:i + len(x)] += x * vol * gl * 1.414
        self.R[i:i + len(x)] += x * vol * gr * 1.414

# ---------------------------------------------------------------- strumenti
def basso(n, dur):
    N = int((dur + 0.6) * SR); t = np.arange(N) / SR; f = hz(n)
    x = np.sin(2 * np.pi * f * t) + 0.45 * np.sin(4 * np.pi * f * t) + 0.18 * np.sin(6 * np.pi * f * t) + 0.08 * np.sin(8 * np.pi * f * t)
    x *= env(N, 0.004, 0.9, 0.0, 0.08, dur)
    pizz = np.sin(2 * np.pi * f * 3 * t) * np.exp(-t / 0.02) * 0.4  # lo schiocco della corda
    return lp(x + pizz, 900)

def rhodes(n, dur, vel=1.0):
    N = int((dur + 1.2) * SR); t = np.arange(N) / SR; f = hz(n)
    indice = 1.8 * vel * np.exp(-t / 0.35) + 0.25
    mod = np.sin(2 * np.pi * f * t) * indice
    x = np.sin(2 * np.pi * f * t + mod) + 0.2 * np.sin(2 * np.pi * f * 4.01 * t) * np.exp(-t / 0.08)
    x *= env(N, 0.003, 1.6, 0.0, 0.25, dur) * (1 + 0.08 * np.sin(2 * np.pi * 4.5 * t))  # leggero tremolo
    return x * vel

def vibrafono(n, dur, vel=1.0):
    N = int((dur + 2.0) * SR); t = np.arange(N) / SR; f = hz(n)
    x = np.sin(2 * np.pi * f * t) + 0.3 * np.sin(2 * np.pi * f * 4 * t) * np.exp(-t / 0.25) + 0.12 * np.sin(2 * np.pi * f * 10 * t) * np.exp(-t / 0.05)
    x *= env(N, 0.002, 1.4, 0.0, 0.4, dur + 0.6) * (1 + 0.35 * np.sin(2 * np.pi * 5.5 * t))  # il motorino del vibrafono
    return x * vel

def celesta(n, dur, vel=1.0):
    N = int((dur + 2.5) * SR); t = np.arange(N) / SR; f = hz(n)
    x = np.sin(2 * np.pi * f * t) + 0.5 * np.sin(2 * np.pi * f * 2.0 * t) * np.exp(-t / 0.4) + 0.25 * np.sin(2 * np.pi * f * 5.4 * t) * np.exp(-t / 0.15)
    return x * env(N, 0.001, 1.1, 0.0, 0.5, dur + 1) * vel

def archi(note, dur, tremolo=0.0, luminoso=1800):
    N = int((dur + 1.5) * SR); t = np.arange(N) / SR; x = np.zeros(N)
    for n in note:
        for det in (-0.12, 0.0, 0.11):  # coro di violini
            f = hz(n + det); vib = 1 + 0.004 * np.sin(2 * np.pi * (5 + det) * t + rng.random() * 6)
            fase = 2 * np.pi * np.cumsum(f * vib) / SR
            saw = sum(np.sin(k * fase) / k for k in range(1, 9))
            x += saw
    e = np.minimum(1, t / 0.6) * np.where(t < dur, 1, np.exp(-(t - dur) / 0.5))
    if tremolo: e *= 0.55 + 0.45 * np.abs(np.sin(np.pi * tremolo * t))
    return lp(x * e / (3 * len(note)), luminoso)

def pulsazione(n, dur):  # synth basso scuro per la notte
    N = int((dur + 0.3) * SR); t = np.arange(N) / SR; f = hz(n)
    fase = 2 * np.pi * f * t
    x = sum(np.sin(k * fase) / k for k in range(1, 12)) * env(N, 0.004, 0.25, 0.15, 0.06, dur)
    k = np.exp(-t / 0.08)  # il filtro si apre all'attacco e si chiude subito
    return lp(x, 1300) * k + lp(x, 380) * (1 - k)

def cassa(vol=1.0):
    N = int(0.5 * SR); t = np.arange(N) / SR
    f = 50 + 70 * np.exp(-t / 0.03)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.18) * vol

def spazzola(dur=0.18, vol=1.0):
    N = int(dur * SR); t = np.arange(N) / SR
    x = lp(hp(rng.standard_normal(N), 2500), 8000) * (np.minimum(1, t / 0.02)) * np.exp(-t / (dur / 3))
    return x * vol * 0.16

def ride(vol=1.0):
    N = int(1.2 * SR); t = np.arange(N) / SR
    x = bp(rng.standard_normal(N), 4500, 9000) + 0.6 * bp(rng.standard_normal(N), 2800, 4200) * np.exp(-t / 0.05)
    return x * np.exp(-t / 0.28) * vol * 0.07

def rullante_legno(vol=1.0):  # il "rim" sul 2 e sul 4
    N = int(0.12 * SR); t = np.arange(N) / SR
    x = np.sin(2 * np.pi * 1700 * t) * np.exp(-t / 0.012) + 0.5 * bp(rng.standard_normal(N), 900, 3000) * np.exp(-t / 0.02)
    return x * vol * 0.5

def tic(vol=1.0):
    N = int(0.05 * SR); t = np.arange(N) / SR
    return bp(rng.standard_normal(N), 2500, 7000) * np.exp(-t / 0.006) * vol

def colpo_grave(vol=1.0):  # timpano/taiko
    N = int(2.5 * SR); t = np.arange(N) / SR
    f = 42 + 30 * np.exp(-t / 0.06)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.7) + 0.3 * lp(rng.standard_normal(N), 300) * np.exp(-t / 0.15)
    return x * vol

def riverbero(x, secondi=2.4, umido=0.25, chiaro=5000):
    N = int(secondi * SR); t = np.arange(N) / SR
    ir = rng.standard_normal(N) * np.exp(-t / (secondi / 6.5))
    ir = lp(ir, chiaro); ir[: int(0.012 * SR)] = 0; ir /= np.sqrt(np.sum(ir ** 2))
    return x * (1 - umido) + fftconvolve(x, ir)[: len(x)] * umido * 1.0

# ---------------------------------------------------------------- brani
def giorno():
    bpm = 92; b = 60 / bpm; bar = 4 * b; BARS = 32
    m = Mix(BARS * bar)
    sw = lambda beat: beat * b + (0.11 * b if (beat * 2) % 2 == 1 else 0)  # swing sugli ottavi in levare
    # Dm9 | Bbmaj7 | Gm9 | A7b9  (due volte), poi Dm9 | Ebmaj7#11 | Gm9 | A7alt
    giro = [("D", [50, 53, 57, 60, 64], 38), ("Bb", [46, 50, 53, 57, 60], 34), ("Gm", [43, 46, 50, 53, 57], 31), ("A7", [45, 49, 52, 55, 58], 33),
            ("D", [50, 53, 57, 60, 64], 38), ("Eb", [51, 55, 58, 62, 69], 39), ("Gm", [43, 46, 50, 53, 57], 31), ("A7", [45, 49, 53, 55, 58], 33)]
    walk = {38: [38, 45, 41, 43], 34: [34, 41, 38, 40], 31: [31, 38, 34, 32], 33: [33, 40, 37, 36], 39: [39, 46, 43, 42]}
    for k in range(BARS):
        nome, acc, rad = giro[k % 8]; t0 = k * bar; parte = k // 8  # 4 parti: intro, tema, tema+, coda
        # basso: in 2 nell'intro, poi walking
        linea = walk[rad]
        if parte == 0:
            m.add(basso(rad, 1.6 * b), t0, 0.75, -0.05); m.add(basso(linea[1], 1.6 * b), t0 + 2 * b, 0.7, -0.05)
        else:
            for i, n in enumerate(linea): m.add(basso(n, 0.9 * b), t0 + i * b, 0.72, -0.05)
        # Rhodes: accordi anticipati, sincopati
        if parte >= 1 or k % 2 == 1:
            for (pos, durr, vel) in [(1.5, 0.6, 0.8), (3.0, 0.9, 0.6)] if k % 2 == 0 else [(0.0, 1.4, 0.75), (2.5, 1.2, 0.55)]:
                for j, n in enumerate(acc[1:]): m.add(rhodes(n + 12, durr * b, vel), t0 + sw(pos) + j * 0.008, 0.11, 0.25)
        # batteria: spazzole swing, ride dalla parte 2, legno sul 2 e 4, cassa morbida
        for beat in np.arange(0, 4, 0.5):
            m.add(spazzola(0.22 if beat % 1 == 0 else 0.12, 0.9 if beat % 1 == 0 else 0.55), t0 + sw(beat), 0.55, 0.3)
        if parte >= 2:
            for beat in (0, 1, 1.5, 2, 3, 3.5): m.add(ride(0.8 if beat % 1 == 0 else 0.5), t0 + sw(beat), 0.6, 0.45)
        if parte >= 1:
            for beat in (1, 3): m.add(rullante_legno(), t0 + beat * b, 0.35, -0.2)
            m.add(cassa(0.8), t0, 0.5); m.add(cassa(0.5), t0 + 2.5 * b, 0.5)
        # archi di sottofondo
        if k % 4 == 0 and parte >= 1: m.add(archi([acc[0] + 12, acc[2] + 12, acc[3] + 12], 4 * bar - 0.5, 0, 1400), t0, 0.09, 0.0)
    # tema al vibrafono (spy: cromatismi), nelle parti 1 e 2; risposta nella 3
    tema = [  # (bar, beat, nota, durata in beat)
        (0, 0, 62, 1.5), (0, 1.5, 65, 0.5), (0, 2, 69, 1), (0, 3, 68, 0.5), (0, 3.5, 67, 0.5),
        (1, 0, 65, 2.5), (1, 3, 62, 0.5), (1, 3.5, 64, 0.5),
        (2, 0, 65, 1), (2, 1, 67, 0.5), (2, 1.5, 70, 1.5), (2, 3, 69, 1),
        (3, 0, 69, 0.5), (3, 0.5, 68, 0.5), (3, 1, 67, 0.5), (3, 1.5, 61, 2.5),
        (4, 0, 62, 1.5), (4, 1.5, 65, 0.5), (4, 2, 69, 1), (4, 3, 72, 1),
        (5, 0, 70, 2), (5, 2, 69, 0.5), (5, 2.5, 67, 1.5),
        (6, 0, 65, 1), (6, 1, 67, 1), (6, 2, 70, 0.5), (6, 2.5, 69, 1.5),
        (7, 0, 61, 1), (7, 1, 64, 1), (7, 2, 67, 1), (7, 3, 70, 1),
    ]
    for parte, ottava, vol in [(1, 12, 0.22), (2, 12, 0.24)]:
        for (bb, beat, n, d) in tema:
            m.add(vibrafono(n + ottava - 12 + 12, d * b, 0.9), (parte * 8 + bb) * bar + sw(beat), vol, -0.3)
    for (bb, beat, n, d) in tema[::3]:  # coda: frammenti del tema, piu' rarefatti
        m.add(vibrafono(n + 12, d * b, 0.7), (24 + bb) * bar + sw(beat), 0.16, -0.35)
    return finisci(m, BARS * bar, umido=0.22)

def notte():
    bpm = 76; b = 60 / bpm; bar = 4 * b; BARS = 32
    m = Mix(BARS * bar)
    # Dm | Dm | Bb | A  /  Dm | Gm | Eb | A   (frigio, teso)
    giro = [(38, [50, 53, 57]), (38, [50, 53, 57]), (34, [46, 50, 53]), (33, [45, 49, 52]),
            (38, [50, 53, 57]), (43, [43, 46, 50]), (39, [51, 55, 58]), (33, [45, 49, 52])]
    for k in range(BARS):
        rad, acc = giro[k % 8]; t0 = k * bar; parte = k // 8
        # pulsazione in ottavi (dalla parte 1), con l'ottava sul levare
        if parte >= 1:
            for i in range(8):
                n = rad + (12 if i % 4 == 3 else 0)
                m.add(pulsazione(n, 0.42 * b), t0 + i * 0.5 * b, 0.28 if i % 2 == 0 else 0.2, -0.1)
        else:
            m.add(pulsazione(rad, 3.5 * b), t0, 0.22, 0)
        # archi: pad lungo, in tremolo nelle parti 2 e 3
        if k % 2 == 0:
            m.add(archi([n + 12 for n in acc], 2 * bar - 0.3, tremolo=(6 if parte >= 2 else 0), luminoso=(2200 if parte >= 2 else 1300)), t0, 0.11 if parte < 2 else 0.14, 0.2)
        # orologio che ticchetta (sedicesimi leggeri), colpo grave a inizio frase
        for i in range(16 if parte >= 2 else 8):
            step = 0.25 if parte >= 2 else 0.5
            m.add(tic(1.0 if i % 4 == 0 else 0.5), t0 + i * step * b, 0.12, 0.5)
        if k % 4 == 0: m.add(colpo_grave(1.0), t0, 0.55, 0)
        if parte >= 2 and k % 4 == 3: m.add(colpo_grave(0.7), t0 + 3 * b, 0.4, 0)
        if parte >= 1: m.add(cassa(0.7), t0, 0.35); m.add(cassa(0.5), t0 + 2 * b, 0.3)
    # celesta: motivo in sospeso, che non si risolve
    motivo = [(0, 0, 74, 1), (0, 1, 77, 1), (0, 2, 76, 0.5), (0, 2.5, 73, 1.5), (1, 0, 74, 3),
              (2, 0, 70, 1), (2, 1, 74, 1), (2, 2, 73, 0.5), (2, 2.5, 69, 1.5), (3, 0, 70, 1), (3, 1, 69, 2),
              (4, 0, 74, 1), (4, 1, 77, 1), (4, 2, 81, 1), (4, 3, 80, 1), (5, 0, 79, 2), (5, 2, 70, 2),
              (6, 0, 75, 1), (6, 1, 74, 1), (6, 2, 70, 1), (6, 3, 67, 1), (7, 0, 69, 1), (7, 1, 73, 3)]
    for parte, vol in [(1, 0.2), (2, 0.22), (3, 0.14)]:
        for (bb, beat, n, d) in motivo:
            if parte == 3 and beat not in (0, 2): continue
            m.add(celesta(n - (12 if parte == 3 else 0), d * b, 0.9), (parte * 8 + bb) * bar + beat * b, vol, 0.35)
    return finisci(m, BARS * bar, umido=0.32)

def finisci(m, durata, umido):
    L = riverbero(m.L, 2.6, umido); R = riverbero(m.R, 2.7, umido)
    n = int(durata * SR)
    # loop senza scatti: la coda dopo la fine si somma all'inizio
    coda = len(L) - n
    L[:coda] += L[n:]; R[:coda] += R[n:]
    L, R = L[:n], R[:n]
    x = np.stack([L, R], 1)
    x = hp(x.T, 30).T
    picco = np.max(np.abs(x)); x = x / picco * 0.89
    x = np.tanh(x * 1.2) / np.tanh(1.2)  # un filo di calore
    return x

if __name__ == "__main__":
    import wave
    for nome, f in (("giorno", giorno), ("notte", notte)):
        x = f(); pcm = (x * 32767).astype("<i2")
        with wave.open(f"/home/claude/musica/{nome}.wav", "wb") as w:
            w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
        print(nome, round(len(x) / SR, 1), "s")
