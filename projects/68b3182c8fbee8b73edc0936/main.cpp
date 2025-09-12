#include <iostream>
#include <string>
#include <limits>

int main() {
    double num1, num2;
    char operation;

    std::cout << "Simple C++ Calculator\n";
    std::cout << "Enter first number: ";
    std::cin >> num1;

    // Input validation for the first number
    while (std::cin.fail()) {
        std::cout << "Invalid input. Please enter a valid number: ";
        std::cin.clear();
        std::cin.ignore(std::numeric_limits<std::streamsize>::max(), '\n');
        std::cin >> num1;
    }

    std::cout << "Enter an operator (+, -, *, /): ";
    std::cin >> operation;

    // Input validation for the operator
    while (operation != '+' && operation != '-' && operation != '*' && operation != '/') {
        std::cout << "Invalid operator. Please enter +, -, *, or /: ";
        std::cin >> operation;
    }

    std::cout << "Enter second number: ";
    std::cin >> num2;

    // Input validation for the second number
    while (std::cin.fail()) {
        std::cout << "Invalid input. Please enter a valid number: ";
        std::cin.clear();
        std::cin.ignore(std::numeric_limits<std::streamsize>::max(), '\n');
        std::cin >> num2;
    }

    double result;

    switch (operation) {
        case '+':
            result = num1 + num2;
            break;
        case '-':
            result = num1 - num2;
            break;
        case '*':
            result = num1 * num2;
            break;
        case '/':
            if (num2 == 0) {
                std::cout << "Error: Division by zero is not allowed.\n";
                return 1; // Exit with an error code
            }
            result = num1 / num2;
            break;
        default:
            std::cout << "Error: Invalid operator.\n";
            return 1; // Exit with an error code
    }

    std::cout << "Result: " << num1 << " " << operation << " " << num2 << " = " << result << std::endl;

    return 0;
}