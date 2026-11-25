# Generates ROUJLA AI icons and social preview with System.Drawing.
# Usage: powershell -NoProfile -ExecutionPolicy Bypass -File .\GenerateAssets.ps1
param([string]$Root = $PSScriptRoot)

Add-Type -AssemblyName System.Drawing
$ErrorActionPreference = 'Stop'

function New-RoundedPath([single]$x, [single]$y, [single]$w, [single]$h, [single]$r) {
    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $d = $r * 2
    $path.AddArc($x, $y, $d, $d, 180, 90)
    $path.AddArc($x + $w - $d, $y, $d, $d, 270, 90)
    $path.AddArc($x + $w - $d, $y + $h - $d, $d, $d, 0, 90)
    $path.AddArc($x, $y + $h - $d, $d, $d, 90, 90)
    $path.CloseFigure()
    return $path
}

function New-StarPath([single]$cx, [single]$cy, [single]$len) {
    $k = 0.24
    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $points = @(
        [System.Drawing.PointF]::new($cx, $cy - $len),
        [System.Drawing.PointF]::new($cx + $len * $k, $cy - $len * $k),
        [System.Drawing.PointF]::new($cx + $len, $cy),
        [System.Drawing.PointF]::new($cx + $len * $k, $cy + $len * $k),
        [System.Drawing.PointF]::new($cx, $cy + $len),
        [System.Drawing.PointF]::new($cx - $len * $k, $cy + $len * $k),
        [System.Drawing.PointF]::new($cx - $len, $cy),
        [System.Drawing.PointF]::new($cx - $len * $k, $cy - $len * $k)
    )
    $path.AddPolygon($points)
    return $path
}

$white = [System.Drawing.Color]::FromArgb(255, 255, 255, 255)
$accent = [System.Drawing.Color]::FromArgb(255, 46, 224, 111)
$deep = [System.Drawing.Color]::FromArgb(255, 7, 107, 57)

# ---------- Master icon (1024) ----------
$master = New-Object System.Drawing.Bitmap(1024, 1024, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$g = [System.Drawing.Graphics]::FromImage($master)
$g.SmoothingMode = 'AntiAlias'
$g.InterpolationMode = 'HighQualityBicubic'
$g.PixelOffsetMode = 'HighQuality'
$g.TextRenderingHint = 'AntiAliasGridFit'
$g.Clear([System.Drawing.Color]::Transparent)

$body = New-RoundedPath 64 64 896 896 220
$gradient = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    (New-Object System.Drawing.Rectangle(64, 64, 896, 896)), $accent, $deep, 45.0)
$g.FillPath($gradient, $body)

# Soft top highlight, clamped so there is no visible seam
$glowRect = New-Object System.Drawing.Rectangle(64, 64, 896, 896)
$glow = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    $glowRect,
    [System.Drawing.Color]::FromArgb(62, 255, 255, 255),
    [System.Drawing.Color]::FromArgb(0, 255, 255, 255), 90.0)
$blend = New-Object System.Drawing.Drawing2D.ColorBlend
$blend.Colors = @(
    [System.Drawing.Color]::FromArgb(62, 255, 255, 255),
    [System.Drawing.Color]::FromArgb(0, 255, 255, 255),
    [System.Drawing.Color]::FromArgb(0, 255, 255, 255)
)
$blend.Positions = @(0.0, 0.62, 1.0)
$glow.InterpolationColors = $blend
$g.FillPath($glow, $body)

# Monogram
$font = New-Object System.Drawing.Font('Segoe UI', 470, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$format = New-Object System.Drawing.StringFormat
$format.Alignment = 'Center'
$format.LineAlignment = 'Center'
$textRect = New-Object System.Drawing.RectangleF(20, -10, 984, 1000)
$g.DrawString('R', $font, [System.Drawing.Brushes]::White, $textRect, $format)

# Nova sparkle and dot
$sparkle = New-StarPath 800 222 78
$g.FillPath((New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(245, 255, 255, 255))), $sparkle)
$g.FillEllipse((New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(150, 255, 255, 255))), 214, 742, 44, 44)

function Export-Scaled([string]$path, [int]$size) {
    $bmp = New-Object System.Drawing.Bitmap($size, $size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $bg = [System.Drawing.Graphics]::FromImage($bmp)
    $bg.InterpolationMode = 'HighQualityBicubic'
    $bg.PixelOffsetMode = 'HighQuality'
    $bg.SmoothingMode = 'HighQuality'
    $bg.DrawImage($master, 0, 0, $size, $size)
    $bg.Dispose()
    $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
}

Export-Scaled (Join-Path $Root 'icon-512.png') 512
Export-Scaled (Join-Path $Root 'icon-192.png') 192
Export-Scaled (Join-Path $Root 'apple-touch-icon.png') 180

# ---------- Social preview (1200x630) ----------
$og = New-Object System.Drawing.Bitmap(1200, 630, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$bg = [System.Drawing.Graphics]::FromImage($og)
$bg.SmoothingMode = 'AntiAlias'
$bg.InterpolationMode = 'HighQualityBicubic'
$bg.TextRenderingHint = 'AntiAliasGridFit'

$rect = New-Object System.Drawing.Rectangle(0, 0, 1200, 630)
$bgBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    $rect,
    [System.Drawing.Color]::FromArgb(255, 6, 24, 16),
    [System.Drawing.Color]::FromArgb(255, 12, 62, 38), 30.0)
$bg.FillRectangle($bgBrush, $rect)

$halo = New-Object System.Drawing.Drawing2D.GraphicsPath
$halo.AddEllipse(-120, -260, 900, 900)
$haloBrush = New-Object System.Drawing.Drawing2D.PathGradientBrush $halo
$haloBrush.CenterColor = [System.Drawing.Color]::FromArgb(80, 34, 197, 94)
$haloBrush.SurroundColors = @([System.Drawing.Color]::FromArgb(0, 34, 197, 94))
$bg.FillPath($haloBrush, $halo)

$bg.DrawImage($master, 80, 165, 300, 300)

$titleFont = New-Object System.Drawing.Font('Segoe UI', 96, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$aiFont = New-Object System.Drawing.Font('Segoe UI', 96, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$tagFont = New-Object System.Drawing.Font('Segoe UI', 34, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
$metaFont = New-Object System.Drawing.Font('Segoe UI', 21, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)

$bg.DrawString('ROUJLA', $titleFont, [System.Drawing.Brushes]::White, 430, 175)
$bg.DrawString('AI', $aiFont, (New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 74, 222, 128))), 430, 282)
$bg.DrawString('Ask anything. Get answers.', $tagFont, (New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 172, 205, 188))), 436, 405)

$dot = [char]0x00B7
$meta = "Free  $dot  No sign-up  $dot  Arabic first  $dot  GitHub Pages"
$bg.DrawString($meta, $metaFont, (New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 126, 163, 144))), 438, 470)

$bg.Dispose()
$og.Save((Join-Path $Root 'og.png'), [System.Drawing.Imaging.ImageFormat]::Png)
$og.Dispose()

$g.Dispose()
$master.Dispose()

"Generated:"
Get-ChildItem $Root -File -Include 'icon-192.png','icon-512.png','apple-touch-icon.png','og.png' |
    Select-Object Name, Length | Format-Table -AutoSize
