import React from 'react';
import '../styles/MainContent.css';

function MainContent() {
  const [todos, setTodos] = useState([]);
  const [input, setInput] = useState('');

  const addTodo = () => {
    if (input.trim()) {
      setTodos([...todos, { id: Date.now(), text: input, completed: false }]);
      setInput('');
    }
  };

  const toggleCompleted = (id) => {
    const updatedTodos = todos.map(todo => 
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    );
    setTodos(updatedTodos);
  };

  return (
    <div className="main-content">
      <TodoForm input={input} setInput={setInput} addTodo={addTodo} />
      <TodoList todos={todos} toggleCompleted={toggleCompleted} />
    </div>
  );
}

export default MainContent;