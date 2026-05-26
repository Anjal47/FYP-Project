param(
  [string]$ProjectRoot = (Split-Path -Parent $PSScriptRoot)
)

$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.Drawing

function New-HexColor {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Hex,
    [int]$Alpha = 255
  )

  $clean = $Hex.TrimStart("#")
  return [System.Drawing.Color]::FromArgb(
    $Alpha,
    [Convert]::ToInt32($clean.Substring(0, 2), 16),
    [Convert]::ToInt32($clean.Substring(2, 2), 16),
    [Convert]::ToInt32($clean.Substring(4, 2), 16)
  )
}

function New-RoundedRectanglePath {
  param(
    [float]$X,
    [float]$Y,
    [float]$Width,
    [float]$Height,
    [float]$Radius
  )

  $path = New-Object System.Drawing.Drawing2D.GraphicsPath
  $diameter = $Radius * 2

  $path.AddArc($X, $Y, $diameter, $diameter, 180, 90)
  $path.AddArc($X + $Width - $diameter, $Y, $diameter, $diameter, 270, 90)
  $path.AddArc($X + $Width - $diameter, $Y + $Height - $diameter, $diameter, $diameter, 0, 90)
  $path.AddArc($X, $Y + $Height - $diameter, $diameter, $diameter, 90, 90)
  $path.CloseFigure()

  return $path
}

function New-Point {
  param(
    [System.Drawing.RectangleF]$Rect,
    [double]$UnitX,
    [double]$UnitY
  )

  return New-Object System.Drawing.PointF(
    ($Rect.X + ($UnitX / 72.0) * $Rect.Width),
    ($Rect.Y + ($UnitY / 72.0) * $Rect.Height)
  )
}

function Initialize-Graphics {
  param([System.Drawing.Graphics]$Graphics)

  $Graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $Graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $Graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $Graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
}

function Draw-Mark {
  param(
    [System.Drawing.Graphics]$Graphics,
    [System.Drawing.RectangleF]$Rect
  )

  $markPath = New-RoundedRectanglePath -X $Rect.X -Y $Rect.Y -Width $Rect.Width -Height $Rect.Height -Radius ($Rect.Width * 0.31)
  $markBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    $Rect,
    (New-HexColor "#C85608"),
    (New-HexColor "#E86F1D"),
    45.0
  )

  try {
    $Graphics.FillPath($markBrush, $markPath)

    $highlightBrush = New-Object System.Drawing.SolidBrush (New-HexColor "#FFFFFF" 56)
    try {
      $Graphics.FillEllipse(
        $highlightBrush,
        $Rect.X + ($Rect.Width * 0.66),
        $Rect.Y + ($Rect.Height * 0.08),
        $Rect.Width * 0.2,
        $Rect.Height * 0.2
      )
    } finally {
      $highlightBrush.Dispose()
    }

    $strokeWidth = [float]($Rect.Width * (3.0 / 72.0))
    $iconPen = New-Object System.Drawing.Pen ([System.Drawing.Color]::White, $strokeWidth)
    $iconPen.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round
    $iconPen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
    $iconPen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round

    try {
      $shieldPath = New-Object System.Drawing.Drawing2D.GraphicsPath
      try {
        $shieldPath.StartFigure()
        $shieldPath.AddBezier((New-Point $Rect 36 16), (New-Point $Rect 44.5 16), (New-Point $Rect 51 21), (New-Point $Rect 51 29))
        $shieldPath.AddBezier((New-Point $Rect 51 29), (New-Point $Rect 51 41), (New-Point $Rect 44 51), (New-Point $Rect 36 57))
        $shieldPath.AddBezier((New-Point $Rect 36 57), (New-Point $Rect 28 51), (New-Point $Rect 21 41), (New-Point $Rect 21 29))
        $shieldPath.AddBezier((New-Point $Rect 21 29), (New-Point $Rect 21 21), (New-Point $Rect 27.5 16), (New-Point $Rect 36 16))
        $shieldPath.CloseFigure()
        $Graphics.DrawPath($iconPen, $shieldPath)
      } finally {
        $shieldPath.Dispose()
      }

      $wavePoints = [System.Drawing.PointF[]]@(
        (New-Point $Rect 27 36),
        (New-Point $Rect 33 36),
        (New-Point $Rect 36.2 29.4),
        (New-Point $Rect 40 43),
        (New-Point $Rect 43.2 37),
        (New-Point $Rect 49 37)
      )
      $Graphics.DrawLines($iconPen, $wavePoints)

      $dotPoint = New-Point $Rect 36 29
      $dotRadius = $Rect.Width * (2.5 / 72.0)
      $dotBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::White)

      try {
        $Graphics.FillEllipse(
          $dotBrush,
          $dotPoint.X - $dotRadius,
          $dotPoint.Y - $dotRadius,
          $dotRadius * 2,
          $dotRadius * 2
        )
      } finally {
        $dotBrush.Dispose()
      }
    } finally {
      $iconPen.Dispose()
    }
  } finally {
    $markBrush.Dispose()
    $markPath.Dispose()
  }
}

