export default class ListNode<T> {
  public next?: ListNode<T>;
  public prev?: ListNode<T>;

  constructor(public value: T) {}
}
