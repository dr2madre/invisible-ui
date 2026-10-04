import type { ReactNode } from "react";
import { cx } from "../internal/cx";

export interface SliderFieldProps {
  /** The class block: `slider` or `range-slider`. */
  block: string;
  disabled: boolean;
  /** Set on the range slider's frame, which its sheet reads. */
  orientation?: string;
  icon?: ReactNode;
  /** The value shown beside the track, when asked for. */
  valueText?: string;
  /** The formatted bounds shown under the track, when asked for. */
  range?: readonly [string, string];
  /** The track. */
  children: ReactNode;
}

/**
 * The frame the Slider and the RangeSlider share: the optional icon before the
 * track, the value beside it and the bounds under it, with each component's
 * own class block.
 */
export function SliderField({
  block,
  disabled,
  orientation,
  icon,
  valueText,
  range,
  children,
}: SliderFieldProps) {
  const field = `${block}-field`;
  return (
    <div className={cx(field, disabled && `${field}--disabled`)} data-orientation={orientation}>
      <div className={`${field}__row`}>
        {icon ? (
          <span className={`${field}__icon`} aria-hidden="true">
            {icon}
          </span>
        ) : null}
        {children}
        {valueText === undefined ? null : (
          <output className={`${field}__value`}>{valueText}</output>
        )}
      </div>
      {range ? (
        <div className={`${field}__range`} aria-hidden="true">
          <span>{range[0]}</span>
          <span>{range[1]}</span>
        </div>
      ) : null}
    </div>
  );
}
