#!/usr/bin/env python3
"""
Transcribe intro.mp4 using OpenAI Whisper API
Generates timestamped captions for the dashboard video
"""

import openai
import json
import os

# Get API key from environment
client = openai.OpenAI()

video_path = os.path.join(os.path.dirname(__file__), "intro.mp4")

print(f"Transcribing: {video_path}")
print("This may take a moment...")

with open(video_path, "rb") as audio_file:
    transcript = client.audio.transcriptions.create(
        model="whisper-1",
        file=audio_file,
        response_format="verbose_json",
        timestamp_granularities=["segment"]
    )

# Convert to caption format
captions = []
for segment in transcript.segments:
    captions.append({
        "start": round(segment.start, 2),
        "end": round(segment.end, 2),
        "text": segment.text.strip()
    })

# Save to JSON file
output_path = os.path.join(os.path.dirname(__file__), "intro_captions.json")
with open(output_path, "w") as f:
    json.dump(captions, f, indent=2)

print(f"\nSaved to: {output_path}")
print(f"\nFound {len(captions)} caption segments:\n")

# Print JavaScript-ready format
print("// Caption data for dashboard:")
print("const INTRO_CAPTIONS = [")
for cap in captions:
    print(f'    {{ start: {cap["start"]}, end: {cap["end"]}, text: "{cap["text"]}" }},')
print("];")
