import React from "react";
import classNames from "classnames";

interface CardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  footer?: React.ReactNode;
  header?: React.ReactNode;
  withShadow?: boolean;
  padded?: boolean;
}

const Card: React.FC<CardProps> = ({
  title,
  children,
  className = "",
  footer,
  header,
  withShadow = true,
  padded = true,
}) => {
  return (
    <div
      className={classNames(
        "bg-white rounded-2xl",
        withShadow && "shadow-md",
        className
      )}
    >
      {header && <div className="border-b p-4">{header}</div>}

      {title && (
        <div className="border-b p-4">
          <h2 className="text-lg font-semibold">{title}</h2>
        </div>
      )}

      <div className={classNames(padded ? "p-4" : "")}>{children}</div>

      {footer && <div className="border-t p-4">{footer}</div>}
    </div>
  );
};

export default Card;
