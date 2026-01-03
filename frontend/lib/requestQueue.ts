/**
 * Request queue utility to ensure sequential API requests
 * Prevents race conditions when multiple requests are made rapidly
 */

interface QueuedRequest<T> {
  id: string;
  fn: () => Promise<T>;
  resolve: (value: T) => void;
  reject: (error: any) => void;
}

class RequestQueue {
  private queue: QueuedRequest<any>[] = [];
  private isProcessing = false;

  async enqueue<T>(id: string, fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push({ id, fn, resolve, reject });
      this.process();
    });
  }

  private async process() {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;
    const request = this.queue.shift();

    if (!request) {
      this.isProcessing = false;
      return;
    }

    try {
      const result = await request.fn();
      request.resolve(result);
    } catch (error) {
      request.reject(error);
    } finally {
      this.isProcessing = false;
      this.process(); // Process next request
    }
  }
}

// Create a singleton instance
export const taskUpdateQueue = new RequestQueue();
