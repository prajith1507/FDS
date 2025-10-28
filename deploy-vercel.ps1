# Vercel Deployment Script for Fuzion Development Suite
# This script deploys all four Next.js applications to Vercel

Write-Host "Deploying Fuzion Development Suite to Vercel..." -ForegroundColor Cyan
Write-Host ""

# Check if Vercel CLI is installed
try {
    vercel --version | Out-Null
    Write-Host "Vercel CLI is installed" -ForegroundColor Green
} catch {
    Write-Host "Vercel CLI is not installed. Installing..." -ForegroundColor Red
    npm install -g vercel
}






Write-Host ""

$projects = @(
    @{Name="Suite UI"; Path="suite-ui"; Order=4},
    @{Name="DB Viewer"; Path="fuzion-db-viewer"; Order=1},
    @{Name="Postman"; Path="fuzion-postman"; Order=2},
    @{Name="Transformer"; Path="fuzion-transformer"; Order=3}
)

# Sort by deployment order
$projects = $projects | Sort-Object Order

$successful = 0
$failed = 0
$deployedUrls = @{}

Write-Host "Deployment Plan:" -ForegroundColor Yellow
foreach ($project in $projects) {
    Write-Host "   $($project.Order). $($project.Name) ($($project.Path))" -ForegroundColor White
}
Write-Host ""

foreach ($project in $projects) {
    Write-Host "Deploying $($project.Name)..." -ForegroundColor Yellow
    
    try {
        Push-Location $project.Path
        
        # Build first to check for errors
        Write-Host "   Building..." -ForegroundColor Gray
        npm run build
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "   Build successful" -ForegroundColor Green
            
            # Deploy to Vercel
            Write-Host "   Deploying to Vercel..." -ForegroundColor Gray
            $deployOutput = vercel --prod --yes 2>&1
            
            if ($LASTEXITCODE -eq 0) {
                $url = ($deployOutput | Select-String "https://.*\.vercel\.app").Matches.Value
                if ($url) {
                    $deployedUrls[$project.Name] = $url
                    Write-Host "   $($project.Name) deployed successfully" -ForegroundColor Green
                    Write-Host "   URL: $url" -ForegroundColor Cyan
                    $successful++
                } else {
                    Write-Host "   Deployed but URL not captured" -ForegroundColor Yellow
                    $successful++
                }
            } else {
                Write-Host "   Deployment failed" -ForegroundColor Red
                $failed++
            }
        } else {
            Write-Host "   Build failed" -ForegroundColor Red
            $failed++
        }
    }
    catch {
        Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
        $failed++
    }
    finally {
        Pop-Location
    }
    
    Write-Host ""
}

Write-Host "Deployment Summary:" -ForegroundColor Cyan
Write-Host "   Successful: $successful" -ForegroundColor Green
Write-Host "   Failed: $failed" -ForegroundColor Red
Write-Host ""

if ($deployedUrls.Count -gt 0) {
    Write-Host "Deployed URLs:" -ForegroundColor Cyan
    foreach ($deployment in $deployedUrls.GetEnumerator()) {
        Write-Host "   $($deployment.Key): $($deployment.Value)" -ForegroundColor White
    }
    Write-Host ""
}

if ($successful -gt 0) {
    Write-Host "Deployment completed!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next Steps:" -ForegroundColor Yellow
    Write-Host "   1. Update environment variables in Vercel dashboard" -ForegroundColor White
    Write-Host "   2. Test all deployed applications" -ForegroundColor White
    Write-Host "   3. Configure custom domains (optional)" -ForegroundColor White
    Write-Host "   4. Set up monitoring and analytics" -ForegroundColor White
    Write-Host ""
    Write-Host "Remember to update the Suite UI environment variables with the URLs of other services!" -ForegroundColor Blue
} else {
    Write-Host "No applications were deployed successfully." -ForegroundColor Yellow
    Write-Host "Please check the errors above and try again." -ForegroundColor White
}