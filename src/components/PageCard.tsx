import { PAGE_CARD_SHELL } from "@/lib/layout-widths";

type PageCardProps = {
  children: React.ReactNode;
  className?: string;
};

export function PageCard({ children, className = "" }: PageCardProps) {
  return (
    <div className={`flex ${PAGE_CARD_SHELL} ${className}`.trim()}>{children}</div>
  );
}
