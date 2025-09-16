// Basic usage: log a string
console.log("Hello, world!");

// Log a variable's value
let myVariable = 42;
console.log("The value of myVariable is:", myVariable); // Recommended: include a descriptive label

// Log multiple values at once
let name = "Alice";
let age = 30;
console.log("Name:", name, "Age:", age);

// Log objects
let person = {
  name: "Bob",
    city: "New York"
    };
    console.log("Person object:", person); // Displays the object's properties

    // Log arrays
    let numbers = [1, 2, 3, 4, 5];
    console.log("Numbers array:", numbers);

    // Advanced logging: use format specifiers
    let score = 95;
    console.log("Your score is %d points!", score); // %d is a placeholder for a number

    // Conditional logging
    let debugMode = true;
if (debugMode) {
  console.log("Debugging information: ...");
}