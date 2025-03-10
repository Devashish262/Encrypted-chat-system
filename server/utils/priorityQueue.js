/**
 * Priority Queue implementation for handling urgent messages first
 * Lower priority number means higher actual priority
 */
class PriorityQueue {
  constructor() {
    this.queue = [];
  }

  // Add element to the queue with a priority
  enqueue(element, priority = 0) {
    const item = { element, priority };
    let added = false;

    // Add element in the right position based on priority
    for (let i = 0; i < this.queue.length; i++) {
      if (item.priority < this.queue[i].priority) {
        this.queue.splice(i, 0, item);
        added = true;
        break;
      }
    }

    // If the element has the lowest priority, add it to the end
    if (!added) {
      this.queue.push(item);
    }
  }

  // Remove and return the highest priority element
  dequeue() {
    if (this.isEmpty()) {
      return null;
    }
    return this.queue.shift().element;
  }

  // Check if queue is empty
  isEmpty() {
    return this.queue.length === 0;
  }

  // Return the size of the queue
  size() {
    return this.queue.length;
  }

  // Get the highest priority element without removing it
  peek() {
    if (this.isEmpty()) {
      return null;
    }
    return this.queue[0].element;
  }

  // Clear the queue
  clear() {
    this.queue = [];
  }
}

module.exports = { PriorityQueue }; 