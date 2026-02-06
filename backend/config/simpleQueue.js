import EventEmitter from 'events';

/**
 * Simple In-Memory Queue System
 * No external dependencies required - perfect for up to 3000+ jobs
 */
class SimpleQueue extends EventEmitter {
  constructor(name, options = {}) {
    super();
    this.name = name;
    this.jobs = new Map(); // Store all jobs
    this.pendingJobs = []; // Queue of pending job IDs
    this.processingJobs = new Set(); // Currently processing job IDs
    this.completedJobs = new Set(); // Completed job IDs
    this.failedJobs = new Set(); // Failed job IDs
    this.jobIdCounter = 1;
    
    // Options
    this.options = options;
    this.concurrency = options.concurrency || 1;
    this.defaultJobOptions = {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000
      },
      ...options.defaultJobOptions
    };
    
    // Processor
    this.processor = null;
    this.isProcessing = false;
  
  }

  /**
   * Add a job to the queue
   */
  async add(data, options = {}) {
    const jobId = this.jobIdCounter++;
    const job = {
      id: jobId,
      data,
      options: { ...this.defaultJobOptions, ...options },
      attempts: 0,
      maxAttempts: options.attempts || this.defaultJobOptions.attempts,
      status: 'pending',
      progress: 0,
      createdAt: new Date(),
      error: null,
      result: null
    };

    this.jobs.set(jobId, job);
    this.pendingJobs.push(jobId);
    
    this.emit('added', job);
    
    // Start processing if not already running
    if (this.processor && !this.isProcessing) {
      this.startProcessing();
    }

    return {
      id: jobId,
      progress: (percent) => {
        const currentJob = this.jobs.get(jobId);
        if (currentJob) {
          currentJob.progress = percent;
          this.emit('progress', currentJob, percent);
        }
        return Promise.resolve();
      }
    };
  }

  /**
   * Set the processor function for jobs
   */
  process(processorFn) {
    this.processor = processorFn;
    this.startProcessing();
  }

  /**
   * Start processing jobs
   */
  async startProcessing() {
    if (this.isProcessing || !this.processor) return;
    this.isProcessing = true;

    while (this.pendingJobs.length > 0 || this.processingJobs.size > 0) {
      // Process jobs up to concurrency limit
      while (this.processingJobs.size < this.concurrency && this.pendingJobs.length > 0) {
        const jobId = this.pendingJobs.shift();
        this.processJob(jobId);
        
        // Add delay between jobs to prevent rate limiting (especially for email)
        if (this.options.delayBetweenJobs) {
          await new Promise(resolve => setTimeout(resolve, this.options.delayBetweenJobs));
        }
      }

      // Wait a bit before checking again
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    this.isProcessing = false;
  }

  /**
   * Process a single job
   */
  async processJob(jobId) {
    const job = this.jobs.get(jobId);
    if (!job) return;

    this.processingJobs.add(jobId);
    job.status = 'processing';
    job.attempts++;
    job.startedAt = new Date();

    this.emit('active', job);

    try {
      // Create job wrapper with progress method
      const jobWrapper = {
        id: job.id,
        data: job.data,
        progress: async (percent) => {
          job.progress = percent;
          this.emit('progress', job, percent);
        }
      };

      // Execute processor
      const result = await this.processor(jobWrapper);

      // Job completed successfully
      job.status = 'completed';
      job.result = result;
      job.completedAt = new Date();
      
      this.processingJobs.delete(jobId);
      this.completedJobs.add(jobId);
      
      this.emit('completed', job, result);
      
    } catch (error) {
      // Job failed
      job.error = error.message;
      job.lastError = error;

      // Check if we should retry
      if (job.attempts < job.maxAttempts) {
        // Retry with backoff
        const delay = this.calculateBackoff(job);
        job.status = 'waiting';
        
        this.processingJobs.delete(jobId);
        
        this.emit('failed', job, error);
        console.log(`Job ${jobId} failed (attempt ${job.attempts}/${job.maxAttempts}), retrying in ${delay}ms...`);
        
        setTimeout(() => {
          this.pendingJobs.push(jobId);
          if (!this.isProcessing) this.startProcessing();
        }, delay);
        
      } else {
        // Max attempts reached, job failed permanently
        job.status = 'failed';
        job.failedAt = new Date();
        
        this.processingJobs.delete(jobId);
        this.failedJobs.add(jobId);
        
        this.emit('failed', job, error);
        console.error(`Job ${jobId} failed permanently after ${job.attempts} attempts:`, error.message);
      }
    }
  }

  /**
   * Calculate backoff delay
   */
  calculateBackoff(job) {
    const backoff = job.options.backoff || this.defaultJobOptions.backoff;
    if (backoff.type === 'exponential') {
      return backoff.delay * Math.pow(2, job.attempts - 1);
    }
    return backoff.delay || 2000;
  }

  /**
   * Get queue statistics
   */
  getStats() {
    return {
      waiting: this.pendingJobs.length,
      active: this.processingJobs.size,
      completed: this.completedJobs.size,
      failed: this.failedJobs.size,
      total: this.jobs.size
    };
  }

  /**
   * Get all jobs with optional filters
   */
  getJobs(status = null) {
    const allJobs = Array.from(this.jobs.values());
    if (status) {
      return allJobs.filter(job => job.status === status);
    }
    return allJobs;
  }

  /**
   * Get waiting jobs (for Bull compatibility)
   */
  async getWaiting() {
    return this.pendingJobs.map(id => this.jobs.get(id)).filter(job => job);
  }

  /**
   * Get active/processing jobs (for Bull compatibility)
   */
  async getActive() {
    return Array.from(this.processingJobs).map(id => this.jobs.get(id)).filter(job => job);
  }

  /**
   * Get completed jobs (for Bull compatibility)
   */
  async getCompleted() {
    return Array.from(this.completedJobs).map(id => this.jobs.get(id)).filter(job => job);
  }

  /**
   * Get failed jobs (for Bull compatibility)
   */
  async getFailed() {
    return Array.from(this.failedJobs).map(id => this.jobs.get(id)).filter(job => job);
  }

  /**
   * Get a specific job
   */
  getJob(jobId) {
    return this.jobs.get(jobId);
  }

  /**
   * Clean old completed jobs
   */
  clean(maxAge = 24 * 3600 * 1000, maxCount = 1000) {
    const now = new Date();
    const completedJobIds = Array.from(this.completedJobs);
    
    // Sort by completion time
    const sortedJobs = completedJobIds
      .map(id => this.jobs.get(id))
      .filter(job => job)
      .sort((a, b) => b.completedAt - a.completedAt);

    // Remove old jobs
    let removed = 0;
    for (let i = maxCount; i < sortedJobs.length; i++) {
      const job = sortedJobs[i];
      if (now - job.completedAt > maxAge) {
        this.jobs.delete(job.id);
        this.completedJobs.delete(job.id);
        removed++;
      }
    }

    if (removed > 0) {
      console.log(`Cleaned ${removed} old jobs from queue "${this.name}"`);
    }
  }

  /**
   * Event handler helpers (for compatibility with Bull)
   */
  on(event, handler) {
    return super.on(event, handler);
  }
}

