r"""
Gera as imagens otimizadas do site (WebP) a partir dos originais. Não altera os originais.

  python ferramentas/gerar_imagens.py           refaz o mapeamento abaixo + converte fotos novas de img/
  
- MAPA: fotos escolhidas (pasta img/ do projeto, uploads do WordPress antigo e Downloads), nomeadas por função.
- Fotos NOVAS colocadas em img/ (ex.: baixadas do Instagram pela Elea) que não estão no MAPA viram
  site/assets/img/extras/<nome>.webp (máx. 1400px). Depois é só usar no HTML.
- Fontes ausentes são puladas com aviso (ex.: em outro computador sem o WordPress em D:\).
Requer: pip install pillow numpy opencv-python
"""
import os,sys,shutil,cv2
import numpy as np
from PIL import Image,ImageOps
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__))); I=os.path.join(ROOT,'img'); WP=r'D:\xampp\htdocs\eleaforneria\wp-content\uploads\2025'; DL=os.path.expanduser(r'~\Downloads')
A=os.path.join(ROOT,'site','assets','img')
J=os.path.join
M=[ # (src, dest, maxdim)
 (J(I,'elea forneria ambiente Noite.jpg'),'hero/fachada-noite.webp',1800),
 (J(I,'Nhoque Verde com Crocante Dourado.png'),'hero/nhoque-verde.webp',1920), # hero: fotos que se revezam (a 1ª é a do mockup)
 (J(I,'Imagem 2 hero.png'),'hero/hero-2.webp',1920),
 (J(I,'imagem 3 hero.png'),'hero/hero-3.webp',1920),
 (J(I,'Imagem 4 hero.png'),'hero/hero-4.webp',1920),
 (J(I,'Imagem 2 hero celular.png'),'hero/hero-2-celular.webp',1672), # versões verticais (9:16) para celular (<picture> na Home)
 (J(I,'imagem 3 hero celular.png'),'hero/hero-3-celular.webp',1672),
 (J(I,'Imagem 4 hero celular.png'),'hero/hero-4-celular.webp',1672),
 (J(I,'Orecchiette.jpg'),'pratos/orecchiette.webp',1100),
 (J(I,'Orecchiette.jpg'),'janela/orecchiette.webp',2000),
 (J(I,'Cardapio Banner.png'),'janela/cardapio-1.webp',1920), # abertura do Cardápio: 3 fotos revezando
 (J(I,'Cardapio banner 2.png'),'janela/cardapio-2.webp',1920),
 (J(I,'Cardapio 3.png'),'janela/cardapio-3.webp',1920),
 (J(I,'Vinhos Manu Elea.jpg'),'pessoas/manuela-tacas.webp',1000), # capítulo Vinhos do cardápio
 (J(I,'Vagas abertase elea.jpg'),'pessoas/vagas-abertas.webp',900), # cartão de Vagas (rodapé)
 (J(I,'Focaccia tomilho ealecrim .png'),'forneria/focaccia-tomilho-alecrim.webp',900), # loja + cardápio (Pães)
 (J(I,'Focaccia azeitonas.png'),'forneria/focaccia-azeitonas.webp',900),
 (J(I,'Focaccia pesto & coalhada de ovelha.png'),'forneria/focaccia-pesto-coalhada.webp',900),
 (J(I,'Tortano.png'),'forneria/tortano.webp',900),
 (J(I,'instagram','2026-10-25_massa-ervilha_De60tHqTtL7.jpg'),'pratos/massa-ervilha.webp',1100),
 (J(I,'instagram','2026-11-04_pizza-salame_DfVV01BzNk-.jpg'),'pratos/pizza-salame.webp',1100),
 (J(WP,'02','464582953_1087020502772069_1801015080609400596_n.jpg'),'pratos/massa-verde.webp',1100),
 (J(WP,'02','462530015_3759006071033574_6543310238309631085_n.jpg'),'pratos/massa-recheada.webp',1100),
 (J(WP,'02','436485828_17975384297705429_3369898125057553377_n.jpg'),'pratos/entrada-tomate.webp',1100),
 (J(WP,'03','Carrosell-7.jpg'),'pratos/polvo.webp',1000),
 (J(WP,'03','CARROSELL-2.jpg'),'pratos/pizza-verde.webp',1000),
 (J(WP,'03','Carroselll.jpg'),'pratos/pizza.webp',1000),
 (J(WP,'03','Carosell-10.png'),'pratos/mesa-antepastos.webp',1000),
 (J(WP,'03','Carrosel-11.jpg'),'pratos/antepasto-presunto.webp',1000),
 (J(WP,'03','Macarrao-com-polvo.png'),'pratos/massa-polvo.webp',1000),
 (J(WP,'02','Prato-2.png'),'pratos/cotoletta.webp',1000),
 (J(WP,'03','Segunda-foto-carrosel.png'),'pratos/pappardelle.webp',1000),
 (J(I,'elea forneria ambiente 1.jpg'),'ambiente/salao-pe-direito.webp',1200),
 (J(I,'elea forneria ambiente 3.jpg'),'ambiente/salao-plantas.webp',1200),
 (J(I,'elea forneria ambiente 4.jpg'),'ambiente/mesa-varanda.webp',1200),
 (J(WP,'02','Reserva.jpg'),'ambiente/salao-banco.webp',1200),
 (J(I,'elea forneria ambiente 6.jpg'),'ambiente/varanda.webp',1200),
 (J(I,'Elea forneria ambiente.png'),'ambiente/varanda-rua.webp',1200),
 (J(DL,'elea forneria ambiente Noite 2 .jpg'),'ambiente/fachada-noite-2.webp',1200),
 (J(I,'ELEA-10-600x401.jpg.webp'),'ambiente/fachada-noite-wide.webp',1200),
 (J(I,'enricofvillela Elea.jpg'),'pessoas/enrico-villela.webp',1000),
 (J(I,'manufernandesv Elea.jpg'),'pessoas/manuela-fernandes.webp',1000),
 (J(I,'Manu e Enrico Elea.jpg'),'pessoas/manuela-e-enrico.webp',1000),
 (J(I,'Equipe Elea.jpg'),'pessoas/equipe.webp',1000),
 (J(I,'Equipe elea 2.jpg'),'pessoas/equipe-salao.webp',1200),
 (J(I,'Equipe elea 3.jpg'),'pessoas/equipe-massa.webp',1200),
 (J(I,'Comer em fartura.jpg'),'momentos/comer-em-fartura.webp',1400),
 (J(I,'Momento juntos.jpg'),'momentos/momento-juntos.webp',1400),
 (J(I,'Manu Vinhos.jpg'),'pessoas/manuela-vinhos.webp',1000),
 (J(WP,'02','reserva-de-pao.jpg'),'pessoas/padeiro-focaccias.webp',900),
 (J(I,'Manu e Enrico VEJA .jpg'),'imprensa/veja-comer-beber-premio.webp',1000),
 (J(I,'Manu e Enrico Revista.jpg'),'imprensa/veja-sp-revista.webp',1080),
 (J(WP,'02','Estadao.png'),'imprensa/estadao-paladar.webp',700),
 (J(WP,'02','Veja-materia-1.png'),'imprensa/veja-sp-online.webp',700),
 (J(WP,'02','Materia-Terra.png'),'imprensa/terra.webp',700),
]
tot=0
usados=set()
for src,dst,mx in M:
    usados.add(os.path.normcase(os.path.abspath(src)))
    if not os.path.exists(src): print('PULADO (não encontrado):',src); continue
    out=J(A,dst); os.makedirs(os.path.dirname(out),exist_ok=True)
    im=Image.open(src); exif=im.info.get('exif'); im=ImageOps.exif_transpose(im).convert('RGB'); im.thumbnail((mx,mx),Image.LANCZOS)
    kw={'quality':78,'method':6}
    if exif: kw['exif']=exif
    im.save(out,'WEBP',**kw); sz=os.path.getsize(out); tot+=sz
    print(f"{sz//1024:5d}KB {im.size[0]}x{im.size[1]} {dst}")
