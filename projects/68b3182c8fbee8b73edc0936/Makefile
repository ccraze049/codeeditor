CXX = g++
CXXFLAGS = -std=c++17 -Wall -Wextra -pedantic
TARGET = calculator
SOURCES = main.cpp

$(TARGET): $(SOURCES)
	$(CXX) $(CXXFLAGS) -o $(TARGET) $(SOURCES)

run: $(TARGET)
	./$(TARGET)

clean:
	rm -f $(TARGET)