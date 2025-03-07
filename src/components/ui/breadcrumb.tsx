
import * as React from "react"
import { Link } from "react-router-dom"
import { ChevronRight, Home } from "lucide-react"
import { cn } from "@/lib/utils"

interface BreadcrumbProps extends React.HTMLAttributes<HTMLElement> {
  segments: {
    name: string
    href: string
  }[]
  separator?: React.ReactNode
  home?: boolean
}

const Breadcrumb = ({
  segments,
  separator = <ChevronRight className="h-4 w-4" />,
  home = true,
  className,
  ...props
}: BreadcrumbProps) => {
  return (
    <nav
      aria-label="Breadcrumb"
      className={cn("flex items-center space-x-2 text-sm text-muted-foreground", className)}
      {...props}
    >
      <ol className="flex items-center space-x-2">
        {home && (
          <li>
            <Link
              to="/"
              className="flex items-center hover:text-foreground transition-colors"
            >
              <Home className="h-4 w-4" />
              <span className="sr-only">Home</span>
            </Link>
          </li>
        )}
        
        {home && segments.length > 0 && (
          <li className="flex items-center">
            {separator}
          </li>
        )}
        
        {segments.map((segment, index) => (
          <React.Fragment key={segment.href}>
            <li>
              {index === segments.length - 1 ? (
                <span className="font-medium text-foreground">{segment.name}</span>
              ) : (
                <Link
                  to={segment.href}
                  className="hover:text-foreground transition-colors"
                >
                  {segment.name}
                </Link>
              )}
            </li>
            {index < segments.length - 1 && (
              <li className="flex items-center">
                {separator}
              </li>
            )}
          </React.Fragment>
        ))}
      </ol>
    </nav>
  )
}

export { Breadcrumb }
