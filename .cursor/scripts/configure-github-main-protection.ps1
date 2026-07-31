param(
    [string]$Branch = "main"
)

$ErrorActionPreference = "Stop"

& gh auth status | Out-Null
if ($LASTEXITCODE -ne 0) {
    throw "GitHub CLI is not authenticated."
}

$repo = (& gh repo view --json nameWithOwner --jq ".nameWithOwner").Trim()
if ([string]::IsNullOrWhiteSpace($repo)) {
    throw "Unable to infer GitHub repository."
}

$payload = @{
    required_status_checks = @{
        strict = $true
        contexts = @("governance", "quality")
    }
    enforce_admins = $true
    required_pull_request_reviews = @{
        dismiss_stale_reviews = $false
        require_code_owner_reviews = $false
        required_approving_review_count = 0
        require_last_push_approval = $false
    }
    restrictions = $null
    required_linear_history = $false
    allow_force_pushes = $false
    allow_deletions = $false
    block_creations = $false
    required_conversation_resolution = $true
    lock_branch = $false
    allow_fork_syncing = $false
} | ConvertTo-Json -Depth 10 -Compress

$temp = [System.IO.Path]::GetTempFileName()
try {
    $utf8NoBom = New-Object System.Text.UTF8Encoding $false
    [System.IO.File]::WriteAllText($temp, $payload, $utf8NoBom)
    & gh api `
        --method PUT `
        -H "Accept: application/vnd.github+json" `
        -H "X-GitHub-Api-Version: 2022-11-28" `
        "repos/$repo/branches/$Branch/protection" `
        --input $temp

    if ($LASTEXITCODE -ne 0) {
        throw "GitHub rejected the branch protection request."
    }

    Write-Host "Protection configured for ${repo}:${Branch}"
} finally {
    Remove-Item $temp -Force -ErrorAction SilentlyContinue
}
