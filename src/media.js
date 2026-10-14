// A pending permission prompt may outlive the component which requested it.
export class CameraLease {
  generation = 0;
  closed = false;
  stream = null;
  stop() {
    this.generation++;
    this.stream?.getTracks().forEach((track) => track.stop());
    this.stream = null;
  }
  close() {
    this.closed = true;
    this.stop();
  }
  async acquire(request) {
    if (this.closed) return null;
    this.stop();
    const generation = this.generation;
    const stream = await request();
    if (this.closed || generation !== this.generation) {
      stream.getTracks().forEach((track) => track.stop());
      return null;
    }
    this.stream = stream;
    return stream;
  }
}
