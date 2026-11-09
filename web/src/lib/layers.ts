const stack: Array<() => void> = [];

const onKeyDown = (event: KeyboardEvent): void => {
  if (event.key !== 'Escape') return;
  stack[stack.length - 1]?.();
};

export function pushEscapeLayer(close: () => void): () => void {
  if (stack.length === 0) window.addEventListener('keydown', onKeyDown);
  stack.push(close);
  return () => {
    stack.splice(stack.indexOf(close), 1);
    if (stack.length === 0) window.removeEventListener('keydown', onKeyDown);
  };
}
