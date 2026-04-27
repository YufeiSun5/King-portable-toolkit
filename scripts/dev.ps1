# 文件说明：稳定启动 Wails dev 的 PowerShell 脚本，修复 vfox 环境缺失 Windows 系统 PATH 导致的黑屏/退出问题。
# 联动 .vfox.toml、wails.json、frontend/package.json、.devlogs 和 Wails/Vite 开发服务。

$ErrorActionPreference = "Stop"

$Root = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location -LiteralPath $Root

Invoke-Expression (vfox env -s pwsh --full)

$systemPaths = @(
    "$env:SystemRoot\System32",
    "$env:SystemRoot",
    "$env:SystemRoot\System32\Wbem",
    "$env:SystemRoot\System32\WindowsPowerShell\v1.0"
)

foreach ($path in $systemPaths) {
    if ($env:Path -notlike "*$path*") {
        $env:Path = "$path;$env:Path"
    }
}

$env:CGO_ENABLED = "1"

& ".\.vfox\sdks\golang\packages\bin\wails.exe" dev

