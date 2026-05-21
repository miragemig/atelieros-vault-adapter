param(
  [Parameter(Position=0)]
  [string]$Command = "help",

  [Parameter(ValueFromRemainingArguments=$true)]
  [string[]]$Args
)

$scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptRoot

$tsx = ".\node_modules\.bin\tsx.cmd"
$router = "founder-command-center\zeus\zeusCommandRouter.ts"

if (-not (Test-Path $tsx)) {
  Write-Error "tsx.cmd not found at $tsx"
  exit 1
}

if (-not (Test-Path $router)) {
  Write-Error "ZEUS command router not found at $router"
  exit 1
}

& $tsx $router $Command @Args
