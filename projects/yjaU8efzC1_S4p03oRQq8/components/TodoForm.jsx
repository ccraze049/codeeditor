import React from 'react';
import '../styles/TodoForm.css';

function TodoForm({ input, setInput, addTodo }) {
  return (
    <form className="todo-form" onSubmit={(e) => { e.preventDefault(); addTodo(); }}>
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Add new task..."
      />
      <button type="submit">Add</button>
    </form>
  );
}

export default TodoForm;