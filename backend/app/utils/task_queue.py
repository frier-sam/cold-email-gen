# app/utils/task_queue.py
import threading
import queue
import time
import uuid
import logging
from typing import Dict, Any, Optional, Callable

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global task queue
task_queue = queue.Queue()
task_results = {}
task_progress = {}
task_workers = {}

def start_background_worker():
    """Start a worker thread to process tasks from the queue."""
    def worker():
        logger.info("Background worker thread started")
        while True:
            try:
                logger.info("Worker waiting for task...")
                task_id, task_func, args, kwargs = task_queue.get()
                logger.info(f"Processing task: {task_id}")
                
                # Update task status
                task_progress[task_id] = {
                    "status": "running",
                    "progress": 0,
                    "message": "Task started"
                }
                
                try:
                    # Run the task function
                    result = task_func(*args, **kwargs)
                    logger.info(f"Task completed: {task_id}")
                    task_results[task_id] = {
                        "status": "completed",
                        "result": result
                    }
                except Exception as e:
                    logger.error(f"Task failed: {task_id} - Error: {str(e)}")
                    task_results[task_id] = {
                        "status": "failed",
                        "error": str(e)
                    }
                
                # Clean up progress tracking
                task_progress[task_id]["status"] = task_results[task_id]["status"]
                task_progress[task_id]["progress"] = 100
                
                # Cleanup old tasks
                cleanup_old_tasks()
                
                task_queue.task_done()
            except Exception as e:
                logger.error(f"Worker error: {str(e)}")
                time.sleep(1)  # Avoid tight loop if there's an error
                
    # Start worker thread
    thread = threading.Thread(target=worker, daemon=True)
    thread.start()
    logger.info(f"Background worker thread started with ID: {thread.ident}")
    return thread

def add_task(task_func: Callable, *args, **kwargs) -> str:
    """Add a task to the queue and return its ID."""
    task_id = str(uuid.uuid4())
    logger.info(f"Adding task to queue: {task_id}")
    task_queue.put((task_id, task_func, args, kwargs))
    
    # Initialize task status
    task_results[task_id] = {"status": "pending"}
    task_progress[task_id] = {
        "status": "queued",
        "progress": 0,
        "message": "Task queued"
    }
    
    return task_id

def get_task_status(task_id: str) -> Dict[str, Any]:
    """Get the status of a task."""
    result = task_results.get(task_id, {"status": "unknown"})
    progress = task_progress.get(task_id, {
        "status": "unknown",
        "progress": 0,
        "message": "Task not found"
    })
    
    return {
        **result,
        "progress": progress
    }

def update_task_progress(task_id: str, progress: int, message: str):
    """Update the progress of a task."""
    logger.info(f"Updating task progress: {task_id} - {progress}% - {message}")
    if task_id in task_progress:
        task_progress[task_id].update({
            "progress": progress,
            "message": message
        })

def cleanup_old_tasks():
    """Clean up tasks older than 1 hour."""
    # Implementation omitted for brevity
    pass

logger.info("Initializing task queue system")
worker_thread = start_background_worker()