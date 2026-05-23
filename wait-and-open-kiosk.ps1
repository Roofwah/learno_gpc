param(
  [Parameter(Mandatory = $true)][int]$Kiosk,
  [int]$Port = 3001,
  [int]$MaxWaitSeconds = 180
)

$root = $http://127.0.0.1:$Port/
$target = "http://127.0.0.1:$Port/?kiosk=$Kiosk"
$deadline = (Get-Date).AddSeconds($MaxWaitSeconds)

while ((Get-Date) -lt $deadline) {
  try {
    Invoke-WebRequest -Uri $root -UseBasicParsing -TimeoutSec 3 | Out-Null
    Start-Process $target
    exit 0
  } catch {
    Start-Sleep -Seconds 2
  }
}

Add-Type -AssemblyName System.Windows.Forms
[System.Windows.Forms.MessageBox]::Show(
  @"
The local GPC server did not start on this PC.

1. Run install-windows.bat in the project folder (once).
2. Double-click Start GPC Kiosk again.
3. Leave the minimized "learno GPC Kiosk Server" window open.

If it still fails, send a photo of the server window error.
"@,
  'GPC Kiosk — server not running',
  [System.Windows.Forms.MessageBoxButtons]::OK,
  [System.Windows.Forms.MessageBoxIcon]::Warning
) | Out-Null
exit 1
