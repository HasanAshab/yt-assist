import { useCallback } from 'react';
import { useAppContext } from '../contexts/AppContext';
import type { Task } from '../types';

export const useTasks = () => {
  const { state, dispatch } = useAppContext();

  const setTasks = useCallback((tasks: Task[]) => {
    dispatch({ type: 'SET_TASKS', payload: tasks });
  }, [dispatch]);

  const addTask = useCallback((task: Task) => {
    dispatch({ type: 'ADD_TASK', payload: task });
  }, [dispatch]);

  const updateTask = useCallback((task: Task) => {
    dispatch({ type: 'UPDATE_TASK', payload: task });
  }, [dispatch]);

  const deleteTask = useCallback((taskId: string) => {
    dispatch({ type: 'DELETE_TASK', payload: taskId });
  }, [dispatch]);

  const setLoading = useCallback((loading: boolean) => {
    dispatch({ type: 'SET_TASK_LOADING', payload: loading });
  }, [dispatch]);

  // Computed values
  const getUserTasks = useCallback(() => {
    return state.tasks.items.filter(task => task.type === 'user');
  }, [state.tasks.items]);

  const getSystemTasks = useCallback(() => {
    return state.tasks.items.filter(task => task.type === 'system');
  }, [state.tasks.items]);

  const getActiveTasks = useCallback(() => {
    const now = new Date();
    return state.tasks.items.filter(task => task.expires_at && new Date(task.expires_at) > now);
  }, [state.tasks.items]);

  const getExpiredTasks = useCallback(() => {
    const now = new Date();
    return state.tasks.items.filter(task => task.expires_at && new Date(task.expires_at) <= now);
  }, [state.tasks.items]);

  const getTodaysTasks = useCallback(() => {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    
    return state.tasks.items.filter(task => {
      const taskDate = new Date(task.created_at);
      return taskDate >= startOfDay && taskDate < endOfDay;
    });
  }, [state.tasks.items]);

  const getRemainingTasksCount = useCallback(() => {
    return getActiveTasks().length;
  }, [getActiveTasks]);

  return {
    // State
    tasks: state.tasks.items,
    loading: state.tasks.loading,
    
    // Actions
    setTasks,
    addTask,
    updateTask,
    deleteTask,
    setLoading,
    
    // Computed values
    userTasks: getUserTasks(),
    systemTasks: getSystemTasks(),
    activeTasks: getActiveTasks(),
    expiredTasks: getExpiredTasks(),
    todaysTasks: getTodaysTasks(),
    remainingTasksCount: getRemainingTasksCount(),
  };
};