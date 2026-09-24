$ErrorActionPreference = "Stop"

$psqlCandidates = @(
  "C:\Program Files\PostgreSQL\17\bin\psql.exe",
  "C:\Program Files\PostgreSQL\16\bin\psql.exe",
  "C:\Program Files\PostgreSQL\15\bin\psql.exe",
  "C:\Program Files\PostgreSQL\14\bin\psql.exe"
)

$psql = $psqlCandidates | Where-Object { Test-Path $_ } | Select-Object -First 1

if (-not $psql) {
  $command = Get-Command psql -ErrorAction SilentlyContinue
  if ($command) {
    $psql = $command.Source
  }
}

if (-not $psql) {
  throw "psql.exe nao encontrado. Instale PostgreSQL ou use npm run db:up com Docker Desktop aberto."
}

$hostName = $env:LOCAL_PGHOST
if (-not $hostName) { $hostName = "localhost" }

$port = $env:LOCAL_PGPORT
if (-not $port) { $port = "5432" }

$adminUser = $env:LOCAL_PG_ADMIN_USER
if (-not $adminUser) { $adminUser = "postgres" }

$appDatabase = "sesc_contratos"
$appUser = "sesc_contratos"
$appPassword = "local_dev_password"

$securePassword = Read-Host "Senha do usuario PostgreSQL '$adminUser'" -AsSecureString
$passwordPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)

try {
  $env:PGPASSWORD = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($passwordPointer)

  $roleSql = @"
do `$`$
begin
  if not exists (select 1 from pg_roles where rolname = '$appUser') then
    create role $appUser login password '$appPassword';
  else
    alter role $appUser with login password '$appPassword';
  end if;
end
`$`$;
"@

  & $psql -h $hostName -p $port -U $adminUser -d postgres -v ON_ERROR_STOP=1 -c $roleSql

  $databaseExists = & $psql -h $hostName -p $port -U $adminUser -d postgres -tAc "select 1 from pg_database where datname = '$appDatabase'"

  if ($databaseExists.Trim() -ne "1") {
    & $psql -h $hostName -p $port -U $adminUser -d postgres -v ON_ERROR_STOP=1 -c "create database $appDatabase owner $appUser"
  }

  & $psql -h $hostName -p $port -U $adminUser -d postgres -v ON_ERROR_STOP=1 -c "alter database $appDatabase owner to $appUser"
  & $psql -h $hostName -p $port -U $adminUser -d $appDatabase -v ON_ERROR_STOP=1 -c "grant all privileges on schema public to $appUser"

  Write-Host "Banco local pronto: $appDatabase"
  Write-Host "Usuario da aplicacao: $appUser"
  Write-Host "DATABASE_URL=postgresql://${appUser}:${appPassword}@${hostName}:$port/$appDatabase"
}
finally {
  Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue
  if ($passwordPointer -ne [IntPtr]::Zero) {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($passwordPointer)
  }
}
