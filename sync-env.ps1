# ==============================================================================
# FUZION DEVELOPMENT SUITE - ENVIRONMENT SYNC SCRIPT
# ==============================================================================
# This script copies the global .env file to all project directories
# Run this whenever you update the global .env file

$globalEnvPath = "c:\Users\FUZIONEST1\Downloads\FDS\New folder\.env"
$projects = @(
    "fuzion-db-viewer",
    "fuzion-postman", 
    "fuzion-transformer",
    "suite-ui"
)

Write-Host "Syncing global .env file to all projects..." -ForegroundColor Cyan

if (!(Test-Path $globalEnvPath)) {
    Write-Host "Global .env file not found at: $globalEnvPath" -ForegroundColor Red
    exit 1
}

$syncedCount = 0
$totalProjects = $projects.Count

foreach ($project in $projects) {
    $targetPath = "c:\Users\FUZIONEST1\Downloads\FDS\New folder\$project\.env"
    
    try {
        Copy-Item $globalEnvPath $targetPath -Force
        Write-Host "Synced to: $project" -ForegroundColor Green
        $syncedCount++
    }
    catch {
        Write-Host "Failed to sync to: $project - $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Sync Summary:" -ForegroundColor Yellow
Write-Host "   Total projects: $totalProjects" -ForegroundColor White
Write-Host "   Successfully synced: $syncedCount" -ForegroundColor Green
Write-Host "   Failed: $($totalProjects - $syncedCount)" -ForegroundColor Red

if ($syncedCount -eq $totalProjects) {
    Write-Host ""
    Write-Host "All projects successfully synced with global .env!" -ForegroundColor Green
    Write-Host "You can now start the development suite with: npm run dev" -ForegroundColor Cyan
} else {
    Write-Host ""
    Write-Host "Some projects failed to sync. Please check the errors above." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Tip: Run this script whenever you update the global .env file" -ForegroundColor Blue