function Save-Png {
  param(
    [int]$Size,
    [string]$Path,
    [scriptblock]$Painter
  )

  $directory = Split-Path -Parent $Path
  if (!(Test-Path $directory)) {
    New-Item -ItemType Directory -Path $directory -Force | Out-Null
  }

  $bitmap = [System.Drawing.Bitmap]::new($Size, $Size)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)

  try {
    Initialize-Graphics $graphics
    & $Painter $graphics $Size
    $bitmap.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)
  } finally {
    if ($null -ne $graphics) {
      $graphics.Dispose()
    }

    if ($null -ne $bitmap) {
      $bitmap.Dispose()
    }
  }
}

function Draw-FullIcon {
  param(
    [System.Drawing.Graphics]$Graphics,
    [int]$Size
  )

  $backgroundRect = New-Object System.Drawing.RectangleF 0, 0, $Size, $Size
  $backgroundBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    $backgroundRect,
    (New-HexColor "#FFFDF9"),
    (New-HexColor "#F3ECE1"),
    90.0
  )

  try {
    $Graphics.FillRectangle($backgroundBrush, $backgroundRect)
  } finally {
    $backgroundBrush.Dispose()
  }

  $glowBrush = New-Object System.Drawing.SolidBrush (New-HexColor "#FFF0E1" 220)
  try {
    $Graphics.FillEllipse($glowBrush, $Size * 0.55, $Size * 0.05, $Size * 0.34, $Size * 0.34)
  } finally {
    $glowBrush.Dispose()
  }

  $shadowRect = New-Object System.Drawing.RectangleF ($Size * 0.2), ($Size * 0.24), ($Size * 0.58), ($Size * 0.58)
  $shadowPath = New-RoundedRectanglePath -X $shadowRect.X -Y $shadowRect.Y -Width $shadowRect.Width -Height $shadowRect.Height -Radius ($shadowRect.Width * 0.31)
  $shadowBrush = New-Object System.Drawing.SolidBrush (New-HexColor "#171311" 34)
  $state = $Graphics.Save()
  $Graphics.TranslateTransform($Size * 0.018, $Size * 0.028)

  try {
    $Graphics.FillPath($shadowBrush, $shadowPath)
  } finally {
    $Graphics.Restore($state)
    $shadowBrush.Dispose()
    $shadowPath.Dispose()
  }

  $markRect = New-Object System.Drawing.RectangleF ($Size * 0.21), ($Size * 0.21), ($Size * 0.58), ($Size * 0.58)
  Draw-Mark -Graphics $Graphics -Rect $markRect
}

function Draw-ForegroundIcon {
  param(
    [System.Drawing.Graphics]$Graphics,
    [int]$Size
  )

  $Graphics.Clear([System.Drawing.Color]::Transparent)
  $markRect = New-Object System.Drawing.RectangleF ($Size * 0.16), ($Size * 0.16), ($Size * 0.68), ($Size * 0.68)
  Draw-Mark -Graphics $Graphics -Rect $markRect
}

$androidLegacySizes = @{
  "mipmap-mdpi" = 48
  "mipmap-hdpi" = 72
  "mipmap-xhdpi" = 96
  "mipmap-xxhdpi" = 144
  "mipmap-xxxhdpi" = 192
}

$androidForegroundSizes = @{
  "mipmap-mdpi" = 108
  "mipmap-hdpi" = 162
  "mipmap-xhdpi" = 216
  "mipmap-xxhdpi" = 324
  "mipmap-xxxhdpi" = 432
}

$iosIcons = @(
  @{ Name = "Icon-App-20x20@2x.png"; Size = 40 }
  @{ Name = "Icon-App-20x20@3x.png"; Size = 60 }
  @{ Name = "Icon-App-29x29@2x.png"; Size = 58 }
  @{ Name = "Icon-App-29x29@3x.png"; Size = 87 }
  @{ Name = "Icon-App-40x40@2x.png"; Size = 80 }
  @{ Name = "Icon-App-40x40@3x.png"; Size = 120 }
  @{ Name = "Icon-App-60x60@2x.png"; Size = 120 }
  @{ Name = "Icon-App-60x60@3x.png"; Size = 180 }
  @{ Name = "Icon-App-1024x1024.png"; Size = 1024 }
)

foreach ($entry in $androidLegacySizes.GetEnumerator()) {
  Save-Png -Size $entry.Value -Path (Join-Path $ProjectRoot "android/app/src/main/res/$($entry.Key)/ic_launcher.png") -Painter ${function:Draw-FullIcon}
  Save-Png -Size $entry.Value -Path (Join-Path $ProjectRoot "android/app/src/main/res/$($entry.Key)/ic_launcher_round.png") -Painter ${function:Draw-FullIcon}
}

foreach ($entry in $androidForegroundSizes.GetEnumerator()) {
  Save-Png -Size $entry.Value -Path (Join-Path $ProjectRoot "android/app/src/main/res/$($entry.Key)/ic_launcher_foreground.png") -Painter ${function:Draw-ForegroundIcon}
}

foreach ($icon in $iosIcons) {
  Save-Png -Size $icon.Size -Path (Join-Path $ProjectRoot "ios/myapp/Images.xcassets/AppIcon.appiconset/$($icon.Name)") -Painter ${function:Draw-FullIcon}
}

Save-Png -Size 1024 -Path (Join-Path $ProjectRoot "assets/branding/angeltouch-app-icon-1024.png") -Painter ${function:Draw-FullIcon}
