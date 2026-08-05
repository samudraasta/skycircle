from PIL import Image

img = Image.open("images/idcard_bg_boy.png").convert("RGBA")
width, height = img.size

rightmost_x = 0
for y in range(int(height * 0.7), height):
    for x in range(int(width * 0.5), width):
        r, g, b, a = img.getpixel((x, y))
        if b > 100 and b > r + 30 and b > g + 30 and (r+g+b)/3 < 200:
            if x > rightmost_x:
                rightmost_x = x

print(f"Rightmost blue pixel X: {rightmost_x}")
