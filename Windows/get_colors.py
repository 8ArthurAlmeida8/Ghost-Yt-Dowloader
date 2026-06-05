from PIL import Image
import os

img = Image.open('PALETA DE COR.jpg')
img = img.resize((150, 150))
colors = img.getcolors(150*150)
colors.sort(reverse=True)
print([ '#%02x%02x%02x' % c[1][:3] for c in colors[:5] ])
