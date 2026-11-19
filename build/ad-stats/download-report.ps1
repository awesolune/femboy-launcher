param([Parameter(Mandatory=$true)][string]$Month,[Parameter(Mandatory=$true)][string]$OutputDirectory)
$ErrorActionPreference='Stop'
$reportCredential=Import-Clixml -LiteralPath (Join-Path $env:LOCALAPPDATA 'FemboyLauncherRelease\spaceweb-key.xml')
$env:SW_FTP_USER=$reportCredential.UserName
$env:SW_FTP_PASSWORD=$reportCredential.GetNetworkCredential().Password
try { & node "$PSScriptRoot\download-report.js" $Month $OutputDirectory; $reportExit=$LASTEXITCODE }
finally { Remove-Item Env:SW_FTP_USER -ErrorAction SilentlyContinue; Remove-Item Env:SW_FTP_PASSWORD -ErrorAction SilentlyContinue; $reportCredential=$null }
exit $reportExit
