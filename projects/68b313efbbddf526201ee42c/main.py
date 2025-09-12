#!/usr/bin/env python3
"""A simple calculator application."""

def add(x, y):
    """Add two numbers."""
    return x + y

def subtract(x, y):
    """Subtract two numbers."""
    return x - y

def multiply(x, y):
    """Multiply two numbers."""
    return x * y

def divide(x, y):
    """Divide two numbers."""
    if y == 0:
        return "Cannot divide by zero"
    return x / y

def power(x, y):
    """Calculate x to the power of y."""
    return x ** y

def square_root(x):
    """Calculate the square root of x."""
    if x < 0:
        return "Cannot calculate square root of negative number"
    return x ** 0.5

def main():
    """Main function to run the calculator."""
    print("Simple Calculator")
    print("Operations: add, subtract, multiply, divide, power, square_root, quit")

    while True:
        try:
            operation = input("Enter operation: ").lower()

            if operation == 'quit':
                print("Goodbye!")
                break

            if operation in ('add', 'subtract', 'multiply', 'divide', 'power'):
                num1 = float(input("Enter first number: "))
                num2 = float(input("Enter second number: "))

                if operation == 'add':
                    print("Result:", add(num1, num2))
                elif operation == 'subtract':
                    print("Result:", subtract(num1, num2))
                elif operation == 'multiply':
                    print("Result:", multiply(num1, num2))
                elif operation == 'divide':
                    print("Result:", divide(num1, num2))
                elif operation == 'power':
                    print("Result:", power(num1, num2))

            elif operation == 'square_root':
                num = float(input("Enter number: "))
                print("Result:", square_root(num))
            else:
                print("Invalid operation")

        except ValueError:
            print("Invalid input. Please enter numbers.")
        except Exception as e:
            print(f"An error occurred: {e}")

if __name__ == "__main__":
    main()