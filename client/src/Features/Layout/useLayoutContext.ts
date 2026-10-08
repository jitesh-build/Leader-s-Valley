import { useOutletContext } from "react-router-dom";

export interface LayoutContext {
  showToast: (message: string) => void;
}

/** Call inside any page rendered under <AppLayout /> to trigger the shared toast. */
export function useLayoutContext(): LayoutContext {
  return useOutletContext<LayoutContext>();
}