"""
Simple Title Creator
Usage:
    python title_creator.py
It will ask for keywords and options, then generate titles and save to 'generated_titles.csv'.
"""
import random
import csv
import sys
from typing import List

# --- Configurable word-banks & templates ---
POWER_WORDS = [
    "Ultimate", "Amazing", "Secret", "Proven", "Essential", "Crazy",
    "Simple", "Fast", "Step-by-Step", "Complete", "Beginner's", "Advanced"
]

EMOTION_WORDS = [
    "Incredible", "Unbelievable", "Heartwarming", "Shocking", "Funny",
    "Must-See", "Mind-Blowing", "Timeless"
]

ACTION_PHRASES = [
    "How to", "Learn to", "Make", "Create", "Build", "Master",
    "Avoid", "Stop", "Start", "Boost", "Increase"
]

TEMPLATES = [
    "{power}: {keywords} — {promise}",
    "{action} {keywords} in {time_frame}",
    "{keywords}: {power} Tips You Need",
    "{number} {power} Ways to {keywords}",
    "{keywords} — {emotion} Story",
    "{keywords} | {power} Guide",
    "{action} {keywords} like a {role}",
    "The {power} Truth About {keywords}",
    "{keywords}? {short_hook}",
    "{keywords}: {benefit} in {time_frame}"
]

TIME_FRAMES = ["5 minutes", "10 minutes", "1 hour", "a day", "a week", "30 seconds"]
ROLES = ["Pro", "Expert", "Beginner", "Artist", "Hacker", "Chef", "Designer"]

SHORT_HOOKS = [
    "You'll never guess", "Don't make this mistake", "Watch now", "Before it's too late",
    "What everyone misses"
]

PROMISES = [
    "Get results fast", "No experience needed", "Work every time",
    "Save time and money", "Step-by-step", "Without tools"
]

# --- Helper functions ---
def title_case(s: str) -> str:
    # basic title case but keep small words lowercase if not first
    parts = s.split()
    small = {"and","or","the","a","an","in","on","with","to","for","of"}
    res = []
    for i,p in enumerate(parts):
        if i != 0 and p.lower() in small:
            res.append(p.lower())
        else:
            res.append(p.capitalize())
    return " ".join(res)

def clean_keywords(keywords: str) -> str:
    # normalize spacing
    return " ".join(keywords.strip().split())

def choose(lst):
    return random.choice(lst)

# --- Core generator ---
def generate_titles(keywords: str,
                    tone: str = "neutral",
                    n: int = 20,
                    max_length: int = 60) -> List[str]:
    keywords = clean_keywords(keywords)
    titles = set()
    attempts = 0
    while len(titles) < n and attempts < n * 10:
        tpl = choose(TEMPLATES)
        filled = tpl.format(
            power=choose(POWER_WORDS),
            keywords=keywords,
            promise=choose(PROMISES),
            action=choose(ACTION_PHRASES),
            time_frame=choose(TIME_FRAMES),
            number=random.randint(3,12),
            role=choose(ROLES),
            short_hook=choose(SHORT_HOOKS),
            emotion=choose(EMOTION_WORDS),
            benefit=random.choice(["More views", "More sales", "Faster results", "Better skills"])
        )
        # Tone adjustments (simple)
        if tone == "clickbait":
            if not filled.endswith("!"):
                filled = filled + "!"
            if random.random() < 0.3:
                filled = "You won't believe " + filled
        elif tone == "informative":
            # remove excessive punctuation
            filled = filled.replace("!", "")
            if not filled.lower().startswith(("how ", "learn ", "what ", "why ")):
                if random.random() < 0.4:
                    filled = "How " + filled[0].lower() + filled[1:]
        # enforce max length
        if len(filled) > max_length:
            # try trimming promise pieces
            filled = filled[:max_length].rsplit(' ',1)[0] + "..."
        filled = title_case(filled)
        titles.add(filled)
        attempts += 1
    return sorted(titles)

# --- CLI / Example usage ---
def main():
    print("==== Python Title Creator ====")
    keywords = input("Keywords / Topic (e.g. 'python web scraping'): ").strip()
    if not keywords:
        print("Keywords required. Exiting.")
        sys.exit(1)

    tone = input("Tone? (neutral / clickbait / informative) [neutral]: ").strip().lower() or "neutral"
    try:
        n = int(input("How many titles to generate? [20]: ") or "20")
    except ValueError:
        n = 20
    try:
        max_length = int(input("Max title length (chars) [60]: ") or "60")
    except ValueError:
        max_length = 60

    generated = generate_titles(keywords, tone, n, max_length)
    print("\nGenerated Titles:\n")
    for i,t in enumerate(generated,1):
        print(f"{i}. {t}")

    # save to CSV
    filename = "generated_titles.csv"
    with open(filename, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["title"])
        for t in generated:
            writer.writerow([t])

    print(f"\nSaved {len(generated)} titles to '{filename}'")

if __name__ == "__main__":
    main()