// Create queues
export const certificateQueue = new SimpleQueue('certificate-generation', {
  concurrency: 5, // Process 5 certificates at once
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000
    }
  }
});

export const emailQueue = new SimpleQueue('email-sending', {
  concurrency: 1, // Send 1 email at a time to avoid Gmail rate limits
  delayBetweenJobs: 2000, // 2 second delay between emails to prevent "Too many login attempts"
  defaultJobOptions: {
    attempts: 5,
    backoff: {
      type: 'exponential',
      delay: 5000 // Longer delay on retry
    }
  }
});

// Queue events for monitoring
certificateQueue.on('completed', (job) => {
  console.log(`✓ Certificate job ${job.id} completed`);
});

certificateQueue.on('failed', (job, error) => {
  console.error(`✗ Certificate job ${job.id} failed:`, error.message);
});

emailQueue.on('completed', (job) => {
  console.log(`✓ Email job ${job.id} completed`);
});

emailQueue.on('failed', (job, error) => {
  console.error(`✗ Email job ${job.id} failed:`, error.message);
});

// Auto-clean old jobs every hour
setInterval(() => {
  certificateQueue.clean(24 * 3600 * 1000, 1000);
  emailQueue.clean(24 * 3600 * 1000, 1000);
}, 3600 * 1000);


export default SimpleQueue;
