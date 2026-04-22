from pathlib import Path
p = Path('public/dashboard.html')
text = p.read_text(encoding='utf-8')
old = 'doc.setFont("UnifrakturMaguntia", "normal");\n              doc.text("ATTENDANCE SHEET", pageWidth / 2, y, {\n                align: "center",\n              });'
new = 'doc.setFont("helvetica", "bold");\n              doc.text("ATTENDANCE SHEET", pageWidth / 2, y, {\n                align: "center",\n              });'
count = text.count(old)
print(f"found {count} occurrences")
text = text.replace(old, new)
p.write_text(text, encoding='utf-8')
