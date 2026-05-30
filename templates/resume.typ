// Typst resume template for Fabricio Pirini
// Reads data.json from same directory as this template, compiles to PDF
// Compile with: typst compile --font-path ../lib/fonts templates/resume.typ output.pdf

#let data = json("data.json")

// Colors matching portfolio design
#let accent = rgb("#0395de")
#let dark = rgb("#111827")
#let body-color = rgb("#374151")
#let muted = rgb("#9ca3af")
#let gray = rgb("#6b7280")

// Page setup
#set page(
  margin: (top: 48pt, bottom: 48pt, left: 48pt, right: 48pt),
  paper: "a4",
)
#set text(font: ("Source Sans 3", "Roboto"), size: 11pt, fill: body-color)

// Section header: first 3 chars in accent, rest in dark
#let section-header(accent-text, rest-text) = {
  text(weight: 900, font: "Roboto", size: 13pt)[
    #text(fill: accent)[#accent-text]#text(fill: dark)[#rest-text]
  ]
  v(8pt)
}

// ============================================================
// HEADER
// ============================================================
#align(center)[
  #text(size: 28pt, weight: "bold", font: "Roboto", fill: dark)[#data.name]
  #v(4pt)
  #text(size: 12pt, weight: "bold", fill: accent)[#data.subtitle]
  #v(4pt)
  #text(size: 12pt, style: "italic", fill: muted)[#data.location]
  #v(4pt)
  // Contact links inline with · separators
  #for (i, c) in data.contact.enumerate() [
    #if i > 0 {
      text(size: 9pt, fill: gray)[ · ]
    }
    #box(baseline: 3pt, image("icons/" + c.icon + ".svg", height: 9pt))
    #link(c.href)[#text(size: 9pt, fill: body-color)[#c.text]]
  ]
]

#v(18pt)

// ============================================================
// PROFESSIONAL SUMMARY
// ============================================================
#section-header("Pro", "fessional Summary")
#set par(leading: 0.5em)
#text(size: 11pt)[#data.summary]

#v(16pt)

// ============================================================
// TECHNICAL SKILLS
// ============================================================
#section-header("Tec", "hnical Skills")
#for skill in data.skills [
  #text(size: 11pt)[#text(weight: "bold")[#skill.label:] #skill.value]
]

#v(16pt)

// ============================================================
// PROFESSIONAL EXPERIENCE
// ============================================================
#section-header("Prof", "essional Experience")

#for job in data.jobs [
  #for (pi, period) in job.periods.enumerate() [
    #let is-first = pi == 0
    #if pi > 0 {
      v(8pt)
    }
    #if is-first {
      text(size: 13pt, weight: "bold", font: "Roboto", fill: dark)[#job.company]
      v(2pt)
    }
    #let meta = if is-first {
      [#job.location  |  #period.start - #period.end]
    } else {
      [#period.start - #period.end]
    }

    // Role + meta in one row
    #grid(
      columns: (1fr, auto),
      column-gutter: 8pt,
      text(size: 11pt, fill: body-color)[#period.role],
      align(right, text(size: 10pt, fill: gray)[#meta]),
    )

    // Bullets
    #if period.bullets != none and period.bullets.len() > 0 [
      #v(2pt)
      #for bullet in period.bullets [
        #list(marker: [•], indent: 12pt)[
          #text(size: 11pt, fill: body-color)[#bullet]
        ]
      ]
    ]
  ]
  #v(8pt)
]

// ============================================================
// EDUCATION
// ============================================================
#section-header("Edu", "cation")

#for edu in data.education [
  #grid(
    columns: (1fr, auto),
    column-gutter: 8pt,
    text(size: 13pt, weight: "bold", font: "Roboto", fill: dark)[#edu.school],
    align(right, text(size: 11pt, fill: gray)[#edu.location]),
  )
  #text(size: 11pt, fill: body-color)[#edu.degree]
  #text(size: 10pt, fill: muted)[#edu.years]
  #v(8pt)
]
