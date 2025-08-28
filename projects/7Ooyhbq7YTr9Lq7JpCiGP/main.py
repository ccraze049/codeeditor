#!/usr/bin/env python3
import csv

def generate_titles(keywords, tone="professional", n=5, max_length=60):
    """Generate sample titles based on keywords"""
    titles = []
    tones = {
        "professional": ["Guide to", "Complete", "Ultimate", "Advanced", "Mastering"],
        "casual": ["Easy", "Simple", "Quick", "Fun", "Cool"],
        "exciting": ["Amazing", "Incredible", "Awesome", "Mind-blowing", "Revolutionary"]
    }
    
    tone_words = tones.get(tone, tones["professional"])
    
    for i in range(n):
        keyword = keywords[i % len(keywords)].strip()
        tone_word = tone_words[i % len(tone_words)]
        title = f"{tone_word} {keyword.title()} Tutorial"
        
        # Ensure title is within max length
        if len(title) > max_length:
            title = title[:max_length-3] + "..."
            
        titles.append(title)
    
    return titles

def main():
    print("==== Python Title Creator ====")
    
    # Use default parameters instead of input() to avoid hanging
    max_length = 60
    keywords = ["python", "coding", "tutorial", "programming", "development"]
    tone = "professional"
    n = 5
    
    print(f"Using keywords: {', '.join(keywords)}")
    print(f"Tone: {tone}")
    print(f"Max length: {max_length} chars")
    print(f"Generating {n} titles...\n")
    
    generated = generate_titles(keywords, tone, n, max_length)
    print("Generated Titles:")
    for i, title in enumerate(generated, 1):
        print(f"{i}. {title}")
        
    # Save to CSV
    filename = "generated_titles.csv"
    with open(filename, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["title"])
        for title in generated:
            writer.writerow([title])
            
    print(f"\nSaved {len(generated)} titles to '{filename}'")

if __name__ == "__main__":
    main()