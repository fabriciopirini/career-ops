// Typst resume template for Fabricio Pirini
// Reads data.json from same dir as this template, compiles to PDF
// Compile with: typst compile --font-path ../lib/fonts templates/resume.typ output.pdf
#let data = json("data.json")
// Colors matching portfolio design
#let accent = rgb("#0395de")
#let dark = rgb("#111827")
#let body-color = rgb("#374151")
#let muted = rgb("#737373")
#let gray = rgb("#6b7280")
// Page setup
#set page(
  margin: (top: 50pt, bottom: 50pt, left: 50pt, right: 50pt),
  paper: "a4",
  footer: context [
    #let pg = counter(page).get().at(0)
    #let total = counter(page).final().at(0)
    #grid(
      columns: (1fr, 1fr, 1fr),
      text(size: 8pt, fill: muted)[#datetime.today().display("[month repr:long] [day], [year]")],
      align(center, text(size: 8pt, fill: muted)[#data.name]),
      align(right, text(size: 8pt, fill: muted)[Page #pg of #total]),
    )
  ],
)
#set par(leading: 0.9em) // line height
#set text(font: ("Source Sans 3", "Roboto"), size: 11pt, fill: body-color)
// Section header: first 3 chars in accent, rest in dark
#let section-header(accent-text, rest-text) = {
  text(weight: 900, font: "Roboto", size: 14pt)[
    #text(fill: accent)[#accent-text]#text(fill: dark)[#rest-text]
  ]
  v(0pt) // section header bottom
}
// HEADER
#align(center)[
  #set par(spacing: 0pt)
  #text(size: 24pt, weight: "bold", font: "Roboto", fill: dark)[#data.name]
  #v(10pt)
  #text(size: 11pt, weight: "medium", fill: accent, font: "Source Sans 3")[#smallcaps(data.subtitle)]
  #v(10pt)
  #text(size: 11pt, style: "italic", fill: muted)[#data.location]
  #v(16pt)
  // Contact links inline with space separators
  #for (i, c) in data.contact.enumerate() [
    #if i > 0 {
      h(10pt)
    }
    #box(baseline: 1.5pt, image("icons/" + c.icon + ".svg", height: 9pt))
    #link(c.href)[#text(size: 9pt, fill: body-color)[#c.text]]
  ]
]

#v(10pt)

#text(size: 10pt)[#data.summary]

#v(8pt)

// TECHNICAL SKILLS
#section-header("Tec", "hnical Skills")
#for skill in data.skills [
  #text(size: 10pt)[#text(weight: "bold")[#skill.label:] #skill.value]
  #v(1pt) // between skill items
]

#v(6pt)

// PROFESSIONAL EXPERIENCE
#section-header("Prof", "essional Experience")

#for (i, job) in data.jobs.enumerate() [
  #set par(spacing: 0pt)

  #if (i > 0) {
    v(16pt) // between jobs
  }

  #for (pi, period) in job.periods.enumerate() [
    #let is-first = pi == 0
    #if pi > 0 {
      v(10pt) // pt-2 equivalent for multi-role
    }
    #if is-first {
      // Company + location on same line
      grid(
        columns: (1fr, auto),
        column-gutter: 4pt,
        text(size: 12pt, weight: "bold", font: "Roboto", fill: dark)[#job.company],
        align(right+bottom, text(size: 10pt, fill: accent)[#job.location]),
      )
      v(8pt) // gap between company and role
    }

    // Role + period on same line
    #grid(
      columns: (1fr, auto),
      column-gutter: 4pt,
      text(size: 10pt, weight: "medium", fill: body-color, font: "Source Sans 3")[#smallcaps(period.role)],
      align(right+top, text(size: 10pt, fill: muted)[#period.start - #period.end]),
    )

    // Bullets
    #if period.bullets != none and period.bullets.len() > 0 [
      #v(16pt) // role → bullets
      #for bullet in period.bullets [
        #list(marker: [•], indent: 0pt)[
          #text(size: 10pt, fill: body-color)[#bullet]
        ]
        #v(8pt) // between bullets
      ]
    ]
  ]
]

// EDUCATION
#section-header("Edu", "cation")

#for edu in data.education [
  #set par(spacing: 0pt)
  #grid(
    columns: (1fr, auto),
    column-gutter: 4pt,
    text(size: 12pt, weight: "bold", font: "Roboto", fill: dark)[#edu.school],
    align(right+bottom, text(size: 10pt, fill: accent)[#edu.location]),
  )
  #v(8pt) // gap between school and degree

  #grid(
    columns: (1fr, auto),
    column-gutter: 4pt,
    text(size: 10pt, fill: body-color)[#edu.degree],
    align(right+top, text(size: 10pt, fill: muted)[#edu.years]),
  )
  #v(16pt) // between education items
]
