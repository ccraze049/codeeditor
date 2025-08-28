#!/usr/bin/env python3

def main():
    print("Hello World!")
    print("Your Python application is running successfully.")
    
    # Simple counter example
    count = 0
    while True:
        user_input = input("Press Enter to increment counter (or 'quit' to exit): ")
        if user_input.lower() == 'quit':
            break
        count += 1
        print(f"Count: {count}")
    
    print("Goodbye!")

if __name__ == "__main__":
    main()