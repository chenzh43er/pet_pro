$base = "g:\pet_pro\img"
$dirs = @(
    $base,
    "$base\quiz\cat",
    "$base\quiz\dog",
    "$base\generator"
)
foreach ($d in $dirs) { New-Item -ItemType Directory -Force -Path $d | Out-Null }

$static = "https://www.findpawpal.com/public/static/Images"
$staticFiles = @{
    "$base\logo-b.webp" = "$static/logo-b.webp"
    "$base\logo-w.webp" = "$static/logo-w.webp"
    "$base\loading-cat.webp" = "$static/loading-cat.webp"
    "$base\loading-dog.webp" = "$static/loading-dog.webp"
    "$base\arrow.png" = "$static/arrow.png"
    "$base\generator\delete.webp" = "$static/generator/delete.webp"
    "$base\generator\cat-generator.webp" = "$static/generator/cat-generator.webp"
    "$base\generator\cat-generator-m.webp" = "$static/generator/cat-generator-m.webp"
    "$base\generator\dog-generator.webp" = "$static/generator/dog-generator.webp"
    "$base\generator\dog-generator-m.webp" = "$static/generator/dog-generator-m.webp"
}

$catIds = @('6_1','6_2','6_3','7_1','7_2','7_3','8_1','8_2','8_3','9_1','9_2','9_3','10_1','10_2','10_3')
$dogIds = @('1_1','1_2','1_3','2_1','2_2','2_3','3_1','3_2','3_3','4_1','4_2','4_3','5_1','5_2','5_3')

foreach ($kv in $staticFiles.GetEnumerator()) {
    Write-Host "Downloading $($kv.Key)"
    Invoke-WebRequest -Uri $kv.Value -OutFile $kv.Key -TimeoutSec 60
}

foreach ($id in $catIds) {
    $out = "$base\quiz\cat\$id.webp"
    $url = "https://cdn.findpawpal.com/quiz/$id.jpg?f=webp"
    Write-Host "Downloading cat $id"
    Invoke-WebRequest -Uri $url -OutFile $out -TimeoutSec 60
}

foreach ($id in $dogIds) {
    $out = "$base\quiz\dog\$id.webp"
    $url = "https://cdn.findpawpal.com/quiz/$id.jpg?f=webp"
    Write-Host "Downloading dog $id"
    Invoke-WebRequest -Uri $url -OutFile $out -TimeoutSec 60
}

Write-Host "Done"
