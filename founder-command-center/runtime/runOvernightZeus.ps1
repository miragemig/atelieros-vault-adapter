param(
  [int]$Hours = 8,
  [int]$IntervalMinutes = 5
)

$ErrorActionPreference = "Continue"

$scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $scriptRoot
Set-Location $projectRoot

$env:OLLAMA_BASE_URL = "http://127.0.0.1:11434"
$env:OLLAMA_MODEL = "qwen2.5-coder:7b"
$env:ZEUS_CHAT_MODEL = "qwen2.5-coder:7b"
$env:ZEUS_OLLAMA_TIMEOUT_MS = "45000"
$env:ENABLE_PAID_APIS = "false"
$env:MAX_ADDITIONAL_COST_EUR = "0"
$env:ZEUS_RUNTIME_MODE = "OVERNIGHT_SAFE_MODE"
$env:ZEUS_ALLOW_CORE_APPLY = "false"
$env:ZEUS_ALLOW_GIT_COMMIT = "false"
$env:ZEUS_ALLOW_GIT_PUSH = "false"
$env:ZEUS_ALLOW_EMAIL_SEND = "false"
$env:ZEUS_ALLOW_PROJECT_CREATION = "false"

.\node_modules\.bin\tsx.cmd founder-command-center\zeus\zeusOvernightSelfBuild.ts $Hours $IntervalMinutes

