// Shared Typst configuration for resume and cover letter templates
// Extracted for DRY and easier styling tweaks

// === COLORS ===
#let accent = rgb("#0395de")
#let dark = rgb("#111827")
#let body-color = rgb("#374151")
#let muted = rgb("#737373")
#let gray = rgb("#6b7280")

// === FONTS ===
#let fonts = ("Source Sans 3", "Roboto")

// === SPACING ===
#let sp-section-after = 6pt
#let sp-job-between = 16pt
#let sp-bullet-between = 8pt
#let sp-role-between = 10pt
#let sp-header-gap = 8pt
#let sp-section-header-bottom = 0pt

// === SIZES ===
#let size-body = 11pt
#let size-header = 14pt
#let size-name = 24pt
#let size-subtitle = 11pt
#let size-contact = 9pt
#let size-skills = 10pt
#let size-footer = 8pt

// === HELPERS ===

// Section header: first 3 chars in accent, rest in dark
#let section-header(accent-text, rest-text) = {
  text(weight: 900, font: "Roboto", size: size-header)[
    #text(fill: accent)[#accent-text]#text(fill: dark)[#rest-text]
  ]
  v(sp-section-header-bottom)
}

// Contact icon + link combo
#let contact-icon-link(icon, href, text) = {
  box(baseline: 1.5pt, image("icons/" + icon + ".svg", height: 9pt))
  link(href)[#text(size: size-contact, fill: body-color)[#text]]
}

// Job/company grid layout
#let job-grid(company, location) = {
  grid(
    columns: (1fr, auto),
    column-gutter: 4pt,
    text(size: 12pt, weight: "bold", font: "Roboto", fill: dark)[#company],
    align(right+bottom, text(size: 10pt, fill: accent)[#location]),
  )
}

// Role/period grid layout
#let role-grid(role, start, end) = {
  grid(
    columns: (1fr, auto),
    column-gutter: 4pt,
    text(size: 10pt, weight: "medium", fill: body-color, font: "Source Sans 3")[#smallcaps(role)],
    align(right+top, text(size: 10pt, fill: muted)[#start - #end]),
  )
}

// Education grid layout
#let edu-grid(school, location, degree, years) = {
  grid(
    columns: (1fr, auto),
    column-gutter: 4pt,
    text(size: 12pt, weight: "bold", font: "Roboto", fill: dark)[#school],
    align(right+bottom, text(size: 10pt, fill: accent)[#location]),
  )
  v(sp-header-gap)
  grid(
    columns: (1fr, auto),
    column-gutter: 4pt,
    text(size: 10pt, fill: body-color)[#degree],
    align(right+top, text(size: 10pt, fill: muted)[#years]),
  )
}