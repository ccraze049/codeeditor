// FILENAME: App.jsx
import React, { useState } from 'react';
import 'style/App.css';

function App() {
  const [tasks, setTasks] = useState([]);
  const [input, setInput] = useState('');

  const addTask = () => {
    if (input.trim()) {
      setTasks([...tasks, { id: Date.now(), text: input, completed: false }]);
      setInput('');
    }
  };

  const toggleTask = (id) => {
    setTasks(tasks.map(task =>
      task.id === id ? { ...task, completed: !task.completed } : task
    ));
  };

  const deleteTask = (id) => {
    setTasks(tasks.filter(task => task.id !== id));
  };

  return (
    <div className="container">
      <h1>To-Do List</h1>
      <ul className="todo-list">
        {tasks.map(task => (
          <li key={task.id} className={`todo-item ${task.completed ? 'completed' : ''}`}>
            <input type="checkbox" checked={task.completed} onChange={() => toggleTask(task.id)} />
            <span>{task.text}</span>
            <button onClick={() => deleteTask(task.id)}>X</button>
          </li>
        ))}
      </ul>
      <form className="add-form" onSubmit={e => { e.preventDefault(); addTask(); }}>
        <input className="add-input" value={input} onChange={e => setInput(e.target.value)} placeholder="Add new task..." />
        <button className="add-button" type="submit">Add</button>
      </form>
    </div>
  );
}

export default App;