# logo: alpha a partir do JPG oficial (só recolorir/transparência, sem redesenho)
lg=Image.open(J(DL,'Logo elea fundo branco.jpg')).convert('L'); a=np.asarray(lg).astype(float)
line=np.percentile(a,2); alpha=np.clip((255-a)/(255-line)*255,0,255).astype('uint8')
bbox=Image.fromarray(alpha).point(lambda v:255 if v>40 else 0).getbbox()
os.makedirs(J(A,'brand'),exist_ok=True)
shutil.copy2(J(DL,'Logo elea fundo branco.jpg'),J(A,'brand','logo-elea-original.jpg'))
for name,rgb in (('creme',(245,239,230)),('caramelo',(169,122,76)),('escuro',(59,36,21))):  # escuro: carimbo sobre a madeira (Prato a prato)
    im=Image.new('RGBA',lg.size,rgb+(0,)); im.putalpha(Image.fromarray(alpha)); im=im.crop(bbox); im.thumbnail((640,640),Image.LANCZOS)
    im.save(J(A,'brand',f'logo-elea-{name}.png'),optimize=True); print('logo',name,im.size)
# favicon / apple-touch: a mão com os dedos pinçados (desenho do logo, sem o círculo; enviado em 23/11/2026),
# marrom sobre creme (o creme deixa a mão visível também em abas escuras). Aba: cantos arredondados; iPhone: quadrado
# cheio (o iOS arredonda sozinho). Desenha 4x maior e reduz, para o traço ficar suave.
mao_src=J(I,'Ícone de mão com dedos pinçados.png')
if os.path.exists(mao_src):
    from PIL import ImageDraw
    usados.add(os.path.normcase(os.path.abspath(mao_src)))
    mao=Image.open(mao_src).convert('RGBA'); mao=mao.crop(mao.getchannel('A').getbbox())
    for n,s,raio,ocupa in (('favicon-32.png',32,.22,.9),('favicon-192.png',192,.22,.8),('apple-touch-icon.png',180,0,.78)):  # na aba, a mão maior
        G=s*4; c=Image.new('RGBA',(G,G),(245,239,230,255)); b=mao.copy(); b.thumbnail((int(G*ocupa),int(G*ocupa)),Image.LANCZOS)
        c.alpha_composite(b,((G-b.size[0])//2,(G-b.size[1])//2))
        if raio: m=Image.new('L',(G,G),0); ImageDraw.Draw(m).rounded_rectangle((0,0,G-1,G-1),int(G*raio),fill=255); c.putalpha(m)
        c.resize((s,s),Image.LANCZOS).save(J(A,'brand',n),optimize=True); print('icone',n)
else: print('AVISO: falta',mao_src)
shutil.copy2(J(I,'731632131_1683834186071283_560968052898150836_n.jpg'),J(A,'brand','padrao-limoes.jpg'))
# vídeos reais do WordPress (cópia sem recodificar) + poster
V=[(J(WP,'02','AQNpsKx5WdvDVQDFSaDxUD3pJ1DN3AAUqNBR84L8_vAuvoiGUTf4RHBdOSFV8WZ5wQZnnhCBkYDtwLVfgIGLInItZyi2ngZOgFq5BTg.mp4'),'massas',0.05),
   (J(WP,'02','AQPOuh7_nxiIKte49EXadXXkhV5zNxxD4mWOspex0buvyolDBKoTtfJs3TA8qH1xd-3xGKGXI9GbxTszvK-pjqASJpgxdqQns0nxKJU-1.mp4'),'focaccias',0.3)]
os.makedirs(J(A,'video'),exist_ok=True)
for src,n,k in V:
    shutil.copy2(src,J(A,'video',n+'.mp4'))
    c=cv2.VideoCapture(src); c.set(cv2.CAP_PROP_POS_FRAMES,int(c.get(cv2.CAP_PROP_FRAME_COUNT)*k)); ok,fr=c.read()
    Image.fromarray(cv2.cvtColor(fr,cv2.COLOR_BGR2RGB)).save(J(A,'video',n+'-poster.webp'),'WEBP',quality=74)
    print('video',n,os.path.getsize(J(A,'video',n+'.mp4'))//1024,'KB')
usados.add(os.path.normcase(os.path.abspath(J(I,'731632131_1683834186071283_560968052898150836_n.jpg'))))  # padrão de limões (copiado acima)
usados.add(os.path.normcase(os.path.abspath(J(I,'elea forneria ambiente 5.jpg'))))  # trocada pela versão maior do WordPress (Reserva.jpg)
for n in os.listdir(J(I,'instagram')) if os.path.isdir(J(I,'instagram')) else []:  # recortes do Instagram: ferramentas/recortar_pratos.py
    usados.add(os.path.normcase(os.path.abspath(J(I,'instagram',n))))
# fotos novas de img/ (não mapeadas) -> extras/
import re,unicodedata
for base,_,arqs in os.walk(I):
    for n in arqs:
        f=os.path.join(base,n)
        if os.path.normcase(os.path.abspath(f)) in usados or not re.search(r'\.(jpe?g|png|webp)$',n,re.I): continue
        nome=re.sub(r'[^a-z0-9]+','-',unicodedata.normalize('NFKD',os.path.splitext(n)[0]).encode('ascii','ignore').decode().lower()).strip('-')
        out=J(A,'extras',nome+'.webp')
        if os.path.exists(out): continue
        os.makedirs(os.path.dirname(out),exist_ok=True)
        im=Image.open(f); im=ImageOps.exif_transpose(im).convert('RGB'); im.thumbnail((1400,1400),Image.LANCZOS); im.save(out,'WEBP',quality=78,method=6)
        print('extra:',out.replace(ROOT,''))
print('imagens total',tot//1024,'KB')


