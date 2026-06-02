// Typst resume template for Fabricio Pirini
// Reads data.json from same dir as this template, compiles to PDF
// Compile with: typst compile --font-path ../lib/fonts templates/resume.typ output.pdf

// Load shared configuration
// NOTE: #include doesn't work as expected with variable exports
// Variables defined inline for now. To change:
// - Colors: accent, dark, body-color, muted, gray
// - Spacing: sp-job-between, sp-bullet-between, etc.
// - Sizes: size-body, size-header, etc.

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

#let data = json("data.json")

// Page setup
#set page(
  margin: (top: 50pt, bottom: 50pt, left: 50pt, right: 50pt),
  paper: "a4",
  footer: context [
    #let pg = counter(page).get().at(0)
    #let total = counter(page).final().at(0)
    #grid(
      columns: (1fr, 1fr, 1fr),
      text(size: size-footer, fill: muted)[#datetime.today().display("[month repr:long] [day], [year]")],
      align(center, text(size: size-footer, fill: muted)[#data.name]),
      align(right, text(size: size-footer, fill: muted)[Page #pg of #total]),
    )
  ],
)

#set par(leading: 0.9em)
#set text(font: fonts, size: size-body, fill: body-color)

// HEADER
#align(center)[
  #set par(spacing: 0pt)
  #text(size: size-name, weight: "bold", font: "Roboto", fill: dark)[#data.name]
  #v(10pt)
  #text(size: size-subtitle, weight: "medium", fill: accent, font: "Source Sans 3")[#smallcaps(data.subtitle)]
  #v(10pt)
  #text(size: 11pt, style: "italic", fill: muted)[#data.location]
  #v(16pt)

  // Contact links inline with space separators
  #for (i, c) in data.contact.enumerate() [
    #if i > 0 {
      h(10pt)
    }
    #box(baseline: 1.5pt, image("icons/" + c.icon + ".svg", height: 9pt))
    #link(c.href)[#text(size: size-contact, fill: body-color)[#c.text]]
  ]
]

#v(10pt)
#text(size: 10pt)[#data.summary]
#v(8pt)

// TECHNICAL SKILLS
#section-header("Tec", "hnical Skills")
#v(sp-section-after)

#for skill in data.skills [
  #text(size: size-skills)[#text(weight: "bold")[#skill.label:] #skill.value]
  #v(1pt)
]

#v(sp-section-after)

// PROFESSIONAL EXPERIENCE
#section-header("Prof", "essional Experience")

#for (i, job) in data.jobs.enumerate() [
  #set par(spacing: 0pt)
  #if (i > 0) {
    v(sp-job-between)
  }

  #for (pi, period) in job.periods.enumerate() [
    #let is-first = pi == 0
    #if pi > 0 {
      v(sp-role-between)
    }

    #if is-first {
      // Company + location on same line
      job-grid(job.company, job.location)
      v(sp-header-gap)
    }

    // Role + period on same line
    #role-grid(period.role, period.start, period.end)

    // Bullets
    #if period.bullets != none and period.bullets.len() > 0 [
      #v(16pt)
      #for bullet in period.bullets [
        #list(marker: [•], indent: 0pt)[
          #text(size: size-skills, fill: body-color)[#bullet]
        ]
        #v(sp-bullet-between)
      ]
    ]
  ]
]

// EDUCATION
#section-header("Edu", "cation")

#for edu in data.education [
  #set par(spacing: 0pt)
  #edu-grid(edu.school, edu.location, edu.degree, edu.years)
  #v(sp-job-between)
]