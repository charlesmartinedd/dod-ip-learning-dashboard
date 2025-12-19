import pandas as pd
import json
import re
from pathlib import Path

script_dir = Path(__file__).parent
df = pd.read_excel(script_dir / "Learning Resources Spreadsheet.xlsx")

def clean_text(text):
    if pd.isna(text):
        return None
    text = str(text)
    text = re.sub(r"[\ufffd\u0080-\u009f]+", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text

def generate_summary(desc):
    if pd.isna(desc) or not desc:
        return ""
    desc = clean_text(desc)
    sentences = re.split(r"(?<=[.!?])\s+", desc)
    summary = " ".join(sentences[:3])
    if len(summary) > 300:
        summary = summary[:297] + "..."
    return summary

resources = []
for i, row in df.iterrows():
    if i == 60:
        continue
    title = clean_text(row["Title"])
    if not title or title == "N/A":
        continue
    raw_type = str(row["Type"]) if pd.notna(row["Type"]) else "Other"
    if raw_type in ["nan", "N/A", ""]:
        raw_type = "Other"
    date_val = None
    if pd.notna(row["Date Published"]):
        try:
            date_val = pd.to_datetime(row["Date Published"]).strftime("%Y-%m-%d")
        except:
            pass
    resource = {
        "id": len(resources) + 1,
        "title": title,
        "summary": generate_summary(row["Description"]),
        "description": clean_text(row["Description"]) or "",
        "type": raw_type,
        "organization": clean_text(row["Originating Organization"]) or "",
        "audience": clean_text(row["Audience"]) or "",
        "date": date_val,
        "url": clean_text(row["Currently Located"]) or "",
        "videoLength": clean_text(row["Video Length"]) if pd.notna(row["Video Length"]) else None
    }
    resources.append(resource)

output_path = script_dir.parent / "resources_data.json"
with open(output_path, "w", encoding="utf-8") as f:
    json.dump(resources, f, indent=2, ensure_ascii=False)
print(f"Exported {len(resources)} resources to {output_path}")
