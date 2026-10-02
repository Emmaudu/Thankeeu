$ErrorActionPreference = 'Stop'

$sourceRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\src')).Path
$sourceFiles = Get-ChildItem -Path $sourceRoot -Recurse -File |
  Where-Object { $_.Extension -in '.js', '.jsx', '.ts', '.tsx' }

function Test-IconCodePoint {
  param([int]$CodePoint)

  return (
    ($CodePoint -ge 0x1F000 -and $CodePoint -le 0x1FAFF) -or
    ($CodePoint -ge 0x2600 -and $CodePoint -le 0x27BF) -or
    ($CodePoint -ge 0x2B00 -and $CodePoint -le 0x2BFF) -or
    ($CodePoint -ge 0x2190 -and $CodePoint -le 0x21FF) -or
    ($CodePoint -ge 0x2300 -and $CodePoint -le 0x23FF) -or
    $CodePoint -eq 0x2139 -or
    $CodePoint -eq 0x200D -or
    $CodePoint -eq 0xFE0F
  )
}

$utf8NoBom = [Text.UTF8Encoding]::new($false)

foreach ($file in $sourceFiles) {
  $content = [IO.File]::ReadAllText($file.FullName, [Text.Encoding]::UTF8)
  $builder = [Text.StringBuilder]::new($content.Length)
  for ($index = 0; $index -lt $content.Length; $index += 1) {
    $codePoint = [char]::ConvertToUtf32($content, $index)
    $charLength = if ($codePoint -gt 0xFFFF) { 2 } else { 1 }
    $isIcon = (
      ($codePoint -ge 0x1F000 -and $codePoint -le 0x1FAFF) -or
      ($codePoint -ge 0x2600 -and $codePoint -le 0x27BF) -or
      ($codePoint -ge 0x2B00 -and $codePoint -le 0x2BFF) -or
      ($codePoint -ge 0x2190 -and $codePoint -le 0x21FF) -or
      ($codePoint -ge 0x2300 -and $codePoint -le 0x23FF) -or
      $codePoint -eq 0x2139 -or
      $codePoint -eq 0x200D -or
      $codePoint -eq 0xFE0F
    )
    if (-not $isIcon) {
      [void]$builder.Append($content, $index, $charLength)
    }
    if ($charLength -eq 2) {
      $index += 1
    }
  }

  [IO.File]::WriteAllText($file.FullName, $builder.ToString(), $utf8NoBom)
}

Write-Output "Removed emoji and text-icon characters from $($sourceFiles.Count) source files. Data-driven interfaces now infer SVG icons from their accessible labels."
