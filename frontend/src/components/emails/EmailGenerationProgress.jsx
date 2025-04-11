// frontend/src/components/emails/EmailGenerationProgress.jsx
import { useState, useEffect } from 'react';
import { tasks as tasksApi } from '../../lib/api';

import { Progress } from '../ui/progress';
import { Alert, AlertDescription } from '../ui/alert';
import { Check, X, AlertTriangle, RotateCw } from 'lucide-react';

export function EmailGenerationProgress({ tasks }) {
  const [taskStatus, setTaskStatus] = useState({});
  const [isPolling, setIsPolling] = useState(true);
  const [error, setError] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  
  useEffect(() => {
    let pollingId = null;
    
    const fetchStatus = async () => {
      try {
        let allCompleted = true;
        const newStatus = { ...taskStatus };
        const taskIdsToCheck = [];
        
        // Only check tasks that are not completed or failed
        for (const task of tasks) {
          if (
            newStatus[task.task_id]?.status !== 'completed' && 
            newStatus[task.task_id]?.status !== 'failed'
          ) {
            taskIdsToCheck.push(task.task_id);
          }
        }
        
        // If all tasks are complete, stop polling
        if (taskIdsToCheck.length === 0) {
          setIsPolling(false);
          return;
        }
        
        // Batch request all task statuses in one go
        const statuses = await Promise.all(
          taskIdsToCheck.map(id => tasksApi.getStatus(id))
        );
        
        // Update statuses
        taskIdsToCheck.forEach((id, index) => {
          const status = statuses[index];
          newStatus[id] = status;
          
          if (status.status !== 'completed' && status.status !== 'failed') {
            allCompleted = false;
          }
        });
        
        setTaskStatus(newStatus);
        setError(''); // Clear any previous errors
        setRetryCount(0); // Reset retry count on successful requests
        
        if (allCompleted) {
          setIsPolling(false);
        } else {
          // Gradually increase polling interval (2s, 3s, 4s, 5s)
          const baseInterval = Math.min(2000 + (tasks.length * 500), 8000);
          pollingId = setTimeout(fetchStatus, baseInterval);
        }
      } catch (err) {
        console.error("Error polling:", err);
        setError('Error fetching task status. Will retry...');
        
        // Implement exponential backoff on error
        const newRetryCount = retryCount + 1;
        setRetryCount(newRetryCount);
        
        // Calculate backoff: 5s, 10s, 15s, 20s (max)
        const backoff = Math.min(5000 * newRetryCount, 20000);
        pollingId = setTimeout(fetchStatus, backoff);
      }
    };
    
    if (isPolling && tasks.length > 0) {
      fetchStatus();
    }
    
    return () => {
      if (pollingId) clearTimeout(pollingId);
    };
  }, [tasks, isPolling, retryCount]);
  
  const getOverallProgress = () => {
    if (tasks.length === 0) return 0;
    
    let totalProgress = 0;
    let tasksWithProgress = 0;
    
    for (const task of tasks) {
      const status = taskStatus[task.task_id];
      if (status && status.progress) {
        totalProgress += status.progress.progress || 0;
        tasksWithProgress++;
      }
    }
    
    return tasksWithProgress === 0 ? 0 : Math.round(totalProgress / tasks.length);
  };
  
  const overallProgress = getOverallProgress();
  
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium">Overall Progress</h3>
          <span className="text-sm font-medium">{overallProgress}%</span>
        </div>
        <Progress value={overallProgress} className="h-2" />
      </div>
      
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Individual Tasks</h3>
        
        <div className="space-y-3">
          {tasks.map(task => {
            const status = taskStatus[task.task_id];
            const progress = status?.progress?.progress || 0;
            const message = status?.progress?.message || 'Initializing...';
            const currentStatus = status?.status || 'pending';
            
            return (
              <div key={task.task_id} className="border rounded-md p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <div className="truncate flex-1">
                    <span className="font-medium">Target:</span> {task.url}
                  </div>
                  <TaskStatusBadge status={currentStatus} />
                </div>
                
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-sm">
                    <span>{message}</span>
                    <span>{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-1.5" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}


function TaskStatusBadge({ status }) {
  switch (status) {
    case 'completed':
      return (
        <div className="flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-green-50 text-green-700">
          <Check className="h-3 w-3 mr-1" />
          Completed
        </div>
      );
    case 'failed':
      return (
        <div className="flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-red-50 text-red-700">
          <X className="h-3 w-3 mr-1" />
          Failed
        </div>
      );
    case 'running':
      return (
        <div className="flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-blue-50 text-blue-700">
          <RotateCw className="h-3 w-3 mr-1 animate-spin" />
          Running
        </div>
      );
    default:
      return (
        <div className="flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-yellow-50 text-yellow-700">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Pending
        </div>
      );
  }
}