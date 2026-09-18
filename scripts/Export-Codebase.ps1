# Export-Codebase.ps1
# Flattens the robyn-site repo into one CODEBASE.md: file tree + every source file, fenced.
# Run from anywhere:  powershell -ExecutionPolicy Bypass -File E:\~GoldenWings\presskit\robyn-site\scripts\Export-Codebase.ps1
# Optional:           -Root <path> -Out <path> -MaxKB 512

param(
    [string]$Root  = "E:\~GoldenWings\presskit\robyn-site",
    [string]$Out   = "E:\~GoldenWings\presskit\robyn-site\CODEBASE.md",
    [int]$MaxKB    = 512
)

$ErrorActionPreference = "Stop"
$Root = (Resolve-Path $Root).Path

# Directories to skip entirely (matched against any path segment)
$SkipDirs = @("node_modules", "dist", ".git", ".astro", ".wrangler", ".vscode", ".codex", ".superdesign", "_tmp")

# Exact filenames to skip
$SkipFiles = @("package-lock.json", "pnpm-lock.yaml", "yarn.lock", ".env", ".env.local", ".env.production", "CODEBASE.md", "*.lnk")

# Extensions to skip (binaries, media, maps)
$SkipExt = @(".png", ".jpg", ".jpeg", ".webp", ".avif", ".gif", ".ico", ".svg",
             ".ttf", ".woff", ".woff2", ".otf", ".eot",
             ".pdf", ".zip", ".mp4", ".mov", ".mp3", ".wav",
             ".map", ".log", ".sample", ".lnk")

# Fence language by extension
$Lang = @{
    ".astro" = "astro"; ".ts" = "ts"; ".tsx" = "tsx"; ".js" = "js"; ".mjs" = "js"; ".cjs" = "js"; ".jsx" = "jsx"
    ".json" = "json"; ".md" = "md"; ".mdx" = "mdx"; ".html" = "html"; ".css" = "css"; ".scss" = "scss"
    ".toml" = "toml"; ".yml" = "yaml"; ".yaml" = "yaml"; ".xml" = "xml"; ".txt" = "text"
    ".ps1" = "powershell"; ".cmd" = "bat"; ".sh" = "bash"; ".env" = "text"
}

function Test-Skip([System.IO.FileInfo]$f) {
    $rel = $f.FullName.Substring($Root.Length).TrimStart("\")
    foreach ($d in $SkipDirs) { if ($rel -split "\\" | Where-Object { $_ -eq $d }) { return $true } }
    foreach ($p in $SkipFiles) { if ($f.Name -like $p) { return $true } }
    if ($SkipExt -contains $f.Extension.ToLower()) { return $true }
    if ($f.Name -like "_tmp_*") { return $true }
    if ($f.Length -gt ($MaxKB * 1KB)) { return $true }
    return $false
}

$files = Get-ChildItem -Path $Root -Recurse -File -Force |
         Where-Object { -not (Test-Skip $_) } |
         Sort-Object FullName

$sb = New-Object System.Text.StringBuilder
[void]$sb.AppendLine("# CODEBASE: $(Split-Path $Root -Leaf)")
[void]$sb.AppendLine("Generated: $(Get-Date -Format 'yyyy-MM-dd HH:mm')  |  Root: $Root  |  Files: $($files.Count)")
[void]$sb.AppendLine()
[void]$sb.AppendLine("## File tree")
[void]$sb.AppendLine('```')
foreach ($f in $files) {
    [void]$sb.AppendLine($f.FullName.Substring($Root.Length).TrimStart("\").Replace("\", "/"))
}
[void]$sb.AppendLine('```')
[void]$sb.AppendLine()
[void]$sb.AppendLine("## Files")
[void]$sb.AppendLine()

foreach ($f in $files) {
    $rel  = $f.FullName.Substring($Root.Length).TrimStart("\").Replace("\", "/")
    $ext  = $f.Extension.ToLower()
    $lang = if ($Lang.ContainsKey($ext)) { $Lang[$ext] } else { "" }
    $body = Get-Content -LiteralPath $f.FullName -Raw -Encoding UTF8
    if ($null -eq $body) { $body = "" }
    # Bump fence length if the file itself contains ``` so the markdown stays valid
    $fence = '```'
    while ($body -match [regex]::Escape($fence)) { $fence += '`' }
    [void]$sb.AppendLine("### $rel")
    [void]$sb.AppendLine("$fence$lang")
    [void]$sb.AppendLine($body.TrimEnd())
    [void]$sb.AppendLine($fence)
    [void]$sb.AppendLine()
}

[System.IO.File]::WriteAllText($Out, $sb.ToString(), (New-Object System.Text.UTF8Encoding $false))

$kb = [math]::Round((Get-Item $Out).Length / 1KB)
Write-Host "Wrote $Out  ($($files.Count) files, ${kb} KB)"
