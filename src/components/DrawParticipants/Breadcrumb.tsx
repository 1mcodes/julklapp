import React from "react";
import { ChevronRight, Home } from "lucide-react";

/**
 * Single breadcrumb item configuration.
 */
export interface BreadcrumbItem {
  label: string;
  href?: string; // undefined = current page (no link)
}

/**
 * Props for the Breadcrumb component.
 */
interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

/**
 * Navigation breadcrumb component with accessible markup.
 * Displays hierarchical path allowing users to navigate back to parent views.
 */
export const Breadcrumb: React.FC<BreadcrumbProps> = ({ items }) => {
  return (
    <nav aria-label="Breadcrumb" className="mb-6">
      <ol className="flex items-center flex-wrap gap-1 text-sm text-gray-600">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          const isFirst = index === 0;

          return (
            <li key={item.label} className="flex items-center">
              {!isFirst && <ChevronRight className="h-4 w-4 mx-2 text-gray-400 flex-shrink-0" aria-hidden="true" />}

              {item.href && !isLast ? (
                <a
                  href={item.href}
                  className="flex items-center gap-1.5 hover:text-gray-900 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 rounded-sm transition-colors"
                >
                  {isFirst && <Home className="h-4 w-4 flex-shrink-0" aria-hidden="true" />}
                  <span>{item.label}</span>
                </a>
              ) : (
                <span
                  className={`flex items-center gap-1.5 ${isLast ? "font-medium text-gray-900" : "text-gray-600"}`}
                  aria-current={isLast ? "page" : undefined}
                >
                  {isFirst && <Home className="h-4 w-4 flex-shrink-0" aria-hidden="true" />}
                  <span className={isLast ? "truncate max-w-[200px] sm:max-w-none" : ""}>{item.label}</span>
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumb;
