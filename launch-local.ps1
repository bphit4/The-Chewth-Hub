$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$codexNode = "C:\Users\Shadow\AppData\Local\OpenAI\Codex\bin\node.exe"
$vsNpmCli = "C:\Program Files\Microsoft Visual Studio\2022\Community\MSBuild\Microsoft\VisualStudio\NodeJs\node_modules\npm\bin\npm-cli.js"
$npmCmd = Get-Command npm.cmd -ErrorAction SilentlyContinue

Set-Location $projectRoot

if ($npmCmd) {
  & $npmCmd.Source run dev
} elseif ((Test-Path $codexNode) -and (Test-Path $vsNpmCli)) {
  $env:Path = "C:\Users\Shadow\AppData\Local\OpenAI\Codex\bin;$env:Path"
  & $codexNode $vsNpmCli run dev
} else {
  throw "Could not find npm. Install Node.js with npm, or update this script with your npm path."
}
