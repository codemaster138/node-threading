# Subservient Performance

As seen in Issue [#1](https://github.com/codemaster138/node-threading/issues/1), subservient does not always perform better than single-threaded processing. Here, I intend to explain why this is the case, when you should use worker threads, when it's better to resort to another option, for example the [Cluster API](https://nodejs.org/dist/latest-v16.x/docs/api/cluster.html), and when it's best to just run a single thread.

## Communicating with workers is slow

As I was experimenting with benchmarking subservient, I realised that in almost all cases, running worker threads, even multiple ones is slower than just running a single thread. This phenomenon is confirmed and explained in more detail in [this benchmark](https://www.jakso.me/blog/nodejs-14-worker-threads-benchmarks) from jakso.

As it turns out, communicating with node.js workers is slow. It's not quite discernible whether this is due to the HTML structured clone algorithm used by nodejs to serialize data or due to the slow data channels (though the former seems more likely; IPC is usually quite fast), but regardless, any amount of data sent to a worker is too much data sent to a worker.

Strangely, even on highly parallelisable operations, running multiple threads and having each one do part of the work seems to _slow_ performance rather than improving it. This is likely because the operating system limits the priority of the node.js process and each thread gets only a slice of that priority, so the amount of processing power is roughly the same, minus the overhead caused by communication.

Therefore, it is ideal to only send *as little data as possible to/from workers*: When processing an image, the main thread should save the image as a file, *only pass the file name to a worker*, let the worker process it and save its output to a second file, and *only return the name of the new file*. Transferring the entire file between threads would be devastating to performance.

## Workers aren't meant to be fast

As strange as it may sound, node.js worker threads were never intended to speed up parallelizable operations – if it were, they obviously wouldn't live up to the expectations. The _actual_ purpose of a worker thread is keeping the event loop responsive.

Here's an example: A server is running a website. Among the usual stuff – serving up static files for a website – one page on the site also requires the server to be able to resize images. However, the event loop must not be blocked, so that static files can still be served quickly while images are processing. This is where workers shine.

The Server can use subservient to offload the image processing to a worker thread. The worker processes the image and returns the result. This way, the server can continue serving static pages as the worker processes the image in the background – keeping the event loop responsive.
