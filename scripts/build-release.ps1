param(
    [string]$ReleaseTag = ('release-' + (Get-Date -Format 'yyyyMMdd-HHmmss'))
)
$ErrorActionPreference = 'Stop'
if ($ReleaseTag -notmatch '^[a-zA-Z0-9][a-zA-Z0-9_.-]+$') { throw 'Invalid Docker release tag' }
$projectDir = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $projectDir
$backendDir = Join-Path $projectDir 'track-cafedra-backend'

docker info --format '{{.ServerVersion}}'
if ($LASTEXITCODE -ne 0) { throw 'Start Docker Desktop with Linux containers first' }
npm ci
if ($LASTEXITCODE -ne 0) { throw 'npm ci failed' }
npm run lint
if ($LASTEXITCODE -ne 0) { throw 'Lint failed' }
npm test -- --runInBand
if ($LASTEXITCODE -ne 0) { throw 'Frontend tests failed' }

docker run --rm --mount "type=bind,source=$backendDir,target=/workspace" --mount 'type=volume,source=track-cafedra-maven-cache,target=/root/.m2' -w /workspace maven:3.9-eclipse-temurin-21 mvn -B verify
if ($LASTEXITCODE -ne 0) { throw 'Java verification failed' }
docker build -f deploy/backend-runtime.Dockerfile -t "track-cafedra/backend:$ReleaseTag" track-cafedra-backend/target
if ($LASTEXITCODE -ne 0) { throw 'Backend image build failed' }
docker build -t "track-cafedra/frontend:$ReleaseTag" .
if ($LASTEXITCODE -ne 0) { throw 'Frontend image build failed' }
npm run package:release
if ($LASTEXITCODE -ne 0) { throw 'Source packaging failed' }
$imageArchive = Join-Path $projectDir "dist/images-$ReleaseTag.tar"
docker save -o $imageArchive "track-cafedra/frontend:$ReleaseTag" "track-cafedra/backend:$ReleaseTag"
if ($LASTEXITCODE -ne 0) { throw 'Image export failed' }
$checksum = (Get-FileHash -LiteralPath $imageArchive -Algorithm SHA256).Hash.ToLowerInvariant()
[System.IO.File]::WriteAllText("$imageArchive.sha256", "$checksum  $(Split-Path -Leaf $imageArchive)`n")
Write-Output "Ready: $imageArchive"
Write-Output "Set RELEASE_TAG=$ReleaseTag in the server environment before starting these images."
Write-Output 'For a full release, clear FRONTEND_RELEASE_TAG so the frontend uses RELEASE_TAG too.'
