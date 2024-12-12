import * as React from "react";
import { MouseEvent } from "react";

export const ICON_TYPE = {
  trash: "trash",
};
Object.freeze(ICON_TYPE);

export const Icon = ({ iconType, onClick, className, label, active, disabled }: { iconType: string; onClick?: (e: MouseEvent) => void; className: string; label?: string; active?: boolean; disabled?: boolean }) => {
  let classes = `custom-icon ${className}`;
  if (active) {
    classes += " is-active";
  }
  if (disabled) {
    classes += " is-disabled";
  }
  return (
    <div
      aria-label={label}
      className={classes}
      onClick={
        onClick
          ? (e: MouseEvent) => {
              if (!disabled) {
                onClick(e)
              }
            }
          : undefined
      }>
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`svg-icon-icon ${className}-svg`} style={{  cursor: "pointer" }}>
        {iconType === ICON_TYPE.trash ? (
          <>
            <path d="M3 6h18" />
            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
            <line x1="10" x2="10" y1="11" y2="17" />
            <line x1="14" x2="14" y1="11" y2="17" />
          </>
        ) : (
          <>
            <path d="m7 15 5 5 5-5"></path>
            <path d="m7 9 5-5 5 5"></path>
          </>
        )}
      </svg>
    </div>
  )
};
