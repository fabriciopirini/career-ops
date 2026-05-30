// Typst cover letter template for Fabricio Pirini
// Reads data.json from same directory as this template, compiles to PDF
// Compile with: typst compile --font-path ../lib/fonts templates/cover-letter.typ output.pdf
// Matches resume design: same fonts, accent color, header style

#let data = json("data.json")

// Colors matching portfolio design
#let accent = rgb("#0395de")
#let dark = rgb("#111827")
#let body-color = rgb("#374151")
#let muted = rgb("#9ca3af")
#let gray = rgb("#6b7280")

// Page setup
#set page(
  margin: (top: 56pt, bottom: 56pt, left: 56pt, right: 56pt),
  paper: "a4",
)
#set text(font: ("Source Sans 3", "Roboto"), size: 11pt, fill: body-color)

// ============================================================
// HEADER (matches resume)
// ============================================================
#align(center)[
  #text(size: 28pt, weight: "bold", font: "Roboto", fill: dark)[#data.name]
  #v(4pt)
  #text(size: 11pt, weight: "bold", fill: accent)[#data.subtitle]
  #v(4pt)
  #text(size: 11pt, style: "italic", fill: muted)[#data.location]
  #v(4pt)
  // Contact row (text only, no icons for letter)
  #text(size: 10pt, fill: body-color)[
    #data.contact.map(c => c.text).join("  |  ")
  ]
]

// Divider
#v(16pt)
#line(length: 100%, stroke: gray + 0.3pt)
#v(16pt)

// ============================================================
// DATE
// ============================================================
#text(size: 11pt)[#data.date]

#v(12pt)

// ============================================================
// SALUTATION
// ============================================================
#text(size: 11pt)[#data.greeting]

#v(8pt)

// ============================================================
// BODY PARAGRAPHS
// ============================================================
#set par(leading: 0.55em)
#for para in data.paragraphs [
  #text(size: 11pt)[#para]
  #v(8pt)
]

// ============================================================
// CLOSING
// ============================================================
#v(4pt)
#text(size: 11pt)[#data.closing]
#v(12pt)
#text(size: 11pt, weight: "bold", fill: dark)[#data.name]
