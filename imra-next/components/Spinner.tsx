type Props = {
  size?: number;
  thickness?: number;
  /** Inline alignment offset to nudge centering inside button text. */
  inline?: boolean;
};

export default function Spinner({ size = 14, thickness = 1.5, inline = true }: Props) {
  return (
    <span
      className={`inline-spinner ${inline ? 'is-inline' : ''}`}
      style={{
        width: size,
        height: size,
        borderWidth: thickness,
      }}
      aria-hidden="true"
    />
  );
}
