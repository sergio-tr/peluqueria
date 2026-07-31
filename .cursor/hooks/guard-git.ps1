$ErrorActionPreference = "SilentlyContinue"
$raw = [Console]::In.ReadToEnd()

try {
    $payload = $raw | ConvertFrom-Json
} catch {
    '{"permission":"allow"}'
    exit 0
}

$command = $null

if ($payload.command) {
    $command = [string]$payload.command
} elseif ($payload.tool_input.command) {
    $command = [string]$payload.tool_input.command
} elseif ($payload.input.command) {
    $command = [string]$payload.input.command
}

if ([string]::IsNullOrWhiteSpace($command)) {
    '{"permission":"allow"}'
    exit 0
}

$normalized = $command.ToLowerInvariant()
$reason = $null

if ($normalized -match '\bgh\s+pr\s+merge\b') {
    $reason = "Pull requests must only be merged manually by the user from the web."
} elseif ($normalized -match '\bgh\s+pr\s+close\b') {
    $reason = "The agent may not close pull requests."
} elseif ($normalized -match '\bgit\s+push\b.*(--force|-f)\b') {
    $reason = "Force push is prohibited."
} elseif ($normalized -match '\bgit\s+push\b.*\bmain\b') {
    $reason = "Direct pushes to main are prohibited after bootstrap."
} elseif ($normalized -match '\bgit\s+commit\b.*(-m|--message).*\bcursor\b') {
    $reason = "Commit messages may not mention Cursor."
} else {
    $branch = (& git branch --show-current 2>$null).Trim()
    if ($branch -eq "main" -and $normalized -match '\bgit\s+(add|commit|merge|rebase|cherry-pick|reset)\b') {
        $reason = "main is read-only after bootstrap. Create a typed work branch."
    }
}

if ($reason) {
    $escaped = $reason.Replace('\', '\\').Replace('"', '\"')
    "{`"permission`":`"deny`",`"user_message`":`"$escaped`",`"agent_message`":`"$escaped`"}"
    exit 0
}

'{"permission":"allow"}'
