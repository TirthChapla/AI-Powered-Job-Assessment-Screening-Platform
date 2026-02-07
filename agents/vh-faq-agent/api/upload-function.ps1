$FileName = "./function.zip"
if (Test-Path $FileName) {
  Remove-Item $FileName
}

Write-Host "Installing dependencies with pnpm..." -ForegroundColor Yellow
pnpm install

Write-Host "Building optimized bundle..." -ForegroundColor Yellow
pnpm run build

Write-Host "Creating deployment package from optimized build..." -ForegroundColor Yellow
Push-Location dist
Compress-Archive -path ./* -destinationpath ../function.zip
Pop-Location

Write-Host "Uploading to AWS Lambda..." -ForegroundColor Yellow
aws lambda update-function-code --region us-east-1 --function-name vh-faq-agent-api --zip-file fileb://function.zip > $null

if ($LASTEXITCODE -eq 0) {
    Write-Host "Function uploaded successfully!" -ForegroundColor Green
    Write-Host "Cleaning up..." -ForegroundColor Yellow
    Remove-Item function.zip
} else {
    Write-Host "Upload failed!" -ForegroundColor Red
}