param(
  [switch]$FilesOnly
)

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

$matchCount = 0

foreach ($file in $sourceFiles) {
  if ($FilesOnly) {
    $content = Get-Content -LiteralPath $file.FullName -Raw -Encoding utf8
    for ($index = 0; $index -lt $content.Length; $index += 1) {
      $codePoint = [char]::ConvertToUtf32($content, $index)
      if (Test-IconCodePoint -CodePoint $codePoint) {
        Write-Output $file.FullName.Substring($sourceRoot.Length + 1)
        $matchCount += 1
        break
      }
      if ($codePoint -gt 0xFFFF) {
        $index += 1
      }
    }
    continue
  }

  $lineNumber = 0
  foreach ($line in Get-Content -LiteralPath $file.FullName -Encoding utf8) {
    $lineNumber += 1
    $matches = [Collections.Generic.List[string]]::new()

    for ($index = 0; $index -lt $line.Length; $index += 1) {
      $codePoint = [char]::ConvertToUtf32($line, $index)
      $charLength = if ($codePoint -gt 0xFFFF) { 2 } else { 1 }
      if (Test-IconCodePoint -CodePoint $codePoint) {
        $matches.Add($line.Substring($index, $charLength))
        $matchCount += 1
      }
      if ($charLength -eq 2) {
        $index += 1
      }
    }

    if ($matches.Count -gt 0) {
      $relativePath = $file.FullName.Substring($sourceRoot.Length + 1)
      $uniqueMatches = $matches | Select-Object -Unique
      Write-Output "$relativePath`:$lineNumber`: $($uniqueMatches -join ' ') :: $($line.Trim())"
    }
  }
}

if ($matchCount -gt 0 -and -not $FilesOnly) {
  Write-Error "Found $matchCount emoji or text-icon character(s) in frontend source."
  exit 1
}

if ($matchCount -eq 0) {
  Write-Output 'No emoji or text-icon characters found in frontend source.'
}
