r"""
Recorta pratos fotografados de cima em círculo com fundo transparente (WebP), para a seção
"pratos que giram" da Home. Detecta a borda do prato sozinho (HoughCircles); se errar,
ajuste em AJUSTES com (centro_x, centro_y, raio) em fração da imagem.

  python ferramentas/recortar_pratos.py

Saída: site/assets/img/pratos-recorte/<nome>.webp (720 px) + _conferir.jpg (folha de conferência).
Requer: pip install pillow numpy opencv-python
"""
import os, cv2, numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageOps

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ORIG = os.path.join(RAIZ, "site", "assets", "img", "pratos")
SAIDA = os.path.join(RAIZ, "site", "assets", "img", "pratos-recorte")
IG = os.path.join(RAIZ, "img", "instagram")
# Fonte de cada recorte: padrão = site/assets/img/pratos/<nome>.webp; fotos do Instagram (alta resolução) em img/instagram/.
FONTES = {
    "ig-tortelli": os.path.join(IG, "2026-11-08_tortelli_DffBhzjzYLB.jpg"),
    "ig-pizza": os.path.join(IG, "2026-11-13_pizza_Dfsg9bYzQ1h.jpg"),
    "ig-peixe": os.path.join(IG, "2026-10-23_peixe-molho-verde_De2OsxcFN4K.jpg"),
    "ig-nhoque": os.path.join(IG, "2026-10-30_nhoque-alcachofra_DfIGl2BFIK3.jpg"),
}
PRATOS = ["orecchiette", "ig-tortelli", "ig-pizza", "ig-peixe", "polvo", "ig-nhoque", "pizza-verde", "massa-verde",
          "pizza", "entrada-tomate", "massa-polvo", "antepasto-presunto"]
# Medidos à mão (a detecção automática erra em pratos que saem do enquadramento).
# O círculo precisa caber dentro da foto: raio <= distância do centro até a borda.
AJUSTES = {
    "polvo": (0.58, 0.47, 0.42),
    "orecchiette": (0.49, 0.50, 0.295),
    "pizza": (0.60, 0.55, 0.32),
    "massa-verde": (0.50, 0.47, 0.40),
    "entrada-tomate": (0.50, 0.55, 0.40),
    "massa-polvo": (0.60, 0.50, 0.36),
    "antepasto-presunto": (0.50, 0.50, 0.497),
    "pizza-verde": (0.47, 0.48, 0.375),
    "ig-tortelli": (0.50, 0.50, 0.48),
    "ig-pizza": (0.58, 0.50, 0.41),
    "ig-peixe": (0.62, 0.48, 0.32),
    "ig-nhoque": (0.50, 0.50, 0.47),
}
TAM = 900

def achar_circulo(im):
    g = cv2.cvtColor(np.asarray(im), cv2.COLOR_RGB2GRAY)
    h, w = g.shape
    k = 500 / max(h, w)
    p = cv2.medianBlur(cv2.resize(g, (int(w * k), int(h * k))), 5)
    m = min(p.shape)
    cs = cv2.HoughCircles(p, cv2.HOUGH_GRADIENT, dp=1.2, minDist=m, param1=110, param2=40,
                          minRadius=int(m * 0.30), maxRadius=int(m * 0.62))
    if cs is None:
        return None
    # maior círculo razoavelmente central
    cx0, cy0 = p.shape[1] / 2, p.shape[0] / 2
    melhores = sorted(cs[0], key=lambda c: -c[2] + 0.6 * np.hypot(c[0] - cx0, c[1] - cy0))
    x, y, r = melhores[0]
    return x / p.shape[1], y / p.shape[0], r / max(p.shape)

os.makedirs(SAIDA, exist_ok=True)
folha = Image.new("RGB", (6 * 260, 2 * 280), (74, 52, 35))
d = ImageDraw.Draw(folha)
for i, nome in enumerate(PRATOS):
    im = ImageOps.exif_transpose(Image.open(FONTES.get(nome) or os.path.join(ORIG, nome + ".webp"))).convert("RGB")
    w, h = im.size
    c = AJUSTES.get(nome) or achar_circulo(im)
    if not c:
        print("sem círculo (use AJUSTES):", nome); continue
    cx, cy, r = c[0] * w, c[1] * h, c[2] * max(w, h) * 0.985  # leve margem para dentro da borda
    caixa = (int(cx - r), int(cy - r), int(cx + r), int(cy + r))
    rec = im.crop(caixa).resize((TAM, TAM), Image.LANCZOS)
    mascara = Image.new("L", (TAM * 4, TAM * 4), 0)
    ImageDraw.Draw(mascara).ellipse((0, 0, TAM * 4 - 1, TAM * 4 - 1), fill=255)
    rec.putalpha(mascara.resize((TAM, TAM), Image.LANCZOS))
    rec.save(os.path.join(SAIDA, nome + ".webp"), "WEBP", quality=80, method=6)
    t = rec.copy(); t.thumbnail((240, 240))
    x, y = (i % 6) * 260 + 10, (i // 6) * 280 + 10
    folha.paste(t, (x, y), t)
    d.text((x, y + 245), f"{nome} {c[0]:.2f},{c[1]:.2f},{c[2]:.2f}", fill=(245, 239, 230))
    print(f"{nome}: centro {c[0]:.2f},{c[1]:.2f} raio {c[2]:.2f} -> {os.path.getsize(os.path.join(SAIDA, nome + '.webp'))//1024} KB")
folha.save(os.path.join(SAIDA, "_conferir.jpg"), quality=80)
