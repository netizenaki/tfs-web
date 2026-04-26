$files = @("index.html","about.html","leadership.html","contact.html","pathways.html","activities-achievement.html","destination-countries.html","germany.html","403.html","404.html","500.html","503.html")
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
$changed = New-Object System.Collections.Generic.List[string]

foreach ($f in $files) {
  if (-not (Test-Path $f)) { Write-Host "Missing: $f"; continue }
  $content = [System.IO.File]::ReadAllText($f,[System.Text.Encoding]::UTF8)
  $nl = if ($content.Contains("`r`n")) {"`r`n"} else {"`n"}

  $desktopCurrent = if ($f -eq "about.html") { " aria-current=`"page`"" } else { "" }
  $leadershipCurrent = if ($f -eq "leadership.html") { " aria-current=`"page`"" } else { "" }

  $desktopReplacement = @(
    "<li class=`"nav-item nav-group`">",
    ("  <a class=`"nav-link`" href=`"about.html`" aria-label=`"About Us`"{0}>About Us</a>" -f $desktopCurrent),
    "  <div class=`"dropdown`">",
    "    <ul role=`"menu`" aria-label=`"About Us submenu`">",
    ("      <li role=`"none`"><a role=`"menuitem`" href=`"leadership.html`"{0}>Leadership</a></li>" -f $leadershipCurrent),
    "    </ul>",
    "  </div>",
    "</li>"
  ) -join $nl

  $mobileReplacement = @(
    "<details>",
    "  <summary>About Us</summary>",
    ("  <a href=`"leadership.html`"{0}>Leadership</a>" -f $leadershipCurrent),
    "</details>"
  ) -join $nl

  $new = $content
  $new = [regex]::Replace($new,'(?s)<li\s+class="nav-item\s+nav-group">\s*<a[^>]*aria-label="About Us"[^>]*>\s*About Us\s*</a>\s*<div\s+class="dropdown">.*?</div>\s*</li>',$desktopReplacement,1)
  $new = [regex]::Replace($new,'(?s)<details\b[^>]*>\s*<summary>\s*About Us\s*</summary>.*?</details>',$mobileReplacement,1)

  if ($new -ne $content) {
    [System.IO.File]::WriteAllText($f,$new,$utf8NoBom)
    $changed.Add($f) | Out-Null
  }
}

Write-Host "Changed files:"
if ($changed.Count -gt 0) {
  $changed | ForEach-Object { Write-Host " - $_" }
} else {
  Write-Host " - (none)"
}

Write-Host "`nRemaining role=`"menuitem`">About Us< occurrences:"
foreach ($f in $files) {
  $txt = [System.IO.File]::ReadAllText($f,[System.Text.Encoding]::UTF8)
  if ($txt -match 'role="menuitem">\s*About Us\s*<') { Write-Host " - $f" }
}

Write-Host "`nPer-file checks:"
foreach ($f in $files) {
  $txt = [System.IO.File]::ReadAllText($f,[System.Text.Encoding]::UTF8)
  $hasDesktopAbout = $txt -match 'aria-label="About Us"'
  $hasMobileSummary = $txt -match '<summary>\s*About Us\s*</summary>'
  $mobileBlockHasLeadership = $txt -match '(?s)<details\b[^>]*>\s*<summary>\s*About Us\s*</summary>.*?href="leadership\.html".*?</details>'
  Write-Host ("{0}: aria-label About Us={1}; summary About Us={2}; mobile block has leadership.html={3}" -f $f,$hasDesktopAbout,$hasMobileSummary,$mobileBlockHasLeadership)
}
