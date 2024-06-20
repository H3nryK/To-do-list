import React, { useState, useEffect, useCallback } from 'react';
import { AuthClient } from '@dfinity/auth-client';
import { Actor, HttpAgent } from '@dfinity/agent';
import { idlFactory } from '../declarations/todo_backend/todo_backend.did.js';
import { canisterId } from '../declarations/todo_backend/index.js';

const TodoList = () => {
  const [authClient, setAuthClient] = useState(null);
  const [actor, setActor] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const initAuth = useCallback(async () => {
    try {
      const client = await AuthClient.create();
      setAuthClient(client);

      if (await client.isAuthenticated()) {
        handleAuthenticated(client);
      }
    } catch (err) {
      setError(`Failed to initialize auth: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  const handleAuthenticated = async (client) => {
    const identity = await client.getIdentity();
    initActor(identity);
  };

  const initActor = (identity) => {
    const agent = new HttpAgent({ identity });

    // When deploying live, remove this line
    agent.fetchRootKey().catch(console.error);

    const actorInstance = Actor.createActor(idlFactory, {
      agent,
      canisterId: canisterId,
    });
    setActor(actorInstance);
    fetchTasks(actorInstance).catch(console.error);
  };

  const login = async () => {
    try {
      await authClient.login({
        identityProvider: process.env.REACT_APP_II_URL || "https://identity.ic0.app",
        onSuccess: () => {
          handleAuthenticated(authClient);
        },
      });
    } catch (err) {
      setError(`Login failed: ${err.message}`);
    }
  };

  const logout = async () => {
    try {
      await authClient.logout();
      setActor(null);
      setTasks([]);
    } catch (err) {
      setError(`Logout failed: ${err.message}`);
    }
  };

  const fetchTasks = async (actorInstance) => {
    try {
      const result = await actorInstance.getAllTasks();
      setTasks(result);
    } catch (err) {
      setError(`Failed to fetch tasks: ${err.message}`);
    }
  };

  const addTask = async () => {
    if (newTask.trim() !== '' && actor) {
      try {
        await actor.addTask(newTask);
        setNewTask('');
        await fetchTasks(actor);
      } catch (err) {
        setError(`Failed to add task: ${err.message}`);
      }
    }
  };

  const updateTask = async (id, description, completed) => {
    if (actor) {
      try {
        await actor.updateTask(id, description, completed);
        await fetchTasks(actor);
      } catch (err) {
        setError(`Failed to update task: ${err.message}`);
      }
    }
  };

  const deleteTask = async (id) => {
    if (actor) {
      try {
        await actor.deleteTask(id);
        await fetchTasks(actor);
      } catch (err) {
        setError(`Failed to delete task: ${err.message}`);
      }
    }
  };

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      {!actor ? (
        <button onClick={login}>Login with Internet Identity</button>
      ) : (
        <div>
          <button onClick={logout}>Logout</button>
          <h1>To-Do List</h1>
          <input
            type="text"
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            placeholder="New task"
          />
          <button onClick={addTask}>Add Task</button>
          <ul>
            {tasks.map((task) => (
              <li key={task.id}>
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={() => updateTask(task.id, task.description, !task.completed)}
                />
                {task.description}
                <button onClick={() => deleteTask(task.id)}>Delete</button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default TodoList;