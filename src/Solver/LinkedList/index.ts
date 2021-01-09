import ListNode from "../ListNode";

export default class LinkedList<T> {
  private head?: ListNode<T>;
  private tail?: ListNode<T>;

  public addNode(node: ListNode<T>): void {
    if (this.head === undefined || this.tail === undefined) {
      this.head = node;
      this.tail = node;
      this.circleList();
    } else {
      this.tail.next = node;
      node.prev = this.tail;
      this.tail = node;
      this.circleList();
    }
  }

  public removeNode(node: ListNode<T>): void {
    if (node === this.head && node === this.tail) {
      this.tail.next = undefined;
      this.tail.prev = undefined;
      this.tail = undefined;
      this.head = undefined;

      return;
    }

    const prevNode = node.prev;
    const nextNode = node.next;

    if (prevNode !== undefined) {
      prevNode.next = nextNode;
    }
    if (nextNode !== undefined) {
      nextNode.prev = prevNode;
    }
    if (this.tail === node) {
      this.tail = prevNode;
    }
    if (this.head === node) {
      this.head = nextNode;
    }
  }

  public *[Symbol.iterator](): Generator<ListNode<T>> {
    let node = this.head;
    while (node instanceof ListNode) {
      yield node;
      node = node.next;
    }
  }

  private circleList(): void {
    if (this.tail && this.head) {
      this.tail.next = this.head;
      this.head.prev = this.tail;
    }
  }
}
