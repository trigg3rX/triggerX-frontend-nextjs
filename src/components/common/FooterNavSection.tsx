import React from "react";
import Link from "next/link";

interface FooterNavItemBase {
  id: string;
  label: string;
  className: string;
  title?: string;
}

interface FooterLinkItem extends FooterNavItemBase {
  isLink: true;
  href: string;
  target?: string;
  rel?: string;
}

interface FooterSpanItem extends FooterNavItemBase {
  isLink: false;
}

type FooterNavItem = FooterLinkItem | FooterSpanItem;

interface FooterNavSectionProps {
  navItems: FooterNavItem[];
  className?: string;
}

export const FooterNavSection: React.FC<FooterNavSectionProps> = ({
  navItems,
  className,
}) => {
  return (
    <div className={className}>
      {navItems.map((item) => {
        if (item.isLink) {
          if (item.href?.startsWith("http")) {
            return (
              <a
                key={item.id}
                href={item.href}
                className={item.className}
                target={item.target}
                rel={item.rel}
              >
                {item.label}
              </a>
            );
          } else {
            return (
              <Link
                key={item.id}
                href={item.href as string}
                className={item.className}
              >
                {item.label}
              </Link>
            );
          }
        } else {
          return (
            <span key={item.id} className={item.className} title={item.title}>
              {item.label}
            </span>
          );
        }
      })}
    </div>
  );
};
