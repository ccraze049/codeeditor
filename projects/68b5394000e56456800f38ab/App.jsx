import React, { useState, useEffect } from 'react';
import './styles/App.css';
import TodoItem from './components/TodoItem';
import TodoForm from './components/TodoForm';

function App() {
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Get project ID from URL path
  const projectId = window.location.pathname.split('/')[2] || '68b5394000e56456800f38ab';

  useEffect(() => {
    // Load todos from API
    const loadTodos = async () => {
      try {
        const response = await fetch(`/api/projects/${projectId}/data/todos`);
        if (response.ok) {
          const data = await response.json();
          setTodos(data.data || []);
        }
      } catch (error) {
        console.error('Failed to load todos:', error);
        setTodos([]);
      } finally {
        setLoading(false);
      }
    };
    
    loadTodos();
  }, [projectId]);

  useEffect(() => {
    // Save todos to API whenever todos change
    if (!loading && todos.length >= 0) {
      const saveTodos = async () => {
        try {
          await fetch(`/api/projects/${projectId}/data/todos`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data: todos }),
          });
        } catch (error) {
          console.error('Failed to save todos:', error);
        }
      };
      
      saveTodos();
    }
  }, [todos, loading, projectId]);

  const addTodo = (text) => {
    const newTodo = {
      id: Date.now(),
      text,
      completed: false,
    };
    setTodos([...todos, newTodo]);
  };

  const toggleComplete = (id) => {
    setTodos(
      todos.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  };

  const deleteTodo = (id) => {
    setTodos(todos.filter((todo) => todo.id !== id));
  };

  if (loading) {
    return (
      <div className="app">
        <header className="app-header">
          <h1>My Todo List</h1>
          <p>Loading todos...</p>
        </header>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>My Todo List</h1>
        <p style={{fontSize: '12px', color: '#666', margin: '5px 0'}}>
          ✅ Data saved to MongoDB (no localStorage)
        </p>
      </header>

      <main className="app-main">
        <TodoForm addTodo={addTodo} />

        {todos.length === 0 ? (
            <p className="empty-state">No todos yet. Add some!</p>
          ) : (
            <ul className="todo-list">
              {todos.map((todo) => (
                <TodoItem
                  key={todo.id}
                  todo={todo}
                  toggleComplete={toggleComplete}
                  deleteTodo={deleteTodo}
                />
              ))}
            </ul>
          )}
      </main>

      <footer className="app-footer">
        <p>&copy; {new Date().getFullYear()} My Todo App</p>
      </footer>
    </div>
  );
}

export default App;